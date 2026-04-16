import { Readability } from '@mozilla/readability';

export interface ExtractedData {
  title: string;
  url: string;
  description: string;
  image: string;
  content?: string;
}

export function extractMetadata(): ExtractedData {
  let article: any = null;
  try {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    article = reader.parse();
  } catch (e) {
    console.error('Readability extraction failed', e);
  }

  const title =
    document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    article?.title ||
    document.title ||
    '';

  const description =
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    article?.excerpt ||
    '';

  const image =
    document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ||
    '';

  const url =
    document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    document.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
    window.location.href;

  const content = article?.content || document.body.innerHTML.slice(0, 5000);

  return { title, url, description, image, content };
}

export async function sendToApp(data: any, token: string): Promise<Response> {
  const API_URL = 'http://localhost:3000/api/items/create';
  
  return fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
}