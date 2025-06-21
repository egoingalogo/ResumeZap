import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowLeft, Mail, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

/**
 * Authentication page handling both login and registration
 * Includes comprehensive form validation, loading states, error handling, and password reset
 * Validates inputs according to specific business rules with visual feedback
 */
const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, isAuthenticated } = useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  console.log('AuthPage: Component mounted with mode:', mode);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('AuthPage: User already authenticated, redirecting');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  /**
   * Validates form inputs according to business rules
   * Returns true if all validations pass, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name validation (registration only)
    if (mode === 'register') {
      if (!formData.name.trim()) {
        newErrors.name = 'Please enter your full name (letters and spaces only, at least 3 characters per name).';
      } else {
        // Check if name contains only letters and spaces
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.name)) {
          newErrors.name = 'Please enter your full name (letters and spaces only, at least 3 characters per name).';
        } else {
          // Check if each name part has at least 3 characters
          const nameParts = formData.name.trim().split(/\s+/);
          if (nameParts.length < 2 || nameParts.some(part => part.length < 3)) {
            newErrors.name = 'Please enter your full name (letters and spaces only, at least 3 characters per name).';
          }
        }
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com).';
    } else {
      // Enhanced email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address (e.g., user@example.com).';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.';
    } else {
      // Check minimum length
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.';
      } else {
        // Check for uppercase, lowercase, and numbers
        const hasUppercase = /[A-Z]/.test(formData.password);
        const hasLowercase = /[a-z]/.test(formData.password);
        const hasNumbers = /[0-9]/.test(formData.password);
        
        if (!hasUppercase || !hasLowercase || !hasNumbers) {
          newErrors.password = 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.';
        }
      }
    }

    // Confirm Password validation (registration only)
    if (mode === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match. Please make sure both entries are identical.';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match. Please make sure both entries are identical.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validates a single field and updates errors state
   * Used for real-time validation as user types
   */
  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'name':
        if (mode === 'register') {
          if (!value.trim()) {
            newErrors.name = 'Please enter your full name (letters and spaces only, at least 3 characters per name).';
          } else {
            const nameRegex = /^[a-zA-Z\s]+$/;
            if (!nameRegex.test(value)) {
              newErrors.name = 'Please enter your full name (letters and spaces only, at least 3 characters per name).';
            } else {
              const nameParts = value.trim().split(/\s+/);
              if (nameParts.length < 2 || nameParts.some(part => part.length < 3)) {
                newErrors.name = 'Please enter your full name (letters and spaces only, at least 3 characters per name).';
              } else {
                delete newErrors.name;
              }
            }
          }
        }
        break;

      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Please enter a valid email address (e.g., user@example.com).';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors.email = 'Please enter a valid email address (e.g., user@example.com).';
          } else {
            delete newErrors.email;
          }
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.';
        } else {
          const hasUppercase = /[A-Z]/.test(value);
          const hasLowercase = /[a-z]/.test(value);
          const hasNumbers = /[0-9]/.test(value);
          
          if (!hasUppercase || !hasLowercase || !hasNumbers) {
            newErrors.password = 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers.';
          } else {
            delete newErrors.password;
          }
        }
        break;

      case 'confirmPassword':
        if (mode === 'register') {
          if (!value) {
            newErrors.confirmPassword = 'Passwords do not match. Please make sure both entries are identical.';
          } else if (formData.password !== value) {
            newErrors.confirmPassword = 'Passwords do not match. Please make sure both entries are identical.';
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;
    }

    setErrors(newErrors);
  };

  /**
   * Handles form submission with comprehensive validation and specific error handling
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AuthPage: Form submission started');
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    
    if (!validateForm()) {
      console.log('AuthPage: Form validation failed');
      return;
    }

    setIsLoading(true);

    try {
      let success = false;
      
      if (mode === 'register') {
        success = await register(formData.email, formData.password, formData.name);
        if (success) {
          toast.success('Account created successfully!');
        }
      } else {
        success = await login(formData.email, formData.password);
        if (success) {
          toast.success('Welcome back!');
        }
      }

      if (success) {
        const planParam = searchParams.get('plan');
        if (planParam && ['premium', 'pro', 'lifetime'].includes(planParam)) {
          // Handle plan upgrade after registration
          navigate(`/dashboard?upgrade=${planParam}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(mode === 'register' ? 'Registration failed' : 'Invalid credentials');
      }
    } catch (error) {
      console.error('AuthPage: Authentication error:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (mode === 'register' && (
          errorMessage.includes('user already registered') || 
          errorMessage.includes('user already exists') ||
          errorMessage.includes('already registered')
        )) {
          toast.error(
            `This email is already registered. Please sign in instead or use a different email address.`,
            { duration: 5000 }
          );
          // Switch to login mode when user already exists
          setMode('login');
        } else if (mode === 'login' && (
          errorMessage.includes('invalid credentials') ||
          errorMessage.includes('invalid login') ||
          errorMessage.includes('email not confirmed')
        )) {
          toast.error('Invalid email or password. Please check your credentials and try again.');
        } else {
          // Generic error fallback
          toast.error(mode === 'register' ? 'Registration failed. Please try again.' : 'Login failed. Please try again.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles password reset request
   */
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AuthPage: Password reset requested for:', resetEmail);
    
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsResetLoading(true);

    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResetEmailSent(true);
      toast.success('Password reset instructions sent to your email!');
      console.log('AuthPage: Password reset email sent successfully');
      
    } catch (error) {
      console.error('AuthPage: Password reset failed:', error);
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsResetLoading(false);
    }
  };

  /**
   * Closes the password reset modal and resets state
   */
  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail('');
    setResetEmailSent(false);
    setIsResetLoading(false);
  };

  /**
   * Handles input changes with real-time validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field in real-time if it has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  /**
   * Handles input blur events to trigger validation
   */
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  /**
   * Determines if an input field should show error styling
   */
  const hasError = (fieldName: string): boolean => {
    return touched[fieldName] && !!errors[fieldName];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

      {/* Back button - positioned at top of screen */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 flex items-center space-x-2 text-white/90 hover:text-white transition-all duration-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 sm:top-6 sm:left-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium hidden sm:inline">Back to Home</span>
        <span className="font-medium sm:hidden">Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full relative mt-16 sm:mt-0"
      >
        {/* Auth card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl mx-4 sm:mx-0">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ResumeZap
              </span>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {mode === 'register' 
                ? 'Start your AI-powered job search journey' 
                : 'Sign in to continue optimizing your resume'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    hasError('name')
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800'
                  } dark:bg-gray-800 dark:text-white focus:outline-none`}
                  placeholder="Enter your full name"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter your first and last name (letters and spaces only).
                </p>
                {hasError('name') && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  hasError('email')
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800'
                } dark:bg-gray-800 dark:text-white focus:outline-none`}
                placeholder="Enter your email"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter a valid email address (e.g., user@example.com).
              </p>
              {hasError('email') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all duration-200 ${
                    hasError('password')
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800'
                  } dark:bg-gray-800 dark:text-white focus:outline-none`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {/* Show helper text only in registration mode */}
              {mode === 'register' && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  At least 8 characters, including uppercase A–Z, lowercase a–z, and numbers 0–9.
                </p>
              )}
              {hasError('password') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all duration-200 ${
                      hasError('confirmPassword')
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800'
                    } dark:bg-gray-800 dark:text-white focus:outline-none`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Must exactly match the password you entered above.
                </p>
                {hasError('confirmPassword') && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
              )}
            </motion.button>
          </form>

          {/* Forgot Password Link - Only show in login mode */}
          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowResetModal(true)}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium transition-colors duration-200"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Mode toggle */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button
                onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
              >
                {mode === 'register' ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md relative"
          >
            {/* Close button */}
            <button
              onClick={closeResetModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>

            {!resetEmailSent ? (
              <>
                {/* Reset Password Form */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Reset Your Password
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="resetEmail"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeResetModal}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetLoading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {isResetLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* Success Message */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                    We've sent password reset instructions to <strong>{resetEmail}</strong>
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs mb-6">
                    Didn't receive the email? Check your spam folder or try again with a different email address.
                  </p>
                  <button
                    onClick={closeResetModal}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;