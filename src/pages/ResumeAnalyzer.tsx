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
  Target
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import { LiveChatButton } from '../components/LiveChatButton';
import toast from 'react-hot-toast';

/**
 * Resume analyzer component with file upload, job posting input, and AI analysis
 * Provides side-by-side comparison and match scoring functionality
 */
const ResumeAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUsage } = useAuthStore();
  const { analyzeResume, currentResume, isAnalyzing, saveResume } = useResumeStore();
  
  const [resumeText, setResumeText] = useState('');
  const [jobPosting, setJobPosting] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  console.log('ResumeAnalyzer: Component mounted');

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('ResumeAnalyzer: User not authenticated, redirecting');
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    console.log('ResumeAnalyzer: File uploaded:', file.name);
    
    if (file) {
      setUploadedFile(file);
      
      // Simulate file reading - in production, use proper PDF/DOCX parsing
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setResumeText(text || `[Resume content from ${file.name}]\n\nJohn Doe\nSoftware Engineer\n\nExperience:\n- 3 years of React development\n- Built 5+ web applications\n- Team collaboration and agile methodologies\n\nSkills:\n- JavaScript, React, Node.js\n- HTML, CSS, SQL\n- Git, Docker`);
        toast.success('Resume uploaded successfully!');
      };
      reader.readAsText(file);
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
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {uploadedFile ? uploadedFile.name : 'Drop your resume here'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Supports PDF, DOCX, and TXT files
                      </p>
                    </div>
                  </div>
                </div>

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
                disabled={isAnalyzing || !resumeText.trim() || !jobPosting.trim()}
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
              {currentResume ? (
                <>
                  {/* Match Score */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Match Score
                      </h2>
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-600">
                          {currentResume.matchScore}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                      <div 
                        className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
                        style={{ width: `${currentResume.matchScore}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      {currentResume.matchScore >= 80 ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Excellent match! Your resume aligns well with the job requirements.</span>
                        </>
                      ) : currentResume.matchScore >= 60 ? (
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

                  {/* Optimized Resume */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        AI-Optimized Resume
                      </h2>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(currentResume.content)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            // Toggle preview - simplified for this example
                            toast.info('Preview functionality would open in a modal');
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono">
                        {currentResume.content}
                      </pre>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
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