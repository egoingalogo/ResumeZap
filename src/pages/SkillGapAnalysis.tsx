import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
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
  BarChart3,
  Award,
  DollarSign,
  Users,
  Zap,
  ArrowRight,
  MapPin,
  Upload,
  FileCheck
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { RichTextEditor } from '../components/RichTextEditor';
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
  const { user, isAuthenticated, updateUsage } = useAuthStore();
  const { 
    analyzeSkillGaps, 
    skillGaps, 
    skillAnalyses,
    currentSkillAnalysis,
    currentSkillGapAnalysis,
    isAnalyzing,
    isLoading,
    fetchSkillAnalyses,
    loadSkillAnalysis,
    deleteSkillAnalysis,
    clearCurrentSkillAnalysis
  } = useResumeStore();
  
  const [jobPosting, setJobPosting] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'recommendations'>('overview');

  console.log('SkillGapAnalysis: Component mounted');

  // Cleanup function to reset state when navigating away
  useEffect(() => {
    return () => {
      console.log('SkillGapAnalysis: Component unmounting, clearing analysis data');
      
      // Check if there's any loaded analysis data to clear
      const currentState = useResumeStore.getState();
      if (currentState.currentSkillAnalysis || currentState.currentSkillGapAnalysis || currentState.skillGaps.length > 0) {
        // Clear all skill analysis related state
        useResumeStore.setState({
          currentSkillAnalysis: null,
          currentSkillGapAnalysis: null,
          skillGaps: [],
        });
        
        console.log('SkillGapAnalysis: Cleared loaded analysis data on unmount');
      }
    };
  }, []);

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

  /**
   * Handle file drop for direct Claude AI processing
   * Validates file type and size before storing for AI analysis
   */
  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    console.log('SkillGapAnalysis: PDF file dropped:', file.name, 'Type:', file.type);
    
    if (file) {
      // Validate PDF file type only
      const allowedTypes = [
        'application/pdf',
      ];
      
      const allowedExtensions = ['.pdf'];
      const fileName = file.name.toLowerCase();
      
      const hasValidType = allowedTypes.includes(file.type.toLowerCase());
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidType && !hasValidExtension) {
        toast.error('Please upload a PDF file only.');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('File size exceeds 10MB limit. Please use a smaller file.');
        return;
      }
      
      // Validate file size (min 1KB to avoid empty files)
      if (file.size < 1024) {
        toast.error('File is too small. Please ensure your file contains resume content.');
        return;
      }
      
      setUploadedFile(file);
      
      // Show success message
      toast.success(
        `PDF file uploaded successfully! Ready for skill gap analysis.`,
        { duration: 4000 }
      );
      
      console.log('SkillGapAnalysis: File uploaded successfully:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)}KB`,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  const handleAnalyze = async () => {
    console.log('SkillGapAnalysis: Starting analysis with uploadedFile:', uploadedFile ? uploadedFile.name : 'null');
    console.log('SkillGapAnalysis: Job posting length:', jobPosting.trim().length);
    
    // Update usage count
    updateUsage('skillGapAnalysis');
    
    // Validate PDF file upload first
    if (!uploadedFile) {
      toast.error('Please upload your resume as a PDF file before analyzing skill gaps');
      return;
    }

    if (!jobPosting.trim()) {
      toast.error('Please paste the job posting');
      return;
    }

    console.log('SkillGapAnalysis: Starting new analysis');
    
    try {
      console.log('SkillGapAnalysis: Calling analyzeSkillGaps with file:', uploadedFile.name);
      await analyzeSkillGaps('', jobPosting, uploadedFile, undefined);
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
    setUploadedFile(null);
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'important': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'nice-to-have': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
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
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors duration-200"
                >
                  <History className="h-4 w-4" />
                  <span>Analysis History ({skillAnalyses.length})</span>
                </button>
                
                {(skillGaps.length > 0 || currentSkillAnalysis || currentSkillGapAnalysis) && (
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

          {skillGaps.length === 0 && !currentSkillAnalysis && !currentSkillGapAnalysis ? (
            /* Input Section */
            <div className="flex flex-col gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-6"
              >
                {/* Resume Upload */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Upload Resume
                  </h2>
                  
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragActive
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                        uploadedFile
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-purple-100 dark:bg-purple-900'
                      }`}>
                        {uploadedFile ? (
                          <FileCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                        ) : (
                          <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {uploadedFile 
                            ? `✓ ${uploadedFile.name}`
                            : 'Drop your PDF resume here'
                          }
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Supports PDF files only (max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* File upload success info */}
                  {uploadedFile && (
                    <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800 dark:text-green-400">
                            File ready for AI analysis
                          </p>
                          <div className="mt-2 text-xs text-green-700 dark:text-green-500 space-y-1">
                            <div className="flex items-center space-x-4">
                              <span>Size: {(uploadedFile.size / 1024).toFixed(1)}KB</span>
                              <span>Type: PDF</span>
                            </div>
                            <p className="text-xs">AI will process this file directly for optimal accuracy.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Posting Input */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Target Job Posting
                  </h2>
                  
                  <RichTextEditor
                    value={jobPosting}
                    onChange={setJobPosting}
                    placeholder="Paste the job posting you're targeting. Include all requirements, qualifications, and responsibilities for comprehensive analysis..."
                    rows={12}
                    showWordCount={true}
                  />
                </div>

                {/* Analyze Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !uploadedFile || !jobPosting.trim()}
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

              {/* Enhanced Analysis Results */}
              {currentSkillGapAnalysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
                >
                  {/* Tabs */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'roadmap', label: 'Learning Roadmap', icon: MapPin },
                        { id: 'recommendations', label: 'Detailed Recommendations', icon: BookOpen },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === tab.id
                              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          <tab.icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Skills Already Strong */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span>Skills You Already Have</span>
                          </h3>
                          <div className="grid md:grid-cols-2 gap-3">
                            {currentSkillGapAnalysis.skillsAlreadyStrong.map((skill, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <span className="text-sm text-green-800 dark:text-green-400">{skill}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Development Summary */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Development Overview</h3>
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {currentSkillGapAnalysis.totalDevelopmentTime && (
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Total Time Needed
                                </h4>
                                <p className="text-purple-600 dark:text-purple-400 font-semibold">
                                  {currentSkillGapAnalysis.totalDevelopmentTime}
                                </p>
                              </div>
                            )}
                            
                            {currentSkillGapAnalysis.budgetEstimate && (
                              <>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Minimum Budget
                                  </h4>
                                  <p className="text-green-600 dark:text-green-400 font-semibold">
                                    {currentSkillGapAnalysis.budgetEstimate.minimum}
                                  </p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Recommended Budget
                                  </h4>
                                  <p className="text-blue-600 dark:text-blue-400 font-semibold">
                                    {currentSkillGapAnalysis.budgetEstimate.recommended}
                                  </p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Premium Budget
                                  </h4>
                                  <p className="text-purple-600 dark:text-purple-400 font-semibold">
                                    {currentSkillGapAnalysis.budgetEstimate.premium}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Next Steps */}
                        {currentSkillGapAnalysis.nextSteps && currentSkillGapAnalysis.nextSteps.length > 0 && (
                          <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Next Steps</h3>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <div className="space-y-3">
                                {currentSkillGapAnalysis.nextSteps.map((step, index) => (
                                  <div key={index} className="flex items-start space-x-3">
                                    <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-sm font-semibold text-purple-800 dark:text-purple-400">{index + 1}</span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">{step}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Skill Gaps by Priority */}
                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-medium text-red-700 dark:text-red-400 mb-3 flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4" />
                              <span>Critical Skills ({currentSkillGapAnalysis.skillGapAnalysis.critical.length})</span>
                            </h4>
                            <div className="space-y-2">
                              {currentSkillGapAnalysis.skillGapAnalysis.critical.map((skill, index) => (
                                <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                  <h5 className="font-medium text-red-800 dark:text-red-400">{skill.skill}</h5>
                                  <p className="text-xs text-red-600 dark:text-red-500 mt-1">{skill.gap}</p>
                                  {skill.impactOnJobSuccess && (
                                    <p className="text-xs text-red-700 dark:text-red-400 mt-2 bg-red-100 dark:bg-red-900/30 p-1.5 rounded">
                                      <strong>Impact:</strong> {skill.impactOnJobSuccess}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-3 flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4" />
                              <span>Important Skills ({currentSkillGapAnalysis.skillGapAnalysis.important.length})</span>
                            </h4>
                            <div className="space-y-2">
                              {currentSkillGapAnalysis.skillGapAnalysis.important.map((skill, index) => (
                                <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                  <h5 className="font-medium text-yellow-800 dark:text-yellow-400">{skill.skill}</h5>
                                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">{skill.gap}</p>
                                  {skill.impactOnJobSuccess && (
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded">
                                      <strong>Impact:</strong> {skill.impactOnJobSuccess}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-green-700 dark:text-green-400 mb-3 flex items-center space-x-2">
                              <Star className="h-4 w-4" />
                              <span>Nice-to-Have ({currentSkillGapAnalysis.skillGapAnalysis.niceToHave.length})</span>
                            </h4>
                            <div className="space-y-2">
                              {currentSkillGapAnalysis.skillGapAnalysis.niceToHave.map((skill, index) => (
                                <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <h5 className="font-medium text-green-800 dark:text-green-400">{skill.skill}</h5>
                                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">{skill.gap}</p>
                                  {skill.impactOnJobSuccess && (
                                    <p className="text-xs text-green-700 dark:text-green-400 mt-2 bg-green-100 dark:bg-green-900/30 p-1.5 rounded">
                                      <strong>Impact:</strong> {skill.impactOnJobSuccess}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'roadmap' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Your Learning Roadmap
                          {currentSkillGapAnalysis.totalDevelopmentTime && (
                            <span className="ml-2 text-sm font-normal text-purple-600 dark:text-purple-400">
                              {currentSkillGapAnalysis.totalDevelopmentTime}
                            </span>
                          )}
                        </h3>
                        
                        <div className="space-y-6">
                          {Object.entries(currentSkillGapAnalysis.developmentRoadmap).map(([phase, details], index) => (
                            <div key={phase} className="relative">
                              {index < Object.keys(currentSkillGapAnalysis.developmentRoadmap).length - 1 && (
                                <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-200 dark:bg-gray-600"></div>
                              )}
                              
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {index + 1}
                                </div>
                                
                                <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                      {phase.replace(/([A-Z])/g, ' $1').trim()}
                                    </h4>
                                    <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                                      {details.duration}
                                    </span>
                                  </div>
                                  
                                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    <strong>Focus:</strong> {details.focus}
                                  </p>
                                  
                                  <div>
                                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Milestones:</h5>
                                    <ul className="space-y-2">
                                      {details.milestones.map((milestone, milestoneIndex) => (
                                        <li key={milestoneIndex} className="flex items-start space-x-2">
                                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                          <span className="text-sm text-gray-600 dark:text-gray-400">{milestone}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Budget Estimate */}
                          {currentSkillGapAnalysis.budgetEstimate && (
                            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                              <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-3">Budget Estimate</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Minimum</div>
                                  <div className="font-medium text-blue-900 dark:text-blue-100">
                                    {currentSkillGapAnalysis.budgetEstimate.minimum}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Recommended</div>
                                  <div className="font-medium text-blue-900 dark:text-blue-100">
                                    {currentSkillGapAnalysis.budgetEstimate.recommended}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Premium</div>
                                  <div className="font-medium text-blue-900 dark:text-blue-100">
                                    {currentSkillGapAnalysis.budgetEstimate.premium}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Next Steps */}
                          {currentSkillGapAnalysis.nextSteps && currentSkillGapAnalysis.nextSteps.length > 0 && (
                            <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
                              <h4 className="font-semibold text-green-900 dark:text-green-400 mb-3">Next Steps</h4>
                              <ul className="space-y-2">
                                {currentSkillGapAnalysis.nextSteps.map((step, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs mt-0.5">
                                      {index + 1}
                                    </div>
                                    <span className="text-sm text-green-800 dark:text-green-300">{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'recommendations' && (
                      <div className="space-y-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Detailed Learning Recommendations
                        </h3>
                        
                        {currentSkillGapAnalysis.learningRecommendations.map((recommendation, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                                  {recommendation.skill}
                                </h4>
                                <div className="flex items-center space-x-3 mt-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                                    {recommendation.priority}
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{recommendation.timeInvestment}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Courses */}
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                                  <BookOpen className="h-4 w-4" />
                                  <span>Recommended Courses</span>
                                </h5>
                                <div className="space-y-3">
                                  {recommendation.courses.map((course, courseIndex) => (
                                    <div key={courseIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <h6 className="font-medium text-gray-900 dark:text-white">{course.courseName}</h6>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                                          {course.difficulty}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center space-x-1">
                                          <Users className="h-3 w-3" />
                                          <span>{course.platform}</span>
                                        </span>
                                        {course.instructor && (
                                          <span className="flex items-center space-x-1">
                                            <Users className="h-3 w-3" />
                                            <span>{course.instructor}</span>
                                          </span>
                                        )}
                                        <span className="flex items-center space-x-1">
                                          <Clock className="h-3 w-3" />
                                          <span>{course.duration}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                          <DollarSign className="h-3 w-3" />
                                          <span>{course.cost}</span>
                                        </span>
                                        {course.rating && (
                                          <span className="flex items-center space-x-1">
                                            <Star className="h-3 w-3" />
                                            <span>{course.rating}</span>
                                          </span>
                                        )}
                                      </div>
                                      {course.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 border-t border-gray-100 dark:border-gray-600 pt-2">
                                          {course.description}
                                        </p>
                                      )}
                                      {course.url && (
                                        <div className="mt-2">
                                          <a
                                            href={course.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm hover:underline"
                                          >
                                            View Course <ExternalLink className="h-3 w-3 ml-1" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Free Resources */}
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                                  <Star className="h-4 w-4" />
                                  <span>Free Resources</span>
                                </h5>
                                <div className="space-y-3">
                                  {recommendation.freeResources.map((resource, resourceIndex) => (
                                    <div key={resourceIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <h6 className="font-medium text-gray-900 dark:text-white">{resource.resource}</h6>
                                        <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-1 rounded text-xs font-medium">
                                          {resource.type}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {resource.description}
                                      </p>
                                      {resource.estimatedTime && (
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span>{resource.estimatedTime}</span>
                                        </div>
                                      )}
                                      {resource.url && (
                                        <div className="mt-2">
                                          <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm hover:underline"
                                          >
                                            Access Resource <ExternalLink className="h-3 w-3 ml-1" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Certifications */}
                            {recommendation.certifications.length > 0 && (
                              <div className="mt-6">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                                  <Award className="h-4 w-4" />
                                  <span>Relevant Certifications</span>
                                </h5>
                                <div className="grid md:grid-cols-2 gap-3">
                                  {recommendation.certifications.map((cert, certIndex) => (
                                    <div key={certIndex} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                      <h6 className="font-medium text-blue-900 dark:text-blue-400">{cert.name}</h6>
                                      <div className="flex items-center space-x-4 mt-2 text-sm text-blue-700 dark:text-blue-500">
                                        <span>{cert.provider}</span>
                                        <span>{cert.timeToComplete}</span>
                                        <span className="flex items-center">
                                          <DollarSign className="h-3 w-3 mr-1" />
                                          {cert.cost}
                                        </span>
                                        {cert.validity && <span>{cert.validity}</span>}
                                      </div>
                                      {cert.industryRecognition && (
                                        <div className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded text-blue-800 dark:text-blue-300">
                                          {cert.industryRecognition}
                                        </div>
                                      )}
                                      {cert.url && (
                                        <div className="mt-2">
                                          <a
                                            href={cert.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-600 dark:text-blue-400 text-sm hover:underline"
                                          >
                                            View Certification <ExternalLink className="h-3 w-3 ml-1" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Practical Application */}
                            <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                              <h5 className="font-medium text-purple-900 dark:text-purple-400 mb-2 flex items-center space-x-2">
                                <Zap className="h-4 w-4" />
                                <span>Practical Application{recommendation.timeInvestment ? ` (${recommendation.timeInvestment})` : ''}</span>
                              </h5>
                              <p className="text-sm text-purple-800 dark:text-purple-300">
                                {recommendation.practicalApplication}
                              </p>
                              
                              {/* Books section */}
                              {recommendation.books && recommendation.books.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                                  <h6 className="text-sm font-medium text-purple-900 dark:text-purple-400 mb-2">
                                    Recommended Books:
                                  </h6>
                                  <ul className="space-y-2">
                                    {recommendation.books.map((book, idx) => (
                                      <li key={idx} className="text-sm text-purple-800 dark:text-purple-300">
                                        "{book.title}" by {book.author}
                                        {book.amazonUrl && (
                                          <a
                                            href={book.amazonUrl}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="ml-2 inline-flex items-center text-blue-600 dark:text-blue-400 text-xs hover:underline"
                                          >
                                            View <ExternalLink className="h-2 w-2 ml-0.5" />
                                          </a>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            {/* Books section */}
                            {recommendation.books && recommendation.books.length > 0 && (
                              <div className="mt-6">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                                  <BookOpen className="h-4 w-4" />
                                  <span>Recommended Books</span>
                                </h5>
                                <div className="space-y-3">
                                  {recommendation.books.map((book, bookIndex) => (
                                    <div key={bookIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                                      <h6 className="font-medium text-gray-900 dark:text-white">{book.title}</h6>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">by {book.author}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{book.description}</p>
                                      {book.amazonUrl && (
                                        <a 
                                          href={book.amazonUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline"
                                        >
                                          View on Amazon <ExternalLink className="h-3 w-3 ml-1" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* Legacy Summary for backward compatibility */
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
              )}

              {/* Skill Gaps Display */}
              {!currentSkillGapAnalysis && skillGaps.length > 0 && (
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
              )}

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