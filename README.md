# ResumeZap

**AI-Powered Resume Tailoring Platform**

ResumeZap is a modern web application that leverages artificial intelligence to help job seekers optimize their resumes, analyze skill gaps, and accelerate their career growth. Built with React, TypeScript, and Supabase, it provides a comprehensive suite of tools for job search optimization.

## 🚀 Features

### Core Functionality
- **AI-Powered Resume Tailoring**: Upload your resume and job postings to get AI-optimized versions with improved ATS compatibility and keyword optimization
- **Skill Gap Analysis**: Identify missing skills for target roles and receive personalized learning recommendations with development roadmaps
- **Dynamic Cover Letter Generation**: Create compelling, personalized cover letters with multiple tone options (professional, enthusiastic, concise)
- **Application Tracking**: Manage job applications with status tracking, notes, and analytics
- **Match Scoring**: Get percentage-based compatibility scores between your resume and job requirements

### User Experience
- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop) with breakpoint-specific layouts
- **Dark Mode Support**: Toggle between light and dark themes with persistent preferences
- **Real-time Analytics**: Track usage, success rates, and progress with visual dashboards
- **File Management**: Upload, store, and manage multiple resume versions with version history

### Authentication & Security
- **Secure Authentication**: Email/password authentication with Supabase Auth
- **Row Level Security (RLS)**: Database-level security ensuring users can only access their own data
- **Profile Management**: User profiles with customizable settings and profile pictures
- **Session Management**: Secure session handling with automatic cleanup

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe component development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling and responsive design
- **Framer Motion** for smooth animations and micro-interactions
- **Zustand** for lightweight state management
- **React Router** for client-side routing

### Backend & Database
- **Supabase** for backend-as-a-service
  - PostgreSQL database with real-time subscriptions
  - Authentication and user management
  - Row Level Security (RLS) policies
  - Edge Functions for serverless computing
  - Storage for file uploads (profile pictures)

### Key Libraries
- **Lucide React** for consistent iconography
- **React Hot Toast** for user notifications
- **React Dropzone** for file upload handling
- **Recharts** for data visualization

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ErrorBoundary.tsx    # Error handling wrapper
│   ├── Navbar.tsx           # Navigation component
│   ├── PricingCard.tsx      # Subscription plan cards
│   ├── ProfilePictureUpload.tsx # Profile image management
│   └── UpgradeModal.tsx     # Plan upgrade interface
├── lib/                  # Utility functions and API clients
│   ├── applications.ts      # Job application management
│   ├── database.types.ts    # TypeScript database types
│   ├── imageUtils.ts        # Image processing utilities
│   ├── profilePicture.ts    # Profile picture handling
│   ├── skillAnalysis.ts     # Skill gap analysis logic
│   ├── supabase.ts          # Supabase client and auth
│   └── support.ts           # Support ticket management
├── pages/                # Main application pages
│   ├── ApplicationTracker.tsx   # Job application management
│   ├── AuthPage.tsx            # Login/registration
│   ├── CoverLetterGenerator.tsx # Cover letter creation
│   ├── Dashboard.tsx           # User dashboard
│   ├── EmailSupport.tsx        # Support contact form
│   ├── LandingPage.tsx         # Marketing homepage
│   ├── ResumeAnalyzer.tsx      # Resume optimization
│   ├── Settings.tsx            # User preferences
│   └── SkillGapAnalysis.tsx    # Skill assessment
├── store/                # State management
│   ├── authStore.ts         # Authentication state
│   ├── resumeStore.ts       # Resume and analysis data
│   └── themeStore.ts        # Theme preferences
└── App.tsx               # Main application component
```

### Database Schema

The application uses a PostgreSQL database with the following main tables:

- **users**: User profiles, subscription plans, and usage tracking
- **resumes**: Stored resume versions with match scores
- **applications**: Job application tracking and status
- **support_tickets**: Customer support management
- **skill_analyses**: Skill gap analysis results
- **skill_recommendations**: AI-generated learning recommendations

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Environment Variables
Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Setup
1. Run the migration files in `supabase/migrations/` to set up the database schema
2. Configure Row Level Security policies (included in migrations)
3. Set up Supabase Edge Functions for serverless operations

## 💳 Subscription Plans

### Free Plan
- 3 resume tailoring sessions per month
- 2 cover letter generations per month
- Basic skill gap analysis
- Email support (48-72 hours)

### Premium Plan ($7.99/month)
- 40 resume tailoring sessions per month
- 30 cover letter generations per month
- Enhanced skill gap analysis with priority ranking
- Priority email support (24-48 hours)
- Usage analytics dashboard

### Pro Plan ($14.99/month)
- Unlimited resume tailoring and cover letters
- Advanced skill gap analysis with development roadmaps
- Priority email support (4 hours)
- Advanced analytics and success tracking
- Custom templates and bulk processing

### Lifetime Plan ($79.99 one-time)
- All Pro features permanently
- Limited to first 1,000 customers
- VIP support and early access to new features
- 60-day money-back guarantee

## 🔒 Security Features

- **Row Level Security**: Database policies ensure data isolation
- **Authentication**: Secure email/password with session management
- **Input Validation**: Comprehensive form validation and sanitization
- **Error Handling**: Graceful error boundaries and user feedback
- **CORS Protection**: Proper cross-origin request handling

## 🎨 Design System

### Visual Design
- **Glassmorphic UI**: Modern glass-effect components with backdrop blur
- **Responsive Breakpoints**: 
  - Mobile: 0-480px
  - Tablet: 481-768px
  - Laptop: 769-1279px
  - Desktop: 1280px+
- **Color Scheme**: Purple-to-blue gradients with dark mode support
- **Typography**: Clean, readable fonts with proper hierarchy

### Animations
- **Framer Motion**: Smooth page transitions and micro-interactions
- **Loading States**: Skeleton screens and progress indicators
- **Hover Effects**: Interactive feedback on all clickable elements

## 📊 Current Progress

### ✅ Completed Features
- [x] User authentication and profile management
- [x] Resume upload and analysis simulation
- [x] Skill gap analysis with database persistence
- [x] Cover letter generation with tone options
- [x] Application tracking system
- [x] Subscription plan management
- [x] Dark mode implementation
- [x] Responsive design across all breakpoints
- [x] Profile picture upload with optimization
- [x] Support ticket system
- [x] Database schema with RLS policies
- [x] Edge Functions for serverless operations

### 🚧 In Development
- [ ] AI integration for actual resume analysis
- [ ] Payment processing with Stripe
- [ ] Email notifications and reminders
- [ ] Advanced analytics and reporting
- [ ] Export functionality (PDF, DOCX)
- [ ] Bulk application processing

### 🔮 Future Enhancements
- [ ] LinkedIn integration
- [ ] Job board API connections
- [ ] Interview preparation tools
- [ ] Salary negotiation guidance
- [ ] Team collaboration features
- [ ] Mobile app development

## 🤝 Contributing

This is a production-ready application built with modern web development best practices. The codebase follows:

- **TypeScript** for type safety
- **Component-based architecture** for maintainability
- **Comprehensive error handling** for reliability
- **Responsive design** for accessibility
- **Security-first approach** for user protection

## 📝 License

This project is proprietary software. All rights reserved.

---

**ResumeZap** - Accelerate your career with AI-powered job search optimization.