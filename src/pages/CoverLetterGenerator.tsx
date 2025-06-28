import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  Mail, 
  Zap, 
  Copy, 
  Download, 
  RefreshCw,
  MessageSquare,
  Briefcase,
  Heart,
  Clock,
  CheckCircle,
  Target,
  Lightbulb,
  ArrowRight,
  FileText,
  Upload,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { RichTextEditor } from '../components/RichTextEditor';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import toast from 'react-hot-toast';
import type { CoverLetter } from '../lib/coverLetters';

/**
 * Cover letter generator component with tone selection and AI-powered personalization
 * Provides multiple templates and real-time preview functionality
 */
const CoverLetterGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUsage } = useAuthStore();
  const { generateCoverLetter, currentCoverLetter, isAnalyzing, saveCoverLetter } = useResumeStore();
  
  // Use drop state for file upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    hiringManager: '',
    jobDescription: '',
    tone: 'professional' as 'professional' | 'enthusiastic' | 'concise',
  });
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'letter' | 'customizations' | 'strengths'>('letter');

  console.log('CoverLetterGenerator: Component mounted');

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('CoverLetterGenerator: User not authenticated, redirecting to landing page');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  /**
   * Handle file drop for direct Claude AI processing
   * Validates file type and size before storing for AI analysis
   */
  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    console.log('CoverLetterGenerator: PDF file dropped:', file.name, 'Type:', file.type);
    
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
        `PDF file uploaded successfully! Ready for cover letter generation.`,
        { duration: 4000 }
      );
      
      console.log('CoverLetterGenerator: File uploaded successfully:', {
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

  /**
   * Handle file drop for direct Claude AI processing
   * Validates file type and size before storing for AI analysis
   */
  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    console.log('CoverLetterGenerator: PDF file dropped:', file.name, 'Type:', file.type);
    
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
        `PDF file uploaded successfully! Ready for cover letter generation.`,
        { duration: 4000 }
      );
      
      console.log('CoverLetterGenerator: File uploaded successfully:', {
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

  const tones = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'Formal and business-appropriate tone',
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'enthusiastic',
      name: 'Enthusiastic',
      description: 'Energetic and passionate tone',
      icon: Heart,
      color: 'from-red-500 to-pink-600',
    },
    {
      id: 'concise',
      name: 'Concise',
      description: 'Brief and to-the-point tone',
      icon: Clock,
      color: 'from-green-500 to-green-600',
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handle cover letter generation with file upload support
   */
  const handleGenerateCoverLetter = async () => {
    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast.error('Please fill in company name, job title, and job description');
      return;
    }
    
    if (!uploadedFile) {
      toast.error('Please upload your resume as a PDF file');
      return;
    }
    
    if (!uploadedFile) {
      toast.error('Please upload your resume as a PDF file');
      return;
    }
    
    console.log('CoverLetterGenerator: Starting generation with tone:', formData.tone);
    updateUsage('coverLetters');

    try {
      await generateCoverLetter(
        '',  // Empty string for resumeContent (no longer used)
        formData.jobDescription,
        formData.companyName,
        formData.jobTitle,
        formData.tone,
        uploadedFile  // Pass the uploaded file to the function
        uploadedFile
      );
      toast.success('Cover letter generated successfully!');
      
    } catch (error) {
      console.error('CoverLetterGenerator: Generation failed:', error);
      toast.error('Generation failed. Please try again.');
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!currentCoverLetter) {
      toast.error('No cover letter to save');
      return;
    }

    if (!formData.companyName || !formData.jobTitle) {
      toast.error('Company name and job title are required to save');
      return;
    }

    console.log('CoverLetterGenerator: Saving cover letter');

    try {
      const coverLetterData: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'> = {
        title: `Cover Letter - ${formData.companyName} - ${formData.jobTitle}`,
        content: currentCoverLetter.coverLetter,
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        tone: formData.tone,
        jobPosting: formData.jobDescription,
        resumeContentSnapshot: uploadedFile ? uploadedFile.name : '',
        customizations: currentCoverLetter.customizations || [],
        keyStrengths: currentCoverLetter.keyStrengths || [],
        callToAction: currentCoverLetter.callToAction,
      };

      await saveCoverLetter(coverLetterData);
      toast.success('Cover letter saved to your library!');
    } catch (error) {
      console.error('CoverLetterGenerator: Failed to save cover letter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save cover letter';
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = () => {
    if (currentCoverLetter) {
      navigator.clipboard.writeText(currentCoverLetter.coverLetter);
    }
    toast.success('Cover letter copied to clipboard!');
  };

  const downloadLetter = () => {
    if (!currentCoverLetter) return;
    
    const blob = new Blob([currentCoverLetter.coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.companyName}_${formData.jobTitle}_CoverLetter.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Cover letter downloaded!');
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
              Cover Letter Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create personalized, compelling cover letters that make you stand out
            </p>
          </motion.div>

          <div className="flex flex-col gap-8">
            {/* Input Section */}
          </div>
          
          {/* Output Section - Now below input instead of side-by-side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6 mt-8"
          >
              {/* Job Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Job Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g., Google, Microsoft, Startup Inc."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Software Engineer, Product Manager"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hiring Manager Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="hiringManager"
                      value={formData.hiringManager}
                      onChange={handleInputChange}
                      placeholder="e.g., John Smith, Ms. Johnson"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Resume Upload */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Upload Your Resume *
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
                          File ready for cover letter generation
              {/* Resume Upload */}
                        <div className="mt-2 text-xs text-green-700 dark:text-green-500 space-y-1">
                          <div className="flex items-center space-x-4">
                  Upload Your Resume *
                            <span>Type: PDF</span>
                          </div>
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
                          File ready for cover letter generation
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
              

              {/* Job Description */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Job Description *
                </h2>
                
                <RichTextEditor
                  value={formData.jobDescription}
                  onChange={(value) => setFormData(prev => ({ ...prev, jobDescription: value }))}
                  placeholder="Paste the job description or key requirements here. Copy directly from the job posting to preserve all details..."
                  rows={8}
                  showWordCount={true}
                />
              </div>

              {/* Personal Experience */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Personal Highlights (Optional)
                </h2>
                
                <RichTextEditor
                  value={formData.personalExperience}
                  onChange={(value) => setFormData(prev => ({ ...prev, personalExperience: value }))}
                  placeholder="Share a specific achievement or experience that makes you stand out for this role. Use bullet points or formatting to highlight key accomplishments..."
                  rows={4}
                  showWordCount={true}
                />
              </div>

              {/* Tone Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Choose Tone
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {tones.map((tone) => (
                    <motion.button
                      key={tone.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, tone: tone.id as any }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.tone === tone.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${tone.color} flex items-center justify-center mb-3 mx-auto`}>
                        <tone.icon className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {tone.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tone.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateCoverLetter}
                disabled={isAnalyzing || !formData.companyName || !formData.jobTitle || !formData.jobDescription || !uploadedFile}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Generate Cover Letter</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Output Section */}
          </div>
          
          {/* Output Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6 mt-8"
          >
              {currentCoverLetter ? (
                <>
                  {/* Cover Letter Tabs */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                      <nav className="flex space-x-8">
                        {[
                          { id: 'letter', label: 'Cover Letter', icon: Mail },
                          { id: 'customizations', label: 'Customizations', icon: Target },
                          { id: 'strengths', label: 'Key Strengths', icon: CheckCircle },
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
                    
                    <div>
                      {activeTab === 'letter' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Generated Cover Letter
                            </h3>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                title="Copy to clipboard"
                              >
                                <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={handleGenerateCoverLetter}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                title="Regenerate"
                              >
                                <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 max-h-96 overflow-y-auto">
                            <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                              {currentCoverLetter.coverLetter}
                            </pre>
                          </div>
                        </div>
                      )}

                      {activeTab === 'customizations' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            AI Customizations Applied
                          </h3>
                          <div className="space-y-3">
                            {currentCoverLetter.customizations.map((customization, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-800 dark:text-blue-400">
                                  {customization}
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <h4 className="font-medium text-green-800 dark:text-green-400 mb-2 flex items-center space-x-2">
                              <Lightbulb className="h-4 w-4" />
                              <span>Call to Action</span>
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {currentCoverLetter.callToAction}
                            </p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'strengths' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Key Strengths Highlighted
                          </h3>
                          <div className="space-y-3">
                            {currentCoverLetter.keyStrengths.map((strength, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-purple-800 dark:text-purple-400">
                                  {strength}
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
                      onClick={downloadLetter}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Download className="h-5 w-5" />
                      <span>Download as TXT</span>
                    </button>
                    
                    <button
                      onClick={() => navigate('/applications')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>Save to Applications</span>
                    </button>
                    
                    <button
                      onClick={handleSaveCoverLetter}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <FileText className="h-5 w-5" />
                      <span>Save to Library</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Placeholder */
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Ready to Generate
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Fill in the job details and click generate to create your personalized cover letter
                  </p>
                </div>
              )}
          </motion.div>
      </div>
    </div>
  );
};

export default CoverLetterGenerator;