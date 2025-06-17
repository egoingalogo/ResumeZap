import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';

interface Resume {
  id: string;
  title: string;
  content: string;
  originalContent: string;
  jobPosting: string;
  matchScore: number;
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
  saveResume: (resume: Omit<Resume, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateResume: (id: string, updates: Partial<Resume>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  setCurrentResume: (resume: Resume | null) => void;
  analyzeSkillGaps: (resumeContent: string, jobPosting: string) => Promise<void>;
}

/**
 * Store for managing resume data with Supabase integration
 * Handles AI-powered resume tailoring and skill gap analysis
 */
export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  skillGaps: [],
  isAnalyzing: false,
  isLoading: false,
  
  /**
   * Fetch user's resumes from database
   */
  fetchResumes: async () => {
    console.log('ResumeStore: Fetching user resumes');
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('ResumeStore: No authenticated user');
        return;
      }
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('ResumeStore: Failed to fetch resumes:', error);
        return;
      }
      
      const resumes: Resume[] = data.map(resume => ({
        id: resume.id,
        title: resume.title,
        content: resume.content,
        originalContent: resume.original_content,
        jobPosting: resume.job_posting,
        matchScore: resume.match_score,
        createdAt: resume.created_at,
        lastModified: resume.updated_at,
      }));
      
      set({ resumes });
    } catch (error) {
      console.error('ResumeStore: Failed to fetch resumes:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * Analyze resume with AI (simulated for now)
   */
  analyzeResume: async (resumeContent: string, jobPosting: string) => {
    console.log('ResumeStore: Starting resume analysis');
    set({ isAnalyzing: true });
    
    try {
      // Simulate AI analysis - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate AI-tailored content (simulated)
      const tailoredContent = `${resumeContent}

[AI-ENHANCED SECTIONS]
• Optimized keywords for ATS compatibility
• Highlighted relevant experience matching job requirements
• Improved formatting for better readability
• Added quantifiable achievements where applicable`;
      
      const matchScore = Math.floor(Math.random() * 20) + 80; // 80-100%
      
      const analyzedResume: Resume = {
        id: Date.now().toString(),
        title: `Tailored Resume - ${new Date().toLocaleDateString()}`,
        content: tailoredContent,
        originalContent: resumeContent,
        jobPosting,
        matchScore,
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
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: resumeData.title,
          content: resumeData.content,
          original_content: resumeData.originalContent,
          job_posting: resumeData.jobPosting,
          match_score: resumeData.matchScore,
        })
        .select()
        .single();
      
      if (error) {
        console.error('ResumeStore: Failed to save resume:', error);
        throw new Error(handleSupabaseError(error, 'save resume'));
      }
      
      const newResume: Resume = {
        id: data.id,
        title: data.title,
        content: data.content,
        originalContent: data.original_content,
        jobPosting: data.job_posting,
        matchScore: data.match_score,
        createdAt: data.created_at,
        lastModified: data.updated_at,
      };
      
      set((state) => ({
        resumes: [newResume, ...state.resumes],
      }));
      
      console.log('ResumeStore: Resume saved successfully');
    } catch (error) {
      console.error('ResumeStore: Failed to save resume:', error);
      throw error;
    }
  },
  
  /**
   * Update existing resume
   */
  updateResume: async (id: string, updates: Partial<Resume>) => {
    console.log('ResumeStore: Updating resume:', id);
    
    try {
      const { error } = await supabase
        .from('resumes')
        .update({
          title: updates.title,
          content: updates.content,
          original_content: updates.originalContent,
          job_posting: updates.jobPosting,
          match_score: updates.matchScore,
        })
        .eq('id', id);
      
      if (error) {
        console.error('ResumeStore: Failed to update resume:', error);
        throw new Error(handleSupabaseError(error, 'update resume'));
      }
      
      set((state) => ({
        resumes: state.resumes.map((resume) =>
          resume.id === id 
            ? { ...resume, ...updates, lastModified: new Date().toISOString() } 
            : resume
        ),
      }));
      
      console.log('ResumeStore: Resume updated successfully');
    } catch (error) {
      console.error('ResumeStore: Failed to update resume:', error);
      throw error;
    }
  },
  
  /**
   * Delete resume from database
   */
  deleteResume: async (id: string) => {
    console.log('ResumeStore: Deleting resume:', id);
    
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('ResumeStore: Failed to delete resume:', error);
        throw new Error(handleSupabaseError(error, 'delete resume'));
      }
      
      set((state) => ({
        resumes: state.resumes.filter((resume) => resume.id !== id),
      }));
      
      console.log('ResumeStore: Resume deleted successfully');
    } catch (error) {
      console.error('ResumeStore: Failed to delete resume:', error);
      throw error;
    }
  },
  
  /**
   * Set current resume for editing
   */
  setCurrentResume: (resume: Resume | null) => {
    set({ currentResume: resume });
  },
  
  /**
   * Analyze skill gaps (simulated AI analysis)
   */
  analyzeSkillGaps: async (resumeContent: string, jobPosting: string) => {
    console.log('ResumeStore: Analyzing skill gaps');
    set({ isAnalyzing: true });
    
    try {
      // Simulate AI skill gap analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
}));