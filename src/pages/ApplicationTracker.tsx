import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { Navbar } from '../components/Navbar';
import { ApplicationFormModal } from '../components/ApplicationFormModal';
import { useAuthStore } from '../store/authStore';
import { 
  fetchApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  type Application 
} from '../lib/applications';
import toast from 'react-hot-toast';

/**
 * Application tracker component for managing job applications
 * Provides CRUD operations and status tracking for job applications
 */
const ApplicationTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('ApplicationTracker: Component mounted');

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('ApplicationTracker: User not authenticated, redirecting to landing page');
      navigate('/');
      return;
    }

    // Load applications on component mount
    loadApplications();
  }, [isAuthenticated, navigate]);

  const loadApplications = async () => {
    console.log('ApplicationTracker: Loading applications');
    setIsLoading(true);
    
    try {
      const data = await fetchApplications();
      setApplications(data);
      console.log('ApplicationTracker: Loaded', data.length, 'applications');
    } catch (error) {
      console.error('ApplicationTracker: Failed to load applications:', error);
      toast.error('Failed to load applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddApplication = () => {
    console.log('ApplicationTracker: Opening add application modal');
    setEditingApplication(null);
    setShowAddModal(true);
  };

  const handleEditApplication = (application: Application) => {
    console.log('ApplicationTracker: Opening edit modal for application:', application.id);
    setEditingApplication(application);
    setShowAddModal(true);
  };

  const handleSaveApplication = async (applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('ApplicationTracker: Saving application data');
    
    try {
      if (editingApplication) {
        // Update existing application
        await updateApplication(editingApplication.id, applicationData);
        toast.success('Application updated successfully!');
      } else {
        // Create new application
        await createApplication(applicationData);
        toast.success('Application added successfully!');
      }
      
      // Reload applications to get updated data
      await loadApplications();
      
      // Close modal
      setShowAddModal(false);
      setEditingApplication(null);
      
    } catch (error) {
      console.error('ApplicationTracker: Failed to save application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save application';
      toast.error(errorMessage);
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleDeleteApplication = async (application: Application) => {
    if (!confirm(`Are you sure you want to delete the application for ${application.position} at ${application.company}? This action cannot be undone.`)) {
      return;
    }

    console.log('ApplicationTracker: Deleting application:', application.id);
    
    try {
      await deleteApplication(application.id);
      toast.success('Application deleted successfully!');
      
      // Reload applications
      await loadApplications();
      
    } catch (error) {
      console.error('ApplicationTracker: Failed to delete application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete application';
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'interview': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'offer': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return Clock;
      case 'interview': return Calendar;
      case 'offer': return CheckCircle;
      case 'rejected': return XCircle;
      default: return FileText;
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                  Manage and track your job applications in one place
                </p>
              </div>
              
              <button
                onClick={handleAddApplication}
                className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Application</span>
              </button>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by company or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <CustomSelect
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "applied", label: "Applied" },
                    { value: "interview", label: "Interview" },
                    { value: "offer", label: "Offer" },
                    { value: "rejected", label: "Rejected" }
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  className=""
                />
              </div>
            </div>
          </motion.div>

          {/* Applications List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredApplications.length > 0 ? (
              <div className="space-y-4">
                {filteredApplications.map((application, index) => {
                  const StatusIcon = getStatusIcon(application.status);
                  
                  return (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                              {application.company.charAt(0)}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                {application.position}
                              </h3>
                              <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 mb-3">
                                <div className="flex items-center space-x-1">
                                  <Building className="h-4 w-4" />
                                  <span>{application.company}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{application.location}</span>
                                </div>
                                {application.salary && (
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span>{application.salary}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  <span className="capitalize">{application.status}</span>
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Applied: {new Date(application.appliedDate).toLocaleDateString()}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Updated: {new Date(application.lastUpdate).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {application.notes && (
                                <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
                                  {application.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditApplication(application)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                            title="Edit application"
                          >
                            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(application)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                            title="Delete application"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No applications yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Start tracking your job applications to stay organized and increase your success rate
                </p>
                <button
                  onClick={handleAddApplication}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Your First Application</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Application Form Modal */}
      <ApplicationFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingApplication(null);
        }}
        onSave={handleSaveApplication}
        application={editingApplication}
      />
    </div>
  );
};

export default ApplicationTracker;