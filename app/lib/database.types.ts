export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _CollectionToItem: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_CollectionToItem_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "Collection"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_CollectionToItem_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "Item"
            referencedColumns: ["id"]
          },
        ]
      }
      _ItemToTag: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_ItemToTag_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "Item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_ItemToTag_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "Tag"
            referencedColumns: ["id"]
          },
        ]
      }
      Collection: {
        Row: {
          autoRule: Json | null
          canvasState: Json | null
          color: string | null
          createdAt: string
          description: string | null
          icon: string | null
          id: string
          isAuto: boolean
          name: string
          updatedAt: string
          userId: string | null
        }
        Insert: {
          autoRule?: Json | null
          canvasState?: Json | null
          color?: string | null
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          isAuto?: boolean
          name: string
          updatedAt?: string
          userId?: string | null
        }
        Update: {
          autoRule?: Json | null
          canvasState?: Json | null
          color?: string | null
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          isAuto?: boolean
          name?: string
          updatedAt?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Collection_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Embedding: {
        Row: {
          createdAt: string
          embedding: string
          id: string
          itemId: string
          modelVersion: string
          vector: string
        }
        Insert: {
          createdAt?: string
          embedding: string
          id?: string
          itemId: string
          modelVersion?: string
          vector: string
        }
        Update: {
          createdAt?: string
          embedding?: string
          id?: string
          itemId?: string
          modelVersion?: string
          vector?: string
        }
        Relationships: [
          {
            foreignKeyName: "Embedding_itemId_fkey"
            columns: ["itemId"]
            isOneToOne: true
            referencedRelation: "Item"
            referencedColumns: ["id"]
          },
        ]
      }
      Item: {
        Row: {
          canvasPosition: Json | null
          content: string | null
          createdAt: string
          customColor: string | null
          description: string | null
          extractedText: string | null
          fullTextSearch: string | null
          id: string
          isFavorite: boolean
          notes: string | null
          sourceUrl: string | null
          title: string
          type: string
          updatedAt: string
          userId: string | null
        }
        Insert: {
          canvasPosition?: Json | null
          content?: string | null
          createdAt?: string
          customColor?: string | null
          description?: string | null
          extractedText?: string | null
          fullTextSearch?: string | null
          id?: string
          isFavorite?: boolean
          notes?: string | null
          sourceUrl?: string | null
          title: string
          type: string
          updatedAt?: string
          userId?: string | null
        }
        Update: {
          canvasPosition?: Json | null
          content?: string | null
          createdAt?: string
          customColor?: string | null
          description?: string | null
          extractedText?: string | null
          fullTextSearch?: string | null
          id?: string
          isFavorite?: boolean
          notes?: string | null
          sourceUrl?: string | null
          title?: string
          type?: string
          updatedAt?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Item_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      ItemLink: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          linkType: string
          sourceItemId: string
          strength: number
          targetItemId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          linkType?: string
          sourceItemId: string
          strength?: number
          targetItemId: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          linkType?: string
          sourceItemId?: string
          strength?: number
          targetItemId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ItemLink_sourceItemId_fkey"
            columns: ["sourceItemId"]
            isOneToOne: false
            referencedRelation: "Item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ItemLink_targetItemId_fkey"
            columns: ["targetItemId"]
            isOneToOne: false
            referencedRelation: "Item"
            referencedColumns: ["id"]
          },
        ]
      }
      ItemMetadata: {
        Row: {
          author: string | null
          bookAuthor: string | null
          bookCover: string | null
          bookRating: number | null
          bookTitle: string | null
          colorPalette: Json | null
          createdAt: string
          customData: Json | null
          dominantColors: string[] | null
          favicon: string | null
          id: string
          imageUrl: string | null
          isbn: string | null
          itemId: string
          movieGenres: string[] | null
          moviePoster: string | null
          movieRating: number | null
          movieRuntime: number | null
          movieTitle: string | null
          preview: string | null
          publishedDate: string | null
          readingTime: number | null
          sourceUrl: string | null
          tmdbId: number | null
          updatedAt: string
        }
        Insert: {
          author?: string | null
          bookAuthor?: string | null
          bookCover?: string | null
          bookRating?: number | null
          bookTitle?: string | null
          colorPalette?: Json | null
          createdAt?: string
          customData?: Json | null
          dominantColors?: string[] | null
          favicon?: string | null
          id?: string
          imageUrl?: string | null
          isbn?: string | null
          itemId: string
          movieGenres?: string[] | null
          moviePoster?: string | null
          movieRating?: number | null
          movieRuntime?: number | null
          movieTitle?: string | null
          preview?: string | null
          publishedDate?: string | null
          readingTime?: number | null
          sourceUrl?: string | null
          tmdbId?: number | null
          updatedAt?: string
        }
        Update: {
          author?: string | null
          bookAuthor?: string | null
          bookCover?: string | null
          bookRating?: number | null
          bookTitle?: string | null
          colorPalette?: Json | null
          createdAt?: string
          customData?: Json | null
          dominantColors?: string[] | null
          favicon?: string | null
          id?: string
          imageUrl?: string | null
          isbn?: string | null
          itemId?: string
          movieGenres?: string[] | null
          moviePoster?: string | null
          movieRating?: number | null
          movieRuntime?: number | null
          movieTitle?: string | null
          preview?: string | null
          publishedDate?: string | null
          readingTime?: number | null
          sourceUrl?: string | null
          tmdbId?: number | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ItemMetadata_itemId_fkey"
            columns: ["itemId"]
            isOneToOne: true
            referencedRelation: "Item"
            referencedColumns: ["id"]
          },
        ]
      }
      Tag: {
        Row: {
          color: string | null
          count: number
          createdAt: string
          description: string | null
          icon: string | null
          id: string
          name: string
          userId: string | null
        }
        Insert: {
          color?: string | null
          count?: number
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          userId?: string | null
        }
        Update: {
          color?: string | null
          count?: number
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Tag_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string
          id: string
          name: string | null
          theme: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          id?: string
          name?: string | null
          theme?: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          name?: string | null
          theme?: string
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_items: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
