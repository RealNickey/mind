export interface BaseItem {
  id: string;
  title: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CanvasItem extends BaseItem {
  x?: number;
  y?: number;
  [key: string]: any;
}

export interface KnowledgeGraphItem extends BaseItem {
  type?: 'note' | 'article' | 'book' | 'link' | 'image' | 'video' | string;
}

export interface KnowledgeGraphLink {
  id?: string;
  sourceItemId: string;
  targetItemId: string;
  [key: string]: any;
}

export interface GraphNode {
  id?: string | number;
  name?: string;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
  [key: string]: unknown;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface EmbeddingRequest {
  text: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  source: 'local' | 'groq';
  dimensions: number;
}

export interface APIErrorResponse {
  error: string;
}

export interface DeleteItemResponse {
  success: boolean;
}

// Ensure the types for Prisma Database returns and OpenAI metadata
export interface ItemMetadata {
  id?: string;
  itemId?: string;
  [key: string]: any;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
}

export interface ItemResponse extends BaseItem {
  tags?: Tag[];
  collections?: Collection[];
  metadata?: ItemMetadata;
  sourceLinks?: KnowledgeGraphLink[];
  targetLinks?: KnowledgeGraphLink[];
}

export interface OpenAIMetadataPayload {
  title?: string;
  description?: string;
  keywords?: string[];
  summary?: string;
  extractedEntities?: string[];
}