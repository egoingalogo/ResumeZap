type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          plan: 'free' | 'premium' | 'pro' | 'lifetime'
          usage_this_month: Json
          created_at: string
          updated_at: string
          profile_picture_url: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          plan?: 'free' | 'premium' | 'pro' | 'lifetime'
          usage_this_month?: Json
          created_at?: string
          updated_at?: string
          profile_picture_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          plan?: 'free' | 'premium' | 'pro' | 'lifetime'
          usage_this_month?: Json
          created_at?: string
          updated_at?: string
          profile_picture_url?: string | null
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          original_content: string
          job_posting: string
          match_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          original_content: string
          job_posting: string
          match_score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          original_content?: string
          job_posting?: string
          match_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          user_id: string
          company: string
          position: string
          location: string
          status: 'applied' | 'interview' | 'offer' | 'rejected'
          applied_date: string
          last_update: string
          salary: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company: string
          position: string
          location: string
          status?: 'applied' | 'interview' | 'offer' | 'rejected'
          applied_date: string
          last_update: string
          salary?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company?: string
          position?: string
          location?: string
          status?: 'applied' | 'interview' | 'offer' | 'rejected'
          applied_date?: string
          last_update?: string
          salary?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          subject: string
          category: string
          priority: 'low' | 'medium' | 'high'
          message: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          category: string
          priority?: 'low' | 'medium' | 'high'
          message: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          category?: string
          priority?: 'low' | 'medium' | 'high'
          message?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at?: string
          updated_at?: string
        }
      }
      skill_analyses: {
        Row: {
          id: string
          user_id: string
          resume_id: string | null
          job_posting_content: string
          resume_content_snapshot: string
          analysis_date: string
          overall_summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resume_id?: string | null
          job_posting_content: string
          resume_content_snapshot: string
          analysis_date?: string
          overall_summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resume_id?: string | null
          job_posting_content?: string
          resume_content_snapshot?: string
          analysis_date?: string
          overall_summary?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      skill_recommendations: {
        Row: {
          id: string
          skill_analysis_id: string
          skill_name: string
          importance: 'low' | 'medium' | 'high'
          has_skill: boolean
          recommended_courses: Json
          recommended_resources: Json
          time_estimate: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          skill_analysis_id: string
          skill_name: string
          importance?: 'low' | 'medium' | 'high'
          has_skill?: boolean
          recommended_courses?: Json
          recommended_resources?: Json
          time_estimate?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          skill_analysis_id?: string
          skill_name?: string
          importance?: 'low' | 'medium' | 'high'
          has_skill?: boolean
          recommended_courses?: Json
          recommended_resources?: Json
          time_estimate?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cover_letters: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          company_name: string
          job_title: string
          tone: 'professional' | 'enthusiastic' | 'concise'
          job_posting: string | null
          resume_content_snapshot: string | null
          customizations: Json
          key_strengths: Json
          call_to_action: string | null
          hiring_manager: string | null
          personal_highlights: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          company_name: string
          job_title: string
          tone?: 'professional' | 'enthusiastic' | 'concise'
          job_posting?: string | null
          resume_content_snapshot?: string | null
          customizations?: Json
          key_strengths?: Json
          call_to_action?: string | null
          hiring_manager?: string | null
          personal_highlights?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          company_name?: string
          job_title?: string
          tone?: 'professional' | 'enthusiastic' | 'concise'
          job_posting?: string | null
          resume_content_snapshot?: string | null
          customizations?: Json
          key_strengths?: Json
          call_to_action?: string | null
          hiring_manager?: string | null
          personal_highlights?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_plan: 'free' | 'premium' | 'pro' | 'lifetime'
      application_status: 'applied' | 'interview' | 'offer' | 'rejected'
      ticket_priority: 'low' | 'medium' | 'high'
      ticket_status: 'open' | 'in_progress' | 'resolved' | 'closed'
      skill_importance: 'low' | 'medium' | 'high'
      cover_letter_tone: 'professional' | 'enthusiastic' | 'concise'
    }
  }
}