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
        systemPrompt = `You are ResumeZap AI, an expert ATS optimization and resume tailoring specialist. Your role is to analyze resumes against job postings and provide detailed tailoring recommendations with quantifiable improvements.

EXPERTISE:
- ATS keyword optimization and parsing algorithms
- Bullet point impact optimization with quantifiable results
- Job-resume alignment scoring methodologies
- Industry-specific formatting standards
- Applicant Tracking System compatibility

TONE: Analytical, precise, and improvement-focused. Provide specific data and measurable improvements.

OUTPUT REQUIREMENTS:
- Always provide numerical match scores and percentages
- Highlight specific changes with before/after examples
- Focus on ATS-friendly formatting improvements
- Ensure all recommendations maintain authenticity`

        userPrompt = `Analyze this resume against the job posting and provide comprehensive tailoring:

**ORIGINAL RESUME:**
${requestData.resumeContent}

**TARGET JOB POSTING:**
${requestData.jobPosting}

Please provide a JSON response with these exact keys:
{
  "tailoredResume": "Complete optimized resume text with improved bullet points",
  "matchScore": "Percentage score (0-100)",
  "matchBreakdown": {
    "keywords": "Percentage of job keywords found in resume",
    "skills": "Skills alignment percentage", 
    "experience": "Experience relevance percentage",
    "formatting": "ATS compatibility score"
  },
  "changes": [
    {
      "section": "Section name",
      "original": "Original text",
      "improved": "Improved text",
      "reason": "Why this change improves ATS/relevance"
    }
  ],
  "keywordMatches": {
    "found": ["list of matched keywords"],
    "missing": ["list of missing important keywords"],
    "suggestions": ["keywords to naturally incorporate"]
  },
  "atsOptimizations": [
    "Specific formatting improvements made for ATS compatibility"
  ]
}`
        break

      case 'cover_letter':
        const coverLetterReq = requestData as CoverLetterRequest
        
        // Dynamic tone instructions based on user selection
        const toneInstructions = {
          professional: 'Use a formal, business-appropriate tone that demonstrates professionalism and competence.',
          enthusiastic: 'Use an energetic, passionate tone that shows genuine excitement for the role and company.',
          concise: 'Use a brief, direct tone that gets straight to the point while maintaining professionalism.'
        }
        
        const selectedTone = coverLetterReq.tone as keyof typeof toneInstructions
        const toneInstruction = toneInstructions[selectedTone] || toneInstructions.professional
        
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

OUTPUT: Provide both the cover letter and customization details used.`

        userPrompt = `Create a ${coverLetterReq.tone} cover letter based on:

**RESUME:**
${coverLetterReq.resumeContent}

**JOB POSTING:**
${coverLetterReq.jobPosting}

**COMPANY NAME:** ${coverLetterReq.companyName}

**JOB TITLE:** ${coverLetterReq.jobTitle}

**TONE:** ${coverLetterReq.tone}
${coverLetterReq.hiringManager ? `**HIRING MANAGER:** ${coverLetterReq.hiringManager}` : ''}
${coverLetterReq.personalExperience ? `**PERSONAL HIGHLIGHTS:** ${coverLetterReq.personalExperience}` : ''}

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
        break

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

OUTPUT: Detailed analysis with specific, actionable learning recommendations.`

        userPrompt = `Analyze skill gaps between this resume and job posting, then provide comprehensive learning recommendations:

**CURRENT RESUME:**
${requestData.resumeContent}

**TARGET JOB POSTING:**
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

    // Set max_tokens based on request type
    let maxTokens = 4000 // default
    switch (requestData.type) {
      case 'resume_analysis':
        maxTokens = 6000
        break
      case 'cover_letter':
        maxTokens = 2500
        break
      case 'skill_gap':
        maxTokens = 8000
        break
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
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