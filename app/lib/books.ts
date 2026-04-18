export interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string;
  coverUrl: string | null;
  publishedDate: string;
  isbn: string | null;
  pageCount: number;
  averageRating: number;
}

interface GoogleBookIndustryIdentifier {
  type?: string;
  identifier?: string;
}

interface GoogleBookVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  imageLinks?: {
    thumbnail?: string;
  };
  publishedDate?: string;
  industryIdentifiers?: GoogleBookIndustryIdentifier[];
  pageCount?: number;
  averageRating?: number;
}

interface GoogleBookItem {
  id: string;
  volumeInfo?: GoogleBookVolumeInfo;
}

interface GoogleBooksSearchResponse {
  items?: GoogleBookItem[];
}

export type OpenLibraryBookDetails = Record<string, unknown>;

export async function searchBooks(query: string): Promise<Book[]> {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json() as GoogleBooksSearchResponse;
    
    if (!data.items) return [];

    return data.items.map((item) => {
      const vol = item.volumeInfo ?? {};
      const isbns = vol.industryIdentifiers ?? [];
      const isbn13 = isbns.find((identifier) => identifier.type === 'ISBN_13')?.identifier;
      const isbn10 = isbns.find((identifier) => identifier.type === 'ISBN_10')?.identifier;
      
      return {
        id: item.id,
        title: vol.title || 'Unknown Title',
        authors: vol.authors ?? [],
        description: vol.description || '',
        coverUrl: vol.imageLinks?.thumbnail ? vol.imageLinks.thumbnail.replace('http:', 'https:') : null,
        publishedDate: vol.publishedDate || '',
        isbn: isbn13 || isbn10 || null,
        pageCount: vol.pageCount || 0,
        averageRating: vol.averageRating || 0,
      };
    });
  } catch (error) {
    console.error('Book Search Error:', error);
    return [];
  }
}

export async function getOpenLibraryBookDetails(isbn: string): Promise<OpenLibraryBookDetails | null> {
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    if (!res.ok) return null;
    const data = await res.json() as Record<string, OpenLibraryBookDetails | undefined>;
    return data[`ISBN:${isbn}`] || null;
  } catch (error) {
    console.error('Open Library Error:', error);
    return null;
  }
}
