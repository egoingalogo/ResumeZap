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
  resumes: [
    // Mock resumes for testing
    {
      id: 'resume-1',
      title: 'Software Engineer Resume - Google',
      content: `John Doe
Software Engineer

EXPERIENCE
• Senior Frontend Developer at TechCorp (2022-2024)
  - Built scalable React applications serving 100K+ users
  - Implemented modern JavaScript frameworks and TypeScript
  - Collaborated with cross-functional teams using Agile methodologies

• Full Stack Developer at StartupXYZ (2020-2022)
  - Developed RESTful APIs using Node.js and Express
  - Designed responsive user interfaces with React and CSS
  - Optimized database queries improving performance by 40%

SKILLS
• Frontend: React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express, Python, REST APIs
• Database: PostgreSQL, MongoDB, Redis
• Tools: Git, Docker, AWS, CI/CD, Jest

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2016-2020)`,
      originalContent: `John Doe
Software Engineer

EXPERIENCE
• Frontend Developer at TechCorp (2022-2024)
• Full Stack Developer at StartupXYZ (2020-2022)

SKILLS
• React, JavaScript, Node.js, Python
• Git, Docker, AWS

EDUCATION
Bachelor of Science in Computer Science`,
      jobPosting: 'Senior Software Engineer position at Google requiring React, TypeScript, and cloud experience.',
      matchScore: 92,
      createdAt: '2025-01-10T10:00:00.000Z',
      lastModified: '2025-01-10T10:00:00.000Z',
    },
    {
      id: 'resume-2',
      title: 'Product Manager Resume - Microsoft',
      content: `John Doe
Product Manager

EXPERIENCE
• Senior Product Manager at TechCorp (2021-2024)
  - Led product strategy for B2B SaaS platform with $2M ARR
  - Managed cross-functional teams of 12+ engineers and designers
  - Increased user engagement by 35% through data-driven decisions

• Associate Product Manager at StartupXYZ (2019-2021)
  - Defined product roadmap and feature prioritization
  - Conducted user research and A/B testing
  - Collaborated with engineering teams on technical implementation

SKILLS
• Product Strategy, Roadmap Planning, User Research
• Data Analysis, A/B Testing, Metrics & KPIs
• Agile/Scrum, Stakeholder Management
• SQL, Analytics Tools, Wireframing

EDUCATION
MBA in Technology Management
Business School (2017-2019)`,
      originalContent: `John Doe
Product Manager

EXPERIENCE
• Product Manager at TechCorp (2021-2024)
• Associate Product Manager at StartupXYZ (2019-2021)

SKILLS
• Product Strategy, Data Analysis
• Agile, SQL

EDUCATION
MBA in Technology Management`,
      jobPosting: 'Senior Product Manager role at Microsoft focusing on enterprise software and team leadership.',
      matchScore: 87,
      createdAt: '2025-01-08T14:30:00.000Z',
      lastModified: '2025-01-08T14:30:00.000Z',
    },
    {
      id: 'resume-3',
      title: 'Data Scientist Resume - Netflix',
      content: `John Doe
Data Scientist

EXPERIENCE
• Senior Data Scientist at DataCorp (2022-2024)
  - Built machine learning models improving recommendation accuracy by 25%
  - Analyzed large datasets using Python, SQL, and Spark
  - Deployed ML models to production serving millions of users

• Data Analyst at AnalyticsCo (2020-2022)
  - Created dashboards and reports for executive decision making
  - Performed statistical analysis and hypothesis testing
  - Automated data pipelines reducing processing time by 60%

SKILLS
• Programming: Python, R, SQL, Scala
• ML/AI: Scikit-learn, TensorFlow, PyTorch, XGBoost
• Data: Pandas, NumPy, Spark, Hadoop
• Visualization: Tableau, Matplotlib, Seaborn
• Cloud: AWS, GCP, Docker, Kubernetes

EDUCATION
Master of Science in Data Science
Data University (2018-2020)`,
      originalContent: `John Doe
Data Scientist

EXPERIENCE
• Data Scientist at DataCorp (2022-2024)
• Data Analyst at AnalyticsCo (2020-2022)

SKILLS
• Python, SQL, Machine Learning
• Tableau, AWS

EDUCATION
Master of Science in Data Science`,
      jobPosting: 'Senior Data Scientist position at Netflix working on recommendation systems and ML infrastructure.',
      matchScore: 94,
      createdAt: '2025-01-05T09:15:00.000Z',
      lastModified: '2025-01-05T09:15:00.000Z',
    },
  ],
  currentResume: null,
  skillGaps: [
    // Mock skill gaps for testing
    {
      skill: 'Kubernetes',
      importance: 'high',
      hasSkill: false,
      recommendations: {
        courses: ['Kubernetes Fundamentals', 'Certified Kubernetes Administrator (CKA)'],
        resources: ['Kubernetes Official Documentation', 'Kubernetes by Example'],
        timeEstimate: '4-6 weeks',
      },
    },
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
      skill: 'GraphQL',
      importance: 'medium',
      hasSkill: false,
      recommendations: {
        courses: ['GraphQL Fundamentals', 'Apollo GraphQL'],
        resources: ['GraphQL.org', 'Apollo Documentation'],
        timeEstimate: '3-4 weeks',
      },
    },
    {
      skill: 'System Design',
      importance: 'high',
      hasSkill: false,
      recommendations: {
        courses: ['System Design Interview', 'Designing Data-Intensive Applications'],
        resources: ['High Scalability Blog', 'System Design Primer'],
        timeEstimate: '8-12 weeks',
      },
    },
  ],
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