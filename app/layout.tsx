import type { Metadata } from "next";
import { Inter, EB_Garamond, Caveat } from "next/font/google";
import { ThemeProvider } from "./components/ui/theme-provider";
import { FilmGrainEffect } from "./components/FilmGrainEffect";
import Providers from "./components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
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
      className={`${inter.variable} ${ebGaramond.variable} ${caveat.variable} h-full antialiased`}
      style={{ colorScheme: 'light dark' }}
    >
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="min-h-screen flex flex-col relative bg-background text-foreground antialiased selection:bg-blue-500/30 selection:text-blue-200" style={{ touchAction: 'manipulation', overscrollBehavior: 'contain' }}>
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

