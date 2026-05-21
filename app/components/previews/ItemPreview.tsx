import React from 'react';
import { getDisplayDomain } from '@/app/lib/url-utils';
import ArticlePreview from './ArticlePreview';
import BookPreview from './BookPreview';
import ColorPreview from './ColorPreview';
import GithubPreview from './GithubPreview';
import ImagePreview from './ImagePreview';
import InstagramPreview from './InstagramPreview';
import LinkPreview from './LinkPreview';
import MoviePreview from './MoviePreview';
import MusicPreview from './MusicPreview';
import NotePreview from './NotePreview';
import PlacePreview from './PlacePreview';
import ProductPreview from './ProductPreview';
import QuotePreview from './QuotePreview';
import RecipePreview from './RecipePreview';
import PdfPreview from './PdfPreview';
import PropertyPreview from './PropertyPreview';
import WikipediaPreview from './WikipediaPreview';
import HighlightPreview from './HighlightPreview';
import TodoPreview, { type TodoItem } from './TodoPreview';
import TVShowPreview from './TVShowPreview';
import TwitterPreview from './TwitterPreview';
import VideoPreview from './VideoPreview';
import YoutubePreview from './YoutubePreview';

type JsonObject = Record<string, unknown>;

export interface PreviewItemMetadata {
  sourceUrl?: string | null;
  imageUrl?: string | null;
  favicon?: string | null;
  author?: string | null;
  readingTime?: number | null;
  publishedDate?: string | null;
  movieTitle?: string | null;
  moviePoster?: string | null;
  movieRating?: number | null;
  movieRuntime?: number | null;
  movieGenres?: string[] | null;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  bookCover?: string | null;
  bookRating?: number | null;
  isbn?: string | null;
  dominantColors?: string[] | null;
  customData?: unknown;
}

export interface PreviewItem {
  id?: string;
  title: string;
  description?: string | null;
  content?: string | null;
  type: string;
  sourceUrl?: string | null;
  customColor?: string | null;
  metadata?: PreviewItemMetadata | null;
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as JsonObject;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const parsed = value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));

  return parsed.length > 0 ? parsed : undefined;
}

function getYear(value?: string | null): string {
  if (!value) {
    return 'Unknown';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return String(parsed.getFullYear());
}

function svgPlaceholder(label: string, bg = '#f4f4f5', fg = '#3f3f46'): string {
  const safeLabel = label.replace(/</g, '').replace(/>/g, '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='56' fill='${fg}'>${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function extractRepoFromUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function extractHandleFromUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    const firstSegment = parsed.pathname.split('/').filter(Boolean)[0];
    return firstSegment || undefined;
  } catch {
    return undefined;
  }
}

function extractHexCandidate(...values: Array<string | null | undefined>): string | undefined {
  const matcher = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/;

  for (const value of values) {
    if (!value) {
      continue;
    }

    const match = value.match(matcher);
    if (match) {
      return match[0].toUpperCase();
    }
  }

  return undefined;
}

function hexToRgbString(hex: string): string | undefined {
  const normalized = hex.replace('#', '');
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
    return undefined;
  }

  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `${red}, ${green}, ${blue}`;
}

function extractTodoItems(content?: string | null, description?: string | null): TodoItem[] {
  const source = [content, description].filter((entry): entry is string => Boolean(entry)).join('\n');
  const pattern = /^\s*[-*]\s*\[( |x|X)\]\s+(.+)$/gm;
  const parsed: TodoItem[] = [];

  for (const match of source.matchAll(pattern)) {
    parsed.push({
      id: `todo-${parsed.length}`,
      completed: match[1].toLowerCase() === 'x',
      text: match[2].trim(),
    });
  }

  if (parsed.length > 0) {
    return parsed;
  }

  if (description && description.trim()) {
    return [{
      id: 'todo-0',
      completed: false,
      text: description.trim(),
    }];
  }

  return [{
    id: 'todo-0',
    completed: false,
    text: 'No checklist items yet',
  }];
}

function extractIngredients(content?: string | null): string[] {
  if (!content) {
    return [];
  }

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, ''))
    .slice(0, 12);
}

export default function ItemPreview({ item, isCard = false }: { item: PreviewItem; isCard?: boolean }) {
  const metadata = item.metadata ?? null;
  const customData = asObject(metadata?.customData);

  const sourceUrl = metadata?.sourceUrl ?? item.sourceUrl ?? asString(customData?.sourceUrl);
  const imageUrl = metadata?.imageUrl ?? asString(customData?.imageUrl) ?? asString(customData?.image);
  const favicon = metadata?.favicon ?? asString(customData?.favicon);
  const normalizedType = item.type.toLowerCase();
  const sourceDomain = getDisplayDomain(sourceUrl, 'saved content') ?? 'saved content';

  switch (normalizedType) {
    case 'article': {
      return (
        <ArticlePreview
          title={item.title}
          excerpt={item.description ?? item.content ?? 'Saved article'}
          domain={sourceDomain}
          thumbnail={imageUrl ?? undefined}
          readingTime={metadata?.readingTime ? `${metadata.readingTime} min read` : undefined}
        />
      );
    }

    case 'pdf': {
      return (
        <PdfPreview
          title={item.title}
          pages={asNumber(customData?.pages)}
          fileSize={asString(customData?.fileSize)}
        />
      );
    }

    case 'property': {
      return (
        <PropertyPreview
          title={item.title}
          price={asString(customData?.price)}
          imageUrl={imageUrl ?? undefined}
          beds={asNumber(customData?.beds)}
          baths={asNumber(customData?.baths)}
          sqft={asNumber(customData?.sqft)}
        />
      );
    }

    case 'wikipedia': {
      return (
        <WikipediaPreview
          title={item.title}
          excerpt={item.description ?? item.content ?? 'Wikipedia article'}
          imageUrl={imageUrl ?? undefined}
        />
      );
    }

    case 'highlight': {
      return (
        <HighlightPreview
          text={item.content ?? item.description ?? 'Saved highlight'}
          sourceTitle={asString(customData?.sourceTitle) ?? getDisplayDomain(sourceUrl) ?? undefined}
          sourceUrl={sourceUrl ?? undefined}
        />
      );
    }

    case 'movie': {
      return (
        <MoviePreview
          title={metadata?.movieTitle ?? item.title}
          poster={metadata?.moviePoster ?? imageUrl ?? svgPlaceholder('Movie')}
          backdrop={imageUrl ?? metadata?.moviePoster ?? undefined}
          rating={metadata?.movieRating ?? asNumber(customData?.rating) ?? 0}
          year={getYear(metadata?.publishedDate ?? asString(customData?.year) ?? null)}
          runtime={metadata?.movieRuntime ?? asNumber(customData?.runtime)}
          genres={metadata?.movieGenres ?? asStringArray(customData?.genres)}
        />
      );
    }

    case 'tvshow': {
      return (
        <TVShowPreview
          name={asString(customData?.name) ?? item.title}
          poster={imageUrl ?? metadata?.moviePoster ?? svgPlaceholder('TV Show')}
          seasons={asNumber(customData?.seasons) ?? 1}
          rating={asNumber(customData?.rating) ?? metadata?.movieRating ?? 0}
          year={getYear(metadata?.publishedDate ?? asString(customData?.year) ?? null)}
          network={asString(customData?.network)}
        />
      );
    }

    case 'book': {
      return (
        <BookPreview
          title={metadata?.bookTitle ?? item.title}
          author={metadata?.bookAuthor ?? metadata?.author ?? asString(customData?.author) ?? 'Unknown author'}
          cover={metadata?.bookCover ?? imageUrl ?? svgPlaceholder('Book')}
          identifier={metadata?.isbn ?? asString(customData?.isbn)}
          rating={metadata?.bookRating ?? asNumber(customData?.rating)}
        />
      );
    }

    case 'image': {
      return (
        <ImagePreview
          url={imageUrl ?? sourceUrl ?? svgPlaceholder('Image')}
          alt={item.title}
          colors={metadata?.dominantColors ?? asStringArray(customData?.colors)}
        />
      );
    }

    case 'video': {
      return (
        <VideoPreview
          url={sourceUrl ?? ''}
          thumbnail={imageUrl ?? svgPlaceholder('Video')}
          title={item.title}
          duration={asString(customData?.duration)}
        />
      );
    }

    case 'recipe': {
      const ingredients = asStringArray(customData?.ingredients) ?? extractIngredients(item.content);
      return (
        <RecipePreview
          title={item.title}
          ingredients={ingredients.length > 0 ? ingredients : ['Open item details to add ingredients']}
          prepTime={asNumber(customData?.prepTime) ?? 15}
          cookTime={asNumber(customData?.cookTime) ?? 20}
          servings={asNumber(customData?.servings) ?? 2}
          imageUrl={imageUrl ?? undefined}
        />
      );
    }

    case 'product': {
      return (
        <ProductPreview
          title={item.title}
          price={asString(customData?.price) ?? 'N/A'}
          currency={asString(customData?.currency) ?? '$'}
          store={asString(customData?.store) ?? sourceDomain}
          imageUrl={imageUrl ?? svgPlaceholder('Product')}
          rating={asNumber(customData?.rating)}
          reviews={asNumber(customData?.reviews)}
        />
      );
    }

    case 'twitter': {
      const author = asString(customData?.author) ?? item.title;
      const handle = asString(customData?.handle) ?? extractHandleFromUrl(sourceUrl) ?? 'user';
      return (
        <TwitterPreview
          author={author}
          handle={handle.replace(/^@/, '')}
          avatar={asString(customData?.avatar) ?? svgPlaceholder('Avatar', '#e4e4e7', '#52525b')}
          content={item.description ?? item.content ?? sourceUrl ?? 'Saved tweet'}
          date={asString(customData?.date) ?? 'Now'}
          replies={asNumber(customData?.replies) ?? 0}
          retweets={asNumber(customData?.retweets) ?? 0}
          likes={asNumber(customData?.likes) ?? 0}
        />
      );
    }

    case 'instagram': {
      const author = asString(customData?.author) ?? extractHandleFromUrl(sourceUrl) ?? 'instagram';
      return (
        <InstagramPreview
          author={author}
          avatar={asString(customData?.avatar) ?? svgPlaceholder('IG', '#fde68a', '#92400e')}
          imageUrl={imageUrl ?? svgPlaceholder('Instagram')}
          caption={item.description ?? item.content ?? undefined}
          likes={asNumber(customData?.likes)}
        />
      );
    }

    case 'youtube': {
      return (
        <YoutubePreview
          title={item.title}
          channel={asString(customData?.channel) ?? sourceDomain}
          thumbnail={imageUrl ?? svgPlaceholder('YouTube')}
          views={asString(customData?.views) ?? 'N/A'}
          date={asString(customData?.date) ?? 'Recently'}
          duration={asString(customData?.duration)}
          sourceUrl={sourceUrl ?? undefined}
          description={item.description ?? item.content ?? undefined}
        />
      );
    }

    case 'github': {
      return (
        <GithubPreview
          repo={asString(customData?.repo) ?? extractRepoFromUrl(sourceUrl) ?? item.title}
          description={item.description ?? asString(customData?.description) ?? 'Saved repository'}
          stars={asNumber(customData?.stars) ?? 0}
          forks={asNumber(customData?.forks) ?? 0}
          language={asString(customData?.language) ?? 'TypeScript'}
          languageColor={asString(customData?.languageColor) ?? '#3178c6'}
          updated={asString(customData?.updated)}
        />
      );
    }

    case 'music': {
      return (
        <MusicPreview
          title={item.title}
          artist={asString(customData?.artist) ?? metadata?.author ?? 'Unknown artist'}
          album={asString(customData?.album)}
          cover={imageUrl ?? svgPlaceholder('Music')}
          year={asString(customData?.year) ?? getYear(metadata?.publishedDate)}
          isCard={isCard}
        />
      );
    }

    case 'quote': {
      return (
        <QuotePreview
          text={item.content ?? item.description ?? item.title}
          author={asString(customData?.author) ?? metadata?.author ?? 'Unknown'}
          source={asString(customData?.source)}
        />
      );
    }

    case 'todo': {
      const todoItems = extractTodoItems(item.content, item.description);
      const completed = todoItems.filter((entry) => entry.completed).length;
      return (
        <TodoPreview
          title={item.title}
          items={todoItems}
          total={todoItems.length}
          completed={completed}
        />
      );
    }

    case 'place': {
      const latitude = asNumber(customData?.latitude) ?? asNumber(customData?.lat);
      const longitude = asNumber(customData?.longitude) ?? asNumber(customData?.lng);

      const staticMapUrl = (typeof latitude === 'number' && typeof longitude === 'number')
        ? `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=12&size=800x240&markers=${latitude},${longitude},red-pushpin`
        : svgPlaceholder('Map', '#dbeafe', '#1e3a8a');

      const mapLink = sourceUrl ?? ((typeof latitude === 'number' && typeof longitude === 'number')
        ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}`
        : undefined);

      return (
        <PlacePreview
          name={item.title}
          address={item.description ?? asString(customData?.address) ?? 'Address unavailable'}
          rating={asNumber(customData?.rating)}
          categories={asStringArray(customData?.categories)}
          staticMapUrl={staticMapUrl}
          mapLink={mapLink}
        />
      );
    }

    case 'color': {
      const hex = (
        metadata?.dominantColors?.[0] ??
        asString(customData?.hex) ??
        extractHexCandidate(item.title, item.description ?? undefined, item.content ?? undefined) ??
        '#B3E5D1'
      ).toUpperCase();

      return (
        <ColorPreview
          hex={hex}
          name={asString(customData?.name) ?? item.title}
          rgb={hexToRgbString(hex)}
        />
      );
    }

    case 'note': {
      return (
        <NotePreview
          title={item.title}
          markdown={item.content ?? item.description ?? 'No notes yet.'}
          color={item.customColor ?? asString(customData?.color) ?? '#FFF9A6'}
        />
      );
    }

    case 'link':
    default: {
      return (
        <LinkPreview
          url={sourceUrl ?? item.title}
          title={item.title}
          description={item.description ?? undefined}
          favicon={favicon ?? undefined}
          ogImage={imageUrl ?? undefined}
        />
      );
    }
  }
}
