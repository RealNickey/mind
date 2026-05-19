import type { Metadata } from "next";
import { Inter, Playfair_Display, Caveat } from "next/font/google";
import { ThemeProvider } from "./components/ui/theme-provider";
import { FilmGrainEffect } from "./components/FilmGrainEffect";
import Providers from "./components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "myMind",
  description: "Personal knowledge base with AI, semantic search, and canvas exploration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${caveat.variable} h-full antialiased`}
      style={{ colorScheme: 'light dark' }}
    >
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="min-h-screen flex flex-col relative bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased selection:bg-blue-500/30 selection:text-blue-200" style={{ touchAction: 'manipulation', overscrollBehavior: 'contain' }}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <FilmGrainEffect />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

