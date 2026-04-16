import { db } from '@/app/lib/db';
import { generateLocalEmbedding } from '@/app/lib/embeddings';

export async function autoCategorizeItem(itemId: string) {
  const { data: item } = await db.from('Item').select('*, metadata:ItemMetadata(*), tags:Tag(*)').eq('id', itemId).single();

  if (!item) return;

  const contentToEmbed = `${item.title} ${item.description || ''} ${item.content || ''}`;
  const embedding = await generateLocalEmbedding(contentToEmbed);

  const getOrCreateCollection = async (name: string, description?: string) => {
    let { data: collection } = await db.from('Collection').select('*').eq('name', name).eq('isAuto', true).maybeSingle();
    if (!collection) {
      const { data: created } = await db.from('Collection').insert({ name, isAuto: true, description }).select().single();
      collection = created;
    }
    return collection;
  };

  const connectToCollection = async (collectionId: string) => {
    const A = [collectionId, itemId].sort()[0];
    const B = [collectionId, itemId].sort()[1] === collectionId ? collectionId : itemId;
    // Prisma implicit tables format: _CollectionToItem
    await db.from('_CollectionToItem').insert({ A: collectionId, B: itemId });
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
