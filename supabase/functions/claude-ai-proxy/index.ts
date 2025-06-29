import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Validate PDF file data
 */
function validatePdfFile(mediaType: string, filename: string): void {
  if (mediaType !== 'application/pdf') {
    throw new Error('Invalid file type. Please upload a PDF file only.');
  }
  
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension !== 'pdf') {
    throw new Error('Please upload a PDF file only.');
  }
}

/**
 * Clean Claude response by removing markdown code blocks
 */
function cleanClaudeResponse(responseText: string): string {
  let cleaned = responseText.trim();
  
  // Check if response starts with ```json and ends with ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  return cleaned.trim();
}

/**
 * Supabase Edge Function for Claude AI API proxy
 * Handles PDF resume analysis, cover letter generation, and skill gap analysis
 * Based on Anthropic Claude Sonnet 4 API with document attachment support
 */
serve(async (req: Request) => {
  console.log('Edge Function invoked');
  console.log('Request method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      console.error('Invalid request method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the Anthropic API key from Supabase secrets
    console.log('Checking for Anthropic API key...');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment variables');
      return new Response(JSON.stringify({
        error: 'AI service configuration error',
        details: 'ANTHROPIC_API_KEY not found in environment variables'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate API key format
    if (!anthropicApiKey.startsWith('sk-ant-')) {
      console.error('Invalid API key format - should start with sk-ant-');
      return new Response(JSON.stringify({
        error: 'AI service configuration error',
        details: 'Invalid API key format'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let requestData: any;
    try {
      const requestText = await req.text();
      console.log('Request body length:', requestText.length);
      requestData = JSON.parse(requestText);
      console.log('Request type:', requestData.type);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate request data
    if (!requestData.type || !requestData.jobPosting) {
      console.error('Missing required fields:', {
        type: requestData.type,
        hasJobPosting: !!requestData.jobPosting
      });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For resume analysis, require PDF file; for other types, allow text content
    if (requestData.type === 'resume_analysis') {
      if (!requestData.resumeFile) {
        console.error('PDF resume file is required for resume analysis');
        return new Response(JSON.stringify({
          error: 'PDF resume file is required for analysis'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Validate PDF file
      try {
        validatePdfFile(requestData.resumeFile.media_type, requestData.resumeFile.filename);
      } catch (error) {
        console.error('PDF validation failed:', error);
        return new Response(JSON.stringify({
          error: error instanceof Error ? error.message : 'Invalid PDF file'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // For cover letter and skill gap analysis, require either file or content
      if (!requestData.resumeContent && !requestData.resumeFile) {
        console.error('Neither resume content nor resume file provided');
        return new Response(JSON.stringify({
          error: 'Either resume content or resume file is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log(`Processing ${requestData.type} request`);

    // Set max_tokens based on request type
    let maxTokens: number;
    switch (requestData.type) {
      case 'resume_analysis':
        maxTokens = 6000;
        break;
      case 'cover_letter':
        maxTokens = 2500;
        break;
      case 'skill_gap':
        maxTokens = 8000;
        break;
      default:
        maxTokens = 4000;
    }

    // Generate system prompt and user content based on request type
    let systemPrompt = '';
    let userContent: any[] = [];

    switch (requestData.type) {
      case 'resume_analysis':
        systemPrompt = `You are ResumeZap AI, an expert ATS optimization and resume tailoring specialist. Your role is to analyze PDF resumes against job postings and provide detailed tailoring recommendations with quantifiable improvements.

EXPERTISE:
- ATS keyword optimization and parsing algorithms
- Bullet point impact optimization with quantifiable results
- Job-resume alignment scoring methodologies
- Industry-specific formatting standards
- Applicant Tracking System compatibility

TONE: Analytical, precise, and improvement-focused. Provide specific data and measurable improvements.

CRITICAL DATA PRESERVATION REQUIREMENTS:
- NEVER alter, modify, or change any factual information from the original resume
- NEVER change dates, company names, job titles, education details, or numerical data
- NEVER fabricate or embellish achievements, metrics, or experiences
- NEVER add skills, certifications, or experiences not present in the original
- NEVER modify quantitative data (years of experience, GPA, percentages, etc.)
- ONLY enhance presentation, formatting, and keyword optimization while preserving ALL original facts

OUTPUT REQUIREMENTS:
- Maintain 100% factual accuracy to the original resume data
- Always provide numerical match scores and percentages
- Highlight specific changes with before/after examples
- Focus on ATS-friendly formatting improvements
- Ensure all recommendations preserve authenticity and truthfulness
- Improvements should focus on: word choice optimization, bullet point structure, keyword integration, formatting enhancements, and strategic repositioning of existing content
- CRITICAL: Return ONLY valid JSON without any markdown formatting or code blocks`;

        userContent = [
          {
            type: "text",
            text: `Please analyze this PDF resume against the provided job posting and deliver comprehensive tailoring recommendations with quantifiable improvements.

Input Data:
RESUME FILE: [PDF file uploaded by user - extract and analyze all content]

JOB POSTING:
${requestData.jobPosting}

Analysis Requirements:

1. Extract all text content from the uploaded PDF resume
2. Perform comprehensive ATS optimization analysis
3. Calculate precise matching scores across all categories
4. Identify specific improvement opportunities while preserving all factual data
5. Generate ATS-optimized tailored resume version

Required JSON Response Format:

{
  "tailoredResume": "Complete optimized resume text with improved formatting, bullet points, and keyword integration while preserving all original factual information",
  "matchScore": "Overall percentage score (0-100) representing resume-job alignment",
  "matchBreakdown": {
    "keywords": "Percentage of critical job keywords found in resume (0-100)",
    "skills": "Skills alignment percentage between resume and job requirements (0-100)", 
    "experience": "Experience relevance percentage to job requirements (0-100)",
    "formatting": "ATS compatibility and formatting score (0-100)"
  },
  "changes": [
    {
      "section": "Resume section name (e.g., Professional Experience, Skills, Summary)",
      "original": "Original text from resume",
      "improved": "Enhanced version with better keywords/formatting",
      "reason": "Specific explanation of how this change improves ATS parsing or job relevance"
    }
  ],
  "keywordMatches": {
    "found": ["Array of job keywords successfully matched in current resume"],
    "missing": ["Array of important job keywords absent from resume"],
    "suggestions": ["Array of missing keywords that can be naturally incorporated based on existing experience"]
  },
  "atsOptimizations": [
    "List of specific ATS formatting improvements implemented (e.g., header formatting, bullet point structure, section organization)"
  ],
  "improvementSummary": {
    "totalChanges": "Number of modifications made",
    "keyAreasImproved": ["List of main resume sections enhanced"],
    "estimatedATSImprovement": "Percentage improvement in ATS compatibility"
  ]
}`
          },
          {
            type: "document",
            source: {
              type: "base64",
              media_type: requestData.resumeFile.media_type,
              data: requestData.resumeFile.data
            }
          }
        ];
        break;

      case 'cover_letter':
        const coverLetterReq = requestData;
        
        const toneInstructions = {
          professional: 'Use a formal, business-appropriate tone that demonstrates professionalism and competence.',
          enthusiastic: 'Use an energetic, passionate tone that shows genuine excitement for the role and company.',
          concise: 'Use a brief, direct tone that gets straight to the point while maintaining professionalism.'
        };
        
        const selectedTone = coverLetterReq.tone;
        const toneInstruction = toneInstructions[selectedTone] || toneInstructions.professional;

        systemPrompt = `You are ResumeZap AI's cover letter specialist. Create compelling, personalized cover letters that demonstrate clear value alignment between candidate experience and job requirements.

EXPERTISE:
- Storytelling techniques that connect experience to job requirements
- Company-specific customization using job posting insights
- Industry-appropriate formatting and structure
- Value proposition articulation

TONE INSTRUCTION: ${toneInstruction}

STRUCTURE REQUIREMENTS:
- Opening: Compelling hook with specific job/company reference
- Body 1: Relevant experience connection to job requirements
- Body 2: Key achievements that demonstrate value
- Closing: Strong call to action and next steps

OUTPUT: Provide both the cover letter and customization details used.
CRITICAL: Return ONLY valid JSON without any markdown formatting or code blocks`;

        if (coverLetterReq.resumeFile) {
          userContent = [
            {
              type: "text",
              text: `Create a ${coverLetterReq.tone} cover letter based on this resume file:

JOB POSTING:
${coverLetterReq.jobPosting}

COMPANY NAME: ${coverLetterReq.companyName}
JOB TITLE: ${coverLetterReq.jobTitle}
TONE: ${coverLetterReq.tone}
${coverLetterReq.hiringManager ? `HIRING MANAGER: ${coverLetterReq.hiringManager}` : ''}
${coverLetterReq.personalExperience ? `PERSONAL HIGHLIGHTS: ${coverLetterReq.personalExperience}` : ''}

Provide JSON response:
{
  "coverLetter": "Complete cover letter text",
  "customizations": [
    "List of company/job-specific elements incorporated"
  ],
  "keyStrengths": [
    "Main value propositions highlighted"
  ],
  "callToAction": "Specific closing statement used"
}`
            },
            {
              type: "document",
              source: {
                type: "base64",
                media_type: coverLetterReq.resumeFile.media_type,
                data: coverLetterReq.resumeFile.data
              }
            }
          ];
        } else {
          userContent = [
            {
              type: "text",
              text: `Create a ${coverLetterReq.tone} cover letter based on:

RESUME:
${coverLetterReq.resumeContent}

JOB POSTING:
${coverLetterReq.jobPosting}

COMPANY NAME: ${coverLetterReq.companyName}
JOB TITLE: ${coverLetterReq.jobTitle}
TONE: ${coverLetterReq.tone}
${coverLetterReq.hiringManager ? `HIRING MANAGER: ${coverLetterReq.hiringManager}` : ''}
${coverLetterReq.personalExperience ? `PERSONAL HIGHLIGHTS: ${coverLetterReq.personalExperience}` : ''}

Provide JSON response:
{
  "coverLetter": "Complete cover letter text",
  "customizations": [
    "List of company/job-specific elements incorporated"
  ],
  "keyStrengths": [
    "Main value propositions highlighted"
  ],
  "callToAction": "Specific closing statement used"
}`
            }
          ];
        }
        break;

      case 'skill_gap':
        systemPrompt = `You are ResumeZap AI's career development analyst specializing in skill gap identification and learning pathway creation. 

EXPERTISE:
- Technical and soft skill gap analysis with priority ranking
- Online learning platform course recommendations (Coursera, Udemy, LinkedIn Learning)
- Free resource curation (YouTube, documentation, tutorials)
- Certification pathway mapping
- Time investment estimation for skill development
- Industry-specific learning resource prioritization

APPROACH:
- Categorize skills by priority (Critical, Important, Nice-to-have)
- Provide specific course names and platforms
- Include both paid and free learning options
- Estimate realistic timeframes for skill acquisition
- Create step-by-step development roadmaps
- Focus on practical, applicable learning

OUTPUT: Detailed analysis with specific, actionable learning recommendations.
CRITICAL: Return ONLY valid JSON without any markdown formatting or code blocks`;

        if (requestData.resumeFile) {
          userContent = [
            {
              type: "text",
              text: `Analyze skill gaps between this resume file and job posting, then provide comprehensive learning recommendations:

TARGET JOB POSTING:
${requestData.jobPosting}

Provide detailed JSON response:
{
  "skillGapAnalysis": {
    "critical": [
      {
        "skill": "Skill name",
        "currentLevel": "Assessment of current proficiency",
        "requiredLevel": "Level needed for job",
        "gap": "Specific gap description"
      }
    ],
    "important": [Similar structure],
    "niceToHave": [Similar structure]
  },
  "learningRecommendations": [
    {
      "skill": "Skill name",
      "priority": "Critical/Important/Nice-to-have",
      "timeInvestment": "Estimated hours/weeks",
      "courses": [
        {
          "platform": "Coursera/Udemy/LinkedIn Learning",
          "courseName": "Specific course title",
          "cost": "Free/Paid price",
          "duration": "Course length",
          "difficulty": "Beginner/Intermediate/Advanced"
        }
      ],
      "freeResources": [
        {
          "type": "YouTube/Documentation/Tutorial",
          "resource": "Specific resource name/channel",
          "description": "What this resource covers"
        }
      ],
      "certifications": [
        {
          "name": "Certification name",
          "provider": "Certification provider",
          "timeToComplete": "Estimated time",
          "cost": "Certification cost"
        }
      ],
      "practicalApplication": "How to gain hands-on experience"
    }
  ],
  "developmentRoadmap": {
    "phase1": {
      "duration": "Timeline",
      "focus": "Priority skills to develop first",
      "milestones": ["Specific achievements/goals"]
    },
    "phase2": {
      "duration": "Timeline",
      "focus": "Secondary skills focus",
      "milestones": ["Specific achievements/goals"]
    },
    "phase3": {
      "duration": "Timeline", 
      "focus": "Advanced skills and specialization",
      "milestones": ["Specific achievements/goals"]
    }
  },
  "skillsAlreadyStrong": [
    "Skills user already possesses that match job requirements"
  ]
}`
            },
            {
              type: "document",
              source: {
                type: "base64",
                media_type: requestData.resumeFile.media_type,
                data: requestData.resumeFile.data
              }
            }
          ];
        } else {
          userContent = [
            {
              type: "text",
              text: `Analyze skill gaps between this resume and job posting, then provide comprehensive learning recommendations:

CURRENT RESUME:
${requestData.resumeContent}

TARGET JOB POSTING:
${requestData.jobPosting}

Provide detailed JSON response:
{
  "skillGapAnalysis": {
    "critical": [
      {
        "skill": "Skill name",
        "currentLevel": "Assessment of current proficiency",
        "requiredLevel": "Level needed for job",
        "gap": "Specific gap description"
      }
    ],
    "important": [Similar structure],
    "niceToHave": [Similar structure]
  },
  "learningRecommendations": [
    {
      "skill": "Skill name",
      "priority": "Critical/Important/Nice-to-have",
      "timeInvestment": "Estimated hours/weeks",
      "courses": [
        {
          "platform": "Coursera/Udemy/LinkedIn Learning",
          "courseName": "Specific course title",
          "cost": "Free/Paid price",
          "duration": "Course length",
          "difficulty": "Beginner/Intermediate/Advanced"
        }
      ],
      "freeResources": [
        {
          "type": "YouTube/Documentation/Tutorial",
          "resource": "Specific resource name/channel",
          "description": "What this resource covers"
        }
      ],
      "certifications": [
        {
          "name": "Certification name",
          "provider": "Certification provider",
          "timeToComplete": "Estimated time",
          "cost": "Certification cost"
        }
      ],
      "practicalApplication": "How to gain hands-on experience"
    }
  ],
  "developmentRoadmap": {
    "phase1": {
      "duration": "Timeline",
      "focus": "Priority skills to develop first",
      "milestones": ["Specific achievements/goals"]
    },
    "phase2": {
      "duration": "Timeline",
      "focus": "Secondary skills focus",
      "milestones": ["Specific achievements/goals"]
    },
    "phase3": {
      "duration": "Timeline", 
      "focus": "Advanced skills and specialization",
      "milestones": ["Specific achievements/goals"]
    }
  },
  "skillsAlreadyStrong": [
    "Skills user already possesses that match job requirements"
  ]
}`
            }
          ];
        }
        break;

      default:
        console.error('Invalid request type:', requestData.type);
        return new Response(JSON.stringify({ error: 'Invalid request type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    console.log('Making request to Claude API...');
    console.log('Model: claude-sonnet-4-20250514');
    console.log('Max tokens:', maxTokens);
    console.log('System prompt length:', systemPrompt.length);
    console.log('User content length:', JSON.stringify(userContent).length);

    // Make request to Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userContent
          }
        ]
      })
    });

    console.log('Claude API response status:', claudeResponse.status);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', {
        status: claudeResponse.status,
        statusText: claudeResponse.statusText,
        body: errorText
      });

      let errorMessage = 'AI service temporarily unavailable';
      if (claudeResponse.status === 429) {
        errorMessage = 'AI service is busy. Please try again in a moment.';
      } else if (claudeResponse.status === 401) {
        errorMessage = 'AI service authentication error. Please check API key configuration.';
      } else if (claudeResponse.status === 400) {
        errorMessage = 'Invalid request to AI service. Please check your input.';
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const claudeData = await claudeResponse.json();
    console.log('Claude API response received successfully');

    // Extract the response content
    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      console.error('Unexpected Claude response format:', claudeData);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const responseText = claudeData.content[0].text;

    // Clean the response to remove markdown code blocks
    const cleanedResponse = cleanClaudeResponse(responseText);
    console.log('Cleaned response length:', cleanedResponse.length);

    // Parse the JSON response from Claude
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
      console.log('Successfully parsed Claude JSON response');
    } catch (error) {
      console.error('Failed to parse Claude JSON response:', error);
      console.error('Raw response:', responseText.substring(0, 500) + '...');
      return new Response(JSON.stringify({ error: 'AI response parsing error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Successfully processed ${requestData.type} request`);

    // Return the parsed response
    return new Response(JSON.stringify({
      success: true,
      data: parsedResponse
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
)

Critical Guidelines:

- PRESERVE ALL FACTUAL DATA: Never alter dates, company names, job titles, education details, or any numerical information
- NO FABRICATION: Do not add skills, experiences, or achievements not present in the original resume
- ENHANCE PRESENTATION ONLY: Focus on keyword optimization, bullet point structure, and formatting improvements
- QUANTIFIABLE RESULTS: Provide specific percentages and measurable improvements
- ATS OPTIMIZATION: Ensure all changes improve Applicant Tracking System compatibility

Output Focus Areas:

1. Strategic keyword integration from job posting
2. Bullet point impact optimization
3. ATS-friendly formatting enhancements
4. Skills section alignment with job requirements
5. Professional summary optimization for relevance

Analyze the resume thoroughly and provide the complete JSON response with all required fields populated.`
});