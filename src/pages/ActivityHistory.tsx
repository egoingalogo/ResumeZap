import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity,
  FileText, 
  Mail, 
  BarChart3, 
  FolderOpen,
  Calendar, 
  Target, 
  Eye, 
  Search,
  Filter,
  ArrowLeft,
  Clock,
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import toast from 'react-hot-toast';

interface ActivityItem {
  id: string;
  type: 'resume' | 'cover_letter' | 'skill_analysis' | 'application';
  title: string;
  subtitle?: string;
  date: string;
  score?: number;
  status?: string;
  icon: any;
  color: string;
  data?: any;
}

/**
 * Activity History page component showing comprehensive user activity across all features
 * Displays resumes, cover letters, skill analyses, and applications in a unified timeline
 * Provides search, filtering, and navigation to specific activity results
 */
const ActivityHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    resumes, 
    skillAnalyses, 
    coverLetters,
    isLoading, 
    fetchResumes, 
    fetchSkillAnalyses,
    fetchCoverLetters,
    loadCoverLetterForViewing,
    loadResumeForViewing,
    loadSkillAnalysis
  } = useResumeStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'resume' | 'cover_letter' | 'skill_analysis' | 'application'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'score'>('date');
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  console.log('ActivityHistory: Component mounted');

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('ActivityHistory: User not authenticated, redirecting to landing page');
      navigate('/');
      return;
    }

    // Fetch all data on component mount
    Promise.all([
      fetchResumes().catch(error => {
        console.error('ActivityHistory: Failed to fetch resumes:', error);
      }),
      fetchSkillAnalyses().catch(error => {
        console.error('ActivityHistory: Failed to fetch skill analyses:', error);
      }),
      fetchCoverLetters().catch(error => {
        console.error('ActivityHistory: Failed to fetch cover letters:', error);
      })
    ]);
  }, [isAuthenticated, navigate, fetchResumes, fetchSkillAnalyses, fetchCoverLetters]);

  // Combine all activities into a unified list
  useEffect(() => {
    const allActivities: ActivityItem[] = [];

    // Add resume activities
    resumes.forEach(resume => {
      // Extract filename without extension
      const resumeTitle = resume.title.includes(' - ') ? 
        resume.title : 
        `AI-Optimized Resume - ${resume.title.replace(/\.[^/.]+$/, '')}`;
        
      allActivities.push({
        id: resume.id,
        type: 'resume',
        title: resumeTitle,
        subtitle: `Match Score: ${resume.matchScore}%`,
        date: resume.createdAt,
        score: resume.matchScore,
        icon: FileText,
        color: 'from-purple-500 to-purple-600',
        data: resume
      });
    });

    // Add skill analysis activities
    skillAnalyses.forEach(analysis => {
      const skillsNeedDev = analysis.recommendations.filter(r => !r.hasSkill).length;
      const totalSkills = analysis.recommendations.length;
      
      // Format title with resume filename (if available) and job title
      let title = "Skill Gap Analysis";
      
      if (analysis.resumeContentSnapshot) {
        // Extract filename without extension if possible
        const resumeFile = analysis.resumeContentSnapshot.split('/').pop() || '';
        const resumeFileName = resumeFile.replace(/\.[^/.]+$/, '');
        
        // Add resume filename
        if (resumeFileName) {
          title = `Skill Gap Analysis - ${resumeFileName}`;
        }
        
        // Add job title if available
        if (analysis.extractedJobTitle) {
          title += ` - ${analysis.extractedJobTitle}`;
        }
      } else {
        // Fall back to date-based title
        title = `Skill Gap Analysis - ${new Date(analysis.analysisDate).toLocaleDateString()}`;
      }
      
      allActivities.push({
        id: analysis.id,
        type: 'skill_analysis',
        title: title,
        subtitle: `${skillsNeedDev} of ${totalSkills} skills need development`,
        date: analysis.analysisDate,
        icon: BarChart3,
        color: 'from-green-500 to-green-600',
        data: analysis
      });
    });

    // Add cover letter activities
    coverLetters.forEach(coverLetter => {
      // Create title with format: Cover Letter - {resume file} - {company} - {job title}
      let title = `Cover Letter - ${coverLetter.companyName} - ${coverLetter.jobTitle}`;
      
      // If resume content snapshot is available (contains filename)
      if (coverLetter.resumeContentSnapshot) {
        // Extract just the filename if it looks like one
        const isFilePath = coverLetter.resumeContentSnapshot.includes('.') && 
                          !coverLetter.resumeContentSnapshot.includes(' ') &&
                          coverLetter.resumeContentSnapshot.length < 100;
                          
        if (isFilePath) {
          const resumeFile = coverLetter.resumeContentSnapshot.split('/').pop() || '';
          const resumeFileName = resumeFile.replace(/\.[^/.]+$/, '');
          
          if (resumeFileName) {
            title = `Cover Letter - ${resumeFileName} - ${coverLetter.companyName} - ${coverLetter.jobTitle}`;
          }
        }
      }
      
      allActivities.push({
        id: coverLetter.id,
        type: 'cover_letter',
        title: title,
        subtitle: `${coverLetter.companyName} - ${coverLetter.jobTitle} (${coverLetter.tone})`,
        date: coverLetter.createdAt,
        icon: Mail,
        color: 'from-blue-500 to-blue-600',
        data: coverLetter
      });
    });

    // TODO: Add application activities when implemented

    setActivities(allActivities);
  }, [resumes, skillAnalyses, coverLetters]);

  /**
   * Handle activity item click - navigate to appropriate page with data loaded
   */
  const handleActivityClick = async (activity: ActivityItem) => {
    console.log('ActivityHistory: Clicking activity:', activity.type, activity.id);
    
    try {
      switch (activity.type) {
        case 'resume':
          await loadResumeForViewing(activity.id);
          navigate('/resume-analyzer');
          toast.success('Resume loaded successfully!');
          break;
          
        case 'skill_analysis':
          await loadSkillAnalysis(activity.id);
          navigate('/skill-gap-analysis');
          toast.success('Skill analysis loaded successfully!');
          break;
          
        case 'cover_letter':
          console.log('ActivityHistory: Loading cover letter for viewing:', activity.id);
          await loadCoverLetterForViewing(activity.id);
          navigate('/cover-letter', { 
            state: { 
              coverLetterData: activity.data,
              isViewing: true 
            } 
          });
          toast.success('Cover letter loaded successfully!');
          break;
          
        case 'application':
          // TODO: Implement application loading
          navigate('/applications');
          toast.info('Application loaded - detailed view coming soon!');
          break;
          
        default:
          console.warn('ActivityHistory: Unknown activity type:', activity.type);
      }
    } catch (error) {
      console.error('ActivityHistory: Failed to load activity:', error);
      toast.error('Failed to load activity. Please try again.');
    }
  };

  /**
   * Filter and sort activities based on search and filter criteria
   */
  const filteredAndSortedActivities = activities
    .filter(activity => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.subtitle && activity.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Type filter
      const matchesType = filterType === 'all' || activity.type === filterType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        case 'score':
          return (b.score || 0) - (a.score || 0);
        default:
          return 0;
      }
    });

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'resume': return 'Resume Analysis';
      case 'cover_letter': return 'Cover Letter';
      case 'skill_analysis': return 'Skill Analysis';
      case 'application': return 'Application';
      default: return type;
    }
  };

  const getActivityStats = () => {
    const stats = {
      total: activities.length,
      resume: activities.filter(a => a.type === 'resume').length,
      skill_analysis: activities.filter(a => a.type === 'skill_analysis').length,
      cover_letter: coverLetters.length,
      application: activities.filter(a => a.type === 'application').length,
    };
    return stats;
  };

  const stats = getActivityStats();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Activity History
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage all your ResumeZap activities
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Activities</div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400">
                    {stats.total}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resume}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Resumes</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.skill_analysis}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Skill Analyses</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{coverLetters.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Cover Letters</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.application}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Applications</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-8"
          >
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Filter by Type */}
              <div>
                <CustomSelect
                  options={[
                    { value: 'all', label: 'All Activities' },
                    { value: 'resume', label: 'Resume Analysis' },
                    { value: 'skill_analysis', label: 'Skill Analysis' },
                    { value: 'cover_letter', label: 'Cover Letters' },
                    { value: 'application', label: 'Applications' },
                  ]}
                  value={filterType}
                  onChange={(value) => setFilterType(value as any)}
                  className="w-full"
                />
              </div>

              {/* Sort By */}
              <div>
                <CustomSelect
                  options={[
                    { value: 'date', label: 'Sort by Date' },
                    { value: 'type', label: 'Sort by Type' },
                    { value: 'score', label: 'Sort by Score' },
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as any)}
                  className="w-full"
                />
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAndSortedActivities.length} of {activities.length} activities
                </span>
              </div>
            </div>
          </motion.div>

          {/* Activity List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredAndSortedActivities.length > 0 ? (
              filteredAndSortedActivities.map((activity, index) => (
                <motion.button
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  onClick={() => handleActivityClick(activity)}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${activity.color} flex items-center justify-center flex-shrink-0`}>
                        <activity.icon className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {activity.title}
                          </h3>
                          <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                            {getActivityTypeLabel(activity.type)}
                          </span>
                        </div>
                        
                        {activity.subtitle && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {activity.subtitle}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(activity.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {activity.score && (
                            <div className="flex items-center space-x-1">
                              <Target className="h-4 w-4" />
                              <span>{activity.score}% match</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterType !== 'all' ? 'No matching activities found' : 'No activities yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Start using ResumeZap features to see your activity here'
                  }
                </p>
                {(!searchTerm && filterType === 'all') && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate('/resume-analyzer')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                    >
                      Analyze Resume
                    </button>
                    <button
                      onClick={() => navigate('/cover-letter')}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                    >
                      Generate Cover Letter
                    </button>
                    <button
                      onClick={() => navigate('/skill-gap-analysis')}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                    >
                      Analyze Skills
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHistory;