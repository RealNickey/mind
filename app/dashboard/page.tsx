import GridLayout from "@/app/components/GridLayout";
import { db } from "@/app/lib/db";
import { hydrateItems } from "@/app/lib/item-hydration";

const PAGE_SIZE = 24;

async function getInitialItems() {
  try {
    const { data, error } = await db
      .from('Item')
      .select('*')
      .order('updatedAt', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      throw error;
    }

    return hydrateItems(data ?? []);
  } catch (error) {
    console.error('Dashboard initial load failed:', error);
    return [];
  }
}

export const metadata = {
  title: "Dashboard - myMind",
  description: "Your knowledge base visualised.",
};

export default async function DashboardPage() {
  const initialItems = await getInitialItems();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <GridLayout initialItems={initialItems} pageSize={PAGE_SIZE} />
    </main>
  );
}
