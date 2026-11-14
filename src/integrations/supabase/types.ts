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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          id: string
          name: string
          props: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          props?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          props?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          helped: boolean | null
          helped_answer: string | null
          id: string
          user_id: string | null
          willing_to_pay: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helped?: boolean | null
          helped_answer?: string | null
          id?: string
          user_id?: string | null
          willing_to_pay?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          helped?: boolean | null
          helped_answer?: string | null
          id?: string
          user_id?: string | null
          willing_to_pay?: string | null
        }
        Relationships: []
      }
      pack_deliveries: {
        Row: {
          created_at: string
          id: string
          kind: string
          status: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          status?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          status?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_deliveries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          marketing_consent: boolean
          marketing_consent_at: string | null
          plan: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          plan?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          plan?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          arc_degrees: number | null
          candle_diameter_cm: number | null
          candle_height_cm: number | null
          created_at: string
          custom_image_path: string | null
          id: string
          margin_cm: number | null
          mode: string
          name: string
          printer_margin_cm: number | null
          sheet: string
          template_id: string | null
          thumbnail: string | null
          transform: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          arc_degrees?: number | null
          candle_diameter_cm?: number | null
          candle_height_cm?: number | null
          created_at?: string
          custom_image_path?: string | null
          id?: string
          margin_cm?: number | null
          mode?: string
          name?: string
          printer_margin_cm?: number | null
          sheet?: string
          template_id?: string | null
          thumbnail?: string | null
          transform?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          arc_degrees?: number | null
          candle_diameter_cm?: number | null
          candle_height_cm?: number | null
          created_at?: string
          custom_image_path?: string | null
          id?: string
          margin_cm?: number | null
          mode?: string
          name?: string
          printer_margin_cm?: number | null
          sheet?: string
          template_id?: string | null
          thumbnail?: string | null
          transform?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_images: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          original_path: string
          sort_order: number
          template_id: string
          thumb_path: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          original_path: string
          sort_order?: number
          template_id: string
          thumb_path?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          original_path?: string
          sort_order?: number
          template_id?: string
          thumb_path?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_images_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          aspect_ratio: number | null
          cover_path: string | null
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          is_premium: boolean
          license_note: string | null
          occasion: string | null
          purchase_url: string | null
          sort_order: number
          tags: string[]
          theme: string | null
          thumb_path: string | null
          title: string
          zip_path: string | null
        }
        Insert: {
          aspect_ratio?: number | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_premium?: boolean
          license_note?: string | null
          occasion?: string | null
          purchase_url?: string | null
          sort_order?: number
          tags?: string[]
          theme?: string | null
          thumb_path?: string | null
          title: string
          zip_path?: string | null
        }
        Update: {
          aspect_ratio?: number | null
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_premium?: boolean
          license_note?: string | null
          occasion?: string | null
          purchase_url?: string | null
          sort_order?: number
          tags?: string[]
          theme?: string | null
          thumb_path?: string | null
          title?: string
          zip_path?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_metrics: { Args: never; Returns: Json }
      admin_pack_metrics: { Args: never; Returns: Json }
      admin_set_plan: {
        Args: { _plan: string; _user_id: string }
        Returns: undefined
      }
      export_count_this_month: {
        Args: { _session_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
