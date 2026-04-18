import * as cheerio from 'cheerio';
import { parse as parseIsoDuration, toSeconds } from 'iso8601-duration';

export interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  imageUrl: string | null;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function hasJsonLdType(value: unknown, expectedType: string): boolean {
  if (typeof value === 'string') {
    return value === expectedType;
  }

  if (Array.isArray(value)) {
    return value.includes(expectedType);
  }

  return false;
}

export async function extractRecipeFromHTML(html: string): Promise<Recipe | null> {
  try {
    const $ = cheerio.load(html);
    let recipeMatch: Recipe | null = null;
    
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html();
        if (!content) return;
        const parsed = JSON.parse(content) as unknown;
        
        const items = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const rawItem of items) {
          const item = asRecord(rawItem);
          if (!item) {
            continue;
          }

          if (hasJsonLdType(item['@type'], 'Recipe')) {
            recipeMatch = extractFromJSONLD(item);
            return false;
          }
          
          if (Array.isArray(item['@graph'])) {
            const recipeNode = item['@graph']
              .map((node) => asRecord(node))
              .find((node): node is JsonRecord => {
                if (!node) {
                  return false;
                }

                return hasJsonLdType(node['@type'], 'Recipe');
              });

            if (recipeNode) {
              recipeMatch = extractFromJSONLD(recipeNode);
              return false;
            }
          }
        }
      } catch {
      }
    });

    if (recipeMatch) return recipeMatch;
    
    return {
      title: $('title').text().trim() || 'Unknown Recipe',
      ingredients: [],
      instructions: [],
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      servings: 1,
      imageUrl: null
    };
  } catch (error) {
    console.error('Recipe extraction error:', error);
    return null;
  }
}

function extractFromJSONLD(recipe: JsonRecord): Recipe {
  const parseTime = (isoDuration: unknown): number => {
    if (typeof isoDuration !== 'string' || !isoDuration) return 0;
    try {
      const parsed = parseIsoDuration(isoDuration);
      return Math.floor(toSeconds(parsed) / 60);
    } catch {
      return 0;
    }
  };

  const parseInstructions = (instructions: unknown): string[] => {
    if (!instructions) return [];
    if (typeof instructions === 'string') return [instructions];
    if (Array.isArray(instructions)) {
      return instructions.map((step) => {
        if (typeof step === 'string') return step;

        const stepRecord = asRecord(step);
        if (stepRecord && typeof stepRecord.text === 'string') {
          return stepRecord.text;
        }

        return '';
      }).filter(Boolean);
    }
    return [];
  };

  const getImageUrl = (image: unknown): string | null => {
    if (!image) return null;
    if (typeof image === 'string') return image;

    if (Array.isArray(image) && image.length > 0) {
      const first = image[0];
      if (typeof first === 'string') {
        return first;
      }

      const firstRecord = asRecord(first);
      if (firstRecord && typeof firstRecord.url === 'string') {
        return firstRecord.url;
      }
    }

    const imageRecord = asRecord(image);
    if (imageRecord && typeof imageRecord.url === 'string') {
      return imageRecord.url;
    }

    return null;
  };

  const parseYield = (yieldVal: unknown): number => {
    if (!yieldVal) return 1;
    if (typeof yieldVal === 'number') return yieldVal;
    if (typeof yieldVal === 'string') {
      const matches = yieldVal.match(/\d+/);
      return matches ? parseInt(matches[0], 10) : 1;
    }
    if (Array.isArray(yieldVal) && yieldVal.length > 0) return parseYield(yieldVal[0]);
    return 1;
  };

  const ingredients = Array.isArray(recipe.recipeIngredient)
    ? recipe.recipeIngredient.filter((ingredient): ingredient is string => typeof ingredient === 'string')
    : [];

  return {
    title: typeof recipe.name === 'string' ? recipe.name : 'Unknown Recipe',
    ingredients,
    instructions: parseInstructions(recipe.recipeInstructions),
    prepTimeMinutes: parseTime(recipe.prepTime),
    cookTimeMinutes: parseTime(recipe.cookTime),
    servings: parseYield(recipe.recipeYield),
    imageUrl: getImageUrl(recipe.image),
  };
}
