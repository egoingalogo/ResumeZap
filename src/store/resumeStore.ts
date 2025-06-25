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

// New interfaces to match Anthropic JSON outputs
interface ResumeAnalysisResult {
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

interface CoverLetterResult {
  coverLetter: string;
  customizations: string[];
  keyStrengths: string[];
  callToAction: string;
}

interface SkillGapResult {
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
  currentResumeAnalysis: ResumeAnalysisResult | null;
  currentCoverLetter: CoverLetterResult | null;
  currentSkillGapAnalysis: SkillGapResult | null;
  skillGaps: SkillGap[];
  skillAnalyses: SkillAnalysisWithRecommendations[];
  currentSkillAnalysis: SkillAnalysisWithRecommendations | null;
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
  currentResumeAnalysis: null,
  currentCoverLetter: null,
  currentSkillGapAnalysis: null,
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
   * Analyze resume with AI using new JSON structure
   */
  analyzeResume: async (resumeContent: string, jobPosting: string) => {
    console.log('ResumeStore: Starting resume analysis');
    set({ isAnalyzing: true, error: null });
    
    try {
      // Simulate AI analysis with new structure - replace with actual Claude API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock response matching Anthropic JSON structure
      const mockAnalysisResult: ResumeAnalysisResult = {
        tailoredResume: `${resumeContent}

EXPERIENCE
• Senior Software Engineer at TechCorp (2021-Present)
  - Led development of React-based web applications serving 50,000+ users
  - Implemented TypeScript for improved code quality and reduced bugs by 30%
  - Collaborated with cross-functional teams using Agile methodologies
  - Optimized application performance resulting in 25% faster load times

• Full Stack Developer at StartupXYZ (2019-2021)
  - Built responsive web applications using React, Node.js, and PostgreSQL
  - Developed RESTful APIs handling 10,000+ daily requests
  - Implemented automated testing reducing deployment issues by 40%

TECHNICAL SKILLS
• Frontend: React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express.js, Python, RESTful APIs
• Databases: PostgreSQL, MongoDB, Redis
• Tools: Git, Docker, AWS, CI/CD, Jest, Webpack`,
        matchScore: 87,
        matchBreakdown: {
          keywords: 85,
          skills: 90,
          experience: 88,
          formatting: 85
        },
        changes: [
          {
            section: "Experience",
            original: "Worked on web applications",
            improved: "Led development of React-based web applications serving 50,000+ users",
            reason: "Added specific technology (React) and quantifiable impact (50,000+ users) for better ATS matching"
          },
          {
            section: "Technical Skills",
            original: "JavaScript, HTML, CSS",
            improved: "React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS",
            reason: "Added React and TypeScript which are key requirements in the job posting"
          }
        ],
        keywordMatches: {
          found: ["React", "TypeScript", "Node.js", "PostgreSQL", "Agile", "APIs"],
          missing: ["AWS Lambda", "GraphQL", "Microservices"],
          suggestions: ["AWS Lambda for serverless functions", "GraphQL for API development", "Microservices architecture"]
        },
        atsOptimizations: [
          "Used standard section headers (EXPERIENCE, TECHNICAL SKILLS)",
          "Added quantifiable achievements with specific numbers",
          "Included relevant keywords naturally in context",
          "Used bullet points for better readability",
          "Avoided graphics and complex formatting"
        ]
      };
      
      // Create resume object for backward compatibility
      const analyzedResume: Resume = {
        id: Date.now().toString(),
        title: `Tailored Resume - ${new Date().toLocaleDateString()}`,
        content: mockAnalysisResult.tailoredResume,
        originalContent: resumeContent,
        jobPosting,
        matchScore: mockAnalysisResult.matchScore,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      
      set({ 
        currentResume: analyzedResume, 
        currentResumeAnalysis: mockAnalysisResult,
        error: null 
      });
      console.log('ResumeStore: Resume analysis completed with score:', mockAnalysisResult.matchScore);
      
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
   * Generate cover letter with AI using new JSON structure
   */
  generateCoverLetter: async (resumeContent: string, jobPosting: string, companyName: string, jobTitle: string, tone: string) => {
    console.log('ResumeStore: Generating cover letter');
    set({ isAnalyzing: true, error: null });
    
    try {
      // Simulate AI generation - replace with actual Claude API call
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Mock response matching Anthropic JSON structure
      const mockCoverLetterResult: CoverLetterResult = {
        coverLetter: `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. With my extensive experience in React development and full-stack engineering, I am confident I would be a valuable addition to your team.

In my current role as Senior Software Engineer, I have led the development of React-based applications serving over 50,000 users, directly aligning with your need for scalable frontend solutions. My expertise in TypeScript and modern JavaScript frameworks, combined with my experience in Agile development environments, positions me well to contribute to your team's success from day one.

What particularly excites me about ${companyName} is your commitment to innovation and technical excellence. I am eager to bring my passion for creating efficient, user-focused applications to help drive your company's continued growth and success.

Thank you for considering my application. I would welcome the opportunity to discuss how my technical skills and collaborative approach can contribute to your team's objectives.

Best regards,
[Your Name]`,
        customizations: [
          `Addressed specific ${jobTitle} role requirements`,
          `Mentioned ${companyName}'s focus on innovation`,
          "Highlighted React and TypeScript experience from resume",
          "Referenced 50,000+ users metric from experience",
          `Adapted tone to be ${tone} and professional`
        ],
        keyStrengths: [
          "React development expertise with proven scale",
          "TypeScript and modern JavaScript proficiency",
          "Agile development experience",
          "Leadership in technical projects",
          "User-focused application development"
        ],
        callToAction: "I would welcome the opportunity to discuss how my technical skills and collaborative approach can contribute to your team's objectives."
      };
      
      set({ 
        currentCoverLetter: mockCoverLetterResult,
        error: null 
      });
      console.log('ResumeStore: Cover letter generation completed');
      
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
   * Analyze skill gaps using new JSON structure and save to database
   */
  analyzeSkillGaps: async (resumeContent: string, jobPosting: string, resumeId?: string) => {
    console.log('ResumeStore: Analyzing skill gaps');
    set({ isAnalyzing: true, error: null });
    
    try {
      // Simulate AI skill gap analysis with new structure
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response matching new Anthropic JSON structure
      const mockSkillGapResult: SkillGapResult = {
        skillGapAnalysis: {
          critical: [
            {
              skill: "AWS Lambda",
              currentLevel: "No experience",
              requiredLevel: "Intermediate - able to build and deploy serverless functions",
              gap: "Need to learn serverless architecture, Lambda functions, and event-driven programming"
            },
            {
              skill: "GraphQL",
              currentLevel: "Basic understanding",
              requiredLevel: "Advanced - able to design schemas and optimize queries",
              gap: "Need hands-on experience with schema design, resolvers, and performance optimization"
            }
          ],
          important: [
            {
              skill: "Docker",
              currentLevel: "Basic containerization knowledge",
              requiredLevel: "Intermediate - able to create multi-stage builds and orchestration",
              gap: "Need experience with Docker Compose, multi-stage builds, and container optimization"
            },
            {
              skill: "Microservices Architecture",
              currentLevel: "Theoretical knowledge",
              requiredLevel: "Practical experience with service communication and deployment",
              gap: "Need hands-on experience building and deploying microservices"
            }
          ],
          niceToHave: [
            {
              skill: "Kubernetes",
              currentLevel: "No experience",
              requiredLevel: "Basic understanding of container orchestration",
              gap: "Foundational knowledge of K8s concepts and basic deployment"
            }
          ]
        },
        learningRecommendations: [
          {
            skill: "AWS Lambda",
            priority: "Critical",
            timeInvestment: "40-60 hours over 6-8 weeks",
            courses: [
              {
                platform: "AWS Training",
                courseName: "AWS Lambda Foundations",
                cost: "Free",
                duration: "4 hours",
                difficulty: "Beginner"
              },
              {
                platform: "Udemy",
                courseName: "AWS Lambda & Serverless Architecture Bootcamp",
                cost: "$89.99",
                duration: "12 hours",
                difficulty: "Intermediate"
              }
            ],
            freeResources: [
              {
                type: "Documentation",
                resource: "AWS Lambda Developer Guide",
                description: "Official documentation with examples and best practices"
              },
              {
                type: "YouTube",
                resource: "AWS Lambda Tutorial Series by AWS",
                description: "Step-by-step tutorials for building serverless applications"
              }
            ],
            certifications: [
              {
                name: "AWS Certified Developer - Associate",
                provider: "Amazon Web Services",
                timeToComplete: "2-3 months",
                cost: "$150"
              }
            ],
            practicalApplication: "Build a serverless API using Lambda, API Gateway, and DynamoDB for a personal project"
          },
          {
            skill: "GraphQL",
            priority: "Critical",
            timeInvestment: "30-40 hours over 4-6 weeks",
            courses: [
              {
                platform: "Apollo GraphQL",
                courseName: "Odyssey - Apollo's GraphQL Tutorial",
                cost: "Free",
                duration: "8 hours",
                difficulty: "Beginner"
              },
              {
                platform: "Pluralsight",
                courseName: "Building Scalable APIs with GraphQL",
                cost: "$29/month",
                duration: "6 hours",
                difficulty: "Intermediate"
              }
            ],
            freeResources: [
              {
                type: "Documentation",
                resource: "GraphQL.org Learning Resources",
                description: "Official GraphQL documentation and tutorials"
              },
              {
                type: "Tutorial",
                resource: "How to GraphQL",
                description: "Comprehensive tutorial covering GraphQL fundamentals"
              }
            ],
            certifications: [
              {
                name: "Apollo Graph Developer - Associate",
                provider: "Apollo GraphQL",
                timeToComplete: "1-2 months",
                cost: "Free"
              }
            ],
            practicalApplication: "Refactor an existing REST API to GraphQL or build a new GraphQL API with subscriptions"
          }
        ],
        developmentRoadmap: {
          phase1: {
            duration: "Months 1-2",
            focus: "Critical serverless and API skills",
            milestones: [
              "Complete AWS Lambda fundamentals course",
              "Build first serverless application",
              "Complete GraphQL tutorial and build basic API",
              "Deploy Lambda function to production"
            ]
          },
          phase2: {
            duration: "Months 3-4",
            focus: "Containerization and architecture patterns",
            milestones: [
              "Master Docker multi-stage builds",
              "Build microservices with Docker Compose",
              "Implement GraphQL subscriptions",
              "Optimize Lambda cold starts"
            ]
          },
          phase3: {
            duration: "Months 5-6",
            focus: "Advanced orchestration and optimization",
            milestones: [
              "Learn Kubernetes basics",
              "Deploy microservices to K8s cluster",
              "Implement advanced GraphQL patterns",
              "Achieve AWS certification"
            ]
          }
        },
        skillsAlreadyStrong: [
          "React.js - Advanced proficiency with hooks and context",
          "TypeScript - Strong typing and interface design",
          "Node.js - Backend API development experience",
          "PostgreSQL - Database design and optimization",
          "Git - Version control and collaboration workflows"
        ]
      };
      
      // Convert to legacy format for backward compatibility
      const legacySkillGaps: SkillGap[] = [
        ...mockSkillGapResult.skillGapAnalysis.critical.map(skill => ({
          skill: skill.skill,
          importance: 'high' as const,
          hasSkill: false,
          recommendations: {
            courses: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.courses.map(c => c.courseName) || [],
            resources: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.freeResources.map(r => r.resource) || [],
            timeEstimate: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.timeInvestment || 'Not specified',
          },
        })),
        ...mockSkillGapResult.skillGapAnalysis.important.map(skill => ({
          skill: skill.skill,
          importance: 'medium' as const,
          hasSkill: false,
          recommendations: {
            courses: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.courses.map(c => c.courseName) || [],
            resources: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.freeResources.map(r => r.resource) || [],
            timeEstimate: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.timeInvestment || 'Not specified',
          },
        })),
        ...mockSkillGapResult.skillGapAnalysis.niceToHave.map(skill => ({
          skill: skill.skill,
          importance: 'low' as const,
          hasSkill: false,
          recommendations: {
            courses: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.courses.map(c => c.courseName) || [],
            resources: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.freeResources.map(r => r.resource) || [],
            timeEstimate: mockSkillGapResult.learningRecommendations
              .find(rec => rec.skill === skill.skill)?.timeInvestment || 'Not specified',
          },
        })),
      ];
      
      const totalGaps = mockSkillGapResult.skillGapAnalysis.critical.length + 
                       mockSkillGapResult.skillGapAnalysis.important.length + 
                       mockSkillGapResult.skillGapAnalysis.niceToHave.length;
      const criticalGaps = mockSkillGapResult.skillGapAnalysis.critical.length;
      const strongSkills = mockSkillGapResult.skillsAlreadyStrong.length;
      
      const overallSummary = `Analysis of ${totalGaps + strongSkills} key skills: You have ${strongSkills} strong skills and need to develop ${totalGaps} skills. ${criticalGaps} critical skills require immediate attention.`;
      
      // Save to database
      const savedAnalysis = await createSkillAnalysis(
        resumeContent,
        jobPosting,
        legacySkillGaps,
        resumeId || null,
        overallSummary
      );
      
      // Update local state
      set({ 
        skillGaps: legacySkillGaps,
        currentSkillGapAnalysis: mockSkillGapResult,
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
      currentSkillGapAnalysis: null,
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