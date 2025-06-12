import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

/**
 * Authentication page handling both login and registration
 * Includes comprehensive form validation, loading states, and error handling
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
   * Handles form submission with comprehensive validation
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
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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
        className="fixed top-6 left-6 z-50 flex items-center space-x-2 text-white/90 hover:text-white transition-all duration-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Back to Home</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full relative"
      >
        {/* Auth card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
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
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                At least 8 characters, including uppercase A–Z, lowercase a–z, and numbers 0–9.
              </p>
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
    </div>
  );
};

export default AuthPage;