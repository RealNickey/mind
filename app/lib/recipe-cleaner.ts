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
  // A simplistic cheerio-style regex-based extraction since cheerio might not be available,
  // or use JSON-LD parsing which is the modern standard for recipe websites.
  try {
    // Look for JSON-LD scripts
    const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    
    while ((match = jsonLdRegex.exec(html)) !== null) {
      const content = match[1];
      try {
        const parsed = JSON.parse(content);
        
        // Handle array of JSON-LD objects or single object
        const items = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const item of items) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            return extractFromJSONLD(item);
          }
          
          if (item['@graph']) {
            const recipeNode = item['@graph'].find((node: any) => node['@type'] === 'Recipe');
            if (recipeNode) return extractFromJSONLD(recipeNode);
          }
        }
      } catch (e) {
        // Continue to next match
      }
    }
    
    // Fallback if no JSON-LD found: return a generic structure based on simple regexes
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    return {
      title: titleMatch ? titleMatch[1].trim() : 'Unknown Recipe',
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
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return (hours * 60) + minutes;
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
