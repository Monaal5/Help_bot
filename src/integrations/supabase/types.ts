export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics: {
        Row: {
          chatbot_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
        }
        Insert: {
          chatbot_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
        }
        Update: {
          chatbot_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          chatbot_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          session_data: Json | null
          updated_at: string | null
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          chatbot_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          session_data?: Json | null
          updated_at?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          chatbot_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          session_data?: Json | null
          updated_at?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          clerk_user_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_user_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_user_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chatbot_id: string | null
          content: string | null
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["document_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          chatbot_id?: string | null
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          chatbot_id?: string | null
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_entries: {
        Row: {
          id: string;
          chatbot_id: string;
          question: string;
          answer: string;
          category: string | null;
          subcategory: string | null;
          keywords: string[] | null;
          source_document_id: string | null;
          embedding: string | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
          is_duplicate: boolean;
          similarity_score: number | null;
        };
        Insert: {
          id?: string;
          chatbot_id: string;
          question: string;
          answer: string;
          category?: string | null;
          subcategory?: string | null;
          keywords?: string[] | null;
          source_document_id?: string | null;
          embedding?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_duplicate?: boolean;
          similarity_score?: number | null;
        };
        Update: {
          id?: string;
          chatbot_id?: string;
          question?: string;
          answer?: string;
          category?: string | null;
          subcategory?: string | null;
          keywords?: string[] | null;
          source_document_id?: string | null;
          embedding?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
          is_duplicate?: boolean;
          similarity_score?: number | null;
        };
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          response_source: Database["public"]["Enums"]["response_source"] | null
          role: Database["public"]["Enums"]["message_role"]
          session_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          response_source?:
            | Database["public"]["Enums"]["response_source"]
            | null
          role: Database["public"]["Enums"]["message_role"]
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          response_source?:
            | Database["public"]["Enums"]["response_source"]
            | null
          role?: Database["public"]["Enums"]["message_role"]
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_chatbot_analytics: {
        Args: { chatbot_uuid: string }
        Returns: Json
      }
      get_monthly_growth: {
        Args: Record<PropertyKey, never>
        Returns: {
          month: string
          count: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      search_knowledge_entries: {
        Args: {
          query_embedding: string
          chatbot_uuid: string
          similarity_threshold?: number
          match_count?: number
        }
        Returns: {
          entry_id: string
          question: string
          answer: string
          similarity: number
          keywords: string[]
          metadata: Json
        }[]
      }
      search_similar_chunks: {
        Args: {
          query_embedding: string
          chatbot_uuid: string
          similarity_threshold?: number
          match_count?: number
        }
        Returns: {
          chunk_id: string
          content: string
          similarity: number
          document_title: string
          metadata: Json
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      bulk_import_knowledge_entries: {
        Args: {
          entries: Json;
          chatbot_uuid: string;
        };
        Returns: {
          id: string;
          question: string;
          answer: string;
          category: string | null;
          subcategory: string | null;
          is_duplicate: boolean;
        }[];
      };
      export_knowledge_entries: {
        Args: {
          chatbot_uuid: string;
          category_filter?: string;
          include_duplicates?: boolean;
        };
        Returns: Json;
      };
    }
    Enums: {
      document_status: "processing" | "completed" | "failed"
      message_role: "user" | "assistant" | "system"
      response_source: "knowledge_base" | "generative" | "hybrid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_status: ["processing", "completed", "failed"],
      message_role: ["user", "assistant", "system"],
      response_source: ["knowledge_base", "generative", "hybrid"],
    },
  },
} as const
