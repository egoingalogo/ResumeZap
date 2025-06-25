import { supabase } from './supabase';

/**
 * AI Service for interacting with Claude API through Supabase Edge Functions
 * Provides secure, server-side AI processing for resume analysis, cover letter generation, and skill gap analysis
 */

// Type definitions for AI responses
export interface ResumeAnalysisResult {
  tailoredResume: string;
  matchScore: number;
  matchBreakdown: {
    keywords: number;
    skills: number;
    experience: number;
    formatting: number;
  };
  changes: Array<{
    section: string;
    original: string;
    improved: string;
    reason: string;
  }>;
  keywordMatches: {
    found: string[];
    missing: string[];
    suggestions: string[];
  };
  atsOptimizations: string[];
}

export interface CoverLetterResult {
  coverLetter: string;
  customizations: string[];
  keyStrengths: string[];
  callToAction: string;
}

export interface SkillGapResult {
  skillGapAnalysis: {
    critical: Array<{
      skill: string;
      currentLevel: string;
      requiredLevel: string;
      gap: string;
    }>;
    important: Array<{
      skill: string;
      currentLevel: string;
      requiredLevel: string;
      gap: string;
    }>;
    niceToHave: Array<{
      skill: string;
      currentLevel: string;
      requiredLevel: string;
      gap: string;
    }>;
  };
  learningRecommendations: Array<{
    skill: string;
    priority: string;
    timeInvestment: string;
    courses: Array<{
      platform: string;
      courseName: string;
      cost: string;
      duration: string;
      difficulty: string;
    }>;
    freeResources: Array<{
      type: string;
      resource: string;
      description: string;
    }>;
    certifications: Array<{
      name: string;
      provider: string;
      timeToComplete: string;
      cost: string;
    }>;
    practicalApplication: string;
  }>;
  developmentRoadmap: {
    phase1: {
      duration: string;
      focus: string;
      milestones: string[];
    };
    phase2: {
      duration: string;
      focus: string;
      milestones: string[];
    };
    phase3: {
      duration: string;
      focus: string;
      milestones: string[];
    };
  };
  skillsAlreadyStrong: string[];
}

/**
 * Base function for making requests to the Claude AI proxy Edge Function
 */
async function callClaudeAPI<T>(requestData: any): Promise<T> {
  console.log('AIService: Making request to Claude API proxy');
  
  try {
    const { data, error } = await supabase.functions.invoke('claude-ai-proxy', {
      body: requestData,
    });

    if (error) {
      console.error('AIService: Edge function error:', error);
      throw new Error(error.message || 'AI service request failed');
    }

    if (!data) {
      throw new Error('No response data received from AI service');
    }

    if (!data.success) {
      throw new Error(data.error || 'AI service returned an error');
    }

    console.log('AIService: Successfully received response from Claude API');
    return data.data as T;

  } catch (error) {
    console.error('AIService: Request failed:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        throw new Error('Unable to connect to AI service. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('AI service request timed out. Please try again.');
      } else if (error.message.includes('busy') || error.message.includes('429')) {
        throw new Error('AI service is currently busy. Please wait a moment and try again.');
      } else if (error.message.includes('authentication') || error.message.includes('401')) {
        throw new Error('AI service authentication error. Please contact support.');
      } else {
        throw error; // Re-throw with original message if it's already user-friendly
      }
    }
    
    throw new Error('An unexpected error occurred while processing your request.');
  }
}

/**
 * Analyze resume against job posting using Claude AI
 * Returns detailed optimization recommendations and match scoring
 */
export async function analyzeResume(
  resumeContent: string,
  jobPosting: string
): Promise<ResumeAnalysisResult> {
  console.log('AIService: Starting resume analysis');
  
  if (!resumeContent?.trim()) {
    throw new Error('Resume content is required for analysis');
  }
  
  if (!jobPosting?.trim()) {
    throw new Error('Job posting is required for analysis');
  }

  const requestData = {
    type: 'resume_analysis',
    resumeContent: resumeContent.trim(),
    jobPosting: jobPosting.trim(),
  };

  try {
    const result = await callClaudeAPI<ResumeAnalysisResult>(requestData);
    
    // Validate the response structure
    if (!result.tailoredResume || typeof result.matchScore !== 'number') {
      throw new Error('Invalid response format from AI service');
    }
    
    console.log('AIService: Resume analysis completed successfully');
    return result;
    
  } catch (error) {
    console.error('AIService: Resume analysis failed:', error);
    throw error;
  }
}

/**
 * Generate personalized cover letter using Claude AI
 * Creates compelling cover letters tailored to specific job postings
 */
export async function generateCoverLetter(
  resumeContent: string,
  jobPosting: string,
  companyName: string,
  jobTitle: string,
  tone: 'professional' | 'enthusiastic' | 'concise',
  hiringManager?: string,
  personalExperience?: string
): Promise<CoverLetterResult> {
  console.log('AIService: Starting cover letter generation');
  
  if (!resumeContent?.trim()) {
    throw new Error('Resume content is required for cover letter generation');
  }
  
  if (!jobPosting?.trim()) {
    throw new Error('Job posting is required for cover letter generation');
  }
  
  if (!companyName?.trim()) {
    throw new Error('Company name is required for cover letter generation');
  }
  
  if (!jobTitle?.trim()) {
    throw new Error('Job title is required for cover letter generation');
  }

  const requestData = {
    type: 'cover_letter',
    resumeContent: resumeContent.trim(),
    jobPosting: jobPosting.trim(),
    companyName: companyName.trim(),
    jobTitle: jobTitle.trim(),
    tone,
    hiringManager: hiringManager?.trim(),
    personalExperience: personalExperience?.trim(),
  };

  try {
    const result = await callClaudeAPI<CoverLetterResult>(requestData);
    
    // Validate the response structure
    if (!result.coverLetter || !Array.isArray(result.customizations)) {
      throw new Error('Invalid response format from AI service');
    }
    
    console.log('AIService: Cover letter generation completed successfully');
    return result;
    
  } catch (error) {
    console.error('AIService: Cover letter generation failed:', error);
    throw error;
  }
}

/**
 * Analyze skill gaps and provide learning recommendations using Claude AI
 * Identifies missing skills and creates comprehensive learning roadmaps
 */
export async function analyzeSkillGaps(
  resumeContent: string,
  jobPosting: string
): Promise<SkillGapResult> {
  console.log('AIService: Starting skill gap analysis');
  
  if (!resumeContent?.trim()) {
    throw new Error('Resume content is required for skill gap analysis');
  }
  
  if (!jobPosting?.trim()) {
    throw new Error('Job posting is required for skill gap analysis');
  }

  const requestData = {
    type: 'skill_gap',
    resumeContent: resumeContent.trim(),
    jobPosting: jobPosting.trim(),
  };

  try {
    const result = await callClaudeAPI<SkillGapResult>(requestData);
    
    // Validate the response structure
    if (!result.skillGapAnalysis || !Array.isArray(result.learningRecommendations)) {
      throw new Error('Invalid response format from AI service');
    }
    
    console.log('AIService: Skill gap analysis completed successfully');
    return result;
    
  } catch (error) {
    console.error('AIService: Skill gap analysis failed:', error);
    throw error;
  }
}

/**
 * Test the AI service connection
 * Useful for debugging and health checks
 */
export async function testAIService(): Promise<boolean> {
  console.log('AIService: Testing AI service connection');
  
  try {
    // Make a simple test request
    const testResult = await analyzeResume(
      'Test resume content with basic information',
      'Test job posting with basic requirements'
    );
    
    console.log('AIService: Connection test successful');
    return true;
    
  } catch (error) {
    console.error('AIService: Connection test failed:', error);
    return false;
  }
}