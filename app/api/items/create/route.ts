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
    const body = await req.json();
    const parseResult = createItemSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parseResult.error.flatten() },
        { status: 400 }
      );
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
    } = parseResult.data;

    const rawSourceUrl = sourceUrl ?? url;
    const normalizedSourceUrl = rawSourceUrl ? (normalizeSourceUrl(rawSourceUrl) ?? rawSourceUrl) : undefined;

    let extractedMetadata: Awaited<ReturnType<typeof extractUrlMetadata>> | null = null;
    let linkHealthResult: Awaited<ReturnType<typeof checkLinkHealth>> | null = null;
    let archiveSnapshot: Awaited<ReturnType<typeof captureArchiveSnapshot>> | null = null;

    if (normalizedSourceUrl) {
      [extractedMetadata, linkHealthResult, archiveSnapshot] = await Promise.all([
        extractUrlMetadata(normalizedSourceUrl).catch((metadataError) => {
          console.warn('Metadata extraction failed during capture:', metadataError);
          return null;
        }),
        checkLinkHealth(normalizedSourceUrl).catch((healthError) => {
          console.warn('Link health check failed during capture:', healthError);
          return null;
        }),
        captureArchiveSnapshot(normalizedSourceUrl).catch((archiveError) => {
          console.warn('Archive snapshot capture failed during save:', archiveError);
          return null;
        }),
      ]);
    }

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
      extractedMetadata?.title ??
      normalizedSourceUrl ??
      'Untitled item';

    const normalizedDescription = description ?? extractedMetadata?.description ?? undefined;
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

    const normalizedImageUrl = imageUrl ?? image ?? extractedMetadata?.image ?? undefined;
    const normalizedFavicon = favicon ?? extractedMetadata?.favicon ?? undefined;

    const customDataPayload: Record<string, unknown> = {
      ...(customData ?? {}),
      ...(normalizedText ? { extractedText: normalizedText } : {}),
      ...(normalizedSourceUrl ? { normalizedSourceUrl } : {}),
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

    const hydratedItem = await getItemByIdWithRelations(item.id);
    return NextResponse.json(hydratedItem ?? item);
  } catch (error) {
    console.error('Item create error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
