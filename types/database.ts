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
      analytics_contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          legacy_id: number | null
          message: string
          name: string
          phone: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          legacy_id?: number | null
          message: string
          name: string
          phone?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          legacy_id?: number | null
          message?: string
          name?: string
          phone?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_daily_summary: {
        Row: {
          active_users: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          email_logins: number
          google_logins: number
          id: string
          legacy_id: number | null
          new_users: number
          page_views: number
          summary_date: string
          total_bookings: number
          total_purchases: number
          total_revenue: number
          total_users: number
          updated_at: string
        }
        Insert: {
          active_users?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email_logins?: number
          google_logins?: number
          id?: string
          legacy_id?: number | null
          new_users?: number
          page_views?: number
          summary_date: string
          total_bookings?: number
          total_purchases?: number
          total_revenue?: number
          total_users?: number
          updated_at?: string
        }
        Update: {
          active_users?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email_logins?: number
          google_logins?: number
          id?: string
          legacy_id?: number | null
          new_users?: number
          page_views?: number
          summary_date?: string
          total_bookings?: number
          total_purchases?: number
          total_revenue?: number
          total_users?: number
          updated_at?: string
        }
        Relationships: []
      }
      analytics_likes: {
        Row: {
          content_id: number
          content_type: string
          created_at: string
          id: string
          legacy_id: number | null
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content_id: number
          content_type: string
          created_at?: string
          id?: string
          legacy_id?: number | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content_id?: number
          content_type?: string
          created_at?: string
          id?: string
          legacy_id?: number | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_market_purchases: {
        Row: {
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          legacy_id: number | null
          payment_method: string
          product_id: number
          product_name: string
          quantity: number
          status: string
          transaction_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          legacy_id?: number | null
          payment_method?: string
          product_id: number
          product_name: string
          quantity?: number
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          legacy_id?: number | null
          payment_method?: string
          product_id?: number
          product_name?: string
          quantity?: number
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_market_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          legacy_id: number | null
          page_count: number
          session_id: string
          updated_at: string
          user_agent: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          legacy_id?: number | null
          page_count?: number
          session_id: string
          updated_at?: string
          user_agent?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          legacy_id?: number | null
          page_count?: number
          session_id?: string
          updated_at?: string
          user_agent?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_social_shares: {
        Row: {
          content_id: number
          content_type: string
          created_at: string
          id: string
          legacy_id: number | null
          platform: Database["public"]["Enums"]["share_platform"]
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content_id: number
          content_type: string
          created_at?: string
          id?: string
          legacy_id?: number | null
          platform: Database["public"]["Enums"]["share_platform"]
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content_id?: number
          content_type?: string
          created_at?: string
          id?: string
          legacy_id?: number | null
          platform?: Database["public"]["Enums"]["share_platform"]
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_social_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_tour_bookings: {
        Row: {
          booking_date: string
          booking_reference: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          legacy_id: number | null
          participants: number
          status: string
          total_amount: number
          tour_id: number
          tour_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_date: string
          booking_reference?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          legacy_id?: number | null
          participants?: number
          status?: string
          total_amount: number
          tour_id: number
          tour_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          booking_reference?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          legacy_id?: number | null
          participants?: number
          status?: string
          total_amount?: number
          tour_id?: number
          tour_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_tour_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_user_activities: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at: string
          data: Json
          id: string
          ip_address: unknown
          legacy_id: number | null
          page_visited: string
          session_id: string
          updated_at: string
          user_agent: string
          user_id: string | null
        }
        Insert: {
          action?: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          data?: Json
          id?: string
          ip_address?: unknown
          legacy_id?: number | null
          page_visited?: string
          session_id?: string
          updated_at?: string
          user_agent?: string
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          data?: Json
          id?: string
          ip_address?: unknown
          legacy_id?: number | null
          page_visited?: string
          session_id?: string
          updated_at?: string
          user_agent?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artisan_products: {
        Row: {
          artisan_id: string
          craft_type: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          description: string
          dimensions: string
          id: string
          image_path: string | null
          image_url: string
          in_stock: boolean
          is_active: boolean
          is_featured: boolean
          legacy_id: number | null
          materials: string
          price: number
          quantity: number
          slug: string
          sort_order: number
          title: string
          updated_at: string
          weight: string
        }
        Insert: {
          artisan_id: string
          craft_type?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          dimensions?: string
          id?: string
          image_path?: string | null
          image_url?: string
          in_stock?: boolean
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          materials?: string
          price?: number
          quantity?: number
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
          weight?: string
        }
        Update: {
          artisan_id?: string
          craft_type?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          dimensions?: string
          id?: string
          image_path?: string | null
          image_url?: string
          in_stock?: boolean
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          materials?: string
          price?: number
          quantity?: number
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
          weight?: string
        }
        Relationships: [
          {
            foreignKeyName: "artisan_products_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
        ]
      }
      artisans: {
        Row: {
          bio: string
          cover_image_path: string | null
          cover_image_url: string
          craft_type: string
          created_at: string
          email: string
          facebook: string
          id: string
          instagram: string
          is_active: boolean
          is_featured: boolean
          legacy_id: number | null
          location: string
          name: string
          phone: string
          profile_image_path: string | null
          profile_image_url: string
          slug: string
          sort_order: number
          specialties: string
          title: string
          twitter: string
          updated_at: string
          website: string
          years_of_experience: number
        }
        Insert: {
          bio?: string
          cover_image_path?: string | null
          cover_image_url?: string
          craft_type?: string
          created_at?: string
          email?: string
          facebook?: string
          id?: string
          instagram?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          location?: string
          name: string
          phone?: string
          profile_image_path?: string | null
          profile_image_url?: string
          slug: string
          sort_order?: number
          specialties?: string
          title?: string
          twitter?: string
          updated_at?: string
          website?: string
          years_of_experience?: number
        }
        Update: {
          bio?: string
          cover_image_path?: string | null
          cover_image_url?: string
          craft_type?: string
          created_at?: string
          email?: string
          facebook?: string
          id?: string
          instagram?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          location?: string
          name?: string
          phone?: string
          profile_image_path?: string | null
          profile_image_url?: string
          slug?: string
          sort_order?: number
          specialties?: string
          title?: string
          twitter?: string
          updated_at?: string
          website?: string
          years_of_experience?: number
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_reference: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          email: string
          id: string
          legacy_id: number | null
          participants: number
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string
          schedule_id: string | null
          special_requests: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          tour_id: string
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_reference?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email: string
          id?: string
          legacy_id?: number | null
          participants?: number
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string
          schedule_id?: string | null
          special_requests?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          tour_id: string
          transaction_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_reference?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email?: string
          id?: string
          legacy_id?: number | null
          participants?: number
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string
          schedule_id?: string | null
          special_requests?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          tour_id?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "tour_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          legacy_id: number | null
          message: string
          name: string
          phone: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          legacy_id?: number | null
          message: string
          name: string
          phone?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          legacy_id?: number | null
          message?: string
          name?: string
          phone?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          clicked_at: string | null
          content: string
          created_at: string
          error_message: string
          id: string
          ip_address: unknown
          legacy_analytics_id: number | null
          legacy_pages_id: number | null
          metadata: Json
          opened_at: string | null
          recipient: string
          recipient_name: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          template_name: string
          tracking_id: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string | null
          content: string
          created_at?: string
          error_message?: string
          id?: string
          ip_address?: unknown
          legacy_analytics_id?: number | null
          legacy_pages_id?: number | null
          metadata?: Json
          opened_at?: string | null
          recipient: string
          recipient_name?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          template_name?: string
          tracking_id?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string | null
          content?: string
          created_at?: string
          error_message?: string
          id?: string
          ip_address?: unknown
          legacy_analytics_id?: number | null
          legacy_pages_id?: number | null
          metadata?: Json
          opened_at?: string | null
          recipient?: string
          recipient_name?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          template_name?: string
          tracking_id?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      footer_contacts: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          legacy_id: number | null
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          sort_order?: number
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_features: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          legacy_id: number | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_quick_links: {
        Row: {
          category: Database["public"]["Enums"]["footer_link_category"]
          created_at: string
          id: string
          is_active: boolean
          label: string
          legacy_id: number | null
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          category: Database["public"]["Enums"]["footer_link_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          legacy_id?: number | null
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          category?: Database["public"]["Enums"]["footer_link_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          legacy_id?: number | null
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      footer_settings: {
        Row: {
          company_name: string
          copyright_text: string
          created_at: string
          id: string
          legacy_id: number | null
          newsletter_button: string
          newsletter_note: string
          newsletter_placeholder: string
          tagline: string
          updated_at: string
        }
        Insert: {
          company_name?: string
          copyright_text?: string
          created_at?: string
          id?: string
          legacy_id?: number | null
          newsletter_button?: string
          newsletter_note?: string
          newsletter_placeholder?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          copyright_text?: string
          created_at?: string
          id?: string
          legacy_id?: number | null
          newsletter_button?: string
          newsletter_note?: string
          newsletter_placeholder?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          legacy_id: number | null
          section: Database["public"]["Enums"]["homepage_section_key"]
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          section: Database["public"]["Enums"]["homepage_section_key"]
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          section?: Database["public"]["Enums"]["homepage_section_key"]
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_slides: {
        Row: {
          button_link: string
          button_text: string
          created_at: string
          description: string
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean
          legacy_id: number | null
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          button_link?: string
          button_text?: string
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          legacy_id?: number | null
          sort_order?: number
          subtitle?: string
          title: string
          updated_at?: string
        }
        Update: {
          button_link?: string
          button_text?: string
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          legacy_id?: number | null
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      issue_reports: {
        Row: {
          created_at: string
          description: string
          email: string
          id: string
          is_read: boolean
          legacy_id: number | null
          phone: string
          priority: Database["public"]["Enums"]["issue_priority"]
          resolution_notes: string
          status: Database["public"]["Enums"]["issue_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          email?: string
          id?: string
          is_read?: boolean
          legacy_id?: number | null
          phone?: string
          priority?: Database["public"]["Enums"]["issue_priority"]
          resolution_notes?: string
          status?: Database["public"]["Enums"]["issue_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          id?: string
          is_read?: boolean
          legacy_id?: number | null
          phone?: string
          priority?: Database["public"]["Enums"]["issue_priority"]
          resolution_notes?: string
          status?: Database["public"]["Enums"]["issue_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          legacy_id: number | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_openings: {
        Row: {
          category_id: string | null
          closing_date: string | null
          created_at: string
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          is_active: boolean
          legacy_id: number | null
          location: string
          requirements: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          closing_date?: string | null
          created_at?: string
          description: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          location?: string
          requirements: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          closing_date?: string | null
          created_at?: string
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          location?: string
          requirements?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_openings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          legacy_id: number | null
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          legacy_id?: number | null
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          legacy_id?: number | null
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          legacy_id: number | null
          location: string | null
          success: boolean
          updated_at: string
          user_agent: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: unknown
          legacy_id?: number | null
          location?: string | null
          success: boolean
          updated_at?: string
          user_agent?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          legacy_id?: number | null
          location?: string | null
          success?: boolean
          updated_at?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      main_feature_cards: {
        Row: {
          button_color: string
          button_link: string
          button_text: string
          card_type: Database["public"]["Enums"]["feature_card_type"]
          created_at: string
          description: string
          description_alignment: Database["public"]["Enums"]["text_alignment"]
          description_color: string
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean
          legacy_id: number | null
          max_width: string
          mobile_card_height: string
          mobile_card_width: string
          sort_order: number
          subtitle: string
          subtitle_alignment: Database["public"]["Enums"]["text_alignment"]
          subtitle_color: string
          title: string
          title_alignment: Database["public"]["Enums"]["text_alignment"]
          title_color: string
          updated_at: string
        }
        Insert: {
          button_color?: string
          button_link?: string
          button_text?: string
          card_type?: Database["public"]["Enums"]["feature_card_type"]
          created_at?: string
          description?: string
          description_alignment?: Database["public"]["Enums"]["text_alignment"]
          description_color?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          legacy_id?: number | null
          max_width?: string
          mobile_card_height?: string
          mobile_card_width?: string
          sort_order?: number
          subtitle?: string
          subtitle_alignment?: Database["public"]["Enums"]["text_alignment"]
          subtitle_color?: string
          title: string
          title_alignment?: Database["public"]["Enums"]["text_alignment"]
          title_color?: string
          updated_at?: string
        }
        Update: {
          button_color?: string
          button_link?: string
          button_text?: string
          card_type?: Database["public"]["Enums"]["feature_card_type"]
          created_at?: string
          description?: string
          description_alignment?: Database["public"]["Enums"]["text_alignment"]
          description_color?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          legacy_id?: number | null
          max_width?: string
          mobile_card_height?: string
          mobile_card_width?: string
          sort_order?: number
          subtitle?: string
          subtitle_alignment?: Database["public"]["Enums"]["text_alignment"]
          subtitle_color?: string
          title?: string
          title_alignment?: Database["public"]["Enums"]["text_alignment"]
          title_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_categories: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean
          legacy_id: number | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          legacy_id?: number | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          legacy_id?: number | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      market_products: {
        Row: {
          artisan_bio: string
          artisan_id: string | null
          artisan_image_url: string
          button_link: string
          button_text: string
          care_instructions: string
          category_id: string | null
          colors: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          description: string
          dimensions: string
          discount_price: number | null
          gallery_images: string
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean
          is_featured: boolean
          is_in_stock: boolean
          legacy_id: number | null
          materials: string
          origin: string
          price: number
          rating: number
          review_count: number
          sizes: string
          sku: string
          slug: string
          sort_order: number
          stock_quantity: number
          tags: string
          title: string
          updated_at: string
          weight: string
        }
        Insert: {
          artisan_bio?: string
          artisan_id?: string | null
          artisan_image_url?: string
          button_link?: string
          button_text?: string
          care_instructions?: string
          category_id?: string | null
          colors?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          dimensions?: string
          discount_price?: number | null
          gallery_images?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          is_in_stock?: boolean
          legacy_id?: number | null
          materials?: string
          origin?: string
          price?: number
          rating?: number
          review_count?: number
          sizes?: string
          sku?: string
          slug: string
          sort_order?: number
          stock_quantity?: number
          tags?: string
          title: string
          updated_at?: string
          weight?: string
        }
        Update: {
          artisan_bio?: string
          artisan_id?: string | null
          artisan_image_url?: string
          button_link?: string
          button_text?: string
          care_instructions?: string
          category_id?: string | null
          colors?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          dimensions?: string
          discount_price?: number | null
          gallery_images?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          is_in_stock?: boolean
          legacy_id?: number | null
          materials?: string
          origin?: string
          price?: number
          rating?: number
          review_count?: number
          sizes?: string
          sku?: string
          slug?: string
          sort_order?: number
          stock_quantity?: number
          tags?: string
          title?: string
          updated_at?: string
          weight?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_products_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "market_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          created_at: string | null
          folder_id: string
          id: string
          mime_type: string | null
          name: string
          public_url: string
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          folder_id: string
          id?: string
          mime_type?: string | null
          name: string
          public_url: string
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string
          id?: string
          mime_type?: string | null
          name?: string
          public_url?: string
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      media_folders: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      navbar_dropdowns: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          legacy_id: number | null
          parent_menu_id: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          legacy_id?: number | null
          parent_menu_id: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          legacy_id?: number | null
          parent_menu_id?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "navbar_dropdowns_parent_menu_id_fkey"
            columns: ["parent_menu_id"]
            isOneToOne: false
            referencedRelation: "navbar_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      navbar_menus: {
        Row: {
          created_at: string
          has_dropdown: boolean
          id: string
          is_active: boolean
          label: string
          legacy_id: number | null
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          has_dropdown?: boolean
          id?: string
          is_active?: boolean
          label: string
          legacy_id?: number | null
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          has_dropdown?: boolean
          id?: string
          is_active?: boolean
          label?: string
          legacy_id?: number | null
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          email: string
          id: string
          ip_address: unknown
          is_active: boolean
          latitude: number | null
          legacy_id: number | null
          longitude: number | null
          os: string | null
          postal_code: string | null
          region: string | null
          source: Database["public"]["Enums"]["newsletter_source"]
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          email: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          latitude?: number | null
          legacy_id?: number | null
          longitude?: number | null
          os?: string | null
          postal_code?: string | null
          region?: string | null
          source?: Database["public"]["Enums"]["newsletter_source"]
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          latitude?: number | null
          legacy_id?: number | null
          longitude?: number | null
          os?: string | null
          postal_code?: string | null
          region?: string | null
          source?: Database["public"]["Enums"]["newsletter_source"]
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          legacy_id: number | null
          notes: string
          order_number: string
          order_status: Database["public"]["Enums"]["order_status"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          paystack_transaction_id: string | null
          phone_number: string
          product_id: string
          quantity: number
          shipping_address: string
          shipping_city: string
          shipping_country: string
          shipping_postal_code: string
          shipping_region: string
          total_price: number
          tracking_number: string
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          legacy_id?: number | null
          notes?: string
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_transaction_id?: string | null
          phone_number?: string
          product_id: string
          quantity?: number
          shipping_address?: string
          shipping_city?: string
          shipping_country?: string
          shipping_postal_code?: string
          shipping_region?: string
          total_price: number
          tracking_number?: string
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          legacy_id?: number | null
          notes?: string
          order_number?: string
          order_status?: Database["public"]["Enums"]["order_status"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paystack_transaction_id?: string | null
          phone_number?: string
          product_id?: string
          quantity?: number
          shipping_address?: string
          shipping_city?: string
          shipping_country?: string
          shipping_postal_code?: string
          shipping_region?: string
          total_price?: number
          tracking_number?: string
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_paystack_transaction_id_fkey"
            columns: ["paystack_transaction_id"]
            isOneToOne: false
            referencedRelation: "paystack_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "market_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paystack_transactions: {
        Row: {
          amount: number
          authorization_code: string
          bank: string
          card_type: string
          channel: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          email: string
          id: string
          last4: string
          legacy_id: number | null
          metadata: Json
          name: string
          order_id: string
          paid_at: string | null
          phone: string
          product_ids: Json
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          authorization_code?: string
          bank?: string
          card_type?: string
          channel?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email: string
          id?: string
          last4?: string
          legacy_id?: number | null
          metadata?: Json
          name?: string
          order_id?: string
          paid_at?: string | null
          phone?: string
          product_ids?: Json
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          authorization_code?: string
          bank?: string
          card_type?: string
          channel?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email?: string
          id?: string
          last4?: string
          legacy_id?: number | null
          metadata?: Json
          name?: string
          order_id?: string
          paid_at?: string | null
          phone?: string
          product_ids?: Json
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paystack_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paystack_webhook_logs: {
        Row: {
          created_at: string
          error_message: string
          event_type: string
          id: string
          is_processed: boolean
          legacy_id: number | null
          payload: Json
          processed_at: string | null
          reference: string
          signature: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string
          event_type: string
          id?: string
          is_processed?: boolean
          legacy_id?: number | null
          payload: Json
          processed_at?: string | null
          reference: string
          signature?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string
          event_type?: string
          id?: string
          is_processed?: boolean
          legacy_id?: number | null
          payload?: Json
          processed_at?: string | null
          reference?: string
          signature?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_gallery: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean
          is_primary: boolean
          legacy_id: number | null
          media_type: string
          product_id: string
          sort_order: number
          title: string
          updated_at: string
          video_file_path: string | null
          video_url: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          is_primary?: boolean
          legacy_id?: number | null
          media_type?: string
          product_id: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_file_path?: string | null
          video_url?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          is_primary?: boolean
          legacy_id?: number | null
          media_type?: string
          product_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_file_path?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_gallery_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "market_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          email_notifications: boolean
          first_name: string
          id: string
          is_active: boolean
          is_admin: boolean
          last_activity: string
          last_name: string
          legacy_id: number | null
          marketing_emails: boolean
          phone_number: string | null
          preferred_language: string
          sms_notifications: boolean
          text_size: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          email_notifications?: boolean
          first_name?: string
          id: string
          is_active?: boolean
          is_admin?: boolean
          last_activity?: string
          last_name?: string
          legacy_id?: number | null
          marketing_emails?: boolean
          phone_number?: string | null
          preferred_language?: string
          sms_notifications?: boolean
          text_size?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          email_notifications?: boolean
          first_name?: string
          id?: string
          is_active?: boolean
          is_admin?: boolean
          last_activity?: string
          last_name?: string
          legacy_id?: number | null
          marketing_emails?: boolean
          phone_number?: string | null
          preferred_language?: string
          sms_notifications?: boolean
          text_size?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount: string
          created_at: string
          deadline: string
          description: string
          destination_id: string
          id: string
          is_active: boolean
          is_featured: boolean
          legacy_id: number | null
          level: Database["public"]["Enums"]["scholarship_level"]
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: string
          created_at?: string
          deadline: string
          description?: string
          destination_id: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          level?: Database["public"]["Enums"]["scholarship_level"]
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: string
          created_at?: string
          deadline?: string
          description?: string
          destination_id?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          level?: Database["public"]["Enums"]["scholarship_level"]
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "study_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_settings: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          estimated_days: string
          free_shipping_threshold: number
          id: string
          is_active: boolean
          legacy_id: number | null
          money_back_guarantee: string
          return_policy: string
          secure_payment_text: string
          shipping_cost: number
          shipping_from: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          estimated_days?: string
          free_shipping_threshold?: number
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          money_back_guarantee?: string
          return_policy?: string
          secure_payment_text?: string
          shipping_cost?: number
          shipping_from?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          estimated_days?: string
          free_shipping_threshold?: number
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          money_back_guarantee?: string
          return_policy?: string
          secure_payment_text?: string
          shipping_cost?: number
          shipping_from?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          favicon_url: string
          id: string
          legacy_id: number | null
          login_background_url: string
          login_description: string
          login_features: string
          login_headline: string
          logo_url: string
          register_background_url: string
          register_description: string
          register_features: string
          register_headline: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          favicon_url?: string
          id?: string
          legacy_id?: number | null
          login_background_url?: string
          login_description?: string
          login_features?: string
          login_headline?: string
          logo_url?: string
          register_background_url?: string
          register_description?: string
          register_features?: string
          register_headline?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          favicon_url?: string
          id?: string
          legacy_id?: number | null
          login_background_url?: string
          login_description?: string
          login_features?: string
          login_headline?: string
          logo_url?: string
          register_background_url?: string
          register_description?: string
          register_features?: string
          register_headline?: string
          updated_at?: string
        }
        Relationships: []
      }
      small_glass_cards: {
        Row: {
          button_link: string
          button_text: string
          created_at: string
          description: string
          description_alignment: Database["public"]["Enums"]["text_alignment"]
          description_color: string
          description_size: string
          icon: string
          icon_image_path: string | null
          icon_image_url: string
          id: string
          is_active: boolean
          legacy_id: number | null
          main_card_id: string | null
          sort_order: number
          title: string
          title_alignment: Database["public"]["Enums"]["text_alignment"]
          title_color: string
          title_size: string
          updated_at: string
        }
        Insert: {
          button_link?: string
          button_text?: string
          created_at?: string
          description?: string
          description_alignment?: Database["public"]["Enums"]["text_alignment"]
          description_color?: string
          description_size?: string
          icon?: string
          icon_image_path?: string | null
          icon_image_url?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          main_card_id?: string | null
          sort_order?: number
          title: string
          title_alignment?: Database["public"]["Enums"]["text_alignment"]
          title_color?: string
          title_size?: string
          updated_at?: string
        }
        Update: {
          button_link?: string
          button_text?: string
          created_at?: string
          description?: string
          description_alignment?: Database["public"]["Enums"]["text_alignment"]
          description_color?: string
          description_size?: string
          icon?: string
          icon_image_path?: string | null
          icon_image_url?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          main_card_id?: string | null
          sort_order?: number
          title?: string
          title_alignment?: Database["public"]["Enums"]["text_alignment"]
          title_color?: string
          title_size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "small_glass_cards_main_card_id_fkey"
            columns: ["main_card_id"]
            isOneToOne: false
            referencedRelation: "main_feature_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          legacy_id: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          legacy_id?: number | null
          platform?: Database["public"]["Enums"]["social_platform"]
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      study_destinations: {
        Row: {
          average_tuition: string
          button_link: string
          button_text: string
          cost_of_living: string
          country_name: string
          created_at: string
          currency_name: string
          description: string
          flag: string
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean
          is_featured: boolean
          language: string
          legacy_id: number | null
          slug: string
          sort_order: number
          updated_at: string
          why_study: string
        }
        Insert: {
          average_tuition?: string
          button_link?: string
          button_text?: string
          cost_of_living?: string
          country_name: string
          created_at?: string
          currency_name?: string
          description?: string
          flag?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          language?: string
          legacy_id?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
          why_study?: string
        }
        Update: {
          average_tuition?: string
          button_link?: string
          button_text?: string
          cost_of_living?: string
          country_name?: string
          created_at?: string
          currency_name?: string
          description?: string
          flag?: string
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          language?: string
          legacy_id?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
          why_study?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          category: Database["public"]["Enums"]["suggestion_category"]
          created_at: string
          email: string
          id: string
          is_read: boolean
          legacy_id: number | null
          message: string
          status: Database["public"]["Enums"]["suggestion_status"]
          subject: string
          updated_at: string
          user_id: string | null
          votes: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["suggestion_category"]
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          legacy_id?: number | null
          message: string
          status?: Database["public"]["Enums"]["suggestion_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
          votes?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["suggestion_category"]
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          legacy_id?: number | null
          message?: string
          status?: Database["public"]["Enums"]["suggestion_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string
          created_at: string
          email: string
          id: string
          image_path: string | null
          is_active: boolean
          legacy_id: number | null
          linkedin: string
          name: string
          position: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string
          created_at?: string
          email?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          legacy_id?: number | null
          linkedin?: string
          name: string
          position?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          email?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          legacy_id?: number | null
          linkedin?: string
          name?: string
          position?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tech_events: {
        Row: {
          address: string
          capacity: number
          created_at: string
          description: string
          ends_at: string | null
          event_type: Database["public"]["Enums"]["tech_event_type"]
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean
          is_featured: boolean
          is_upcoming: boolean
          legacy_id: number | null
          location: string
          registered: number
          slug: string
          sort_order: number
          speakers: string
          starts_at: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          address?: string
          capacity?: number
          created_at?: string
          description?: string
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["tech_event_type"]
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          is_upcoming?: boolean
          legacy_id?: number | null
          location?: string
          registered?: number
          slug: string
          sort_order?: number
          speakers?: string
          starts_at: string
          title: string
          updated_at?: string
          venue?: string
        }
        Update: {
          address?: string
          capacity?: number
          created_at?: string
          description?: string
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["tech_event_type"]
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          is_upcoming?: boolean
          legacy_id?: number | null
          location?: string
          registered?: number
          slug?: string
          sort_order?: number
          speakers?: string
          starts_at?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      tech_innovations: {
        Row: {
          category: Database["public"]["Enums"]["innovation_category"]
          created_at: string
          demo_url: string
          description: string
          features: string
          github_url: string
          icon: string
          id: string
          image_path: string | null
          image_url: string
          impact_score: number
          is_active: boolean
          is_featured: boolean
          launch_date: string | null
          legacy_id: number | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["innovation_status"]
          team: string
          tech_stack: string
          title: string
          updated_at: string
          website: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["innovation_category"]
          created_at?: string
          demo_url?: string
          description?: string
          features?: string
          github_url?: string
          icon?: string
          id?: string
          image_path?: string | null
          image_url?: string
          impact_score?: number
          is_active?: boolean
          is_featured?: boolean
          launch_date?: string | null
          legacy_id?: number | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["innovation_status"]
          team?: string
          tech_stack?: string
          title: string
          updated_at?: string
          website?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["innovation_category"]
          created_at?: string
          demo_url?: string
          description?: string
          features?: string
          github_url?: string
          icon?: string
          id?: string
          image_path?: string | null
          image_url?: string
          impact_score?: number
          is_active?: boolean
          is_featured?: boolean
          launch_date?: string | null
          legacy_id?: number | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["innovation_status"]
          team?: string
          tech_stack?: string
          title?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      tech_resources: {
        Row: {
          author: string
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["resource_difficulty"]
          duration: string
          id: string
          is_active: boolean
          is_featured: boolean
          legacy_id: number | null
          resource_type: Database["public"]["Enums"]["tech_resource_type"]
          slug: string
          sort_order: number
          tags: string
          thumbnail_path: string | null
          thumbnail_url: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          author?: string
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["resource_difficulty"]
          duration?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          resource_type?: Database["public"]["Enums"]["tech_resource_type"]
          slug: string
          sort_order?: number
          tags?: string
          thumbnail_path?: string | null
          thumbnail_url?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          author?: string
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["resource_difficulty"]
          duration?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          resource_type?: Database["public"]["Enums"]["tech_resource_type"]
          slug?: string
          sort_order?: number
          tags?: string
          thumbnail_path?: string | null
          thumbnail_url?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_image_path: string | null
          author_name: string
          author_position: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          is_featured: boolean
          legacy_id: number | null
          rating: number
          updated_at: string
        }
        Insert: {
          author_image_path?: string | null
          author_name: string
          author_position?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          rating?: number
          updated_at?: string
        }
        Update: {
          author_image_path?: string | null
          author_name?: string
          author_position?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      tour_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          image_path: string | null
          is_active: boolean
          legacy_id: number | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          legacy_id?: number | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          legacy_id?: number | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tour_reviews: {
        Row: {
          comment: string
          created_at: string
          flags: Json
          id: string
          is_flagged: boolean
          legacy_id: number | null
          moderation_notes: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          tour_id: string
          updated_at: string
          user_email: string
          user_name: string
        }
        Insert: {
          comment: string
          created_at?: string
          flags?: Json
          id?: string
          is_flagged?: boolean
          legacy_id?: number | null
          moderation_notes?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          tour_id: string
          updated_at?: string
          user_email?: string
          user_name: string
        }
        Update: {
          comment?: string
          created_at?: string
          flags?: Json
          id?: string
          is_flagged?: boolean
          legacy_id?: number | null
          moderation_notes?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          tour_id?: string
          updated_at?: string
          user_email?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_reviews_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_schedules: {
        Row: {
          available_spots: number
          booked_spots: number
          created_at: string
          end_date: string
          id: string
          is_cancelled: boolean
          is_full: boolean | null
          legacy_id: number | null
          notes: string
          remaining_spots: number | null
          start_date: string
          tour_id: string
          updated_at: string
        }
        Insert: {
          available_spots?: number
          booked_spots?: number
          created_at?: string
          end_date: string
          id?: string
          is_cancelled?: boolean
          is_full?: boolean | null
          legacy_id?: number | null
          notes?: string
          remaining_spots?: number | null
          start_date: string
          tour_id: string
          updated_at?: string
        }
        Update: {
          available_spots?: number
          booked_spots?: number
          created_at?: string
          end_date?: string
          id?: string
          is_cancelled?: boolean
          is_full?: boolean | null
          legacy_id?: number | null
          notes?: string
          remaining_spots?: number | null
          start_date?: string
          tour_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_schedules_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          category_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          description: string
          discount_price: number | null
          duration_days: number
          excludes: string
          featured_image_path: string | null
          featured_image_url: string
          final_price: number | null
          gallery: string
          highlights: string
          id: string
          includes: string
          is_active: boolean
          is_featured: boolean
          itinerary: string
          legacy_id: number | null
          location: string
          max_group_size: number
          meeting_point: string
          min_group_size: number
          price: number
          rating: number
          region: string
          review_count: number
          short_description: string
          slug: string
          title: string
          updated_at: string
          video_preview_seconds: number
          video_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description: string
          discount_price?: number | null
          duration_days?: number
          excludes?: string
          featured_image_path?: string | null
          featured_image_url?: string
          final_price?: number | null
          gallery?: string
          highlights?: string
          id?: string
          includes?: string
          is_active?: boolean
          is_featured?: boolean
          itinerary?: string
          legacy_id?: number | null
          location?: string
          max_group_size?: number
          meeting_point?: string
          min_group_size?: number
          price?: number
          rating?: number
          region?: string
          review_count?: number
          short_description?: string
          slug: string
          title: string
          updated_at?: string
          video_preview_seconds?: number
          video_url?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          discount_price?: number | null
          duration_days?: number
          excludes?: string
          featured_image_path?: string | null
          featured_image_url?: string
          final_price?: number | null
          gallery?: string
          highlights?: string
          id?: string
          includes?: string
          is_active?: boolean
          is_featured?: boolean
          itinerary?: string
          legacy_id?: number | null
          location?: string
          max_group_size?: number
          meeting_point?: string
          min_group_size?: number
          price?: number
          rating?: number
          region?: string
          review_count?: number
          short_description?: string
          slug?: string
          title?: string
          updated_at?: string
          video_preview_seconds?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tour_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          device_type: Database["public"]["Enums"]["device_type"]
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity: string
          legacy_id: number | null
          session_key: string
          updated_at: string
          user_agent: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          ip_address: unknown
          is_active?: boolean
          last_activity?: string
          legacy_id?: number | null
          session_key: string
          updated_at?: string
          user_agent?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          legacy_id?: number | null
          session_key?: string
          updated_at?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_bookings: {
        Row: {
          booking_number: string
          check_in: string
          check_out: string
          cleaning_fee: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          guest_email: string
          guest_name: string
          guest_phone: string
          guests: number
          id: string
          legacy_id: number | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          rental_id: string
          special_requests: string
          status: Database["public"]["Enums"]["vacation_booking_status"]
          subtotal: number
          total_nights: number
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_number?: string
          check_in: string
          check_out: string
          cleaning_fee?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guests?: number
          id?: string
          legacy_id?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          rental_id: string
          special_requests?: string
          status?: Database["public"]["Enums"]["vacation_booking_status"]
          subtotal: number
          total_nights: number
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_number?: string
          check_in?: string
          check_out?: string
          cleaning_fee?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guests?: number
          id?: string
          legacy_id?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          rental_id?: string
          special_requests?: string
          status?: Database["public"]["Enums"]["vacation_booking_status"]
          subtotal?: number
          total_nights?: number
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_bookings_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "vacation_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacation_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_rentals: {
        Row: {
          address: string
          amenities: string
          bathrooms: number
          bedrooms: number
          city: string
          cleaning_fee: number
          country: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          description: string
          id: string
          images: Json
          is_active: boolean
          is_available: boolean
          is_featured: boolean
          legacy_id: number | null
          location: string
          main_image_path: string | null
          main_image_url: string
          max_guests: number
          price_per_night: number
          property_type: Database["public"]["Enums"]["rental_property_type"]
          region: string
          security_deposit: number
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          address?: string
          amenities?: string
          bathrooms?: number
          bedrooms?: number
          city?: string
          cleaning_fee?: number
          country?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          id?: string
          images?: Json
          is_active?: boolean
          is_available?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          location?: string
          main_image_path?: string | null
          main_image_url?: string
          max_guests?: number
          price_per_night?: number
          property_type?: Database["public"]["Enums"]["rental_property_type"]
          region?: string
          security_deposit?: number
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string
          bathrooms?: number
          bedrooms?: number
          city?: string
          cleaning_fee?: number
          country?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          id?: string
          images?: Json
          is_active?: boolean
          is_available?: boolean
          is_featured?: boolean
          legacy_id?: number | null
          location?: string
          main_image_path?: string | null
          main_image_url?: string
          max_guests?: number
          price_per_night?: number
          property_type?: Database["public"]["Enums"]["rental_property_type"]
          region?: string
          security_deposit?: number
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      video_sections: {
        Row: {
          card_type: Database["public"]["Enums"]["video_card_type"]
          category: string
          created_at: string
          description: string
          id: string
          image_file_path: string | null
          image_url: string
          is_active: boolean
          legacy_id: number | null
          media_type: Database["public"]["Enums"]["video_media_type"]
          social_button_text: string
          social_link: string
          social_platform: Database["public"]["Enums"]["social_platform"] | null
          sort_order: number
          thumbnail_path: string | null
          title: string
          updated_at: string
          video_file_path: string | null
          video_url: string
        }
        Insert: {
          card_type?: Database["public"]["Enums"]["video_card_type"]
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_file_path?: string | null
          image_url?: string
          is_active?: boolean
          legacy_id?: number | null
          media_type?: Database["public"]["Enums"]["video_media_type"]
          social_button_text?: string
          social_link?: string
          social_platform?:
            | Database["public"]["Enums"]["social_platform"]
            | null
          sort_order?: number
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          video_file_path?: string | null
          video_url?: string
        }
        Update: {
          card_type?: Database["public"]["Enums"]["video_card_type"]
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_file_path?: string | null
          image_url?: string
          is_active?: boolean
          legacy_id?: number | null
          media_type?: Database["public"]["Enums"]["video_media_type"]
          social_button_text?: string
          social_link?: string
          social_platform?:
            | Database["public"]["Enums"]["social_platform"]
            | null
          sort_order?: number
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          video_file_path?: string | null
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      activity_action:
        | "view"
        | "login"
        | "google_login"
        | "email_login"
        | "logout"
        | "click"
        | "purchase"
        | "booking"
        | "contact"
        | "export"
        | "import"
        | "delete"
        | "edit"
        | "create"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      currency_code: "GHS" | "USD" | "EUR" | "GBP"
      device_type: "desktop" | "mobile" | "tablet" | "other"
      email_status:
        | "queued"
        | "sent"
        | "opened"
        | "clicked"
        | "bounced"
        | "failed"
        | "unsubscribed"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "remote"
      feature_card_type: "study" | "market" | "custom"
      footer_link_category: "destinations" | "services" | "company" | "support"
      homepage_section_key: "hero" | "destinations" | "study_abroad" | "market"
      innovation_category:
        | "ai"
        | "vr"
        | "cloud"
        | "mobile"
        | "blockchain"
        | "iot"
        | "web3"
        | "other"
      innovation_status: "active" | "development" | "completed" | "planned"
      issue_priority: "low" | "medium" | "high" | "critical"
      issue_status: "new" | "in_progress" | "resolved" | "closed" | "wont_fix"
      newsletter_source: "footer" | "popup" | "landing" | "other"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status: "pending" | "success" | "failed" | "abandoned"
      rental_property_type:
        | "apartment"
        | "house"
        | "villa"
        | "cottage"
        | "studio"
        | "other"
      resource_difficulty: "beginner" | "intermediate" | "advanced"
      review_status: "pending" | "approved" | "rejected"
      scholarship_level: "bachelor" | "master" | "phd" | "all"
      share_platform:
        | "facebook"
        | "twitter"
        | "linkedin"
        | "whatsapp"
        | "email"
        | "copy_link"
        | "other"
      social_platform:
        | "facebook"
        | "twitter"
        | "instagram"
        | "linkedin"
        | "youtube"
        | "tiktok"
        | "whatsapp"
        | "other"
      suggestion_category: "feature" | "improvement" | "general" | "other"
      suggestion_status:
        | "pending"
        | "reviewing"
        | "approved"
        | "rejected"
        | "implemented"
      tech_event_type:
        | "workshop"
        | "hackathon"
        | "seminar"
        | "conference"
        | "meetup"
        | "webinar"
      tech_resource_type:
        | "article"
        | "video"
        | "tutorial"
        | "tool"
        | "course"
        | "podcast"
      text_alignment: "left" | "center" | "right"
      vacation_booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "refunded"
      video_card_type: "wide" | "short"
      video_media_type: "video" | "image" | "none"
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
      activity_action: [
        "view",
        "login",
        "google_login",
        "email_login",
        "logout",
        "click",
        "purchase",
        "booking",
        "contact",
        "export",
        "import",
        "delete",
        "edit",
        "create",
      ],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      currency_code: ["GHS", "USD", "EUR", "GBP"],
      device_type: ["desktop", "mobile", "tablet", "other"],
      email_status: [
        "queued",
        "sent",
        "opened",
        "clicked",
        "bounced",
        "failed",
        "unsubscribed",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "remote",
      ],
      feature_card_type: ["study", "market", "custom"],
      footer_link_category: ["destinations", "services", "company", "support"],
      homepage_section_key: ["hero", "destinations", "study_abroad", "market"],
      innovation_category: [
        "ai",
        "vr",
        "cloud",
        "mobile",
        "blockchain",
        "iot",
        "web3",
        "other",
      ],
      innovation_status: ["active", "development", "completed", "planned"],
      issue_priority: ["low", "medium", "high", "critical"],
      issue_status: ["new", "in_progress", "resolved", "closed", "wont_fix"],
      newsletter_source: ["footer", "popup", "landing", "other"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: ["pending", "success", "failed", "abandoned"],
      rental_property_type: [
        "apartment",
        "house",
        "villa",
        "cottage",
        "studio",
        "other",
      ],
      resource_difficulty: ["beginner", "intermediate", "advanced"],
      review_status: ["pending", "approved", "rejected"],
      scholarship_level: ["bachelor", "master", "phd", "all"],
      share_platform: [
        "facebook",
        "twitter",
        "linkedin",
        "whatsapp",
        "email",
        "copy_link",
        "other",
      ],
      social_platform: [
        "facebook",
        "twitter",
        "instagram",
        "linkedin",
        "youtube",
        "tiktok",
        "whatsapp",
        "other",
      ],
      suggestion_category: ["feature", "improvement", "general", "other"],
      suggestion_status: [
        "pending",
        "reviewing",
        "approved",
        "rejected",
        "implemented",
      ],
      tech_event_type: [
        "workshop",
        "hackathon",
        "seminar",
        "conference",
        "meetup",
        "webinar",
      ],
      tech_resource_type: [
        "article",
        "video",
        "tutorial",
        "tool",
        "course",
        "podcast",
      ],
      text_alignment: ["left", "center", "right"],
      vacation_booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "refunded",
      ],
      video_card_type: ["wide", "short"],
      video_media_type: ["video", "image", "none"],
    },
  },
} as const
