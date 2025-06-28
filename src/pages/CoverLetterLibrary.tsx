import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Search, 
  Calendar, 
  Building, 
  Trash2, 
  Eye, 
  Download,
  Filter,
  ArrowLeft,
  Clock,
  Plus,
  FileText
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import { exportResume } from '../lib/exportUtils';
import toast from 'react-hot-toast';
import type { CoverLetter } from '../lib/coverLetters';

/**
 * Cover Letter Library page component for managing saved cover letters
 * Displays all user's generated cover letters with options to view, export, or delete
 * Provides search and filtering capabilities for better organization
 */
const CoverLetterLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { coverLetters, isLoading, fetchCoverLetters, deleteCoverLetter, loadCoverLetterForViewing } = useResumeStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'title'>('date');
  const [filterTone, setFilterTone] = useState<'all' | 'professional' | 'enthusiastic' | 'concise'>('all');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  console.log('CoverLetterLibrary: Component mounted');

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('CoverLetterLibrary: User not authenticated, redirecting to landing page');
      navigate('/');
      return;
    }

    // Load cover letters from database
    fetchCoverLetters().catch(error => {
      console.error('CoverLetterLibrary: Failed to load cover letters:', error);
      toast.error('Failed to load cover letter library');
    });
  }, [isAuthenticated, navigate]);

  /**
   * Handle cover letter viewing - loads the cover letter for editing
   */
  const handleViewCoverLetter = async (coverLetter: CoverLetter) => {
    console.log('CoverLetterLibrary: Viewing cover letter:', coverLetter.id);
    
    try {
      // Load the cover letter data
      await loadCoverLetterForViewing(coverLetter.id);
      
      // Navigate to cover letter generator with the loaded data
      navigate('/cover-letter', { 
        state: { 
          coverLetterData: coverLetter,
          isViewing: true 
        } 
      });
      
      toast.success('Cover letter loaded successfully!');
    } catch (error) {
      console.error('CoverLetterLibrary: Failed to load cover letter:', error);
      toast.error('Failed to load cover letter. Please try again.');
    }
  };

  /**
   * Handle cover letter deletion with confirmation
   */
  const handleDeleteCoverLetter = async (coverLetterId: string, coverLetterTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${coverLetterTitle}"? This action cannot be undone.`)) {
      return;
    }

    console.log('CoverLetterLibrary: Deleting cover letter:', coverLetterId);
    
    try {
      await deleteCoverLetter(coverLetterId);
      toast.success('Cover letter deleted successfully!');
    } catch (error) {
      console.error('CoverLetterLibrary: Failed to delete cover letter:', error);
      toast.error('Failed to delete cover letter. Please try again.');
    }
  };

  /**
   * Handle cover letter export
   */
  const handleExportCoverLetter = async (coverLetter: CoverLetter, format: 'pdf' | 'docx' | 'txt') => {
    console.log('CoverLetterLibrary: Exporting cover letter as:', format);
    setIsExporting(coverLetter.id);
    
    try {
      // Generate filename with new format: Cover_Letter_Company_JobTitle
      const sanitizedCompany = coverLetter.companyName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const sanitizedJobTitle = coverLetter.jobTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
      const exportFileName = `Cover_Letter_${sanitizedCompany}_${sanitizedJobTitle}`;
      
      const result = await exportResume(coverLetter.content, format, exportFileName);
      
      if (result.success) {
        toast.success(`Cover letter exported as ${format.toUpperCase()}! File: ${result.fileName}`, {
          duration: 5000,
        });
      } else {
        toast.error(result.error || `Failed to export ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('CoverLetterLibrary: Export failed:', error);
      toast.error(`Export failed. Please try again.`);
    } finally {
      setIsExporting(null);
    }
  };

  /**
   * Filter and sort cover letters based on search and filter criteria
   */
  const filteredAndSortedCoverLetters = coverLetters
    .filter(coverLetter => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        coverLetter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coverLetter.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coverLetter.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Tone filter
      const matchesTone = filterTone === 'all' || coverLetter.tone === filterTone;
      
      return matchesSearch && matchesTone;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'company':
          return a.companyName.localeCompare(b.companyName);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'enthusiastic': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'concise': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
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
                  Cover Letter Library
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage your AI-generated cover letters
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Cover Letters</div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400">
                    {coverLetters.length}
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/cover-letter')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Generate New Cover Letter
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
                  placeholder="Search cover letters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'company' | 'title')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="company">Sort by Company</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>

              {/* Filter by Tone */}
              <div>
                <select
                  value={filterTone}
                  onChange={(e) => setFilterTone(e.target.value as 'all' | 'professional' | 'enthusiastic' | 'concise')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Tones</option>
                  <option value="professional">Professional</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="concise">Concise</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAndSortedCoverLetters.length} of {coverLetters.length} cover letters
                </span>
              </div>
            </div>
          </motion.div>

          {/* Cover Letters List */}
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
            ) : filteredAndSortedCoverLetters.length > 0 ? (
              filteredAndSortedCoverLetters.map((coverLetter, index) => (
                <motion.div
                  key={coverLetter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {coverLetter.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                              <Building className="h-4 w-4" />
                              <span>{coverLetter.companyName}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(coverLetter.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(coverLetter.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tone and Job Title */}
                      <div className="flex items-center space-x-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getToneColor(coverLetter.tone)}`}>
                          {coverLetter.tone}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {coverLetter.jobTitle}
                        </span>
                      </div>

                      {/* Content Preview */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                          {coverLetter.content.substring(0, 200)}...
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleViewCoverLetter(coverLetter)}
                        className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-200 group"
                        title="View Cover Letter"
                      >
                        <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
                      </button>

                      {/* Export Options */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleExportCoverLetter(coverLetter, 'pdf')}
                          disabled={isExporting === coverLetter.id}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Export as PDF"
                        >
                          {isExporting === coverLetter.id ? (
                            <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleExportCoverLetter(coverLetter, 'docx')}
                          disabled={isExporting === coverLetter.id}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Export as RTF"
                        >
                          <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleExportCoverLetter(coverLetter, 'txt')}
                          disabled={isExporting === coverLetter.id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                          title="Export as TXT"
                        >
                          <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteCoverLetter(coverLetter.id, coverLetter.title)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        title="Delete Cover Letter"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterTone !== 'all' ? 'No matching cover letters found' : 'No cover letters yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || filterTone !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Start by generating your first cover letter to see it here'
                  }
                </p>
                {(!searchTerm && filterTone === 'all') && (
                  <button
                    onClick={() => navigate('/cover-letter')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    Generate Your First Cover Letter
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

export default CoverLetterLibrary;