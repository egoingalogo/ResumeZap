import { create } from 'zustand';
import { supabase, handleSupabaseError, getCurrentUser, testSupabaseConnection } from '../lib/supabase';
import { 
  analyzeResume as analyzeResumeAI,
  generateCoverLetter as generateCoverLetterAI,
  analyzeSkillGaps as analyzeSkillGapsAI,
  type ResumeAnalysisResult,
  type CoverLetterResult,
  type SkillGapResult
} from '../lib/aiService';
import { 
  createSkillAnalysis, 
  fetchSkillAnalyses, 
  fetchSkillAnalysisById,
  deleteSkillAnalysis,
  convertAnalysisToSkillGaps,
  type SkillGap,
  type SkillAnalysisWithRecommendations
} from '../lib/skillAnalysis';
import { 
  fetchCoverLetters,
  createCoverLetter,
  deleteCoverLetter,
  type CoverLetter
} from '../lib/coverLetters';

interface Resume {
  id: string;
  title: string;
  content: string;
  originalContent: string;
  jobPosting: string;
  matchScore: number;
  analysisDetails?: ResumeAnalysisResult;
  createdAt: string;
  lastModified: string;
}

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  currentResumeAnalysis: ResumeAnalysisResult | null;
  currentCoverLetter: CoverLetterResult | null;
  currentSkillGapAnalysis: SkillGapResult | null;
  skillGaps: SkillGap[];
  skillAnalyses: SkillAnalysisWithRecommendations[];
  currentSkillAnalysis: SkillAnalysisWithRecommendations | null;
  coverLetters: CoverLetter[];
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
  
  fetchResumes: () => Promise<void>;
  analyzeResume: (resumeContent: string, jobPosting: string) => Promise<void>;
  generateCoverLetter: (resumeContent: string, jobPosting: string, companyName: string, jobTitle: string, tone: string) => Promise<void>;
  saveResume: (resume: Omit<Resume, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateResume: (id: string, updates: Partial<Resume>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  setCurrentResume: (resume: Resume | null) => void;
  loadResumeForViewing: (resumeId: string) => Promise<void>;
  analyzeSkillGaps: (resumeContent: string, jobPosting: string, resumeId?: string) => Promise<void>;
  fetchSkillAnalyses: () => Promise<void>;
  loadSkillAnalysis: (analysisId: string) => Promise<void>;
  deleteSkillAnalysis: (analysisId: string) => Promise<void>;
  clearCurrentSkillAnalysis: () => void;
  fetchCoverLetters: () => Promise<void>;
  saveCoverLetter: (coverLetterData: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteCoverLetter: (id: string) => Promise<void>;
  loadCoverLetterForViewing: (coverLetterId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Store for managing resume data and skill gap analysis with Supabase integration
 * Handles AI-powered resume tailoring and persistent skill gap analysis storage
 */
export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  currentResumeAnalysis: null,
  currentCoverLetter: null,
  currentSkillGapAnalysis: null,
  skillGaps: [],
  skillAnalyses: [],
  currentSkillAnalysis: null,
  coverLetters: [],
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
        analysisDetails: resume.analysis_details || undefined,
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
   * Analyze resume with Claude AI through Edge Function
   */
  analyzeResume: async (resumeContent: string, jobPosting: string, resumeFile?: File) => {
    console.log('ResumeStore: Starting resume analysis');
    set({ isAnalyzing: true, error: null });
    
    try {
      // Call Claude AI through Edge Function
      const analysisResult = await analyzeResumeAI(resumeContent, jobPosting, resumeFile);
      
      // Extract file name without extension for resume title if available
      const originalFileName = resumeFile ? 
        resumeFile.name.replace(/\.[^/.]+$/, '') : // Remove extension
        'Resume';
      const resumeTitle = `AI-Optimized Resume - ${originalFileName}`;
      
      // Create a resume object from the analysis
      const analyzedResume: Resume = {
        id: Date.now().toString(),
        title: resumeTitle,
        content: analysisResult.tailoredResume,
        originalContent: resumeContent,
        jobPosting,
        matchScore: analysisResult.matchScore,
        analysisDetails: analysisResult,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      
      set({ 
        currentResume: analyzedResume,
        currentResumeAnalysis: analysisResult,
        error: null 
      });
      
      console.log('ResumeStore: Resume analysis completed with score:', analysisResult.matchScore);
      
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
   * Generate cover letter with Claude AI through Edge Function
   */
  generateCoverLetter: async (resumeContent: string, jobPosting: string, companyName: string, jobTitle: string, tone: string, resumeFile?: File) => {
    console.log('ResumeStore: Generating cover letter');
    set({ isAnalyzing: true, error: null });
    
    try {
      // Call Claude AI through Edge Function
      const coverLetterResult = await generateCoverLetterAI(
        resumeContent,
        jobPosting,
        companyName,
        jobTitle,
        tone as 'professional' | 'enthusiastic' | 'concise',
        resumeFile,
      );
      
      set({ 
        currentCoverLetter: coverLetterResult,
        error: null 
      });
      
      // Auto-save the generated cover letter to database
      try {
        const coverLetterData: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'> = {
          title: `Cover Letter - ${companyName} - ${jobTitle}`,
          content: coverLetterResult.coverLetter,
          companyName: companyName,
          jobTitle: jobTitle,
          tone: tone as 'professional' | 'enthusiastic' | 'concise',
          jobPosting: jobPosting,
          resumeContentSnapshot: resumeFile ? resumeFile.name : resumeContent.substring(0, 500),
          customizations: coverLetterResult.customizations || [],
          keyStrengths: coverLetterResult.keyStrengths || [],
          callToAction: coverLetterResult.callToAction,
          hiringManager: undefined,
          personalHighlights: undefined,
          toneAnalysis: coverLetterResult.toneAnalysis || undefined,
          matchingElements: coverLetterResult.matchingElements || undefined,
        };
        
        await get().saveCoverLetter(coverLetterData);
        console.log('ResumeStore: Cover letter auto-saved to database');
      } catch (saveError) {
        console.error('ResumeStore: Failed to auto-save cover letter:', saveError);
        // Don't throw error for save failure - generation was successful
      }
      console.log('ResumeStore: Cover letter generated successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cover letter generation failed';
      console.error('ResumeStore: Cover letter generation failed:', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isAnalyzing: false });
    }
  },
  
  /**
   * Save resume to database with enhanced error handling
   * Now includes analysis details for complete data persistence
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
          analysis_details: resumeData.analysisDetails || null,
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
        analysisDetails: data.analysis_details || undefined,
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
          analysis_details: updates.analysisDetails || null,
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
   * Load a specific resume for viewing with simulated analysis data
   * Used when navigating from the Resume Library, Dashboard, or Activity History
   * Now loads actual stored analysis data instead of simulated data
   */
  loadResumeForViewing: async (resumeId: string) => {
    console.log('ResumeStore: Loading resume for viewing:', resumeId);
    set({ error: null });
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found. Please log in again.');
      }
      
      // Find the resume in current resumes array
      const resume = get().resumes.find(r => r.id === resumeId);
      if (!resume) {
        throw new Error('Resume not found');
      }
      
      // Load actual analysis data if available, otherwise create fallback
      let analysisResult: ResumeAnalysisResult;
      
      if (resume.analysisDetails) {
        // Use stored analysis details
        analysisResult = resume.analysisDetails;
        console.log('ResumeStore: Using stored analysis details');
      } else {
        // Create fallback analysis for older resumes without stored details
        analysisResult = {
          tailoredResume: resume.content,
          matchScore: resume.matchScore,
          matchBreakdown: {
            keywords: Math.round(resume.matchScore * 0.9),
            skills: Math.round(resume.matchScore * 0.85),
            experience: Math.round(resume.matchScore * 0.95),
            formatting: Math.round(resume.matchScore * 0.8),
          },
          changes: [
            {
              section: "Legacy Resume",
              original: "This resume was created before detailed analysis storage was implemented",
              improved: "Resume loaded from your library",
              reason: "This resume was previously optimized but detailed changes are not available"
            }
          ],
          keywordMatches: {
            found: ["Analysis details not available for legacy resumes"],
            missing: [],
            suggestions: ["Re-analyze this resume to get detailed keyword insights"]
          },
          atsOptimizations: [
            "This resume was previously optimized for ATS compatibility",
            "Re-analyze to get current ATS optimization recommendations"
          ]
        };
        console.log('ResumeStore: Using fallback analysis for legacy resume');
      }
      
      // Ensure all required properties exist with fallbacks
      const safeAnalysisResult: ResumeAnalysisResult = {
        tailoredResume: analysisResult.tailoredResume || resume.content,
        matchScore: analysisResult.matchScore || resume.matchScore,
        matchBreakdown: {
          keywords: analysisResult.matchBreakdown?.keywords ?? Math.round(resume.matchScore * 0.9),
          skills: analysisResult.matchBreakdown?.skills ?? Math.round(resume.matchScore * 0.85),
          experience: analysisResult.matchBreakdown?.experience ?? Math.round(resume.matchScore * 0.95),
          formatting: analysisResult.matchBreakdown?.formatting ?? Math.round(resume.matchScore * 0.8),
        },
        changes: analysisResult.changes || [
          {
            section: "Loaded Resume",
            original: "This is a previously analyzed resume",
            improved: "Resume loaded from your library",
            reason: "This resume was previously optimized and saved to your library"
          }
        ],
        keywordMatches: {
          found: analysisResult.keywordMatches?.found || ["Previously analyzed keywords"],
          missing: analysisResult.keywordMatches?.missing || [],
          suggestions: analysisResult.keywordMatches?.suggestions || ["This resume was previously optimized"]
        },
        atsOptimizations: analysisResult.atsOptimizations || [
          "This resume was previously optimized for ATS compatibility",
          "All formatting and keyword optimizations have been applied"
        ]
      };
      
      // Set as current resume with analysis data
      set({ 
        currentResume: resume,
        currentResumeAnalysis: safeAnalysisResult,
        error: null
      });
      
      console.log('ResumeStore: Resume loaded for viewing successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load resume';
      console.error('ResumeStore: Failed to load resume for viewing:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },
  
  /**
   * Analyze skill gaps using Claude AI and save to database
   */
  analyzeSkillGaps: async (resumeContent: string, jobPosting: string, resumeFile?: File, resumeId?: string) => {
    console.log('ResumeStore: Analyzing skill gaps');
    console.log('ResumeStore: Received parameters:', {
      hasJobPosting: !!jobPosting,
      hasResumeFile: !!resumeFile,
      resumeFileName: resumeFile?.name,
    });
    set({ isAnalyzing: true, error: null });
    
    try {
      // Call Claude AI through Edge Function
      console.log('ResumeStore: Calling AI service with file:', resumeFile?.name || 'no file');
      const skillGapResult = await analyzeSkillGapsAI(resumeContent, jobPosting, resumeFile);
      
      // Use the uploaded file name as resume content snapshot since we're processing PDF
      const resumeContentForSaving = resumeFile ? 
        `PDF Resume File: ${resumeFile.name} (${(resumeFile.size / 1024).toFixed(1)}KB) - Processed by AI` : 
        resumeContent;
      
      // Convert the new format to legacy format for backward compatibility
      const legacySkillGaps: SkillGap[] = [];
      
      // Process critical skills
      skillGapResult.skillGapAnalysis.critical.forEach(skill => {
        const recommendation = skillGapResult.learningRecommendations.find(r => r.skill === skill.skill);
        legacySkillGaps.push({
          skill: skill.skill,
          importance: 'high',
          hasSkill: false, // Critical means they don't have it
          recommendations: {
            courses: recommendation?.courses.map(c => c.courseName) || [],
            resources: recommendation?.freeResources.map(r => r.resource) || [],
            timeEstimate: recommendation?.timeInvestment || 'Not specified',
          },
        });
      });
      
      // Process important skills
      skillGapResult.skillGapAnalysis.important.forEach(skill => {
        const recommendation = skillGapResult.learningRecommendations.find(r => r.skill === skill.skill);
        legacySkillGaps.push({
          skill: skill.skill,
          importance: 'medium',
          hasSkill: false, // Important means they don't have it
          recommendations: {
            courses: recommendation?.courses.map(c => c.courseName) || [],
            resources: recommendation?.freeResources.map(r => r.resource) || [],
            timeEstimate: recommendation?.timeInvestment || 'Not specified',
          },
        });
      });
      
      // Process nice-to-have skills
      skillGapResult.skillGapAnalysis.niceToHave.forEach(skill => {
        const recommendation = skillGapResult.learningRecommendations.find(r => r.skill === skill.skill);
        legacySkillGaps.push({
          skill: skill.skill,
          importance: 'low',
          hasSkill: false, // Nice-to-have means they don't have it
          recommendations: {
            courses: recommendation?.courses.map(c => c.courseName) || [],
            resources: recommendation?.freeResources.map(r => r.resource) || [],
            timeEstimate: recommendation?.timeInvestment || 'Not specified',
          },
        });
      });
      
      // Add skills they already have
      skillGapResult.skillsAlreadyStrong.forEach(skill => {
        legacySkillGaps.push({
          skill,
          importance: 'medium', // Default importance for existing skills
          hasSkill: true,
          recommendations: {
            courses: [],
            resources: [],
            timeEstimate: 'Already proficient',
          },
        });
      });
      
      // Generate overall summary
      const totalSkills = legacySkillGaps.length;
      const skillsHave = legacySkillGaps.filter(gap => gap.hasSkill).length;
      const skillsNeed = totalSkills - skillsHave;
      const criticalGaps = skillGapResult.skillGapAnalysis.critical?.length || 0;
      
      const overallSummary = `Analysis of ${totalSkills} key skills: You have ${skillsHave} skills and need to develop ${skillsNeed} skills. ${criticalGaps} critical skills require immediate attention.`;
      
      // Save to database
      const savedAnalysis = await createSkillAnalysis(
        resumeContentForSaving,
        jobPosting.split('\n')[0] || 'Job Position', // Use first line as job title
        jobPosting,
        legacySkillGaps,
        skillGapResult,
        skillGapResult,
        resumeId || null,
        overallSummary
      );
      
      // Update local state with both new and legacy formats
      set({ 
        skillGaps: legacySkillGaps,
        currentSkillAnalysis: savedAnalysis,
        currentSkillGapAnalysis: skillGapResult,
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
      // Don't throw error for skill analyses - just log it and continue
      set({ error: null, skillAnalyses: [] });
      console.log('ResumeStore: Continuing with empty skill analyses due to error');
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
        
        // Reconstruct the SkillGapResult from saved detailed data
        let skillGapResult: SkillGapResult | null = null;
        
        if (analysis.detailedSkillGapAnalysis) {
          skillGapResult = {
            skillGapAnalysis: analysis.detailedSkillGapAnalysis,
            learningRecommendations: analysis.learningRecommendationsDetails || [],
            developmentRoadmap: analysis.developmentRoadmapDetails || {
              phase1: { duration: '', focus: '', milestones: [] },
              phase2: { duration: '', focus: '', milestones: [] },
              phase3: { duration: '', focus: '', milestones: [] },
            },
            skillsAlreadyStrong: analysis.skillsAlreadyStrongDetails || [],
            totalDevelopmentTime: analysis.totalDevelopmentTime || '',
            budgetEstimate: analysis.budgetEstimateDetails || {
              minimum: '',
              recommended: '',
              premium: ''
            },
            nextSteps: analysis.nextStepsDetails || []
          };
        }
        
        set({ 
          currentSkillAnalysis: analysis,
          skillGaps,
          currentSkillGapAnalysis: skillGapResult,
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
   * Fetch user's cover letters from database with enhanced error handling
   */
  fetchCoverLetters: async () => {
    console.log('ResumeStore: Fetching user cover letters');
    set({ isLoading: true, error: null });
    
    try {
      const coverLetters = await fetchCoverLetters();
      set({ coverLetters, error: null });
      console.log('ResumeStore: Fetched', coverLetters.length, 'cover letters');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cover letters';
      console.error('ResumeStore: Failed to fetch cover letters:', errorMessage);
      // Don't throw error for cover letters - just log it and continue
      set({ error: null, coverLetters: [] });
      console.log('ResumeStore: Continuing with empty cover letters due to error');
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Save cover letter to database with enhanced error handling
   */
  saveCoverLetter: async (coverLetterData: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('ResumeStore: Saving new cover letter');
    set({ error: null });
    
    try {
      const newCoverLetter = await createCoverLetter(coverLetterData);
      
      // Update local state
      set((state) => ({
        coverLetters: [newCoverLetter, ...state.coverLetters],
        error: null,
      }));
      
      console.log('ResumeStore: Cover letter saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save cover letter';
      console.error('ResumeStore: Failed to save cover letter:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Delete cover letter from database with enhanced error handling
   */
  deleteCoverLetter: async (id: string) => {
    console.log('ResumeStore: Deleting cover letter:', id);
    set({ error: null });
    
    try {
      await deleteCoverLetter(id);
      
      // Update local state
      set((state) => ({
        coverLetters: state.coverLetters.filter(cl => cl.id !== id),
        error: null,
      }));
      
      console.log('ResumeStore: Cover letter deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete cover letter';
      console.error('ResumeStore: Failed to delete cover letter:', errorMessage);
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
      currentSkillGapAnalysis: null,
      currentSkillGapAnalysis: null,
      skillGaps: [],
    });
  },
  
  /**
   * Load a specific cover letter for viewing and editing
   * Used when navigating from the Cover Letter Library
   */
  loadCoverLetterForViewing: async (coverLetterId: string) => {
    console.log('ResumeStore: Loading cover letter for viewing:', coverLetterId);
    set({ error: null });
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found. Please log in again.');
      }
      
      // Find the cover letter in current cover letters array
      const coverLetter = get().coverLetters.find(cl => cl.id === coverLetterId);
      if (!coverLetter) {
        throw new Error('Cover letter not found');
      }
      
      // Create a simulated cover letter result based on stored data
      const simulatedCoverLetterResult: CoverLetterResult = {
        coverLetter: coverLetter.content,
        customizations: coverLetter.customizations,
        keyStrengths: coverLetter.keyStrengths,
        callToAction: coverLetter.callToAction || 'Thank you for your consideration.',
        toneAnalysis: coverLetter.toneAnalysis,
        matchingElements: coverLetter.matchingElements,
      };
      
      // Set as current cover letter result
      set({ currentCoverLetter: simulatedCoverLetterResult });
      
      console.log('ResumeStore: Cover letter loaded for viewing successfully');
      
      // Return the cover letter data for form population
      return coverLetter;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cover letter';
      console.error('ResumeStore: Failed to load cover letter for viewing:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },
  
  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));