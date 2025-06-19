import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  CreditCard, 
  Download, 
  Upload,
  Eye,
  EyeOff,
  Check,
  X,
  Crown,
  Zap,
  BarChart3,
  Calendar,
  FileText,
  Mail,
  Save,
  Shield,
  Moon,
  Sun,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { UpgradeModal } from '../components/UpgradeModal';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useResumeStore } from '../store/resumeStore';
import { supabase, deleteUserAccount } from '../lib/supabase';
import { LiveChatButton } from '../components/LiveChatButton';
import toast from 'react-hot-toast';

/**
 * Comprehensive settings page for user profile, subscription, and preferences management
 * Includes security settings, usage analytics, and account customization options
 */
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, upgradePlan } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { resumes } = useResumeStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'billing' | 'notifications' | 'security' | 'data'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
  });

  console.log('Settings: Component mounted for user:', user?.email);

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('Settings: User not authenticated, redirecting');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: SettingsIcon },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data', icon: FileText },
  ];

  const handleProfileUpdate = async () => {
    console.log('Settings: Updating user profile');
    setIsLoading(true);
    
    try {
      // Simulate API call - replace with actual profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Settings: Profile update failed:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle password change using Supabase authentication
   * Validates password requirements and updates user password securely
   */
  const handlePasswordChange = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (profileData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Enhanced password validation
    const hasUppercase = /[A-Z]/.test(profileData.newPassword);
    const hasLowercase = /[a-z]/.test(profileData.newPassword);
    const hasNumbers = /[0-9]/.test(profileData.newPassword);
    
    if (!hasUppercase || !hasLowercase || !hasNumbers) {
      toast.error('Password must include uppercase, lowercase, and numbers');
      return;
    }

    console.log('Settings: Changing user password via Supabase');
    setIsLoading(true);
    
    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: profileData.newPassword
      });

      if (error) {
        console.error('Settings: Supabase password update failed:', error);
        
        // Handle specific Supabase error messages
        if (error.message.includes('same as the old password')) {
          toast.error('New password must be different from your current password');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('Password does not meet security requirements');
        } else if (error.message.includes('session_not_found')) {
          toast.error('Session expired. Please sign in again');
          logout();
          return;
        } else {
          toast.error('Failed to change password. Please try again');
        }
        return;
      }

      // Clear password fields on success
      setProfileData({ 
        ...profileData, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      });
      
      toast.success('Password changed successfully!');
      console.log('Settings: Password updated successfully via Supabase');
      
    } catch (error) {
      console.error('Settings: Password change failed:', error);
      toast.error('An unexpected error occurred. Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle complete account deletion using Supabase Edge Function
   * Deletes user from auth.users table which cascades to all related data
   * Implements proper error handling and user feedback
   */
  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error('No user session found');
      return;
    }

    console.log('Settings: Starting complete account deletion process for user:', user.id);
    setIsLoading(true);
    
    try {
      // Call the edge function to completely delete the user account
      await deleteUserAccount();

      console.log('Settings: Account deletion completed successfully');
      toast.success('Account deleted successfully. We\'re sorry to see you go!');
      
      // Use the logout function to clear all local state and redirect
      await logout();
      
    } catch (error) {
      console.error('Settings: Account deletion failed:', error);
      
      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('No valid session')) {
        toast.error('Session expired. Please sign in again to delete your account.');
        logout();
      } else if (errorMessage.includes('Permission denied')) {
        toast.error('Permission denied. Please contact support for account deletion.');
      } else if (errorMessage.includes('Edge function')) {
        toast.error('Account deletion service is temporarily unavailable. Please try again later or contact support.');
      } else {
        toast.error('Failed to delete account. Please try again or contact support if the problem persists.');
      }
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleUpgradeClick = () => {
    console.log('Settings: Opening upgrade modal');
    setShowUpgradeModal(true);
  };

  const handleExportData = () => {
    console.log('Settings: Exporting user data');
    const data = {
      user: user,
      resumes: resumes,
      preferences: preferences,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumezap-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully!');
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'lifetime': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getUsageData = () => {
    if (!user) return { resumeTailoring: 0, coverLetters: 0, totalLimit: 0, remainingLimit: 0 };
    
    const limits = {
      free: { resumeTailoring: 3, coverLetters: 2 },
      premium: { resumeTailoring: 40, coverLetters: 30 },
      pro: { resumeTailoring: Infinity, coverLetters: Infinity },
      lifetime: { resumeTailoring: Infinity, coverLetters: Infinity },
    };
    
    const currentLimits = limits[user.plan];
    const totalUsed = user.usageThisMonth.resumeTailoring + user.usageThisMonth.coverLetters;
    const totalLimit = currentLimits.resumeTailoring === Infinity ? Infinity : currentLimits.resumeTailoring + currentLimits.coverLetters;
    const remainingLimit = totalLimit === Infinity ? Infinity : totalLimit - totalUsed;
    
    return {
      ...user.usageThisMonth,
      totalLimit,
      remainingLimit,
    };
  };

  const usageData = getUsageData();

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
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account, preferences, and subscription settings
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 sticky top-24">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
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

            {/* Main Content */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-8"
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Profile Information
                      </h2>
                      
                      <div className="flex items-center space-x-6 mb-8">
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-10 w-10 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(user.plan)}`}>
                              {user.plan}
                            </span>
                            {user.plan === 'lifetime' && (
                              <Crown className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <button
                          onClick={handleProfileUpdate}
                          disabled={isLoading}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    {/* Usage Analytics */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Usage Analytics
                      </h2>
                      
                      <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                          <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {usageData.resumeTailoring}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Resume Tailoring
                          </div>
                        </div>
                        
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {usageData.coverLetters}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Cover Letters
                          </div>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                          <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {resumes.length}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Saved Resumes
                          </div>
                        </div>
                      </div>
                      
                      {user.plan !== 'pro' && user.plan !== 'lifetime' && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Monthly Usage</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {usageData.remainingLimit === Infinity 
                                ? 'Unlimited' 
                                : `${usageData.remainingLimit} remaining`
                              }
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-purple-500 transition-all duration-300"
                              style={{ 
                                width: `${usageData.totalLimit === Infinity 
                                  ? 0 
                                  : Math.min((usageData.resumeTailoring + usageData.coverLetters) / usageData.totalLimit * 100, 100)
                                }%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Theme Preferences */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Appearance
                      </h2>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isDarkMode ? (
                            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <Sun className="h-5 w-5 text-gray-600" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Dark Mode
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Toggle dark/light theme
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={toggleTheme}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isDarkMode ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isDarkMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                  <div className="space-y-6">
                    {/* Current Plan */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Current Plan
                      </h2>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-4 py-2 rounded-full text-lg font-semibold ${getPlanBadgeColor(user.plan)}`}>
                              {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                            </span>
                            {user.plan === 'lifetime' && (
                              <Crown className="h-5 w-5 text-amber-500" />
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {user.plan === 'free' && 'Basic features with usage limits'}
                            {user.plan === 'premium' && 'Enhanced features for active job seekers'}
                            {user.plan === 'pro' && 'Complete suite for serious professionals'}
                            {user.plan === 'lifetime' && 'All Pro features permanently'}
                          </p>
                        </div>
                        
                        {user.plan !== 'pro' && user.plan !== 'lifetime' && (
                          <button
                            onClick={handleUpgradeClick}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                          >
                            <Zap className="h-4 w-4" />
                            <span>Upgrade</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Plan Features */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                          Plan Features
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {user.plan === 'free' && [
                            '3 resume tailoring sessions per month',
                            '2 cover letter generations per month',
                            'Basic skill gap analysis',
                            'Standard export formats',
                            'Email support (48-72 hours)',
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                            </div>
                          ))}
                          
                          {user.plan === 'premium' && [
                            '40 resume tailoring sessions per month',
                            '30 cover letter generations per month',
                            'Enhanced skill gap analysis',
                            'Detailed AI learning recommendations',
                            'Priority email support (24-48 hours)',
                            'Usage analytics dashboard',
                            'Multiple resume versions',
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                            </div>
                          ))}
                          
                          {(user.plan === 'pro' || user.plan === 'lifetime') && [
                            'Unlimited resume tailoring',
                            'Unlimited cover letter generation',
                            'Advanced skill gap analysis with roadmaps',
                            'Comprehensive AI learning recommendations',
                            user.plan === 'pro' ? 'Priority email support (4 hours)' : 'VIP email support (4 hours)',
                            'Custom templates',
                            'Bulk processing for multiple applications',
                            'Advanced analytics',
                            'Version history',
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Billing History */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Billing History
                      </h2>
                      
                      <div className="space-y-4">
                        {user.plan !== 'free' ? (
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {user.plan === 'lifetime' ? 'Lifetime Purchase' : `${user.plan} Plan`}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date().toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.plan === 'premium' && '$7.99'}
                                {user.plan === 'pro' && '$14.99'}
                                {user.plan === 'lifetime' && '$79.99'}
                              </div>
                              <div className="text-sm text-green-600">Paid</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No billing history
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              Upgrade to a paid plan to see your billing history
                            </p>
                          </div>
                        )}
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
                      {[
                        {
                          key: 'emailNotifications',
                          title: 'Email Notifications',
                          description: 'Get notified about important account activities',
                        },
                        {
                          key: 'marketingEmails',
                          title: 'Marketing Emails',
                          description: 'Receive tips, updates, and promotional content',
                        },
                      ].map((notification) => (
                        <div key={notification.key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {notification.description}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setPreferences({
                              ...preferences,
                              [notification.key]: !preferences[notification.key as keyof typeof preferences]
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              preferences[notification.key as keyof typeof preferences] ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences[notification.key as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    {/* Change Password */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Change Password
                      </h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={profileData.currentPassword}
                              onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                              placeholder="Enter your current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Note: For security, Supabase doesn't require current password verification for password changes.
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={profileData.newPassword}
                            onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Enter your new password"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Must be at least 8 characters with uppercase, lowercase, and numbers.
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={profileData.confirmPassword}
                            onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Confirm your new password"
                          />
                        </div>
                        
                        <button
                          onClick={handlePasswordChange}
                          disabled={isLoading || !profileData.newPassword || !profileData.confirmPassword}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                          <span>Update Password</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Delete Account */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                      <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-4">
                        Danger Zone
                      </h2>
                      <p className="text-red-700 dark:text-red-300 mb-6">
                        Once you delete your account, there is no going back. This action cannot be undone and will permanently delete all your data including resumes, applications, and support tickets.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    {/* Export Data */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Export Your Data
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Download a copy of all your data including resumes, settings, and usage history.
                      </p>
                      <button
                        onClick={handleExportData}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export Data</span>
                      </button>
                    </div>
                    
                    {/* Data Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Data Summary
                      </h2>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                          <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {resumes.length}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Saved Resumes
                          </div>
                        </div>
                        
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Days Active
                          </div>
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

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete your account? This will permanently remove:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                <li>• Your profile and account settings</li>
                <li>• All saved resumes and versions</li>
                <li>• Job application tracking data</li>
                <li>• Support ticket history</li>
                <li>• Usage analytics and preferences</li>
              </ul>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium mt-4">
                This action cannot be undone and your data cannot be recovered.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete Forever</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={user.plan}
      />
    </div>
  );
};

export default Settings;