/**
 * AI Service for Claude API integration through Supabase Edge Functions
 * Handles resume analysis, cover letter generation, and skill gap analysis
 * Now supports file attachments for direct document processing by Claude
 */

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-ai-proxy`;

/**
 * Convert File to base64 for Claude API
 */
async function fileToBase64(file: File): Promise<string> {
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
}

/**
 * Get media type for Claude API based on file type
 */
function getMediaType(file: File): string {
  const mimeType = file.type.toLowerCase();
  
  // Map common MIME types to Claude-supported media types
  switch (mimeType) {
    case 'application/pdf':
      return 'application/pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'text/plain':
      return 'text/plain';
    default:
      // Fallback based on file extension
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.pdf')) return 'application/pdf';
      if (fileName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (fileName.endsWith('.txt')) return 'text/plain';
      
      // Default to text/plain for unknown types
      return 'text/plain';
  }
}

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
 * Make API call to Claude through Edge Function with enhanced error handling
 */
async function callClaudeAPI(requestData: any): Promise<any> {
  console.log('AIService: Making request to Edge Function');
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('AIService: Response status:', response.status);
    console.log('AIService: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error('AIService: Error response data:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('AIService: Failed to parse error response:', parseError);
        const errorText = await response.text();
        console.error('AIService: Raw error response:', errorText);
      }
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log('AIService: Response data structure:', {
      hasSuccess: 'success' in responseData,
      hasData: 'data' in responseData,
      hasError: 'error' in responseData,
      keys: Object.keys(responseData)
    });

    if (!responseData.success) {
      const errorMessage = responseData.error || 'AI service returned unsuccessful response';
      console.error('AIService: Unsuccessful response:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!responseData.data) {
      console.error('AIService: No data in successful response:', responseData);
      throw new Error('AI service returned no data');
    }

    console.log('AIService: Successfully received data from Edge Function');
    return responseData.data;

  } catch (error) {
    console.error('AIService: Request failed:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to AI service. Please check your internet connection.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown error occurred while calling AI service');
  }
}

/**
 * Analyze resume with Claude AI - supports both text content and file uploads
 */
export async function analyzeResume(
  resumeContent: string, 
  jobPosting: string, 
  resumeFile?: File
): Promise<ResumeAnalysisResult> {
  console.log('AIService: Starting resume analysis');
  console.log('AIService: Has resume content:', !!resumeContent.trim());
  console.log('AIService: Has resume file:', !!resumeFile);
  console.log('AIService: Has job posting:', !!jobPosting.trim());

  if (!resumeContent.trim() && !resumeFile) {
    throw new Error('Either resume content or resume file is required');
  }

  if (!jobPosting.trim()) {
    throw new Error('Job posting is required');
  }

  try {
    const requestData: any = {
      type: 'resume_analysis',
      jobPosting: jobPosting.trim(),
    };

    // Add resume content or file
    if (resumeFile) {
      console.log('AIService: Processing resume file:', resumeFile.name, resumeFile.type);
      const base64Data = await fileToBase64(resumeFile);
      const mediaType = getMediaType(resumeFile);
      
      requestData.resumeFile = {
        data: base64Data,
        media_type: mediaType,
        filename: resumeFile.name,
      };
      
      console.log('AIService: File processed for Claude API:', {
        filename: resumeFile.name,
        mediaType,
        dataLength: base64Data.length,
      });
    } else {
      requestData.resumeContent = resumeContent.trim();
    }

    const result = await callClaudeAPI(requestData);
    
    // Validate the response structure
    if (!result.tailoredResume || typeof result.matchScore !== 'number') {
      console.error('AIService: Invalid resume analysis response structure:', result);
      throw new Error('Invalid response format from AI service');
    }

    console.log('AIService: Resume analysis completed successfully');
    return result as ResumeAnalysisResult;

  } catch (error) {
    console.error('AIService: Resume analysis failed:', error);
    throw error;
  }
}

/**
 * Generate cover letter with Claude AI - supports both text content and file uploads
 */
export async function generateCoverLetter(
  resumeContent: string,
  jobPosting: string,
  companyName: string,
  jobTitle: string,
  tone: 'professional' | 'enthusiastic' | 'concise',
  resumeFile?: File,
  hiringManager?: string,
  personalExperience?: string
): Promise<CoverLetterResult> {
  console.log('AIService: Starting cover letter generation');

  if (!resumeContent.trim() && !resumeFile) {
    throw new Error('Either resume content or resume file is required');
  }

  if (!jobPosting.trim() || !companyName.trim() || !jobTitle.trim()) {
    throw new Error('Job posting, company name, and job title are required');
  }

  try {
    const requestData: any = {
      type: 'cover_letter',
      jobPosting: jobPosting.trim(),
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      tone,
    };

    // Add optional fields
    if (hiringManager?.trim()) {
      requestData.hiringManager = hiringManager.trim();
    }
    if (personalExperience?.trim()) {
      requestData.personalExperience = personalExperience.trim();
    }

    // Add resume content or file
    if (resumeFile) {
      console.log('AIService: Processing resume file for cover letter:', resumeFile.name);
      const base64Data = await fileToBase64(resumeFile);
      const mediaType = getMediaType(resumeFile);
      
      requestData.resumeFile = {
        data: base64Data,
        media_type: mediaType,
        filename: resumeFile.name,
      };
    } else {
      requestData.resumeContent = resumeContent.trim();
    }

    const result = await callClaudeAPI(requestData);
    
    // Validate the response structure
    if (!result.coverLetter) {
      console.error('AIService: Invalid cover letter response structure:', result);
      throw new Error('Invalid response format from AI service');
    }

    console.log('AIService: Cover letter generation completed successfully');
    return result as CoverLetterResult;

  } catch (error) {
    console.error('AIService: Cover letter generation failed:', error);
    throw error;
  }
}

/**
 * Analyze skill gaps with Claude AI - supports both text content and file uploads
 */
export async function analyzeSkillGaps(
  resumeContent: string,
  jobPosting: string,
  resumeFile?: File
): Promise<SkillGapResult> {
  console.log('AIService: Starting skill gap analysis');

  if (!resumeContent.trim() && !resumeFile) {
    throw new Error('Either resume content or resume file is required');
  }

  if (!jobPosting.trim()) {
    throw new Error('Job posting is required');
  }

  try {
    const requestData: any = {
      type: 'skill_gap',
      jobPosting: jobPosting.trim(),
    };

    // Add resume content or file
    if (resumeFile) {
      console.log('AIService: Processing resume file for skill analysis:', resumeFile.name);
      const base64Data = await fileToBase64(resumeFile);
      const mediaType = getMediaType(resumeFile);
      
      requestData.resumeFile = {
        data: base64Data,
        media_type: mediaType,
        filename: resumeFile.name,
      };
    } else {
      requestData.resumeContent = resumeContent.trim();
    }

    const result = await callClaudeAPI(requestData);
    
    // Validate the response structure
    if (!result.skillGapAnalysis || !result.learningRecommendations) {
      console.error('AIService: Invalid skill gap response structure:', result);
      throw new Error('Invalid response format from AI service');
    }

    console.log('AIService: Skill gap analysis completed successfully');
    return result as SkillGapResult;

  } catch (error) {
    console.error('AIService: Skill gap analysis failed:', error);
    throw error;
  }
}