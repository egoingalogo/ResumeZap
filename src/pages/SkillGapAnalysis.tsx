Here's the fixed version with all missing closing brackets and proper whitespace added:

```typescript
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
                                    <p className="text-xs text-red-700 dark:text-red-500 mt-1">Impact: {skill.impactOnJobSuccess}</p>
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
                                    <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">Impact: {skill.impactOnJobSuccess}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-green-700 dark:text