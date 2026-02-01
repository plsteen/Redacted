// TODO: replace with generated types from Supabase when the public schema is ready.
// Using a permissive type to keep the scaffold compiling.
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
      };
      mysteries: {
        Row: {
          id: string;
          slug: string;
          title: string;
          locale: string;
          difficulty: number;
          price_nok: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          locale?: string;
          difficulty?: number;
          price_nok?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          locale?: string;
          difficulty?: number;
          price_nok?: number | null;
          created_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          mystery_id: string;
          platform: string;
          amount: number;
          currency: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          status: string;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mystery_id: string;
          platform?: string;
          amount: number;
          currency?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: string;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mystery_id?: string;
          platform?: string;
          amount?: number;
          currency?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: string;
          purchased_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          mystery_id: string;
          code: string;
          status: string;
          host_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mystery_id: string;
          code: string;
          status?: string;
          host_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          mystery_id?: string;
          code?: string;
          status?: string;
          host_user_id?: string | null;
          created_at?: string;
        };
      };
      stripe_events: {
        Row: {
          id: string;
          event_type: string;
          processed_at: string;
          payload: Record<string, unknown> | null;
        };
        Insert: {
          id: string;
          event_type: string;
          processed_at?: string;
          payload?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          event_type?: string;
          processed_at?: string;
          payload?: Record<string, unknown> | null;
        };
      };
      content_access: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          mystery_id: string;
          granted_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          mystery_id: string;
          granted_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          mystery_id?: string;
          granted_at?: string;
          expires_at?: string | null;
        };
      };
      session_analytics: {
        Row: {
          id: string;
          case_id: string;
          session_code: string | null;
          player_name: string;
          total_time_seconds: number;
          hints_used: number;
          tasks_completed: number;
          rating: number | null;
          comment: string | null;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          session_code?: string | null;
          player_name: string;
          total_time_seconds: number;
          hints_used?: number;
          tasks_completed?: number;
          rating?: number | null;
          comment?: string | null;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          session_code?: string | null;
          player_name?: string;
          total_time_seconds?: number;
          hints_used?: number;
          tasks_completed?: number;
          rating?: number | null;
          comment?: string | null;
          completed_at?: string;
          created_at?: string;
        };
      };
      task_completion_log: {
        Row: {
          id: string;
          session_id: string;
          case_id: string;
          task_idx: number;
          time_spent_seconds: number;
          hints_used: number;
          attempts: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          case_id: string;
          task_idx: number;
          time_spent_seconds: number;
          hints_used?: number;
          attempts?: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          case_id?: string;
          task_idx?: number;
          time_spent_seconds?: number;
          hints_used?: number;
          attempts?: number;
          completed_at?: string;
        };
      };
      case_feedback: {
        Row: {
          id: string;
          case_id: string;
          session_code: string | null;
          rating: number;
          comment: string | null;
          time_spent: number | null;
          hints_used: number | null;
          player_name: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          session_code?: string | null;
          rating: number;
          comment?: string | null;
          time_spent?: number | null;
          hints_used?: number | null;
          player_name?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          session_code?: string | null;
          rating?: number;
          comment?: string | null;
          time_spent?: number | null;
          hints_used?: number | null;
          player_name?: string | null;
          submitted_at?: string;
        };
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase generated type
      [key: string]: any;
    };
    Views: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase generated type
      [key: string]: any;
    };
    Functions: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase generated type
      [key: string]: any;
    };
    Enums: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase generated type
      [key: string]: any;
    };
  };
};

