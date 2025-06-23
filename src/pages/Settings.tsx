import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Database, 
  Trash2, 
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Crown,
  Loader2,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
import { useAuthStore } from '../store/authStore';
import { deleteUserAccount } from '../lib/supabase';
import toast from 'react-hot-toast';

/**
 * Settings page component with comprehensive user profile management
 * Handles profile updates, security settings, notifications, and account deletion
 * Provides tabbed interface for organized settings management
 */
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfilePicture, updateUserEmail, updateUserName, logout } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  
  // Security form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
  });

  console.log('Settings: Component mounted for user:', user?.email);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Settings: User not authenticated, redirecting to landing page');
      navigate('/');
      return;
    }

    // Initialize form with user data
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
      });
    }
  }, [isAuthenticated, navigate, user]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'billing', label: 'Billing', icon: Crown },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: Database },
  ];

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    console.log('Settings: Saving profile changes');
    setIsLoading(true);

    try {
      // Update name if changed
      if (profileForm.name.trim() !== user?.name) {
        await updateUserName(profileForm.name);
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Settings: Failed to update profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!profileForm.email.trim()) {
      toast.error('Email cannot be empty');
      return;
    }

    if (profileForm.email === user?.email) {
      toast.info('Email address is the same as current');
      return;
    }

    console.log('Settings: Changing email address');
    setIsLoading(true);

    try {
      await updateUserEmail(profileForm.email);
      toast.success('Verification email sent to your new address!');
    } catch (error) {
      console.error('Settings: Failed to change email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change email';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (securityForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    console.log('Settings: Changing password');
    setIsLoading(true);

    try {
      // Simulate password change - implement actual password change logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Settings: Failed to change password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    console.log('Settings: Deleting user account');
    setIsDeleting(true);

    try {
      await deleteUserAccount();
      toast.success('Account deleted successfully');
      
      // Sign out and redirect
      await logout();
    } catch (error) {
      console.error('Settings: Failed to delete account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      toast.error(errorMessage);
      setIsDeleting(false);
    }
  };

  const handleProfilePictureUpdate = (newImageUrl: string | null) => {
    updateProfilePicture(newImageUrl);
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
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3"
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Profile Picture
                    </h2>
                    
                    <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
                      <div className="flex-shrink-0 mb-6 lg:mb-0">
                        <ProfilePictureUpload
                          currentImageUrl={user.profilePictureUrl}
                          onImageUpdate={handleProfilePictureUpdate}
                          size="lg"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Upload Guidelines
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li>• Use a clear, professional photo</li>
                          <li>• Square images work best (1:1 aspect ratio)</li>
                          <li>• Maximum file size: 10MB</li>
                          <li>• Supported formats: JPEG, PNG, WebP</li>
                          <li>• Images are automatically optimized for web</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Profile Information
                    </h2>
                    
                    {/* User Info Display */}
                    <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600">
                        {user.profilePictureUrl ? (
                          <img
                            src={user.profilePictureUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {user.email}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          user.plan === 'lifetime' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                            : user.plan === 'pro'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : user.plan === 'premium'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {user.plan}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter your email"
                          />
                          <button
                            onClick={handleEmailChange}
                            disabled={isLoading || profileForm.email === user.email}
                            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Change
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Changing your email will require verification
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleProfileSave}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  {/* Security Settings */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Security Settings
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={securityForm.currentPassword}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={securityForm.newPassword}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={securityForm.confirmPassword}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handlePasswordChange}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            <span>Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Billing & Subscription
                  </h2>
                  
                  <div className="text-center py-12">
                    <Crown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Billing Management
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Billing and subscription management features will be available soon
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current Plan: <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize">{user.plan}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Notification Preferences
                  </h2>
                  
                  <div className="space-y-6">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {key === 'emailUpdates' && 'Email Updates'}
                            {key === 'securityAlerts' && 'Security Alerts'}
                            {key === 'marketingEmails' && 'Marketing Emails'}
                            {key === 'weeklyDigest' && 'Weekly Digest'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {key === 'emailUpdates' && 'Receive updates about your account activity'}
                            {key === 'securityAlerts' && 'Get notified about security-related events'}
                            {key === 'marketingEmails' && 'Receive promotional emails and feature updates'}
                            {key === 'weeklyDigest' && 'Weekly summary of your activity and tips'}
                          </p>
                        </div>
                        <button
                          onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  {/* Data Export */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Data Export
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Download a copy of your data including resumes, applications, and analysis history.
                    </p>
                    
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                      Export My Data
                    </button>
                  </div>

                  {/* Account Deletion */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1" />
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-2">
                          Delete Account
                        </h2>
                        <p className="text-red-700 dark:text-red-300 mb-6">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                          >
                            Delete Account
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-red-900 dark:text-red-400 mb-2">
                                Type "DELETE" to confirm
                              </label>
                              <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-4 py-3 border border-red-300 dark:border-red-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20 dark:text-white"
                                placeholder="Type DELETE to confirm"
                              />
                            </div>
                            
                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeleteConfirmText('');
                                }}
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete Forever</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;