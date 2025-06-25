import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ResumeAnalysisRequest {
  type: 'resume_analysis';
  resumeContent: string;
  jobPosting: string;
}

interface CoverLetterRequest {
  type: 'cover_letter';
  resumeContent: string;
  jobPosting: string;
  companyName: string;
  jobTitle: string;
  tone: string;
  hiringManager?: string;
  personalExperience?: string;
}

interface SkillGapRequest {
  type: 'skill_gap';
  resumeContent: string;
  jobPosting: string;
}

type AIRequest = ResumeAnalysisRequest | CoverLetterRequest | SkillGapRequest;

/**
 * Supabase Edge Function for secure Claude AI API proxy
 * Handles resume analysis, cover letter generation, and skill gap analysis
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the Anthropic API key from Supabase secrets
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'AI service configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    let requestData: AIRequest
    try {
      requestData = await req.json()
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate request data
    if (!requestData.type || !requestData.resumeContent || !requestData.jobPosting) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Processing ${requestData.type} request`)

    // Generate appropriate prompt based on request type
    let systemPrompt = ''
    let userPrompt = ''

    switch (requestData.type) {
      case 'resume_analysis':
        systemPrompt = `You are an expert resume optimization specialist and ATS (Applicant Tracking System) consultant. Your task is to analyze resumes against job postings and provide detailed optimization recommendations.

You must respond with a valid JSON object containing the following structure:
{
  "tailoredResume": "string - the optimized resume content",
  "matchScore": number - overall match percentage (0-100),
  "matchBreakdown": {
    "keywords": number - keyword match percentage (0-100),
    "skills": number - skills match percentage (0-100), 
    "experience": number - experience match percentage (0-100),
    "formatting": number - ATS formatting score (0-100)
  },
  "changes": [
    {
      "section": "string - section name",
      "original": "string - original text",
      "improved": "string - improved text", 
      "reason": "string - explanation for change"
    }
  ],
  "keywordMatches": {
    "found": ["array of keywords found in resume"],
    "missing": ["array of important keywords missing"],
    "suggestions": ["array of keyword optimization suggestions"]
  },
  "atsOptimizations": ["array of ATS optimization tips"]
}`

        userPrompt = `Please analyze this resume against the job posting and provide optimization recommendations.

RESUME:
${requestData.resumeContent}

JOB POSTING:
${requestData.jobPosting}

Provide a comprehensive analysis with specific, actionable improvements to increase ATS compatibility and match score.`
        break

      case 'cover_letter':
        const coverLetterReq = requestData as CoverLetterRequest
        systemPrompt = `You are an expert cover letter writer specializing in creating compelling, personalized cover letters that get results. Your task is to generate cover letters that are tailored to specific job postings and company cultures.

You must respond with a valid JSON object containing the following structure:
{
  "coverLetter": "string - the complete cover letter text",
  "customizations": ["array of specific customizations made for this role"],
  "keyStrengths": ["array of key strengths highlighted"],
  "callToAction": "string - the specific call to action used"
}`

        const toneInstructions = {
          professional: 'Use a formal, business-appropriate tone that demonstrates professionalism and competence.',
          enthusiastic: 'Use an energetic, passionate tone that shows genuine excitement for the role and company.',
          concise: 'Use a brief, direct tone that gets straight to the point while maintaining professionalism.'
        }

        userPrompt = `Generate a ${coverLetterReq.tone} cover letter for this job application.

COMPANY: ${coverLetterReq.companyName}
POSITION: ${coverLetterReq.jobTitle}
${coverLetterReq.hiringManager ? `HIRING MANAGER: ${coverLetterReq.hiringManager}` : ''}

JOB POSTING:
${coverLetterReq.jobPosting}

APPLICANT'S RESUME:
${coverLetterReq.resumeContent}

${coverLetterReq.personalExperience ? `PERSONAL HIGHLIGHTS: ${coverLetterReq.personalExperience}` : ''}

TONE: ${toneInstructions[coverLetterReq.tone as keyof typeof toneInstructions]}

Create a compelling cover letter that demonstrates clear value proposition and genuine interest in the role.`
        break

      case 'skill_gap':
        systemPrompt = `You are an expert career development consultant and skills assessment specialist. Your task is to analyze skill gaps between a candidate's current abilities and job requirements, then provide comprehensive learning recommendations.

You must respond with a valid JSON object containing the following structure:
{
  "skillGapAnalysis": {
    "critical": [
      {
        "skill": "string - skill name",
        "currentLevel": "string - current proficiency level",
        "requiredLevel": "string - required proficiency level",
        "gap": "string - description of the gap"
      }
    ],
    "important": [/* same structure as critical */],
    "niceToHave": [/* same structure as critical */]
  },
  "learningRecommendations": [
    {
      "skill": "string - skill name",
      "priority": "string - Critical/Important/Nice-to-Have",
      "timeInvestment": "string - estimated time to learn",
      "courses": [
        {
          "platform": "string - learning platform",
          "courseName": "string - course title",
          "cost": "string - course cost",
          "duration": "string - course duration",
          "difficulty": "string - Beginner/Intermediate/Advanced"
        }
      ],
      "freeResources": [
        {
          "type": "string - resource type",
          "resource": "string - resource name",
          "description": "string - resource description"
        }
      ],
      "certifications": [
        {
          "name": "string - certification name",
          "provider": "string - certification provider",
          "timeToComplete": "string - time estimate",
          "cost": "string - certification cost"
        }
      ],
      "practicalApplication": "string - how to apply this skill practically"
    }
  ],
  "developmentRoadmap": {
    "phase1": {
      "duration": "string - phase duration",
      "focus": "string - main focus area",
      "milestones": ["array of milestones"]
    },
    "phase2": {
      "duration": "string - phase duration", 
      "focus": "string - main focus area",
      "milestones": ["array of milestones"]
    },
    "phase3": {
      "duration": "string - phase duration",
      "focus": "string - main focus area", 
      "milestones": ["array of milestones"]
    }
  },
  "skillsAlreadyStrong": ["array of skills the candidate already possesses"]
}`

        userPrompt = `Analyze the skill gaps between this candidate's resume and the job requirements, then provide a comprehensive learning plan.

CANDIDATE'S RESUME:
${requestData.resumeContent}

JOB REQUIREMENTS:
${requestData.jobPosting}

Provide specific, actionable learning recommendations with realistic timelines and practical resources.`
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid request type' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Make request to Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errorText)
      
      // Return user-friendly error message
      let errorMessage = 'AI service temporarily unavailable'
      if (claudeResponse.status === 429) {
        errorMessage = 'AI service is busy. Please try again in a moment.'
      } else if (claudeResponse.status === 401) {
        errorMessage = 'AI service authentication error'
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const claudeData = await claudeResponse.json()
    
    // Extract the response content
    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      console.error('Unexpected Claude response format:', claudeData)
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const responseText = claudeData.content[0].text

    // Parse the JSON response from Claude
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (error) {
      console.error('Failed to parse Claude JSON response:', error)
      console.error('Raw response:', responseText)
      return new Response(
        JSON.stringify({ error: 'AI response parsing error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully processed ${requestData.type} request`)

    // Return the parsed response
    return new Response(
      JSON.stringify({
        success: true,
        data: parsedResponse
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})