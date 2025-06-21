import { create } from 'zustand';
import { supabase, handleSupabaseError, getCurrentUser, testSupabaseConnection } from '../lib/supabase';
import { 
  createSkillAnalysis, 
  fetchSkillAnalyses, 
  fetchSkillAnalysisById,
  deleteSkillAnalysis,
  convertAnalysisToSkillGaps,
  type SkillGap,
  type SkillAnalysisWithRecommendations
} from '../lib/skillAnalysis';

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

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  skillGaps: SkillGap[];
  skillAnalyses: SkillAnalysisWithRecommendations[];
  currentSkillAnalysis: SkillAnalysisWithRecommendations | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
  
  fetchResumes: () => Promise<void>;
  analyzeResume: (resumeContent: string, jobPosting: string) => Promise<void>;
  saveResume: (resume: Omit<Resume, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateResume: (id: string, updates: Partial<Resume>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  setCurrentResume: (resume: Resume | null) => void;
  analyzeSkillGaps: (resumeContent: string, jobPosting: string, resumeId?: string) => Promise<void>;
  fetchSkillAnalyses: () => Promise<void>;
  loadSkillAnalysis: (analysisId: string) => Promise<void>;
  deleteSkillAnalysis: (analysisId: string) => Promise<void>;
  clearCurrentSkillAnalysis: () => void;
  clearError: () => void;
}

/**
 * Store for managing resume data and skill gap analysis with Supabase integration
 * Handles AI-powered resume tailoring and persistent skill gap analysis storage
 */
export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  skillGaps: [],
  skillAnalyses: [],
  currentSkillAnalysis: null,
  isAnalyzing: false,
  isLoading: false,
  error: null,
  
  /**
   * Fetch user's resumes from database with enhanced error handling
   */
  fetchResumes: async () => {
    console.log('ResumeStore: Fetching user resumes');
    set({ isLoading: true, error: null });
    
    try {
      // Test connection first
      const connectionOk = await testSupabaseConnection();
      if (!connectionOk) {
        throw new Error('Unable to connect to Supabase. Please check your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) and internet connection.');
      }
      
      // Get current user with error handling
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found. Please log in again.');
      }
      
      console.log('ResumeStore: Authenticated user found:', user.id);
      
      // Fetch resumes with detailed error handling
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('ResumeStore: Database query failed:', error);
        throw new Error(handleSupabaseError(error, 'fetch resumes'));
      }
      
      console.log('ResumeStore: Successfully fetched', data?.length || 0, 'resumes');
      
      const resumes: Resume[] = (data || []).map(resume => ({
        id: resume.id,
        title: resume.title,
        content: resume.content,
        originalContent: resume.original_content,
        jobPosting: resume.job_posting,
        matchScore: resume.match_score,
        createdAt: resume.created_at,
        lastModified: resume.updated_at,
      }));
      
      set({ resumes, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resumes';
      console.error('ResumeStore: Failed to fetch resumes:', errorMessage);
      
      // Log additional debugging information
      console.error('ResumeStore: Environment check:', {
        hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      });
      
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * Analyze resume with AI (simulated for now)
   */
  analyzeResume: async (resumeContent: string, jobPosting: string) => {
    console.log('ResumeStore: Starting resume analysis');
    set({ isAnalyzing: true, error: null });
    
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
      
      set({ currentResume: analyzedResume, error: null });
      console.log('ResumeStore: Resume analysis completed with score:', matchScore);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Resume analysis failed';
      console.error('ResumeStore: Resume analysis failed:', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isAnalyzing: false });
    }
  },
  
  /**
   * Save resume to database with enhanced error handling
   */
  saveResume: async (resumeData: Omit<Resume, 'id' | 'createdAt' | 'lastModified'>) => {
    console.log('ResumeStore: Saving new resume');
    set({ error: null });
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found. Please log in again.');
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
        error: null,
      }));
      
      console.log('ResumeStore: Resume saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save resume';
      console.error('ResumeStore: Failed to save resume:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },
  
  /**
   * Update existing resume with enhanced error handling
   */
  updateResume: async (id: string, updates: Partial<Resume>) => {
    console.log('ResumeStore: Updating resume:', id);
    set({ error: null });
    
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
        error: null,
      }));
      
      console.log('ResumeStore: Resume updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update resume';
      console.error('ResumeStore: Failed to update resume:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },
  
  /**
   * Delete resume from database with enhanced error handling
   */
  deleteResume: async (id: string) => {
    console.log('ResumeStore: Deleting resume:', id);
    set({ error: null });
    
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
        error: null,
      }));
      
      console.log('ResumeStore: Resume deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete resume';
      console.error('ResumeStore: Failed to delete resume:', errorMessage);
      set({ error: errorMessage });
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
   * Analyze skill gaps and save to database with enhanced error handling
   * Performs AI analysis and persists results for future reference
   */
  analyzeSkillGaps: async (resumeContent: string, jobPosting: string, resumeId?: string) => {
    console.log('ResumeStore: Analyzing skill gaps');
    set({ isAnalyzing: true, error: null });
    
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
        {
          skill: 'GraphQL',
          importance: 'low',
          hasSkill: resumeContent.toLowerCase().includes('graphql'),
          recommendations: {
            courses: ['GraphQL Fundamentals', 'Apollo Client'],
            resources: ['GraphQL.org', 'Apollo Documentation'],
            timeEstimate: '3-4 weeks',
          },
        },
      ];
      
      // Generate overall summary
      const totalSkills = mockSkillGaps.length;
      const skillsHave = mockSkillGaps.filter(gap => gap.hasSkill).length;
      const skillsNeed = totalSkills - skillsHave;
      const highPriorityGaps = mockSkillGaps.filter(gap => gap.importance === 'high' && !gap.hasSkill).length;
      
      const overallSummary = `Analysis of ${totalSkills} key skills: You have ${skillsHave} skills and need to develop ${skillsNeed} skills. ${highPriorityGaps} high-priority skills require immediate attention.`;
      
      // Save to database
      const savedAnalysis = await createSkillAnalysis(
        resumeContent,
        jobPosting,
        mockSkillGaps,
        resumeId || null,
        overallSummary
      );
      
      // Update local state
      set({ 
        skillGaps: mockSkillGaps,
        currentSkillAnalysis: savedAnalysis,
        error: null,
      });
      
      // Refresh the analyses list
      await get().fetchSkillAnalyses();
      
      console.log('ResumeStore: Skill gap analysis completed and saved');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Skill gap analysis failed';
      console.error('ResumeStore: Skill gap analysis failed:', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isAnalyzing: false });
    }
  },
  
  /**
   * Fetch all skill analyses for the current user with enhanced error handling
   */
  fetchSkillAnalyses: async () => {
    console.log('ResumeStore: Fetching skill analyses');
    set({ isLoading: true, error: null });
    
    try {
      const analyses = await fetchSkillAnalyses();
      set({ skillAnalyses: analyses, error: null });
      console.log('ResumeStore: Fetched', analyses.length, 'skill analyses');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skill analyses';
      console.error('ResumeStore: Failed to fetch skill analyses:', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * Load a specific skill analysis and set it as current with enhanced error handling
   */
  loadSkillAnalysis: async (analysisId: string) => {
    console.log('ResumeStore: Loading skill analysis:', analysisId);
    set({ isLoading: true, error: null });
    
    try {
      const analysis = await fetchSkillAnalysisById(analysisId);
      
      if (analysis) {
        const skillGaps = convertAnalysisToSkillGaps(analysis);
        set({ 
          currentSkillAnalysis: analysis,
          skillGaps,
          error: null,
        });
        console.log('ResumeStore: Skill analysis loaded successfully');
      } else {
        console.warn('ResumeStore: Skill analysis not found');
        set({ 
          currentSkillAnalysis: null,
          skillGaps: [],
          error: 'Skill analysis not found',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load skill analysis';
      console.error('ResumeStore: Failed to load skill analysis:', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * Delete a skill analysis with enhanced error handling
   */
  deleteSkillAnalysis: async (analysisId: string) => {
    console.log('ResumeStore: Deleting skill analysis:', analysisId);
    set({ error: null });
    
    try {
      await deleteSkillAnalysis(analysisId);
      
      // Update local state
      set((state) => ({
        skillAnalyses: state.skillAnalyses.filter(analysis => analysis.id !== analysisId),
        // Clear current analysis if it was the one deleted
        currentSkillAnalysis: state.currentSkillAnalysis?.id === analysisId ? null : state.currentSkillAnalysis,
        skillGaps: state.currentSkillAnalysis?.id === analysisId ? [] : state.skillGaps,
        error: null,
      }));
      
      console.log('ResumeStore: Skill analysis deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete skill analysis';
      console.error('ResumeStore: Failed to delete skill analysis:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },
  
  /**
   * Clear current skill analysis and skill gaps
   */
  clearCurrentSkillAnalysis: () => {
    set({ 
      currentSkillAnalysis: null,
      skillGaps: [],
    });
  },
  
  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));