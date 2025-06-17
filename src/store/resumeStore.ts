import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../types/database';

type DatabaseResume = Database['public']['Tables']['resumes']['Row'];

interface Resume extends Omit<DatabaseResume, 'user_id' | 'created_at' | 'updated_at'> {
  createdAt: string;
  lastModified: string;
}

interface SkillGap {
  skill: string;
  importance: 'high' | 'medium' | 'low';
  hasSkill: boolean;
  recommendations: {
    courses: string[];
    resources: string[];
    timeEstimate: string;
  };
}

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  skillGaps: SkillGap[];
  isAnalyzing: boolean;
  isLoading: boolean;
  
  fetchResumes: () => Promise<void>;
  analyzeResume: (resumeContent: string, jobPosting: string) => Promise<void>;
  saveResume: (resume: Omit<Resume, 'id' | 'createdAt' | 'lastModified'>) => Promise<boolean>;
  updateResume: (id: string, updates: Partial<Resume>) => Promise<boolean>;
  deleteResume: (id: string) => Promise<boolean>;
  setCurrentResume: (resume: Resume | null) => void;
  analyzeSkillGaps: (resumeContent: string, jobPosting: string) => Promise<void>;
  clearSkillGaps: () => void;
}

/**
 * Resume store with Supabase integration
 * Handles resume management, AI analysis, and skill gap analysis
 */
export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  skillGaps: [],
  isAnalyzing: false,
  isLoading: false,
  
  /**
   * Fetch all resumes for the current user
   */
  fetchResumes: async () => {
    console.log('ResumeStore: Fetching user resumes');
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('ResumeStore: Failed to fetch resumes:', error);
        set({ isLoading: false });
        return;
      }
      
      const resumes: Resume[] = data.map(resume => ({
        id: resume.id,
        title: resume.title,
        content: resume.content,
        original_content: resume.original_content,
        job_posting: resume.job_posting,
        match_score: resume.match_score,
        createdAt: resume.created_at,
        lastModified: resume.updated_at,
      }));
      
      set({ resumes, isLoading: false });
      console.log('ResumeStore: Fetched', resumes.length, 'resumes');
    } catch (error) {
      console.error('ResumeStore: Fetch resumes error:', error);
      set({ isLoading: false });
    }
  },
  
  /**
   * Analyze resume with AI and create optimized version
   */
  analyzeResume: async (resumeContent: string, jobPosting: string) => {
    console.log('ResumeStore: Starting resume analysis');
    set({ isAnalyzing: true });
    
    try {
      // TODO: Replace with actual AI analysis using Claude API
      // For now, simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock AI-tailored content - replace with actual AI response
      const tailoredContent = `${resumeContent}

[AI-ENHANCED SECTIONS]
• Optimized keywords for ATS compatibility
• Highlighted relevant experience matching job requirements
• Improved action verbs and quantified achievements
• Structured for maximum impact and readability`;
      
      const matchScore = Math.floor(Math.random() * 20) + 80; // 80-100%
      
      const analyzedResume: Resume = {
        id: Date.now().toString(), // Temporary ID, will be replaced when saved
        title: `Tailored Resume - ${new Date().toLocaleDateString()}`,
        content: tailoredContent,
        original_content: resumeContent,
        job_posting: jobPosting,
        match_score: matchScore,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      
      set({ currentResume: analyzedResume });
      console.log('ResumeStore: Resume analysis completed with score:', matchScore);
      
    } catch (error) {
      console.error('ResumeStore: Resume analysis failed:', error);
      throw error;
    } finally {
      set({ isAnalyzing: false });
    }
  },
  
  /**
   * Save resume to database
   */
  saveResume: async (resumeData: Omit<Resume, 'id' | 'createdAt' | 'lastModified'>) => {
    console.log('ResumeStore: Saving new resume');
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          title: resumeData.title,
          content: resumeData.content,
          original_content: resumeData.original_content,
          job_posting: resumeData.job_posting,
          match_score: resumeData.match_score,
        })
        .select()
        .single();
      
      if (error) {
        console.error('ResumeStore: Failed to save resume:', error);
        set({ isLoading: false });
        return false;
      }
      
      const newResume: Resume = {
        id: data.id,
        title: data.title,
        content: data.content,
        original_content: data.original_content,
        job_posting: data.job_posting,
        match_score: data.match_score,
        createdAt: data.created_at,
        lastModified: data.updated_at,
      };
      
      set((state) => ({
        resumes: [newResume, ...state.resumes],
        isLoading: false,
      }));
      
      console.log('ResumeStore: Resume saved successfully');
      return true;
    } catch (error) {
      console.error('ResumeStore: Save resume error:', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  /**
   * Update existing resume
   */
  updateResume: async (id: string, updates: Partial<Resume>) => {
    console.log('ResumeStore: Updating resume:', id);
    set({ isLoading: true });
    
    try {
      const { error } = await supabase
        .from('resumes')
        .update({
          title: updates.title,
          content: updates.content,
          original_content: updates.original_content,
          job_posting: updates.job_posting,
          match_score: updates.match_score,
        })
        .eq('id', id);
      
      if (error) {
        console.error('ResumeStore: Failed to update resume:', error);
        set({ isLoading: false });
        return false;
      }
      
      set((state) => ({
        resumes: state.resumes.map((resume) =>
          resume.id === id 
            ? { ...resume, ...updates, lastModified: new Date().toISOString() } 
            : resume
        ),
        isLoading: false,
      }));
      
      console.log('ResumeStore: Resume updated successfully');
      return true;
    } catch (error) {
      console.error('ResumeStore: Update resume error:', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  /**
   * Delete resume from database
   */
  deleteResume: async (id: string) => {
    console.log('ResumeStore: Deleting resume:', id);
    set({ isLoading: true });
    
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('ResumeStore: Failed to delete resume:', error);
        set({ isLoading: false });
        return false;
      }
      
      set((state) => ({
        resumes: state.resumes.filter((resume) => resume.id !== id),
        isLoading: false,
      }));
      
      console.log('ResumeStore: Resume deleted successfully');
      return true;
    } catch (error) {
      console.error('ResumeStore: Delete resume error:', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  /**
   * Set current resume for editing/viewing
   */
  setCurrentResume: (resume: Resume | null) => {
    set({ currentResume: resume });
  },
  
  /**
   * Analyze skill gaps between resume and job posting
   */
  analyzeSkillGaps: async (resumeContent: string, jobPosting: string) => {
    console.log('ResumeStore: Analyzing skill gaps');
    set({ isAnalyzing: true });
    
    try {
      // TODO: Replace with actual AI skill gap analysis
      // For now, simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock skill gap analysis - replace with actual AI response
      const mockSkillGaps: SkillGap[] = [
        {
          skill: 'React.js',
          importance: 'high',
          hasSkill: resumeContent.toLowerCase().includes('react'),
          recommendations: {
            courses: ['Advanced React Patterns', 'React Performance Optimization'],
            resources: ['React Official Docs', 'React DevTools'],
            timeEstimate: '2-3 weeks',
          },
        },
        {
          skill: 'TypeScript',
          importance: 'high',
          hasSkill: resumeContent.toLowerCase().includes('typescript'),
          recommendations: {
            courses: ['TypeScript Fundamentals', 'TypeScript with React'],
            resources: ['TypeScript Handbook', 'TypeScript Playground'],
            timeEstimate: '3-4 weeks',
          },
        },
        {
          skill: 'AWS',
          importance: 'medium',
          hasSkill: resumeContent.toLowerCase().includes('aws'),
          recommendations: {
            courses: ['AWS Solutions Architect', 'AWS Developer Associate'],
            resources: ['AWS Free Tier', 'AWS Documentation'],
            timeEstimate: '6-8 weeks',
          },
        },
        {
          skill: 'Docker',
          importance: 'medium',
          hasSkill: resumeContent.toLowerCase().includes('docker'),
          recommendations: {
            courses: ['Docker Fundamentals', 'Docker for Developers'],
            resources: ['Docker Official Docs', 'Docker Hub'],
            timeEstimate: '2-3 weeks',
          },
        },
      ];
      
      set({ skillGaps: mockSkillGaps });
      console.log('ResumeStore: Skill gap analysis completed');
      
    } catch (error) {
      console.error('ResumeStore: Skill gap analysis failed:', error);
      throw error;
    } finally {
      set({ isAnalyzing: false });
    }
  },
  
  /**
   * Clear skill gaps analysis
   */
  clearSkillGaps: () => {
    set({ skillGaps: [] });
  },
}));