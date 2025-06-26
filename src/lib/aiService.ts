import { supabase } from './supabase';

/**
 * AI Service for interacting with Claude API through Supabase Edge Functions
 * Provides secure, server-side AI processing for resume analysis, cover letter generation, and skill gap analysis
 * Now supports file attachments for direct document processing by Claude
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
 * Convert file to base64 for Claude API
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Get media type for Claude API based on file type
 */
const getMediaType = (file: File): string => {
  const mimeType = file.type;
  if (mimeType === 'application/pdf') return 'application/pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (mimeType === 'text/plain') return 'text/plain';
  
  // Fallback based on file extension
  const extension = file.name.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf': return 'application/pdf';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
};

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
 * Analyze resume with Claude AI through Edge Function
 * Now supports both text content and file attachments
 */
export async function analyzeResume(
  resumeContent: string,
  jobPosting: string,
  resumeFile?: File
): Promise<ResumeAnalysisResult> {
  console.log('AIService: Starting resume analysis');
  
  if (!resumeContent?.trim() && !resumeFile) {
    throw new Error('Resume content or file is required for analysis');
  }
  
  if (!jobPosting?.trim()) {
    throw new Error('Job posting is required for analysis');
  }

  const requestData: any = {
    type: 'resume_analysis',
    jobPosting: jobPosting.trim(),
  };

  // If file is provided, use file attachment; otherwise use text content
  if (resumeFile) {
    try {
      const base64Content = await fileToBase64(resumeFile);
      const mediaType = getMediaType(resumeFile);
      
      requestData.resumeFile = {
        data: base64Content,
        media_type: mediaType,
        filename: resumeFile.name
      };
      
      console.log('AIService: Using file attachment for resume analysis');
    } catch (error) {
      console.error('AIService: Failed to process file:', error);
      throw new Error('Failed to process the uploaded file. Please try again.');
    }
  } else {
    requestData.resumeContent = resumeContent.trim();
    console.log('AIService: Using text content for resume analysis');
  }

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
 * Generate personalized cover letter using Claude AI through Edge Function
 * Creates compelling cover letters tailored to specific job postings
 */
export async function generateCoverLetter(
  resumeContent: string,
  jobPosting: string,
  companyName: string,
  jobTitle: string,
  tone: 'professional' | 'enthusiastic' | 'concise',
  hiringManager?: string,
  personalExperience?: string,
  resumeFile?: File
): Promise<CoverLetterResult> {
  console.log('AIService: Starting cover letter generation');
  
  if (!resumeContent?.trim() && !resumeFile) {
    throw new Error('Resume content or file is required for cover letter generation');
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

  const requestData: any = {
    type: 'cover_letter',
    jobPosting: jobPosting.trim(),
    companyName: companyName.trim(),
    jobTitle: jobTitle.trim(),
    tone,
    hiringManager: hiringManager?.trim(),
    personalExperience: personalExperience?.trim(),
  };

  // If file is provided, use file attachment; otherwise use text content
  if (resumeFile) {
    try {
      const base64Content = await fileToBase64(resumeFile);
      const mediaType = getMediaType(resumeFile);
      
      requestData.resumeFile = {
        data: base64Content,
        media_type: mediaType,
        filename: resumeFile.name
      };
      
      console.log('AIService: Using file attachment for cover letter generation');
    } catch (error) {
      console.error('AIService: Failed to process file:', error);
      throw new Error('Failed to process the uploaded file. Please try again.');
    }
  } else {
    requestData.resumeContent = resumeContent.trim();
    console.log('AIService: Using text content for cover letter generation');
  }

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
  jobPosting: string,
  resumeFile?: File
): Promise<SkillGapResult> {
  console.log('AIService: Starting skill gap analysis');
  
  if (!resumeContent?.trim() && !resumeFile) {
    throw new Error('Resume content or file is required for skill gap analysis');
  }
  
  if (!jobPosting?.trim()) {
    throw new Error('Job posting is required for skill gap analysis');
  }

  const requestData: any = {
    type: 'skill_gap',
    jobPosting: jobPosting.trim(),
  };

  // If file is provided, use file attachment; otherwise use text content
  if (resumeFile) {
    try {
      const base64Content = await fileToBase64(resumeFile);
      const mediaType = getMediaType(resumeFile);
      
      requestData.resumeFile = {
        data: base64Content,
        media_type: mediaType,
        filename: resumeFile.name
      };
      
      console.log('AIService: Using file attachment for skill gap analysis');
    } catch (error) {
      console.error('AIService: Failed to process file:', error);
      throw new Error('Failed to process the uploaded file. Please try again.');
    }
  } else {
    requestData.resumeContent = resumeContent.trim();
    console.log('AIService: Using text content for skill gap analysis');
  }

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