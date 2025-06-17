import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

/**
 * Supabase client instance for database operations and authentication
 * Configured with project URL and anonymous key from environment variables
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * Database types for TypeScript support
 * These should match your Supabase database schema
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
            cover_letters: number;
            resume_tailoring: number;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          plan?: 'free' | 'premium' | 'pro' | 'lifetime';
          usage_this_month?: {
            cover_letters: number;
            resume_tailoring: number;
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
            cover_letters: number;
            resume_tailoring: number;
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
          salary: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          position: string;
          location: string;
          status?: 'applied' | 'interview' | 'offer' | 'rejected';
          applied_date: string;
          last_update: string;
          salary?: string | null;
          notes?: string | null;
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
          salary?: string | null;
          notes?: string | null;
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
          priority?: 'low' | 'medium' | 'high';
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
  };
}