import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Target, 
  BookOpen, 
  Clock, 
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
  Play,
  History,
  Trash2,
  Eye,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import toast from 'react-hot-toast';

/**
 * Skill gap analysis component with AI-powered recommendations and learning paths
 * Provides detailed skill assessment, personalized learning resources, and analysis history
 * Integrates with database to persist and retrieve past analyses
 */
const SkillGapAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    analyzeSkillGaps, 
    skillGaps, 
    skillAnalyses,
    currentSkillAnalysis,
    isAnalyzing,
    isLoading,
    fetchSkillAnalyses,
    loadSkillAnalysis,
    deleteSkillAnalysis,
    clearCurrentSkillAnalysis
  } = useResumeStore();
  
  const [resumeText, setResumeText] = useState('');
  const [jobPosting, setJobPosting] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  console.log('SkillGapAnalysis: Component mounted');

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('SkillGapAnalysis: User not authenticated, redirecting to landing page');
      navigate('/');
      return;
    }

    // Fetch existing analyses on component mount
    fetchSkillAnalyses().catch(error => {
      console.error('SkillGapAnalysis: Failed to fetch analyses:', error);
    });
  }, [isAuthenticated, navigate, fetchSkillAnalyses]);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste your resume content');
      return;
    }

    if (!jobPosting.trim()) {
      toast.error('Please paste the job posting');
      return;
    }

    console.log('SkillGapAnalysis: Starting new analysis');
    
    try {
      await analyzeSkillGaps(resumeText, jobPosting);
      toast.success('Skill gap analysis completed and saved!');
      setShowHistory(false); // Hide history when showing new results
    } catch (error) {
      console.error('SkillGapAnalysis: Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    }
  };

  const handleLoadAnalysis = async (analysisId: string) => {
    console.log('SkillGapAnalysis: Loading analysis:', analysisId);
    setSelectedAnalysisId(analysisId);
    
    try {
      await loadSkillAnalysis(analysisId);
      setShowHistory(false);
      toast.success('Analysis loaded successfully!');
    } catch (error) {
      console.error('SkillGapAnalysis: Failed to load analysis:', error);
      toast.error('Failed to load analysis. Please try again.');
    } finally {
      setSelectedAnalysisId(null);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string, analysisTitle: string) => {
    if (!confirm(`Are you sure you want to delete the analysis "${analysisTitle}"? This action cannot be undone.`)) {
      return;
    }

    console.log('SkillGapAnalysis: Deleting analysis:', analysisId);
    
    try {
      await deleteSkillAnalysis(analysisId);
      toast.success('Analysis deleted successfully!');
    } catch (error) {
      console.error('SkillGapAnalysis: Failed to delete analysis:', error);
      toast.error('Failed to delete analysis. Please try again.');
    }
  };

  const handleNewAnalysis = () => {
    clearCurrentSkillAnalysis();
    setResumeText('');
    setJobPosting('');
    setShowHistory(false);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'high': return AlertCircle;
      case 'medium': return TrendingUp;
      case 'low': return CheckCircle;
      default: return Target;
    }
  };

  const formatAnalysisTitle = (analysis: any) => {
    const date = new Date(analysis.analysisDate).toLocaleDateString();
    const time = new Date(analysis.analysisDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Analysis from ${date} at ${time}`;
  };

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Skill Gap Analysis
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Identify missing skills and get AI-powered learning recommendations to advance your career
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <History className="h-4 w-4" />
                  <span>Analysis History ({skillAnalyses.length})</span>
                </button>
                
                {(skillGaps.length > 0 || currentSkillAnalysis) && (
                  <button
                    onClick={handleNewAnalysis}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Analysis</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Analysis History */}
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Previous Analyses
                </h2>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : skillAnalyses.length > 0 ? (
                  <div className="space-y-4">
                    {skillAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {formatAnalysisTitle(analysis)}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <BarChart3 className="h-4 w-4" />
                              <span>{analysis.recommendations.length} skills analyzed</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="h-4 w-4" />
                              <span>
                                {analysis.recommendations.filter(r => !r.hasSkill && r.importance === 'high').length} high priority gaps
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(analysis.analysisDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {analysis.overallSummary && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                              {analysis.overallSummary}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleLoadAnalysis(analysis.id)}
                            disabled={selectedAnalysisId === analysis.id}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            title="View analysis"
                          >
                            {selectedAnalysisId === analysis.id ? (
                              <div className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteAnalysis(analysis.id, formatAnalysisTitle(analysis))}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                            title="Delete analysis"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No analyses yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Create your first skill gap analysis to see it here
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {skillGaps.length === 0 && !currentSkillAnalysis ? (
            /* Input Section */
            <div className="grid lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-6"
              >
                {/* Resume Input */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Your Resume
                  </h2>
                  
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume content here..."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                {/* Job Posting Input */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Target Job Posting
                  </h2>
                  
                  <textarea
                    value={jobPosting}
                    onChange={(e) => setJobPosting(e.target.value)}
                    placeholder="Paste the job posting you're targeting..."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                {/* Analyze Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !resumeText.trim() || !jobPosting.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing Skills...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5" />
                      <span>Analyze Skill Gaps</span>
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Placeholder */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Ready for Analysis
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Paste your resume and target job posting to get personalized skill gap insights and learning recommendations
                </p>
              </motion.div>
            </div>
          ) : (
            /* Results Section */
            <div className="space-y-8">
              {/* Analysis Info */}
              {currentSkillAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-400">
                      Analysis from {new Date(currentSkillAnalysis.analysisDate).toLocaleDateString()} at{' '}
                      {new Date(currentSkillAnalysis.analysisDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h3>
                  </div>
                  {currentSkillAnalysis.overallSummary && (
                    <p className="text-blue-800 dark:text-blue-300">
                      {currentSkillAnalysis.overallSummary}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Analysis Summary
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {skillGaps.filter(gap => gap.importance === 'high' && !gap.hasSkill).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Critical Skills Missing
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {skillGaps.filter(gap => gap.importance === 'medium' && !gap.hasSkill).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Important Skills Missing
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {skillGaps.filter(gap => gap.hasSkill).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Skills You Have
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Skill Gaps */}
              <div className="space-y-6">
                {skillGaps.map((gap, index) => {
                  const ImportanceIcon = getImportanceIcon(gap.importance);
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${gap.hasSkill ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                            {gap.hasSkill ? (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <ImportanceIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {gap.skill}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImportanceColor(gap.importance)}`}>
                                {gap.importance} priority
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                gap.hasSkill 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {gap.hasSkill ? 'You have this skill' : 'Skill gap identified'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{gap.recommendations.timeEstimate}</span>
                        </div>
                      </div>

                      {!gap.hasSkill && (
                        <div className="space-y-4">
                          {/* Courses */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                              <BookOpen className="h-4 w-4" />
                              <span>Recommended Courses</span>
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {gap.recommendations.courses.map((course, courseIndex) => (
                                <div
                                  key={courseIndex}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {course}
                                  </span>
                                  <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Resources */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                              <Star className="h-4 w-4" />
                              <span>Free Resources</span>
                            </h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {gap.recommendations.resources.map((resource, resourceIndex) => (
                                <div
                                  key={resourceIndex}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {resource}
                                  </span>
                                  <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                                    <Play className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={handleNewAnalysis}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Analysis</span>
                </button>
                
                <button
                  onClick={() => navigate('/resume-analyzer')}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Target className="h-5 w-5" />
                  <span>Update Resume</span>
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillGapAnalysis;