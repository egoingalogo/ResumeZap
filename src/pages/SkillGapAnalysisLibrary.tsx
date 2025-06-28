import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Search, 
  Calendar, 
  Target, 
  Trash2, 
  Eye, 
  Filter,
  ArrowLeft,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import toast from 'react-hot-toast';

/**
 * Skill Gap Analysis Library page component for managing saved skill analyses
 * Displays all user's skill gap analyses with options to view or delete
 * Provides search and filtering capabilities for better organization
 */
const SkillGapAnalysisLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    skillAnalyses, 
    isLoading, 
    fetchSkillAnalyses, 
    loadSkillAnalysis, 
    deleteSkillAnalysis 
  } = useResumeStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'skills' | 'gaps'>('date');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  console.log('SkillGapAnalysisLibrary: Component mounted');

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('SkillGapAnalysisLibrary: User not authenticated, redirecting to landing page');
      navigate('/');
      return;
    }

    // Load skill analyses on component mount
    fetchSkillAnalyses().catch(error => {
      console.error('SkillGapAnalysisLibrary: Failed to load analyses:', error);
      toast.error('Failed to load skill gap analysis library');
    });
  }, [isAuthenticated, navigate, fetchSkillAnalyses]);

  /**
   * Handle analysis viewing - loads the analysis and navigates to skill gap page
   */
  const handleViewAnalysis = async (analysisId: string) => {
    console.log('SkillGapAnalysisLibrary: Loading analysis for viewing:', analysisId);
    setSelectedAnalysisId(analysisId);
    
    try {
      await loadSkillAnalysis(analysisId);
      navigate('/skill-gap-analysis');
      toast.success('Analysis loaded successfully!');
    } catch (error) {
      console.error('SkillGapAnalysisLibrary: Failed to load analysis:', error);
      toast.error('Failed to load analysis. Please try again.');
    } finally {
      setSelectedAnalysisId(null);
    }
  };

  /**
   * Handle analysis deletion with confirmation
   */
  const handleDeleteAnalysis = async (analysisId: string, analysisTitle: string) => {
    if (!confirm(`Are you sure you want to delete the analysis "${analysisTitle}"? This action cannot be undone.`)) {
      return;
    }

    console.log('SkillGapAnalysisLibrary: Deleting analysis:', analysisId);
    
    try {
      await deleteSkillAnalysis(analysisId);
      toast.success('Analysis deleted successfully!');
    } catch (error) {
      console.error('SkillGapAnalysisLibrary: Failed to delete analysis:', error);
      toast.error('Failed to delete analysis. Please try again.');
    }
  };

  /**
   * Format analysis title for display
   */
  const formatAnalysisTitle = (analysis: any) => {
    const date = new Date(analysis.analysisDate).toLocaleDateString();
    const time = new Date(analysis.analysisDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Skill Analysis - ${date} at ${time}`;
  };

  /**
   * Get analysis statistics
   */
  const getAnalysisStats = (analysis: any) => {
    const totalSkills = analysis.recommendations.length;
    const skillsHave = analysis.recommendations.filter((r: any) => r.hasSkill).length;
    const skillsNeed = totalSkills - skillsHave;
    const highPriorityGaps = analysis.recommendations.filter((r: any) => !r.hasSkill && r.importance === 'high').length;
    
    return { totalSkills, skillsHave, skillsNeed, highPriorityGaps };
  };

  /**
   * Filter and sort analyses based on search and filter criteria
   */
  const filteredAndSortedAnalyses = skillAnalyses
    .filter(analysis => {
      // Search filter
      const analysisTitle = formatAnalysisTitle(analysis);
      const matchesSearch = searchTerm === '' || 
        analysisTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (analysis.overallSummary && analysis.overallSummary.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Priority filter
      let matchesPriority = true;
      if (filterPriority !== 'all') {
        const hasHighPriorityGaps = analysis.recommendations.some((r: any) => !r.hasSkill && r.importance === 'high');
        const hasMediumPriorityGaps = analysis.recommendations.some((r: any) => !r.hasSkill && r.importance === 'medium');
        const hasLowPriorityGaps = analysis.recommendations.some((r: any) => !r.hasSkill && r.importance === 'low');
        
        if (filterPriority === 'high' && !hasHighPriorityGaps) matchesPriority = false;
        if (filterPriority === 'medium' && !hasMediumPriorityGaps) matchesPriority = false;
        if (filterPriority === 'low' && !hasLowPriorityGaps) matchesPriority = false;
      }
      
      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime();
        case 'skills':
          return b.recommendations.length - a.recommendations.length;
        case 'gaps':
          const aGaps = a.recommendations.filter((r: any) => !r.hasSkill).length;
          const bGaps = b.recommendations.filter((r: any) => !r.hasSkill).length;
          return bGaps - aGaps;
        default:
          return 0;
      }
    });

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
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Skill Gap Analysis Library
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage your AI-powered skill gap analyses
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Analyses</div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400">
                    {skillAnalyses.length}
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/skill-gap-analysis')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  New Analysis
                </button>
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-8"
          >
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'skills' | 'gaps')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="skills">Sort by Total Skills</option>
                  <option value="gaps">Sort by Skill Gaps</option>
                </select>
              </div>

              {/* Filter by Priority */}
              <div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority Gaps</option>
                  <option value="medium">Medium Priority Gaps</option>
                  <option value="low">Low Priority Gaps</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAndSortedAnalyses.length} of {skillAnalyses.length} analyses
                </span>
              </div>
            </div>
          </motion.div>

          {/* Analyses List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredAndSortedAnalyses.length > 0 ? (
              filteredAndSortedAnalyses.map((analysis, index) => {
                const stats = getAnalysisStats(analysis);
                
                return (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {formatAnalysisTitle(analysis)}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(analysis.analysisDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(analysis.analysisDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.totalSkills}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-500">Total Skills</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.skillsHave}</div>
                            <div className="text-xs text-green-600 dark:text-green-500">Skills You Have</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.skillsNeed}</div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-500">Skills to Learn</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.highPriorityGaps}</div>
                            <div className="text-xs text-red-600 dark:text-red-500">High Priority</div>
                          </div>
                        </div>

                        {/* Summary */}
                        {analysis.overallSummary && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {analysis.overallSummary}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleViewAnalysis(analysis.id)}
                          disabled={selectedAnalysisId === analysis.id}
                          className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-200 group disabled:opacity-50"
                          title="View Analysis"
                        >
                          {selectedAnalysisId === analysis.id ? (
                            <div className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id, formatAnalysisTitle(analysis))}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          title="Delete Analysis"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterPriority !== 'all' ? 'No matching analyses found' : 'No skill gap analyses yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterPriority !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Start by creating your first skill gap analysis to see it here'
                  }
                </p>
                {(!searchTerm && filterPriority === 'all') && (
                  <button
                    onClick={() => navigate('/skill-gap-analysis')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    Create Your First Analysis
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SkillGapAnalysisLibrary;