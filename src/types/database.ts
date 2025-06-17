/**
 * Database type definitions for Supabase integration
 * These types ensure type safety across the application
 */

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'premium' | 'pro' | 'lifetime';
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  content: string;
  original_content: string;
  job_posting: string;
  match_score: number;
  created_at: string;
  updated_at: string;
}

export interface SkillGap {
  id: string;
  user_id: string;
  resume_id?: string;
  skill: string;
  importance: 'high' | 'medium' | 'low';
  has_skill: boolean;
  recommendations: {
    courses: string[];
    resources: string[];
    timeEstimate: string;
  };
  created_at: string;
}

export interface SupportRequest {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  month: string; // Format: YYYY-MM
  resume_tailoring: number;
  cover_letters: number;
  created_at: string;
  updated_at: string;
}

/**
 * Database response types
 */
export type DatabaseUser = User;
export type DatabaseResume = Resume;
export type DatabaseSkillGap = SkillGap;
export type DatabaseSupportRequest = SupportRequest;
export type DatabaseUsageTracking = UsageTracking;