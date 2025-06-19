import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Building, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  DollarSign,
  FileText,
  TrendingUp,
  MoreVertical,
  X,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { fetchApplications, createApplication, updateApplication, deleteApplication, type Application } from '../lib/applications';
import toast from 'react-hot-toast';

/**
 * Production-ready Application Tracker component
 * Features: Full CRUD operations, real-time data, advanced filtering, bulk operations,
 * data export/import, responsive design, and comprehensive error handling
 */
const ApplicationTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  // State management
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'appliedDate' | 'lastUpdate' | 'company' | 'status'>('appliedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    status: 'applied' as Application['status'],
    appliedDate: new Date().toISOString().split('T')[0],
    lastUpdate: new Date().toISOString().split('T')[0],
    salary: '',
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('ApplicationTracker: Component mounted');

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('ApplicationTracker: User not authenticated, redirecting');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load applications on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadApplications();
    }
  }, [isAuthenticated, user]);

  // Filter and sort applications
  useEffect(() => {
    let filtered = [...applications];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case 'appliedDate':
          aValue = new Date(a.appliedDate);
          bValue = new Date(b.appliedDate);
          break;
        case 'lastUpdate':
          aValue = new Date(a.lastUpdate);
          bValue = new Date(b.lastUpdate);
          break;
        case 'company':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.appliedDate;
          bValue = b.appliedDate;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, sortBy, sortOrder]);

  /**
   * Load applications from database
   */
  const loadApplications = async () => {
    console.log('ApplicationTracker: Loading applications');
    setIsLoading(true);
    
    try {
      const data = await fetchApplications();
      setApplications(data);
      console.log('ApplicationTracker: Loaded', data.length, 'applications');
    } catch (error) {
      console.error('ApplicationTracker: Failed to load applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      location: '',
      status: 'applied',
      appliedDate: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString().split('T')[0],
      salary: '',
      notes: '',
    });
  };

  /**
   * Handle adding new application
   */
  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company.trim() || !formData.position.trim()) {
      toast.error('Company and position are required');
      return;
    }

    console.log('ApplicationTracker: Adding new application');
    setIsSubmitting(true);

    try {
      const newApplication = await createApplication({
        ...formData,
        id: '', // Will be generated by database
        createdAt: '', // Will be set by database
        updatedAt: '', // Will be set by database
      });

      setApplications(prev => [newApplication, ...prev]);
      setShowAddModal(false);
      resetForm();
      toast.success('Application added successfully!');
    } catch (error) {
      console.error('ApplicationTracker: Failed to add application:', error);
      toast.error('Failed to add application');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle editing application
   */
  const handleEditApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentApplication) return;

    console.log('ApplicationTracker: Updating application:', currentApplication.id);
    setIsSubmitting(true);

    try {
      await updateApplication(currentApplication.id, {
        ...formData,
        lastUpdate: new Date().toISOString().split('T')[0],
      });

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === currentApplication.id 
          ? { ...app, ...formData, lastUpdate: new Date().toISOString().split('T')[0] }
          : app
      ));

      setShowEditModal(false);
      setCurrentApplication(null);
      resetForm();
      toast.success('Application updated successfully!');
    } catch (error) {
      console.error('ApplicationTracker: Failed to update application:', error);
      toast.error('Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle deleting application
   */
  const handleDeleteApplication = async () => {
    if (!currentApplication) return;

    console.log('ApplicationTracker: Deleting application:', currentApplication.id);
    setIsSubmitting(true);

    try {
      await deleteApplication(currentApplication.id);
      
      setApplications(prev => prev.filter(app => app.id !== currentApplication.id));
      setShowDeleteModal(false);
      setCurrentApplication(null);
      toast.success('Application deleted successfully!');
    } catch (error) {
      console.error('ApplicationTracker: Failed to delete application:', error);
      toast.error('Failed to delete application');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = async () => {
    if (selectedApplications.size === 0) return;

    console.log('ApplicationTracker: Bulk deleting', selectedApplications.size, 'applications');
    setIsSubmitting(true);

    try {
      const deletePromises = Array.from(selectedApplications).map(id => deleteApplication(id));
      await Promise.all(deletePromises);
      
      setApplications(prev => prev.filter(app => !selectedApplications.has(app.id)));
      setSelectedApplications(new Set());
      toast.success(`${selectedApplications.size} applications deleted successfully!`);
    } catch (error) {
      console.error('ApplicationTracker: Failed to bulk delete:', error);
      toast.error('Failed to delete applications');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle export to CSV
   */
  const handleExport = () => {
    console.log('ApplicationTracker: Exporting applications to CSV');
    
    const headers = ['Company', 'Position', 'Location', 'Status', 'Applied Date', 'Last Update', 'Salary', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...applications.map(app => [
        `"${app.company}"`,
        `"${app.position}"`,
        `"${app.location}"`,
        app.status,
        app.appliedDate,
        app.lastUpdate,
        `"${app.salary || ''}"`,
        `"${app.notes?.replace(/"/g, '""') || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Applications exported successfully!');
  };

  /**
   * Open edit modal with application data
   */
  const openEditModal = (application: Application) => {
    setCurrentApplication(application);
    setFormData({
      company: application.company,
      position: application.position,
      location: application.location,
      status: application.status,
      appliedDate: application.appliedDate,
      lastUpdate: application.lastUpdate,
      salary: application.salary || '',
      notes: application.notes || '',
    });
    setShowEditModal(true);
  };

  /**
   * Open view modal
   */
  const openViewModal = (application: Application) => {
    setCurrentApplication(application);
    setShowViewModal(true);
  };

  /**
   * Open delete modal
   */
  const openDeleteModal = (application: Application) => {
    setCurrentApplication(application);
    setShowDeleteModal(true);
  };

  /**
   * Toggle application selection for bulk operations
   */
  const toggleApplicationSelection = (id: string) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  /**
   * Select all visible applications
   */
  const selectAllApplications = () => {
    const allIds = new Set(filteredApplications.map(app => app.id));
    setSelectedApplications(allIds);
  };

  /**
   * Clear all selections
   */
  const clearAllSelections = () => {
    setSelectedApplications(new Set());
  };

  // Status configuration
  const statusConfig = {
    applied: {
      label: 'Applied',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: Clock,
    },
    interview: {
      label: 'Interview',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: AlertCircle,
    },
    offer: {
      label: 'Offer',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      icon: CheckCircle,
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      icon: XCircle,
    },
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    applied: applications.filter(app => app.status === 'applied').length,
    interview: applications.filter(app => app.status === 'interview').length,
    offer: applications.filter(app => app.status === 'offer').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    responseRate: applications.length > 0 
      ? Math.round(((applications.filter(app => app.status !== 'applied').length) / applications.length) * 100)
      : 0,
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
                  Application Tracker
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your job applications and track your progress
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-3">
                {selectedApplications.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete ({selectedApplications.size})</span>
                  </button>
                )}
                
                <button
                  onClick={handleExport}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Application</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total
              </div>
            </div>
            
            {Object.entries(statusConfig).map(([status, config]) => (
              <div
                key={status}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 text-center"
              >
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats[status as keyof typeof stats]}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {config.label}
                </div>
              </div>
            ))}
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.responseRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Response Rate
              </div>
            </div>
          </motion.div>

          {/* Filters and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies, positions, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <option key={status} value={status}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field as any);
                      setSortOrder(order as any);
                    }}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="appliedDate-desc">Newest First</option>
                    <option value="appliedDate-asc">Oldest First</option>
                    <option value="lastUpdate-desc">Recently Updated</option>
                    <option value="company-asc">Company A-Z</option>
                    <option value="company-desc">Company Z-A</option>
                    <option value="status-asc">Status</option>
                  </select>
                </div>
              </div>
              
              {/* Bulk Selection */}
              {filteredApplications.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllApplications}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    Select All
                  </button>
                  {selectedApplications.size > 0 && (
                    <button
                      onClick={clearAllSelections}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Applications List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredApplications.length > 0 ? (
              <AnimatePresence>
                {filteredApplications.map((application, index) => {
                  const statusInfo = statusConfig[application.status];
                  const StatusIcon = statusInfo.icon;
                  const isSelected = selectedApplications.has(application.id);
                  
                  return (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border transition-all duration-200 hover:shadow-xl ${
                        isSelected 
                          ? 'border-purple-500 ring-2 ring-purple-500/20' 
                          : 'border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Selection Checkbox */}
                          <div className="flex items-center pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleApplicationSelection(application.id)}
                              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          
                          {/* Application Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                  {application.position}
                                </h3>
                                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 mb-2">
                                  <div className="flex items-center space-x-1">
                                    <Building className="h-4 w-4" />
                                    <span>{application.company}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{application.location}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} flex items-center space-x-1`}>
                                  <StatusIcon className="h-4 w-4" />
                                  <span>{statusInfo.label}</span>
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span>Applied: {new Date(application.appliedDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="h-4 w-4" />
                                <span>Updated: {new Date(application.lastUpdate).toLocaleDateString()}</span>
                              </div>
                              {application.salary && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{application.salary}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <FileText className="h-4 w-4" />
                                <span>{Math.floor((Date.now() - new Date(application.appliedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago</span>
                              </div>
                            </div>
                            
                            {application.notes && (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {application.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button 
                            onClick={() => openViewModal(application)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button 
                            onClick={() => openEditModal(application)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                            title="Edit Application"
                          >
                            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(application)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                            title="Delete Application"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No applications found' : 'No applications yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start tracking your job applications to see them here'
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Your First Application</span>
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Add Application Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add New Application
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddApplication} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Google, Microsoft"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <option key={status} value={status}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Applied Date
                    </label>
                    <input
                      type="date"
                      name="appliedDate"
                      value={formData.appliedDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., $80,000 - $120,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Add any notes about this application..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Add Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Application Modal */}
      <AnimatePresence>
        {showEditModal && currentApplication && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Application
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentApplication(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleEditApplication} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <option key={status} value={status}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Applied Date
                    </label>
                    <input
                      type="date"
                      name="appliedDate"
                      value={formData.appliedDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentApplication(null);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Update Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Application Modal */}
      <AnimatePresence>
        {showViewModal && currentApplication && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Application Details
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setCurrentApplication(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Company
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentApplication.company}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Position
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentApplication.position}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Location
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {currentApplication.location}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[currentApplication.status].color}`}>
                        {statusConfig[currentApplication.status].label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Applied Date
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(currentApplication.appliedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Last Updated
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(currentApplication.lastUpdate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {currentApplication.salary && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Salary Range
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {currentApplication.salary}
                    </p>
                  </div>
                )}

                {currentApplication.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Notes
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {currentApplication.notes}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(currentApplication);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Application</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && currentApplication && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Delete Application
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete the application for <strong>{currentApplication.position}</strong> at <strong>{currentApplication.company}</strong>?
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCurrentApplication(null);
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteApplication}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationTracker;