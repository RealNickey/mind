import { db } from '@/app/lib/db';
import { getItemByIdWithRelations } from '@/app/lib/item-hydration';

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
    const colName = `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}s`;
    const collection = await getOrCreateCollection(colName, `Auto-generated for ${colName}`);
    if (collection) await connectToCollection(collection.id);
  }

  // Also auto-categorize based on tags
  if (item.tags && item.tags.length > 0) {
    const primaryTag = item.tags[0].name;
    const tagName = `${primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1)}`;
    const tagCollection = await getOrCreateCollection(tagName, `Items tagged with ${primaryTag}`);
    if (tagCollection) await connectToCollection(tagCollection.id);
  }
}
