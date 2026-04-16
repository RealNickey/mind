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

export async function extractRecipeFromHTML(html: string): Promise<Recipe | null> {
  try {
    const $ = cheerio.load(html);
    let recipeMatch: Recipe | null = null;
    
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html();
        if (!content) return;
        const parsed = JSON.parse(content);
        
        const items = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const item of items) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            recipeMatch = extractFromJSONLD(item);
            return false;
          }
          
          if (item['@graph']) {
            const recipeNode = item['@graph'].find((node: any) => node['@type'] === 'Recipe');
            if (recipeNode) {
              recipeMatch = extractFromJSONLD(recipeNode);
              return false;
            }
          }
        }
      } catch (e) {
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

function extractFromJSONLD(recipe: any): Recipe {
  const parseTime = (isoDuration: string) => {
    if (!isoDuration) return 0;
    try {
      const parsed = parseIsoDuration(isoDuration);
      return Math.floor(toSeconds(parsed) / 60);
    } catch {
      return 0;
    }
  };

  const parseInstructions = (instructions: any): string[] => {
    if (!instructions) return [];
    if (typeof instructions === 'string') return [instructions];
    if (Array.isArray(instructions)) {
      return instructions.map((step: any) => {
        if (typeof step === 'string') return step;
        if (step.text) return step.text;
        return '';
      }).filter(Boolean);
    }
    return [];
  };

  const getImageUrl = (image: any): string | null => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    if (Array.isArray(image) && image.length > 0) return typeof image[0] === 'string' ? image[0] : image[0].url;
    if (image.url) return image.url;
    return null;
  };

  const parseYield = (yieldVal: any): number => {
    if (!yieldVal) return 1;
    if (typeof yieldVal === 'number') return yieldVal;
    if (typeof yieldVal === 'string') {
      const matches = yieldVal.match(/\d+/);
      return matches ? parseInt(matches[0], 10) : 1;
    }
    if (Array.isArray(yieldVal) && yieldVal.length > 0) return parseYield(yieldVal[0]);
    return 1;
  };

  return {
    title: recipe.name || 'Unknown Recipe',
    ingredients: Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [],
    instructions: parseInstructions(recipe.recipeInstructions),
    prepTimeMinutes: parseTime(recipe.prepTime),
    cookTimeMinutes: parseTime(recipe.cookTime),
    servings: parseYield(recipe.recipeYield),
    imageUrl: getImageUrl(recipe.image),
  };
}
