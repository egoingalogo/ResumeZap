import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Calendar, 
  Target, 
  Trash2, 
  Eye, 
  Download,
  Filter,
  ArrowLeft,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CustomSelect } from '../components/CustomSelect';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import { exportResume } from '../lib/exportUtils';
import toast from 'react-hot-toast';

/**
 * Resume Library page component for managing saved optimized resumes
 * Displays all user's saved resumes with options to view, export, or delete
 * Provides search and filtering capabilities for better organization
 */
const ResumeLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { resumes, isLoading, fetchResumes, deleteResume, loadResumeForViewing } = useResumeStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'title'>('date');
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  console.log('ResumeLibrary: Component mounted');

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('ResumeLibrary: User not authenticated, redirecting to landing page');
      navigate('/');
      return;
    }

    // Fetch resumes on component mount
    fetchResumes().catch(error => {
      console.error('ResumeLibrary: Failed to fetch resumes:', error);
      toast.error('Failed to load resume library');
    });
  }, [isAuthenticated, navigate, fetchResumes]);

  /**
   * Handle resume viewing - loads the resume and navigates to analyzer
   */
  const handleViewResume = async (resumeId: string) => {
    console.log('ResumeLibrary: Loading resume for viewing:', resumeId);
    
    try {
      await loadResumeForViewing(resumeId);
      navigate('/resume-analyzer');
      toast.success('Resume loaded successfully!');
    } catch (error) {
      console.error('ResumeLibrary: Failed to load resume:', error);
      toast.error('Failed to load resume. Please try again.');
    }
  };

  /**
   * Handle resume deletion with confirmation
   */
  const handleDeleteResume = async (resumeId: string, resumeTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${resumeTitle}"? This action cannot be undone.`)) {
      return;
    }

    console.log('ResumeLibrary: Deleting resume:', resumeId);
    
    try {
      await deleteResume(resumeId);
      toast.success('Resume deleted successfully!');
    } catch (error) {
      console.error('ResumeLibrary: Failed to delete resume:', error);
      toast.error('Failed to delete resume. Please try again.');
    }
  };

  /**
   * Handle resume export
   */
  const handleExportResume = async (resume: any, format: 'pdf' | 'docx' | 'txt') => {
    console.log('ResumeLibrary: Exporting resume as:', format);
    setIsExporting(resume.id);
    
    try {
      // Extract original filename from title if possible
      const titleParts = resume.title.split(' - ');
      const originalFileName = titleParts.length > 2 ? titleParts[2] : 'resume';
      const exportFileName = `optimized_resume_${originalFileName}`;
      
      const result = await exportResume(resume.content, format, exportFileName);
      
      if (result.success) {
        toast.success(`Resume exported as ${format.toUpperCase()}! File: ${result.fileName}`, {
          duration: 5000,
        });
      } else {
        toast.error(result.error || `Failed to export ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('ResumeLibrary: Export failed:', error);
      toast.error(`Export failed. Please try again.`);
    } finally {
      setIsExporting(null);
    }
  };

  /**
   * Filter and sort resumes based on search and filter criteria
   */
  const filteredAndSortedResumes = resumes
    .filter(resume => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.jobPosting.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Score filter
      let matchesScore = true;
      if (filterScore !== 'all') {
        if (filterScore === 'high' && resume.matchScore < 80) matchesScore = false;
        if (filterScore === 'medium' && (resume.matchScore < 60 || resume.matchScore >= 80)) matchesScore = false;
        if (filterScore === 'low' && resume.matchScore >= 60) matchesScore = false;
      }
      
      return matchesSearch && matchesScore;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'score':
          return b.matchScore - a.matchScore;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Work';
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
                  Resume Library
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage your AI-optimized resumes
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Resumes</div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400">
                    {resumes.length}
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/resume-analyzer')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Analyze New Resume
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
                  placeholder="Search resumes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Sort By */}
              <div>
                <CustomSelect
                  options={[
                    { value: 'date', label: 'Sort by Date' },
                    { value: 'score', label: 'Sort by Score' },
                    { value: 'title', label: 'Sort by Title' },
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as 'date' | 'score' | 'title')}
                  className="w-full"
                />
              </div>

              {/* Filter by Score */}
              <div>
                <CustomSelect
                  options={[
                    { value: 'all', label: 'All Scores' },
                    { value: 'high', label: 'High (80%+)' },
                    { value: 'medium', label: 'Medium (60-79%)' },
                    { value: 'low', label: 'Low (Below 60%)' },
                  ]}
                  value={filterScore}
                  onChange={(value) => setFilterScore(value as 'all' | 'high' | 'medium' | 'low')}
                  className="w-full"
                />
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAndSortedResumes.length} of {resumes.length} resumes
                </span>
              </div>
            </div>
          </motion.div>

          {/* Resume List */}
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
            ) : filteredAndSortedResumes.length > 0 ? (
              filteredAndSortedResumes.map((resume, index) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {resume.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(resume.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Match Score:</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(resume.matchScore)}`}>
                          {resume.matchScore}% - {getScoreLabel(resume.matchScore)}
                        </div>
                      </div>

                      {/* Job Posting Preview */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Job Posting:</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {resume.jobPosting.substring(0, 150)}...
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleViewResume(resume.id)}
                        className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-200 group"
                        title="View Resume"
                      >
                        <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
                      </button>

                      {/* Export Options */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleExportResume(resume, 'pdf')}
                          disabled={isExporting === resume.id}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Export as PDF"
                        >
                          {isExporting === resume.id ? (
                            <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleExportResume(resume, 'docx')}
                          disabled={isExporting === resume.id}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Export as RTF"
                        >
                          <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleExportResume(resume, 'txt')}
                          disabled={isExporting === resume.id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Export as TXT"
                        >
                          <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteResume(resume.id, resume.title)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        title="Delete Resume"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterScore !== 'all' ? 'No matching resumes found' : 'No saved resumes yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterScore !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Start by analyzing your first resume to see it here'
                  }
                </p>
                {(!searchTerm && filterScore === 'all') && (
                  <button
                    onClick={() => navigate('/resume-analyzer')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    Analyze Your First Resume
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

export default ResumeLibrary;