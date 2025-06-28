import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Zap, 
  Download, 
  Eye, 
  Copy,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Target,
  BarChart3,
  Search,
  Lightbulb,
  ArrowRight,
  Plus,
  Minus,
  Loader2,
  FileCheck,
  Info
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { RichTextEditor } from '../components/RichTextEditor';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import { exportResume } from '../lib/exportUtils';
import toast from 'react-hot-toast';

/**
 * Resume analyzer component with file upload and AI analysis
 * Files are sent directly to Claude AI for processing
 * Supports PDF, DOCX, and TXT files with comprehensive error handling
 */
const ResumeAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUsage } = useAuthStore();
  const { analyzeResume, currentResume, currentResumeAnalysis, isAnalyzing, saveResume } = useResumeStore();
  
  const [jobPosting, setJobPosting] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null); // Track which format is being exported
  const [activeTab, setActiveTab] = useState<'overview' | 'changes' | 'keywords' | 'ats'>('overview');

  console.log('ResumeAnalyzer: Component mounted');

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('ResumeAnalyzer: User not authenticated, redirecting to landing page');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle file drop for direct Claude AI processing
   * Validates file type and size before storing for AI analysis
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    console.log('ResumeAnalyzer: PDF file dropped:', file.name, 'Type:', file.type);
    
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
      const fileType = 'PDF';
      
      toast.success(
        `PDF file uploaded successfully! Ready for AI analysis.`,
        { duration: 4000 }
      );
      
      console.log('ResumeAnalyzer: File uploaded successfully:', {
        fileName: file.name,
        fileType,
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
    if (!uploadedFile) {
      toast.error('Please upload a resume file');
      return;
    }

    if (!jobPosting.trim()) {
      toast.error('Please paste the job posting');
      return;
    }

    console.log('ResumeAnalyzer: Starting analysis');
    console.log('ResumeAnalyzer: Analysis parameters:', {
      hasUploadedFile: !!uploadedFile,
      hasJobPosting: !!jobPosting.trim(),
      uploadedFileName: uploadedFile?.name,
      uploadedFileType: uploadedFile?.type,
      uploadedFileSize: uploadedFile?.size
    });
    
    updateUsage('resumeTailoring');
    
    try {
      // Pass the uploaded file to the AI service if available
      const result = await analyzeResume('', jobPosting, uploadedFile);
      console.log('ResumeAnalyzer: Analysis completed successfully:', {
        hasResult: !!result,
        matchScore: result?.matchScore,
        hasTailoredResume: !!result?.tailoredResume
      });
      toast.success('Resume analyzed successfully!');
    } catch (error) {
      console.error('ResumeAnalyzer: Analysis failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Analysis failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('AI service')) {
          errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('Invalid response')) {
          errorMessage = 'Received invalid response from AI service. Please try again.';
        } else {
          errorMessage = `Analysis failed: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleSaveResume = () => {
    if (currentResume) {
      console.log('ResumeAnalyzer: Saving resume');
      saveResume(currentResume);
      toast.success('Resume saved to your library!');
    }
  };

  /**
   * Handle resume export with production-ready functionality
   * Supports PDF, DOCX, and TXT formats with proper error handling
   */
  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!currentResumeAnalysis?.tailoredResume) {
      toast.error('No resume content to export');
      return;
    }
    
    console.log('ResumeAnalyzer: Starting export as:', format.toUpperCase());
    setIsExporting(format);
    
    try {
      // Generate filename with original file name if available
      const originalFileName = uploadedFile ? 
        uploadedFile.name.replace(/\.[^/.]+$/, '') : // Remove extension
        'resume';
      const exportFileName = `optimized_resume_${originalFileName}`;
      
      const result = await exportResume(
        currentResumeAnalysis.tailoredResume,
        format,
        exportFileName
      );
      
      if (result.success) {
        toast.success(`Resume exported as ${format.toUpperCase()}! File: ${result.fileName}`, {
          duration: 5000,
        });
        console.log('ResumeAnalyzer: Export completed successfully:', result.fileName);
      } else {
        toast.error(result.error || `Failed to export ${format.toUpperCase()}`);
        console.error('ResumeAnalyzer: Export failed:', result.error);
      }
    } catch (error) {
      console.error('ResumeAnalyzer: Unexpected export error:', error);
      toast.error(`An unexpected error occurred during ${format.toUpperCase()} export`);
    } finally {
      setIsExporting(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Resume Analyzer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload your resume and job posting to get AI-powered optimization recommendations
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
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

              {/* Job Posting */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Target Job Posting
                </h2>
                
                <RichTextEditor
                  value={jobPosting}
                  onChange={setJobPosting}
                  placeholder="Paste the complete job posting here. Copy directly from job boards, company websites, or emails to preserve all formatting and structure..."
                  rows={12}
                  label=""
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
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Analyze Resume</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {currentResume && currentResumeAnalysis ? (
                <>
                  {/* Match Score Overview */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Match Score
                      </h2>
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-600">
                          {currentResumeAnalysis.matchScore}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                      <div 
                        className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
                        style={{ width: `${currentResumeAnalysis.matchScore}%` }}
                      />
                    </div>
                    
                    {/* Match Breakdown */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center">
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getScoreColor(currentResumeAnalysis.matchBreakdown.keywords)}`}>
                          {currentResumeAnalysis.matchBreakdown.keywords}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Keywords</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getScoreColor(currentResumeAnalysis.matchBreakdown.skills)}`}>
                          {currentResumeAnalysis.matchBreakdown.skills}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Skills</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getScoreColor(currentResumeAnalysis.matchBreakdown.experience)}`}>
                          {currentResumeAnalysis.matchBreakdown.experience}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Experience</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold px-2 py-1 rounded ${getScoreColor(currentResumeAnalysis.matchBreakdown.formatting)}`}>
                          {currentResumeAnalysis.matchBreakdown.formatting}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">ATS Format</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      {currentResumeAnalysis.matchScore >= 80 ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Excellent match! Your resume aligns well with the job requirements.</span>
                        </>
                      ) : currentResumeAnalysis.matchScore >= 60 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-yellow-500" />
                          <span>Good match with room for improvement.</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>Low match. Consider significant revisions.</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Analysis Tabs */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <nav className="flex space-x-8 px-6">
                        {[
                          { id: 'overview', label: 'Overview', icon: BarChart3 },
                          { id: 'changes', label: 'Changes', icon: ArrowRight },
                          { id: 'keywords', label: 'Keywords', icon: Search },
                          { id: 'ats', label: 'ATS Tips', icon: Lightbulb },
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
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Optimized Resume
                          </h3>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                              {currentResumeAnalysis.tailoredResume}
                            </pre>
                          </div>
                        </div>
                      )}

                      {activeTab === 'changes' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            AI Improvements Made
                          </h3>
                          <div className="space-y-4">
                            {currentResumeAnalysis.changes.map((change, index) => (
                              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 px-2 py-1 rounded text-sm font-medium">
                                    {change.section}
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Minus className="h-4 w-4 text-red-500" />
                                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Original</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                      {change.original}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Plus className="h-4 w-4 text-green-500" />
                                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Improved</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                      {change.improved}
                                    </p>
                                  </div>
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                    <p className="text-sm text-blue-800 dark:text-blue-400">
                                      <strong>Why:</strong> {change.reason}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'keywords' && (
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Keyword Analysis
                          </h3>
                          
                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="font-medium text-green-700 dark:text-green-400 mb-3 flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Found Keywords</span>
                              </h4>
                              <div className="space-y-2">
                                {currentResumeAnalysis.keywordMatches.found.map((keyword, index) => (
                                  <span key={index} className="inline-block bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-1 rounded text-sm mr-2 mb-2">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-red-700 dark:text-red-400 mb-3 flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>Missing Keywords</span>
                              </h4>
                              <div className="space-y-2">
                                {currentResumeAnalysis.keywordMatches.missing.map((keyword, index) => (
                                  <span key={index} className="inline-block bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 px-2 py-1 rounded text-sm mr-2 mb-2">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-3 flex items-center space-x-2">
                                <Lightbulb className="h-4 w-4" />
                                <span>Suggestions</span>
                              </h4>
                              <div className="space-y-2">
                                {currentResumeAnalysis.keywordMatches.suggestions.map((suggestion, index) => (
                                  <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm text-blue-800 dark:text-blue-400">
                                    {suggestion}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'ats' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            ATS Optimization Tips
                          </h3>
                          <div className="space-y-3">
                            {currentResumeAnalysis.atsOptimizations.map((tip, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-green-800 dark:text-green-400">
                                  {tip}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      onClick={() => copyToClipboard(currentResumeAnalysis.tailoredResume)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Copy className="h-5 w-5" />
                      <span>Copy Optimized Resume</span>
                    </button>
                    
                    <button
                      onClick={handleSaveResume}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <FileText className="h-5 w-5" />
                      <span>Save to Library</span>
                    </button>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting !== null}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExporting === 'pdf' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>{isExporting === 'pdf' ? 'Exporting...' : 'PDF'}</span>
                      </button>
                      <button
                        onClick={() => handleExport('docx')}
                        disabled={isExporting !== null}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExporting === 'docx' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>{isExporting === 'docx' ? 'Exporting...' : 'RTF'}</span>
                      </button>
                      <button
                        onClick={() => handleExport('txt')}
                        disabled={isExporting !== null}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExporting === 'txt' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>{isExporting === 'txt' ? 'Exporting...' : 'TXT'}</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Placeholder */
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Ready for Analysis
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Upload your resume file or paste text content, then add a job posting to get started with AI-powered optimization
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;