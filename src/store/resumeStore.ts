import { create } from 'zustand';

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
  
  analyzeResume: (resumeContent: string, jobPosting: string) => Promise<void>;
  saveResume: (resume: Omit<Resume, 'id' | 'createdAt' | 'lastModified'>) => void;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
  setCurrentResume: (resume: Resume | null) => void;
  analyzeSkillGaps: (resumeContent: string, jobPosting: string) => Promise<void>;
}

/**
 * Store for managing resume data, analysis results, and skill gap analysis
 * Handles AI-powered resume tailoring and learning recommendations
 */
export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  skillGaps: [],
  isAnalyzing: false,
  
  analyzeResume: async (resumeContent: string, jobPosting: string) => {
    console.log('ResumeStore: Starting resume analysis');
    set({ isAnalyzing: true });
    
    try {
      // Simulate AI analysis - replace with actual Claude API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock AI-tailored content
      const tailoredContent = resumeContent + '\n\n[AI-ENHANCED]: Added relevant keywords and optimized for ATS compatibility based on job requirements.';
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
    } finally {
      set({ isAnalyzing: false });
    }
  },
  
  saveResume: (resumeData) => {
    console.log('ResumeStore: Saving new resume');
    const resume: Resume = {
      ...resumeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    set((state) => ({
      resumes: [...state.resumes, resume],
    }));
  },
  
  updateResume: (id: string, updates: Partial<Resume>) => {
    console.log('ResumeStore: Updating resume:', id);
    set((state) => ({
      resumes: state.resumes.map((resume) =>
        resume.id === id ? { ...resume, ...updates, lastModified: new Date().toISOString() } : resume
      ),
    }));
  },
  
  deleteResume: (id: string) => {
    console.log('ResumeStore: Deleting resume:', id);
    set((state) => ({
      resumes: state.resumes.filter((resume) => resume.id !== id),
    }));
  },
  
  setCurrentResume: (resume: Resume | null) => {
    set({ currentResume: resume });
  },
  
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
          hasSkill: true,
          recommendations: {
            courses: ['Advanced React Patterns', 'React Performance Optimization'],
            resources: ['React Official Docs', 'React DevTools'],
            timeEstimate: '2-3 weeks',
          },
        },
        {
          skill: 'TypeScript',
          importance: 'high',
          hasSkill: false,
          recommendations: {
            courses: ['TypeScript Fundamentals', 'TypeScript with React'],
            resources: ['TypeScript Handbook', 'TypeScript Playground'],
            timeEstimate: '3-4 weeks',
          },
        },
        {
          skill: 'AWS',
          importance: 'medium',
          hasSkill: false,
          recommendations: {
            courses: ['AWS Solutions Architect', 'AWS Developer Associate'],
            resources: ['AWS Free Tier', 'AWS Documentation'],
            timeEstimate: '6-8 weeks',
          },
        },
      ];
      
      set({ skillGaps: mockSkillGaps });
      console.log('ResumeStore: Skill gap analysis completed');
      
    } catch (error) {
      console.error('ResumeStore: Skill gap analysis failed:', error);
    } finally {
      set({ isAnalyzing: false });
    }
  },
}));