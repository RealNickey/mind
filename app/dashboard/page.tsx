import GridLayout from "@/app/components/GridLayout";

// In a real app we'd fetch these from our database route or server action
const MOCK_ITEMS = [
  {
    id: "1",
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    type: "movie",
    createdAt: new Date().toISOString(),
    metadata: {
      imageUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2IGpbRXYS.jpg",
      sourceUrl: "https://www.themoviedb.org/movie/693134-dune-part-two",
    },
    tags: [{ id: "t1", name: "scifi" }, { id: "t2", name: "epic" }],
  },
  {
    id: "2",
    title: "Understanding React Server Components",
    description: "A deep dive into how RSCs work under the hood and when to use them.",
    type: "article",
    createdAt: new Date().toISOString(),
    metadata: {
      imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop",
      sourceUrl: "https://react.dev",
    },
    tags: [{ id: "t3", name: "react" }, { id: "t4", name: "webdev" }],
  },
  {
    id: "3",
    title: "Figma Community Resources",
    description: "The best design resources directly from the Figma community.",
    type: "link",
    createdAt: new Date().toISOString(),
    metadata: {
      imageUrl: null,
      sourceUrl: "https://figma.com/community",
    },
    tags: [{ id: "t5", name: "design" }],
  },
  {
    id: "4",
    title: "Minimalist Desk Setup",
    description: null,
    type: "image",
    createdAt: new Date().toISOString(),
    metadata: {
      imageUrl: "https://images.unsplash.com/photo-1518481612222-68bab828fd1d?auto=format&fit=crop&q=80&w=800",
    },
    tags: [{ id: "t6", name: "inspiration" }, { id: "t7", name: "workspace" }],
  },
  {
    id: "5",
    title: "The Three-Body Problem",
    description: "Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space to establish contact with aliens.",
    type: "book",
    createdAt: new Date().toISOString(),
    metadata: {
      imageUrl: "https://covers.openlibrary.org/b/id/12999479-L.jpg",
    },
    tags: [{ id: "t1", name: "scifi" }],
  }
];

export const metadata = {
  title: "Dashboard - myMind",
  description: "Your knowledge base visualised.",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <GridLayout initialItems={MOCK_ITEMS} />
    </main>
  );
}
