# ResumeZap - AI-Powered Resume Tailoring Platform

A modern, production-ready web application that helps job seekers optimize their resumes using AI technology.

## Features

- **AI-Powered Resume Tailoring**: Optimize resumes for specific job postings
- **Cover Letter Generation**: Create personalized cover letters
- **Skill Gap Analysis**: Identify missing skills and get learning recommendations
- **Application Tracking**: Manage job applications and follow-ups
- **Real-time Analytics**: Track usage and success metrics
- **Multi-tier Subscription**: Free, Premium, Pro, and Lifetime plans

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd resumezap
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your Supabase project:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to `.env`
   - Run the database migrations (see Database Setup below)

5. Start the development server:
```bash
npm run dev
```

## Database Setup

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run each migration file in order:
   - `supabase/migrations/create_users_table.sql`
   - `supabase/migrations/create_resumes_table.sql`
   - `supabase/migrations/create_applications_table.sql`
   - `supabase/migrations/create_support_tickets_table.sql`

### Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure the following:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add your production domain when deploying
   - **Email Confirmation**: Disable for development (optional)

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure users can only access their own data. The migrations automatically set up the necessary policies.

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── store/              # Zustand stores
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component

supabase/
└── migrations/         # Database migration files
```

## Key Features Implementation

### Authentication
- Supabase Auth integration with email/password
- Automatic session management
- Protected routes and user state persistence

### Database Integration
- Type-safe database operations with generated TypeScript types
- Row Level Security for data protection
- Real-time subscriptions for live updates

### State Management
- Zustand stores for different domains (auth, resumes, applications)
- Persistent storage for user preferences
- Optimistic updates for better UX

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Dark mode support with system preference detection
- Smooth animations and micro-interactions

## Deployment

### Frontend Deployment (Netlify/Vercel)

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Update environment variables in your hosting dashboard

### Database Deployment

Your Supabase database is automatically hosted and managed. Just ensure your production environment variables are correctly set.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@resumezap.com or create an issue in the repository.