/**
 * Database type definitions for Supabase integration
 * Auto-generated types ensure type safety across the application
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          plan: 'free' | 'premium' | 'pro' | 'lifetime';
          usage_this_month: {
            resume_tailoring: number;
            cover_letters: number;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          plan?: 'free' | 'premium' | 'pro' | 'lifetime';
          usage_this_month?: {
            resume_tailoring: number;
            cover_letters: number;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          plan?: 'free' | 'premium' | 'pro' | 'lifetime';
          usage_this_month?: {
            resume_tailoring: number;
            cover_letters: number;
          };
          updated_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          original_content: string;
          job_posting: string;
          match_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          original_content: string;
          job_posting: string;
          match_score: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          original_content?: string;
          job_posting?: string;
          match_score?: number;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          position: string;
          location: string;
          status: 'applied' | 'interview' | 'offer' | 'rejected';
          applied_date: string;
          last_update: string;
          salary?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          position: string;
          location: string;
          status: 'applied' | 'interview' | 'offer' | 'rejected';
          applied_date: string;
          last_update: string;
          salary?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company?: string;
          position?: string;
          location?: string;
          status?: 'applied' | 'interview' | 'offer' | 'rejected';
          applied_date?: string;
          last_update?: string;
          salary?: string;
          notes?: string;
          updated_at?: string;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          category: string;
          priority: 'low' | 'medium' | 'high';
          message: string;
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          category: string;
          priority: 'low' | 'medium' | 'high';
          message: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          category?: string;
          priority?: 'low' | 'medium' | 'high';
          message?: string;
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_plan: 'free' | 'premium' | 'pro' | 'lifetime';
      application_status: 'applied' | 'interview' | 'offer' | 'rejected';
      ticket_priority: 'low' | 'medium' | 'high';
      ticket_status: 'open' | 'in_progress' | 'resolved' | 'closed';
    };
  };
}