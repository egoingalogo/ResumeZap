import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Mail, 
  BarChart3, 
  FolderOpen, 
  Target,
  TrendingUp,
  Clock,
  Award,
  Plus,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { UpgradeModal } from '../components/UpgradeModal';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import toast from 'react-hot-toast';

/**
 * Main dashboard component showing user statistics, quick actions, and recent activity
 * Provides navigation to all major features and displays usage analytics
 */
const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, upgradePlan, isLoading, lifetimeUserCount } = useAuthStore();
  const { resumes, skillAnalyses, coverLetters, fetchResumes, fetchSkillAnalyses, fetchCoverLetters } = useResumeStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  console.log('Dashboard: Component mounted for user:', user?.email);
  console.log('Dashboard: Lifetime user count:', lifetimeUserCount);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Dashboard: User not authenticated, redirecting to landing page');
      navigate('/');
      return;
    }

    if (isAuthenticated && user) {
      // Fetch user's resumes
      fetchResumes().catch(error => {
        console.error('Dashboard: Failed to fetch resumes:', error);
        // Don't crash the dashboard if resumes fail to load
      });
      
      // Fetch skill analyses
      fetchSkillAnalyses().catch(error => {
        console.error('Dashboard: Failed to fetch skill analyses:', error);
        // Don't crash the dashboard if skill analyses fail to load
      });
      
      // Fetch cover letters
      fetchCoverLetters().catch(error => {
        console.error('Dashboard: Failed to fetch cover letters:', error);
        // Don't crash the dashboard if cover letters fail to load
      });

      // Handle upgrade parameter from registration
      const upgradeParam = searchParams.get('upgrade');
      if (upgradeParam && ['premium', 'pro', 'lifetime'].includes(upgradeParam)) {
        console.log('Dashboard: Processing upgrade:', upgradeParam);
        upgradePlan(upgradeParam as 'premium' | 'pro' | 'lifetime');
        toast.success(`Welcome to ResumeZap ${upgradeParam}!`);
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isAuthenticated, isLoading, navigate, searchParams, upgradePlan, user, fetchResumes, fetchSkillAnalyses, fetchCoverLetters]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const usageLimits = {
    free: { resumeTailoring: 3, coverLetters: 2 },
    premium: { resumeTailoring: 40, coverLetters: 30 },
    pro: { resumeTailoring: Infinity, coverLetters: Infinity },
    lifetime: { resumeTailoring: Infinity, coverLetters: Infinity },
  };

  const currentLimits = usageLimits[user.plan];
  const resumeUsagePercent = currentLimits.resumeTailoring === Infinity 
    ? 0 
    : (user.usageThisMonth.resumeTailoring / currentLimits.resumeTailoring) * 100;
  const coverLetterUsagePercent = currentLimits.coverLetters === Infinity 
    ? 0 
    : (user.usageThisMonth.coverLetters / currentLimits.coverLetters) * 100;

  const quickActions = [
    {
      title: 'Analyze Resume',
      description: 'Upload and tailor your resume to a job posting',
      icon: FileText,
      path: '/resume-analyzer',
      color: 'from-purple-500 to-purple-600',
      disabled: resumeUsagePercent >= 100,
    },
    {
      title: 'Generate Cover Letter',
      description: 'Create a personalized cover letter',
      icon: Mail,
      path: '/cover-letter',
      color: 'from-blue-500 to-blue-600',
      disabled: coverLetterUsagePercent >= 100,
    },
    {
      title: 'Skill Gap Analysis',
      description: 'Identify skills to develop for your target role',
      icon: BarChart3,
      path: '/skill-gap-analysis',
      color: 'from-green-500 to-green-600',
      disabled: false,
    },
    {
      title: 'Track Applications',
      description: 'Manage your job applications and follow-ups',
      icon: FolderOpen,
      path: '/applications',
      color: 'from-orange-500 to-orange-600',
      disabled: false,
    },
  ];

  const libraryActions = [
    {
      title: 'Cover Letter Library',
      description: 'View and manage your generated cover letters',
      icon: Mail,
      path: '/cover-letter-library',
      color: 'from-blue-500 to-blue-600',
      disabled: false,
    },
    {
      title: 'Skill Gap Analysis Library',
      description: 'Review your skill assessments and learning paths',
      icon: BarChart3,
      path: '/skill-gap-analysis-library',
      color: 'from-green-500 to-green-600',
      disabled: false,
    },
    {
      title: 'Support',
      description: 'Get help and contact our support team',
      icon: MessageSquare,
      path: '/support',
      color: 'from-purple-500 to-purple-600',
      disabled: false,
    },
  ];

  const stats = [
    {
      title: 'Resumes Created',
      value: resumes.length,
      icon: FileText,
      change: null,
      changeType: null,
    },
    {
      title: 'Applications',
      value: 0, // Will be updated when applications are implemented
      icon: Target,
      change: null,
      changeType: null,
    },
    {
      title: 'Skill Analyses',
      value: Array.isArray(skillAnalyses) ? skillAnalyses.length : 0,
      icon: TrendingUp,
      change: null,
      changeType: null,
    },
    {
      title: 'Cover Letters',
      value: coverLetters.length,
      icon: Award,
      change: null,
      changeType: null,
    },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.disabled) {
      toast.error(`You've reached your ${action.title.toLowerCase()} limit for this month. Upgrade to continue!`);
      return;
    }
    console.log('Dashboard: Navigating to:', action.path);
    navigate(action.path);
  };

  const handleUpgradeClick = () => {
    console.log('Dashboard: Opening upgrade modal');
    setShowUpgradeModal(true);
  };

  // Determine if upgrade button should be shown
  // Show for all plans except lifetime
  const shouldShowUpgradeButton = user.plan !== 'lifetime';

  return (
    <div>
      <Navbar />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Ready to accelerate your job search with AI-powered tools
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Current Plan</div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400 capitalize">
                    {user.plan}
                  </div>
                </div>
                
                {shouldShowUpgradeButton && (
                  <button
                    onClick={handleUpgradeClick}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Usage Cards */}
          {user.plan !== 'pro' && user.plan !== 'lifetime' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid md:grid-cols-2 gap-6 mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Resume Tailoring</h3>
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {user.usageThisMonth.resumeTailoring} of {currentLimits.resumeTailoring} used
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {Math.round(resumeUsagePercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        resumeUsagePercent >= 100 ? 'bg-red-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(resumeUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Cover Letters</h3>
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {user.usageThisMonth.coverLetters} of {currentLimits.coverLetters} used
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {Math.round(coverLetterUsagePercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        coverLetterUsagePercent >= 100 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(coverLetterUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="h-8 w-8 text-purple-600" />
                  {stat.change && (
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.title}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: action.disabled ? 1 : 1.02 }}
                  whileTap={{ scale: action.disabled ? 1 : 0.98 }}
                  onClick={() => handleQuickAction(action)}
                  disabled={action.disabled}
                  className={`text-left p-6 rounded-2xl shadow-lg border transition-all duration-200 ${
                    action.disabled
                      ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {action.description}
                  </p>
                  
                  <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                    {action.disabled ? 'Limit Reached' : 'Get Started'}
                    {!action.disabled && <ChevronRight className="h-4 w-4 ml-1" />}
                  </div>
                </motion.button>
              ))}
              
              {/* Resume Library Quick Action */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/resume-library')}
                className="text-left p-6 rounded-2xl shadow-lg border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center mb-4">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Resume Library
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  View and manage your optimized resumes
                </p>
                
                <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                  View Library
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </motion.button>
              
              {/* Additional Library Actions */}
              {libraryActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.path)}
                  className="text-left p-6 rounded-2xl shadow-lg border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {action.description}
                  </p>
                  
                  <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                    Get Started
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <button 
                onClick={() => navigate('/activity-history')}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
              >
                View All
              </button>
            </div>

            {resumes.length > 0 || coverLetters.length > 0 || skillAnalyses.length > 0 ? (
              <div className="space-y-4">
                {/* Combine and sort recent activities - include skill analyses */}
                {[
                  ...resumes.map(resume => ({
                    id: resume.id,
                    type: 'resume' as const,
                    title: resume.title,
                    subtitle: `Match Score: ${resume.matchScore}%`,
                    date: resume.createdAt,
                    icon: FileText,
                    color: 'bg-purple-100 dark:bg-purple-900',
                    iconColor: 'text-purple-600 dark:text-purple-400',
                    onClick: () => {
                      console.log('Dashboard: Navigating to resume:', resume.id);
                      useResumeStore.getState().loadResumeForViewing(resume.id)
                        .then(() => {
                          navigate('/resume-analyzer');
                          toast.success('Resume loaded successfully!');
                        })
                        .catch((error) => {
                          console.error('Dashboard: Failed to load resume:', error);
                          toast.error('Failed to load resume. Please try again.');
                        });
                    }
                  })),
                  ...skillAnalyses.map(analysis => {
                    const skillsNeedDev = analysis.recommendations.filter(r => !r.hasSkill).length;
                    const totalSkills = analysis.recommendations.length;
                    const highPriorityGaps = analysis.recommendations.filter(r => !r.hasSkill && r.importance === 'high').length;
                    
                    return {
                      id: analysis.id,
                      type: 'skill_analysis' as const,
                      title: `Skill Gap Analysis - ${new Date(analysis.analysisDate).toLocaleDateString()}`,
                      subtitle: `${skillsNeedDev} of ${totalSkills} skills to develop${highPriorityGaps > 0 ? ` (${highPriorityGaps} high priority)` : ''}`,
                      date: analysis.analysisDate,
                      icon: BarChart3,
                      color: 'bg-green-100 dark:bg-green-900',
                      iconColor: 'text-green-600 dark:text-green-400',
                      onClick: () => {
                        console.log('Dashboard: Loading skill analysis for viewing:', analysis.id);
                        useResumeStore.getState().loadSkillAnalysis(analysis.id)
                          .then(() => {
                            navigate('/skill-gap-analysis');
                            toast.success('Skill analysis loaded successfully!');
                          })
                          .catch((error) => {
                            console.error('Dashboard: Failed to load skill analysis:', error);
                            toast.error('Failed to load skill analysis. Please try again.');
                          });
                      }
                    };
                  }),
                  ...coverLetters.map(coverLetter => ({
                    id: coverLetter.id,
                    type: 'cover_letter' as const,
                    title: coverLetter.title,
                    subtitle: `${coverLetter.companyName} - ${coverLetter.jobTitle}`,
                    date: coverLetter.createdAt,
                    icon: Mail,
                    color: 'bg-blue-100 dark:bg-blue-900',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                    onClick: () => {
                      console.log('Dashboard: Loading cover letter for viewing:', coverLetter.id);
                      // Load the cover letter and navigate to generator
                      useResumeStore.getState().loadCoverLetterForViewing(coverLetter.id)
                        .then(() => {
                          navigate('/cover-letter', { 
                            state: { 
                              coverLetterData: coverLetter,
                              isViewing: true 
                            } 
                          });
                          toast.success('Cover letter loaded successfully!');
                        })
                        .catch((error) => {
                          console.error('Dashboard: Failed to load cover letter:', error);
                          toast.error('Failed to load cover letter. Please try again.');
                        });
                    }
                  }))
                ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map((activity) => (
                  <motion.button
                    key={activity.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={activity.onClick}
                    className="w-full flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 text-left"
                  >
                    <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center`}>
                      <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(activity.date).toLocaleDateString()}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No activity yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start by analyzing your first resume, generating a cover letter, or analyzing skill gaps to see activity here
                </p>
                <button
                  onClick={() => navigate('/resume-analyzer')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Analyze Resume</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={user.plan}
        lifetimeUserCount={lifetimeUserCount}
      />
    </div>
  );
};

export default Dashboard;