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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      client_groups: {
        Row: {
          client_id: string
          group_id: string
        }
        Insert: {
          client_id: string
          group_id: string
        }
        Update: {
          client_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_groups_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          country: string | null
          created_at: string | null
          email: string | null
          facebook: string | null
          facebook_psid: string | null
          id: string
          instagram: string | null
          name: string
          organization_id: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          email?: string | null
          facebook?: string | null
          facebook_psid?: string | null
          id?: string
          instagram?: string | null
          name: string
          organization_id?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          email?: string | null
          facebook?: string | null
          facebook_psid?: string | null
          id?: string
          instagram?: string | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_info: string
          created_at: string | null
          id: string
          name: string
          tags: string[] | null
          type: string
          user_id: string | null
        }
        Insert: {
          contact_info: string
          created_at?: string | null
          id?: string
          name: string
          tags?: string[] | null
          type: string
          user_id?: string | null
        }
        Update: {
          contact_info?: string
          created_at?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          email_id: string
          id: string
          link_url: string | null
          recipient: string
          type: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          email_id: string
          id?: string
          link_url?: string | null
          recipient: string
          type: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          email_id?: string
          id?: string
          link_url?: string | null
          recipient?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          id: string
          original_url: string
          platform: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          id?: string
          original_url: string
          platform?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          id?: string
          original_url?: string
          platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          platform_data: Json | null
          platforms: string[] | null
          scheduled_date: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          platform_data?: Json | null
          platforms?: string[] | null
          scheduled_date?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          platform_data?: Json | null
          platforms?: string[] | null
          scheduled_date?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_outbox: {
        Row: {
          created_at: string
          id: number
          media_urls: string[] | null
          message: string
          organization_id: string
          psid: string
          response_data: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          media_urls?: string[] | null
          message: string
          organization_id: string
          psid: string
          response_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          media_urls?: string[] | null
          message?: string
          organization_id?: string
          psid?: string
          response_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      organization_integrations: {
        Row: {
          access_token: string
          connected_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          platform: string
          provider_account_id: string
          refresh_token: string | null
          status: string | null
          token_expires_at: string | null
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          platform: string
          provider_account_id: string
          refresh_token?: string | null
          status?: string | null
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          platform?: string
          provider_account_id?: string
          refresh_token?: string | null
          status?: string | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_designers: number | null
          max_marketers: number | null
          max_operators: number | null
          name: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_designers?: number | null
          max_marketers?: number | null
          max_operators?: number | null
          name: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_designers?: number | null
          max_marketers?: number | null
          max_operators?: number | null
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          canvas_data: Json | null
          created_at: string | null
          id: string
          is_template: boolean | null
          organization_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string | null
          id?: string
          is_template?: boolean | null
          organization_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string | null
          id?: string
          is_template?: boolean | null
          organization_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          campaign_id: string | null
          content: string | null
          created_at: string | null
          id: number
          media_urls: string[] | null
          organization_id: string | null
          platforms: string[] | null
          response_data: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          media_urls?: string[] | null
          organization_id?: string | null
          platforms?: string[] | null
          response_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          media_urls?: string[] | null
          organization_id?: string | null
          platforms?: string[] | null
          response_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_outbox: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: number
          media_urls: string[] | null
          message: string | null
          metadata: Json | null
          organization_id: string | null
          phone: string
          response_data: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: number
          media_urls?: string[] | null
          message?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone: string
          response_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: number
          media_urls?: string[] | null
          message?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone?: string
          response_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbox_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_users_for_org: {
        Args: { org_id: string }
        Returns: {
          email: string
          id: string
          username: string
        }[]
      }
      get_my_org_id: { Args: never; Returns: string }
      get_my_org_ids: { Args: never; Returns: string[] }
      get_my_role_in_org: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "operator" | "designer" | "marketer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "operator", "designer", "marketer"],
    },
  },
} as const;
