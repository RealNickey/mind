import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { z } from 'zod';
import { detectContentType } from '@/app/lib/content-detection';
import { getItemByIdWithRelations } from '@/app/lib/item-hydration';
import { normalizeSourceUrl } from '@/app/lib/url-utils';
import { checkLinkHealth } from '@/app/lib/link-health';
import { captureArchiveSnapshot } from '@/app/lib/archive';
import { extractUrlMetadata } from '@/app/lib/metadata';
import { autoCreateSemanticLinks } from '@/app/lib/semantic-links';
import type { Database } from '@/app/lib/database.types';
import { parseJsonBody } from '@/app/api/_validation';

type ItemMetadataInsert = Database['public']['Tables']['ItemMetadata']['Insert'];

const createItemSchema = z.object({
  title: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  description: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  content: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  text: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  type: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  sourceUrl: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  url: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  imageUrl: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  image: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  favicon: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  customData: z.record(z.string(), z.unknown()).nullable().optional().transform(v => (!v || Array.isArray(v) ? null : v)),
  tags: z.array(z.string()).optional().default([]).transform(tags => [...new Set(tags.map(t => typeof t === 'string' ? t.trim().toLowerCase() : '').filter(Boolean))]),
  collectionId: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  userId: z.string().trim().optional().transform(v => v === "" ? undefined : v),
});

export async function POST(req: Request) {
  try {
    const parsedBody = await parseJsonBody(req, createItemSchema);
    if (!parsedBody.success) {
      return parsedBody.response;
    }

    const {
      title,
      description,
      content,
      text: normalizedText,
      type,
      sourceUrl,
      url,
      imageUrl,
      image,
      favicon,
      customData,
      tags,
      collectionId,
      userId,
    } = parsedBody.data;

    const rawSourceUrl = sourceUrl ?? url;
    const normalizedSourceUrl = rawSourceUrl ? (normalizeSourceUrl(rawSourceUrl) ?? rawSourceUrl) : undefined;

    const detectedType = normalizedSourceUrl
      ? detectContentType(normalizedSourceUrl, null)
      : 'note';

    const requestedType = type?.toLowerCase();
    const normalizedType = requestedType ?? detectedType;
    const safeType = normalizedType === 'unknown'
      ? (normalizedSourceUrl ? 'link' : 'note')
      : normalizedType;

    const normalizedTitle =
      title ??
      normalizedSourceUrl ??
      'Untitled item';

    const normalizedDescription = description ?? undefined;
    const normalizedContent = content ?? normalizedText;
    const normalizedUserId = userId;

    const { data: item, error } = await db
      .from('Item')
      .insert({
        title: normalizedTitle,
        type: safeType,
        ...(normalizedDescription && { description: normalizedDescription }),
        ...(normalizedContent && { content: normalizedContent }),
        ...(normalizedSourceUrl && { sourceUrl: normalizedSourceUrl }),
        ...(normalizedUserId && { userId: normalizedUserId }),
      })
      .select('id')
      .single();

    if (error) throw error;

    const normalizedImageUrl = imageUrl ?? image ?? undefined;
    const normalizedFavicon = favicon ?? undefined;

    const customDataPayload: Record<string, unknown> = {
      ...(customData ?? {}),
      ...(normalizedText ? { extractedText: normalizedText } : {}),
      ...(normalizedSourceUrl ? { normalizedSourceUrl } : {}),
    };

    const hasCustomData = Object.keys(customDataPayload).length > 0;
    if (normalizedSourceUrl || normalizedImageUrl || normalizedDescription || normalizedFavicon || hasCustomData) {
      const metadataPayload: ItemMetadataInsert = {
        itemId: item.id,
      };

      if (normalizedSourceUrl) {
        metadataPayload.sourceUrl = normalizedSourceUrl;
      }

      if (normalizedImageUrl) {
        metadataPayload.imageUrl = normalizedImageUrl;
      }

      if (normalizedDescription) {
        metadataPayload.preview = normalizedDescription.slice(0, 300);
      }

      if (normalizedFavicon) {
        metadataPayload.favicon = normalizedFavicon;
      }

      if (hasCustomData) {
        metadataPayload.customData = customDataPayload as ItemMetadataInsert['customData'];
      }

      const { error: metaError } = await db
        .from('ItemMetadata')
        .upsert(metadataPayload, { onConflict: 'itemId' });

      if (metaError) throw metaError;
    }

    for (const tagName of tags) {
      const { data: existingTag, error: selectErr } = await db
        .from('Tag')
        .select('*')
        .eq('name', tagName)
        .maybeSingle();

      if (selectErr) throw selectErr;

      let tagId = existingTag?.id;
      if (!tagId) {
        const { data: createdTag, error: tagInsertError } = await db
          .from('Tag')
          .insert({ name: tagName, count: 1 })
          .select('id')
          .single();

        if (tagInsertError) throw tagInsertError;
        tagId = createdTag.id;
      } else {
        const currentCount = typeof existingTag?.count === 'number' ? existingTag.count : 0;
        const { error: tagUpdateError } = await db
          .from('Tag')
          .update({ count: currentCount + 1 })
          .eq('id', tagId);

        if (tagUpdateError) throw tagUpdateError;
      }

      const { error: tagLinkError } = await db
        .from('_ItemToTag')
        .upsert({ A: item.id, B: tagId }, { onConflict: 'A,B' });

      if (tagLinkError) throw tagLinkError;
    }

    if (collectionId) {
      const { error: collectionLinkError } = await db
        .from('_CollectionToItem')
        .upsert({ A: collectionId, B: item.id }, { onConflict: 'A,B' });

      if (collectionLinkError) throw collectionLinkError;
    }

    void autoCreateSemanticLinks(item.id).catch((autoLinkError) => {
      console.error('Auto semantic link generation failed:', autoLinkError);
    });

    if (normalizedSourceUrl) {
      // Fire-and-forget background execution
      void (async () => {
        try {
          const [extractedMetadata, linkHealthResult, archiveSnapshot] = await Promise.all([
            extractUrlMetadata(normalizedSourceUrl).catch((metadataError) => {
              console.warn('Background metadata extraction failed:', metadataError);
              return null;
            }),
            checkLinkHealth(normalizedSourceUrl).catch((healthError) => {
              console.warn('Background link health check failed:', healthError);
              return null;
            }),
            captureArchiveSnapshot(normalizedSourceUrl).catch((archiveError) => {
              console.warn('Background archive snapshot capture failed:', archiveError);
              return null;
            }),
          ]);

          // Update item's title/description/type if not explicitly set initially
          const itemUpdates: { title?: string; description?: string; type?: string } = {};
          if (!title && extractedMetadata?.title) {
            itemUpdates.title = extractedMetadata.title;
          }
          if (!description && extractedMetadata?.description) {
            itemUpdates.description = extractedMetadata.description;
          }
          if (extractedMetadata?.contentType && extractedMetadata.contentType !== 'unknown') {
            itemUpdates.type = extractedMetadata.contentType;
          }

          if (Object.keys(itemUpdates).length > 0) {
            await db
              .from('Item')
              .update(itemUpdates)
              .eq('id', item.id);
          }

          // Update metadata row with background results
          const { data: existingMeta } = await db
            .from('ItemMetadata')
            .select('*')
            .eq('itemId', item.id)
            .maybeSingle();

          const existingCustomData = (existingMeta?.customData as Record<string, unknown>) ?? {};

          const bgImageUrl = imageUrl ?? image ?? extractedMetadata?.image ?? undefined;
          const bgFavicon = favicon ?? extractedMetadata?.favicon ?? undefined;
          const bgDescription = description ?? extractedMetadata?.description ?? undefined;

          const updatedCustomData = {
            ...existingCustomData,
            ...(linkHealthResult
              ? {
                  linkHealth: linkHealthResult,
                  linkHealthHistory: [linkHealthResult],
                }
              : {}),
            ...(archiveSnapshot
              ? {
                  archiveSnapshotLatest: archiveSnapshot,
                  archiveSnapshots: [archiveSnapshot],
                }
              : {}),
          };

          const metadataPayload: ItemMetadataInsert = {
            itemId: item.id,
            sourceUrl: normalizedSourceUrl,
            ...(bgImageUrl && { imageUrl: bgImageUrl }),
            ...(bgDescription && { preview: bgDescription.slice(0, 300) }),
            ...(bgFavicon && { favicon: bgFavicon }),
            customData: updatedCustomData as ItemMetadataInsert['customData'],
          };

          await db
            .from('ItemMetadata')
            .upsert(metadataPayload, { onConflict: 'itemId' });

          console.log(`Background metadata and archive processing completed for item: ${item.id}`);
        } catch (bgError) {
          console.error(`Background processing failed for item ${item.id}:`, bgError);
        }
      })();
    }

    const hydratedItem = await getItemByIdWithRelations(item.id);
    return NextResponse.json(hydratedItem ?? item);
  } catch (error: unknown) {
    console.error('Item create error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
