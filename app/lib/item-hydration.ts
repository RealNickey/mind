import { db } from './db';
import type { Tables } from './database.types';

export type ItemRow = Tables<'Item'>;
export type ItemMetadataRow = Tables<'ItemMetadata'>;
export type TagRow = Tables<'Tag'>;
export type CollectionRow = Tables<'Collection'>;
export type ItemLinkRow = Tables<'ItemLink'>;

type SourceLink = ItemLinkRow & { targetItem?: ItemRow | null };
type TargetLink = ItemLinkRow & { sourceItem?: ItemRow | null };

export type HydratedItem = ItemRow & {
  metadata: ItemMetadataRow | null;
  tags: TagRow[];
  collections: CollectionRow[];
  sourceLinks: SourceLink[];
  targetLinks: TargetLink[];
  x?: number;
  y?: number;
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export async function hydrateItems(items: ItemRow[]): Promise<HydratedItem[]> {
  if (items.length === 0) {
    return [];
  }

  const itemIds = items.map((item) => item.id);

  const { data: metadataRows, error: metadataError } = await db
    .from('ItemMetadata')
    .select('*')
    .in('itemId', itemIds);

  if (metadataError) {
    throw metadataError;
  }

  const { data: itemTagRows, error: itemTagError } = await db
    .from('_ItemToTag')
    .select('A, B')
    .in('A', itemIds);

  if (itemTagError) {
    throw itemTagError;
  }

  const tagIds = unique((itemTagRows ?? []).map((row) => row.B));
  let tags: TagRow[] = [];

  if (tagIds.length > 0) {
    const { data: tagRows, error: tagError } = await db
      .from('Tag')
      .select('*')
      .in('id', tagIds);

    if (tagError) {
      throw tagError;
    }

    tags = tagRows ?? [];
  }

  const { data: collectionItemRows, error: collectionItemError } = await db
    .from('_CollectionToItem')
    .select('A, B')
    .in('B', itemIds);

  if (collectionItemError) {
    throw collectionItemError;
  }

  const collectionIds = unique((collectionItemRows ?? []).map((row) => row.A));
  let collections: CollectionRow[] = [];

  if (collectionIds.length > 0) {
    const { data: collectionRows, error: collectionError } = await db
      .from('Collection')
      .select('*')
      .in('id', collectionIds);

    if (collectionError) {
      throw collectionError;
    }

    collections = collectionRows ?? [];
  }

  const { data: sourceLinkRows, error: sourceLinkError } = await db
    .from('ItemLink')
    .select('*')
    .in('sourceItemId', itemIds);

  if (sourceLinkError) {
    throw sourceLinkError;
  }

  const { data: targetLinkRows, error: targetLinkError } = await db
    .from('ItemLink')
    .select('*')
    .in('targetItemId', itemIds);

  if (targetLinkError) {
    throw targetLinkError;
  }

  const relatedItemIds = unique([
    ...(sourceLinkRows ?? []).map((row) => row.targetItemId),
    ...(targetLinkRows ?? []).map((row) => row.sourceItemId),
  ]);

  let relatedItems: ItemRow[] = [];
  if (relatedItemIds.length > 0) {
    const { data: relatedRows, error: relatedError } = await db
      .from('Item')
      .select('*')
      .in('id', relatedItemIds);

    if (relatedError) {
      throw relatedError;
    }

    relatedItems = relatedRows ?? [];
  }

  const metadataByItemId = new Map((metadataRows ?? []).map((row) => [row.itemId, row]));
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const collectionsById = new Map(collections.map((collection) => [collection.id, collection]));
  const itemsById = new Map(relatedItems.map((item) => [item.id, item]));

  const tagLinksByItemId = new Map<string, string[]>();
  for (const row of itemTagRows ?? []) {
    const existing = tagLinksByItemId.get(row.A) ?? [];
    existing.push(row.B);
    tagLinksByItemId.set(row.A, existing);
  }

  const collectionLinksByItemId = new Map<string, string[]>();
  for (const row of collectionItemRows ?? []) {
    const existing = collectionLinksByItemId.get(row.B) ?? [];
    existing.push(row.A);
    collectionLinksByItemId.set(row.B, existing);
  }

  const sourceLinksByItemId = new Map<string, SourceLink[]>();
  for (const row of sourceLinkRows ?? []) {
    const existing = sourceLinksByItemId.get(row.sourceItemId) ?? [];
    existing.push({ ...row, targetItem: itemsById.get(row.targetItemId) ?? null });
    sourceLinksByItemId.set(row.sourceItemId, existing);
  }

  const targetLinksByItemId = new Map<string, TargetLink[]>();
  for (const row of targetLinkRows ?? []) {
    const existing = targetLinksByItemId.get(row.targetItemId) ?? [];
    existing.push({ ...row, sourceItem: itemsById.get(row.sourceItemId) ?? null });
    targetLinksByItemId.set(row.targetItemId, existing);
  }

  return items.map((item) => {
    const metadata = metadataByItemId.get(item.id) ?? null;
    const metadataCustom = metadata?.customData as
      | { canvasPosition?: { x?: number; y?: number } }
      | null
      | undefined;

    const canvasX = metadataCustom?.canvasPosition?.x;
    const canvasY = metadataCustom?.canvasPosition?.y;

    const itemTags = (tagLinksByItemId.get(item.id) ?? [])
      .map((tagId) => tagsById.get(tagId))
      .filter((tag): tag is TagRow => Boolean(tag));

    const itemCollections = (collectionLinksByItemId.get(item.id) ?? [])
      .map((collectionId) => collectionsById.get(collectionId))
      .filter((collection): collection is CollectionRow => Boolean(collection));

    return {
      ...item,
      metadata,
      tags: itemTags,
      collections: itemCollections,
      sourceLinks: sourceLinksByItemId.get(item.id) ?? [],
      targetLinks: targetLinksByItemId.get(item.id) ?? [],
      x: typeof canvasX === 'number' ? canvasX : undefined,
      y: typeof canvasY === 'number' ? canvasY : undefined,
    };
  });
}

export async function getItemByIdWithRelations(itemId: string): Promise<HydratedItem | null> {
  const { data: item, error } = await db.from('Item').select('*').eq('id', itemId).single();

  if (error || !item) {
    return null;
  }

  const [hydrated] = await hydrateItems([item]);
  return hydrated ?? null;
}
