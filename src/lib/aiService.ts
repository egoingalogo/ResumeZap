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
  // Only support PDF files now
  return 'application/pdf';
}

/**
 * Validate image file for profile picture upload
 * Checks file type, size, and dimensions
 */
export const validatePdfFile = (file: File): ImageValidationResult => {
  console.log('ImageUtils: Validating image file:', file.name);
  
  // Check file type - only allow PDF files
  const allowedTypes = ['application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a PDF file only.'
    };
  }
  
  // Check file size - limit to 10MB
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'PDF file must be smaller than 10MB.'
    };
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    return {
      isValid: false,
      error: 'Please upload a PDF file only.'
    };
  }
  
  return { isValid: true };
};

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
  improvementSummary?: {
    totalChanges: string;
    keyAreasImproved: string[];
    estimatedATSImprovement: string;
  };
}

export interface CoverLetterResult {
  coverLetter: string;
  customizations: string[];
  keyStrengths: string[];
  callToAction: string;
  toneAnalysis?: {
    formality: string;
    enthusiasm: string;
    persuasiveness: string;
    clarity: string;
    notes: string;
  };
  matchingElements?: {
    jobRequirements: string[];
    candidateQualifications: string[];
    alignmentScore?: string;
  };
}

export interface SkillGapResult {
  skillGapAnalysis: {
    critical: Array<{
      skill: string;
      currentLevel: string;
      requiredLevel: string;
      gap: string;
      impactOnJobSuccess?: string;
    }>;
    important: Array<{
      skill: string;
      currentLevel: string;
      requiredLevel: string;
      gap: string;
      impactOnJobSuccess?: string;
    }>;
    niceToHave: Array<{
      skill: string;
      currentLevel: string;
      requiredLevel: string;
      gap: string;
      impactOnJobSuccess?: string;
    }>;
  };
  learningRecommendations: Array<{
    skill: string;
    priority: string;
    timeInvestment: string;
    courses: Array<{
      platform: string;
      courseName: string;
      instructor?: string;
      url?: string;
      cost: string;
      duration: string;
      difficulty: string;
      rating?: string;
      description?: string;
    }>;
    freeResources: Array<{
      type: string;
      resource: string;
      url?: string;
      description: string;
      estimatedTime?: string;
    }>;
    certifications: Array<{
      name: string;
      provider: string;
      timeToComplete: string;
      cost: string;
      validity?: string;
      industryRecognition?: string;
      url?: string;
    }>;
    practicalApplication: string;
    books?: Array<{
      title: string;
      author: string;
      amazonUrl?: string;
      description: string;
    }>;
  }>;
  developmentRoadmap: {
    phase1: {
      duration: string;
      focus: string;
      skills?: string[];
      weeklyTimeCommitment?: string;
      milestones: string[];
    };
    phase2: {
      duration: string;
      focus: string;
      skills?: string[];
      weeklyTimeCommitment?: string;
      milestones: string[];
    };
    phase3: {
      duration: string;
      focus: string;
      skills?: string[];
      weeklyTimeCommitment?: string;
      milestones: string[];
    };
  };
  skillsAlreadyStrong: string[];
  totalDevelopmentTime?: string;
  budgetEstimate?: {
    minimum: string;
    recommended: string;
    premium: string;
  };
  nextSteps?: string[];
}

/**
 * Make API call to Claude through Edge Function with enhanced error handling
 */
async function callClaudeAPI(requestData: any): Promise<any> {
  console.log('AIService: Making request to Edge Function');
  
  try {
    // Get and validate Supabase anon key for authorization
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseAnonKey) {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
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
 * For resume analysis specifically, requires PDF file upload
 */
export async function analyzeResume(
  resumeContent: string,
  jobPosting: string, 
  resumeFile?: File
): Promise<ResumeAnalysisResult> {
  console.log('AIService: Starting resume analysis');
  console.log('AIService: Has resume content:', !!resumeContent?.trim());
  console.log('AIService: Has resume file:', !!resumeFile);
  console.log('AIService: Has job posting:', !!jobPosting.trim());

  // For resume analysis, require PDF file - this is now enforced in the UI
  if (!resumeFile) {
    throw new Error('Resume file is required for analysis');
  }

  // Validate PDF file
  const validation = validatePdfFile(resumeFile);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  if (!jobPosting.trim()) {
    throw new Error('Job posting is required');
  }

  try {
    const requestData: any = {
      type: 'resume_analysis',
      jobPosting: jobPosting.trim(),
      resumeFile: {
        data: await fileToBase64(resumeFile),
        media_type: getMediaType(resumeFile),
        filename: resumeFile.name,
      },
    };

    console.log('AIService: PDF file processed for Claude API:', {
      filename: resumeFile.name,
      mediaType: requestData.resumeFile.media_type,
      dataLength: requestData.resumeFile.data.length,
    });

    const result = await callClaudeAPI(requestData);
    
    // Convert string numbers to actual numbers and validate structure
    if (!result.tailoredResume) {
      console.error('AIService: Invalid resume analysis response structure:', result);
      throw new Error('Invalid response format from AI service');
    }

    // Convert string numbers to actual numbers for proper typing
    const processedResult: ResumeAnalysisResult = {
      ...result,
      matchScore: typeof result.matchScore === 'string' ? parseInt(result.matchScore) : result.matchScore,
      matchBreakdown: {
        keywords: typeof result.matchBreakdown?.keywords === 'string' ? parseInt(result.matchBreakdown.keywords) : result.matchBreakdown?.keywords || 0,
        skills: typeof result.matchBreakdown?.skills === 'string' ? parseInt(result.matchBreakdown.skills) : result.matchBreakdown?.skills || 0,
        experience: typeof result.matchBreakdown?.experience === 'string' ? parseInt(result.matchBreakdown.experience) : result.matchBreakdown?.experience || 0,
        formatting: typeof result.matchBreakdown?.formatting === 'string' ? parseInt(result.matchBreakdown.formatting) : result.matchBreakdown?.formatting || 0,
      },
      changes: result.changes || [],
      keywordMatches: {
        found: result.keywordMatches?.found || [],
        missing: result.keywordMatches?.missing || [],
        suggestions: result.keywordMatches?.suggestions || [],
      },
      atsOptimizations: result.atsOptimizations || [],
    };

    // Validate final processed result
    if (typeof processedResult.matchScore !== 'number' || isNaN(processedResult.matchScore)) {
      console.error('AIService: Invalid match score in response:', result.matchScore);
      throw new Error('Invalid match score format from AI service');
    }

    console.log('AIService: Resume analysis completed successfully');
    return processedResult;

  } catch (error) {
    console.error('AIService: Resume analysis failed:', error);
    throw error;
  }
}

/**
 * Generate cover letter with Claude AI - supports both text content and file uploads
 * Can work with either PDF file or text content
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

  // Now requiring PDF file upload in the UI
  if (!resumeFile) {
    throw new Error('Resume file is required for cover letter generation');
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

    const validation = validatePdfFile(resumeFile);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    requestData.resumeFile = {
      data: await fileToBase64(resumeFile),
      media_type: getMediaType(resumeFile),
      filename: resumeFile.name,
    };

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
 * Can work with either PDF file or text content
 */
export async function analyzeSkillGaps(
  resumeContent: string,
  jobPosting: string,
  resumeFile?: File
): Promise<SkillGapResult> {
  console.log('AIService: Starting skill gap analysis');
  console.log('AIService: Received parameters:', {
    hasJobPosting: !!jobPosting?.trim(),
    hasResumeFile: !!resumeFile,
    resumeFileName: resumeFile?.name,
    resumeFileSize: resumeFile?.size
  });

  // Require PDF file for skill gap analysis
  if (!resumeFile) {
    throw new Error('Resume file is required for skill gap analysis');
  }

  if (!jobPosting.trim()) {
    throw new Error('Job posting is required');
  }

  try {
    const requestData: any = {
      type: 'skill_gap',
      jobPosting: jobPosting.trim(),
    };

    // Validate PDF file
    const validation = validatePdfFile(resumeFile);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    requestData.resumeFile = {
      data: await fileToBase64(resumeFile),
      media_type: getMediaType(resumeFile),
      filename: resumeFile.name,
    };

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