import GridLayout from "@/app/components/GridLayout";
import { db } from "@/app/lib/db";
import { hydrateItems } from "@/app/lib/item-hydration";

const PAGE_SIZE = 24;

async function getInitialItems() {
  // Prerender check — avoid Supabase calls during build if possible
  // or return early to avoid "Invalid API key" errors if keys aren't fully trusted in build env
  const isPrerender = process.env.NEXT_PHASE === 'phase-production-build';
  
  if (isPrerender) {
    return [];
  }

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
    const serializeError = (err: unknown) => {
      if (err instanceof Error) {
        return { name: err.name, message: err.message, stack: err.stack };
      }
      if (err && typeof err === 'object') {
        try {
          return JSON.parse(JSON.stringify(err));
        } catch {
          return Object.getOwnPropertyNames(err as object).reduce((acc, key) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            acc[key] = (err as any)[key];
            return acc;
          }, {} as Record<string, unknown>);
        }
      }
      return String(err);
    };

    console.error('Initial load failed:', serializeError(error));
    return [];
  }
}

export const metadata = {
  title: "Dashboard - myMind",
  description: "Your knowledge base visualised.",
};

export default async function Home() {
  const initialItems = await getInitialItems();

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen bg-background">
      <GridLayout initialItems={initialItems} pageSize={PAGE_SIZE} />
    </main>
  );
}
