import { db } from '@/app/lib/db';
import { getItemByIdWithRelations } from '@/app/lib/item-hydration';
import pluralize from 'pluralize';

const MAX_TAG_COLLECTIONS = 5;

export async function autoCategorizeItem(itemId: string) {
  const item = await getItemByIdWithRelations(itemId);

  if (!item) return;

  const getOrCreateCollection = async (name: string, description?: string) => {
    let { data: collection } = await db.from('Collection').select('*').eq('name', name).eq('isAuto', true).maybeSingle();
    if (!collection) {
      const { data: created } = await db.from('Collection').insert({ name, isAuto: true, description }).select().single();
      collection = created;
    }
    return collection;
  };

  const connectToCollection = async (collectionId: string) => {
    const { error } = await db
      .from('_CollectionToItem')
      .upsert({ A: collectionId, B: itemId }, { onConflict: 'A,B' });

    if (error) throw error;
  };

  // Example logic: cluster or compare items, but for now we'll rely on type/tags
  // Let's create an auto-collection for the type if it doesn't exist
  if (item.type) {
    const formattedType = `${item.type.charAt(0).toUpperCase()}${item.type.slice(1)}`;
    const colName = pluralize(formattedType);
    const collection = await getOrCreateCollection(colName, `Auto-generated for ${colName}`);
    if (collection) await connectToCollection(collection.id);
  }

  // Also auto-categorize based on tags
  if (item.tags && item.tags.length > 0) {
    const uniqueTags: string[] = [];
    const seenTags = new Set<string>();

    for (const tag of item.tags) {
      if (uniqueTags.length >= MAX_TAG_COLLECTIONS) break;

      const name = tag?.name?.trim();
      if (!name) continue;

      const normalized = name.toLocaleLowerCase();
      if (seenTags.has(normalized)) continue;

      seenTags.add(normalized);
      uniqueTags.push(name);
    }

    for (const tag of uniqueTags) {
      const tagName = `${tag.charAt(0).toUpperCase()}${tag.slice(1)}`;
      const tagCollection = await getOrCreateCollection(tagName, `Items tagged with ${tag}`);
      if (tagCollection) await connectToCollection(tagCollection.id);
    }
  }
}
