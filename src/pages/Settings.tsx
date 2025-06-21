import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Trash2, Save, Eye, EyeOff, Upload, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabase';
import { uploadProfilePicture, deleteProfilePicture } from '../lib/profilePicture';
import { deleteUserAccount } from '../lib/support';

/**
 * Settings page component for user account management
 * Provides functionality for profile updates, password changes, and account deletion
 */
const Settings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Load user profile picture on component mount
  useEffect(() => {
    if (user?.profile_picture_url) {
      setProfilePicturePreview(user.profile_picture_url);
    }
  }, [user]);

  /**
   * Displays a temporary message to the user
   */
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  /**
   * Handles profile picture file selection and preview
   */
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('Profile picture must be less than 5MB', 'error');
        return;
      }
      
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Removes the profile picture preview and file
   */
  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  /**
   * Updates user profile information
   */
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let profilePictureUrl = user.profile_picture_url;

      // Handle profile picture upload
      if (profilePicture) {
        const uploadResult = await uploadProfilePicture(profilePicture, user.id);
        if (uploadResult.success && uploadResult.url) {
          profilePictureUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.error || 'Failed to upload profile picture');
        }
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          name,
          email,
          profile_picture_url: profilePictureUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      updateUser({
        ...user,
        name,
        email,
        profile_picture_url: profilePictureUrl
      });

      showMessage('Profile updated successfully!', 'success');
      setProfilePicture(null);
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage(error instanceof Error ? error.message : 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Changes user password
   */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showMessage('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      showMessage(error instanceof Error ? error.message : 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes user account after confirmation
   */
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== 'DELETE') {
      showMessage('Please type DELETE to confirm account deletion', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await deleteUserAccount(user.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }
      
      // Account deletion successful - user will be redirected by auth state change
      showMessage('Account deleted successfully', 'success');
    } catch (error) {
      console.error('Account deletion error:', error);
      showMessage(error instanceof Error ? error.message : 'Failed to delete account', 'error');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your account preferences and security settings</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Profile Information</h2>
              </div>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {profilePicturePreview ? (
                      <div className="relative">
                        <img
                          src={profilePicturePreview}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={removeProfilePicture}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      id="profile-picture"
                    />
                    <label
                      htmlFor="profile-picture"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Max file size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Change Password</h2>
              </div>
            </div>
            
            <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
              {/* Current Password */}
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Preferences</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Dark Mode</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Toggle between light and dark themes</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="p-6 border-b border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h2 className="text-xl font-semibold text-red-900 dark:text-red-400">Danger Zone</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-900 dark:text-red-400 mb-2">Delete Account</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Once you delete your account, there is no going back. This action cannot be undone and will permanently delete all your data.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Account</h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                This action cannot be undone. This will permanently delete your account and all associated data.
              </p>
              
              <div className="mb-4">
                <label htmlFor="delete-confirmation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type <span className="font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="DELETE"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmation !== 'DELETE'}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;