import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Target, 
  BookOpen, 
  Clock, 
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Play
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import { LiveChatButton } from '../components/LiveChatButton';
import toast from 'react-hot-toast';

/**
 * Skill gap analysis component with AI-powered recommendations and learning paths
 * Provides detailed skill assessment and personalized learning resources
 */
const SkillGapAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { analyzeSkillGaps, skillGaps, isAnalyzing } = useResumeStore();
  
  const [resumeText, setResumeText] = useState('');
  const [jobPosting, setJobPosting] = useState('');

  console.log('SkillGapAnalysis: Component mounted');

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('SkillGapAnalysis: User not authenticated, redirecting');
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste your resume content');
      return;
    }

    if (!jobPosting.trim()) {
      toast.error('Please paste the job posting');
      return;
    }

    console.log('SkillGapAnalysis: Starting analysis');
    
    try {
      await analyzeSkillGaps(resumeText, jobPosting);
      toast.success('Skill gap analysis completed!');
    } catch (error) {
      console.error('SkillGapAnalysis: Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    }
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
      case 'high': return AlertTriangle;
      case 'medium': return TrendingUp;
      case 'low': return CheckCircle;
      default: return Target;
    }
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
      
      {/* Live Chat Button for Pro & Lifetime users */}
      <LiveChatButton />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Skill Gap Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Identify missing skills and get AI-powered learning recommendations to advance your career
            </p>
          </motion.div>

          {skillGaps.length === 0 ? (
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
                  onClick={() => {
                    setResumeText('');
                    setJobPosting('');
                    // Clear skill gaps - you'd implement this in the store
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Brain className="h-5 w-5" />
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