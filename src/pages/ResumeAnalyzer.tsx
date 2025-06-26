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
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import { parseFile, validateFileType, getFileTypeDisplayName, type ParseResult } from '../lib/fileParser';
import toast from 'react-hot-toast';

/**
 * Resume analyzer component with file upload, job posting input, and AI analysis
 * Provides production-ready file parsing for PDF, DOCX, and TXT files
 * Includes comprehensive error handling and user feedback
 */
const ResumeAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUsage } = useAuthStore();
  const { analyzeResume, currentResume, currentResumeAnalysis, isAnalyzing, saveResume } = useResumeStore();
  
  const [resumeText, setResumeText] = useState('');
  const [jobPosting, setJobPosting] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'changes' | 'keywords' | 'ats'>('overview');

  console.log('ResumeAnalyzer: Component mounted');

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('ResumeAnalyzer: User not authenticated, redirecting to landing page');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle file drop with production-ready parsing for PDF, DOCX, and TXT files
   * Provides comprehensive error handling and user feedback
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    console.log('ResumeAnalyzer: File dropped:', file.name, 'Type:', file.type);
    
    if (file) {
      // Validate file type first
      const validation = validateFileType(file);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid file type');
        return;
      }
      
      setUploadedFile(file);
      setIsParsingFile(true);
      setParseResult(null);
      
      try {
        // Parse the file using the appropriate parser
        const result = await parseFile(file);
        setParseResult(result);
        
        if (result.success) {
          setResumeText(result.text);
          
          // Show success message with file details
          const fileType = getFileTypeDisplayName(file);
          const wordCount = result.metadata?.wordCount || 0;
          toast.success(
            `${fileType} file parsed successfully! Extracted ${wordCount} words.`,
            { duration: 4000 }
          );
          
          console.log('ResumeAnalyzer: File parsing completed:', {
            fileName: file.name,
            fileType,
            wordCount,
            fileSize: result.metadata?.fileSize,
          });
        } else {
          // Show error message
          toast.error(result.error || 'Failed to parse file');
          console.error('ResumeAnalyzer: File parsing failed:', result.error);
          
          // Clear the uploaded file on error
          setUploadedFile(null);
        }
      } catch (error) {
        console.error('ResumeAnalyzer: Unexpected parsing error:', error);
        toast.error('An unexpected error occurred while parsing the file');
        setUploadedFile(null);
        setParseResult(null);
      } finally {
        setIsParsingFile(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
    disabled: isParsingFile, // Disable during parsing
  });

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast.error('Please upload a resume or paste your resume text');
      return;
    }

    if (!jobPosting.trim()) {
      toast.error('Please paste the job posting');
      return;
    }

    console.log('ResumeAnalyzer: Starting analysis');
    updateUsage('resumeTailoring');
    
    try {
      await analyzeResume(resumeText, jobPosting);
      toast.success('Resume analyzed successfully!');
    } catch (error) {
      console.error('ResumeAnalyzer: Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    }
  };

  const handleSaveResume = () => {
    if (currentResume) {
      console.log('ResumeAnalyzer: Saving resume');
      saveResume(currentResume);
      toast.success('Resume saved to your library!');
    }
  };

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    if (!currentResume) return;
    
    console.log('ResumeAnalyzer: Exporting as:', format);
    // Simulate export - in production, implement actual export functionality
    toast.success(`Resume exported as ${format.toUpperCase()}!`);
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
                    isParsingFile
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 cursor-not-allowed'
                      : isDragActive
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                  }`}
                >
                  <input {...getInputProps()} disabled={isParsingFile} />
                  <div className="space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      isParsingFile 
                        ? 'bg-purple-100 dark:bg-purple-900' 
                        : uploadedFile && parseResult?.success
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-purple-100 dark:bg-purple-900'
                    }`}>
                      {isParsingFile ? (
                        <Loader2 className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-spin" />
                      ) : uploadedFile && parseResult?.success ? (
                        <FileCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                      ) : (
                        <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {isParsingFile 
                          ? `Parsing ${uploadedFile?.name}...`
                          : uploadedFile && parseResult?.success
                          ? `✓ ${uploadedFile.name}`
                          : uploadedFile && !parseResult?.success
                          ? `✗ ${uploadedFile.name}`
                          : 'Drop your resume here'
                        }
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isParsingFile 
                          ? 'Extracting text content...'
                          : 'Supports PDF, DOCX, and TXT files (max 10MB)'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* File parsing result info */}
                {parseResult && uploadedFile && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    parseResult.success 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {parseResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        {parseResult.success ? (
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-400">
                              File parsed successfully
                            </p>
                            {parseResult.metadata && (
                              <div className="mt-2 text-xs text-green-700 dark:text-green-500 space-y-1">
                                <div className="flex items-center space-x-4">
                                  <span>Type: {parseResult.metadata.fileType}</span>
                                  <span>Words: {parseResult.metadata.wordCount?.toLocaleString()}</span>
                                  <span>Size: {(parseResult.metadata.fileSize / 1024).toFixed(1)}KB</span>
                                  {parseResult.metadata.pageCount && (
                                    <span>Pages: {parseResult.metadata.pageCount}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-400">
                              Parsing failed
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                              {parseResult.error}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or paste your resume text
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume content here..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                  {resumeText && (
                    <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <Info className="h-3 w-3" />
                      <span>{resumeText.split(/\s+/).length} words</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Posting */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Job Posting
                </h2>
                
                <textarea
                  value={jobPosting}
                  onChange={(e) => setJobPosting(e.target.value)}
                  placeholder="Paste the complete job posting here, including requirements, responsibilities, and qualifications..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Analyze Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={isAnalyzing || isParsingFile || !resumeText.trim() || !jobPosting.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isAnalyzing || isParsingFile ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isParsingFile ? 'Parsing File...' : 'Analyzing with AI...'}</span>
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
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleExport('docx')}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>DOCX</span>
                      </button>
                      <button
                        onClick={() => handleExport('txt')}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>TXT</span>
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
                    Upload your resume and paste a job posting to get started with AI-powered optimization
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