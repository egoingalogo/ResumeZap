import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User, 
  Settings, 
  LogOut,
  Crown,
  Mail,
  FileText,
  BarChart3,
 ChevronDown,
 FolderOpen
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

interface NavbarProps {
  isScrolled?: boolean;
}

/**
 * Navigation bar component with responsive design and theme toggle
 * Handles user authentication state and subscription plan display
 * Shows user profile picture when available
 */
export const Navbar: React.FC<NavbarProps> = ({ isScrolled = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);
  const libraryDropdownRef = React.useRef<HTMLDivElement>(null);
  
  console.log('Navbar: Rendering with authentication state:', isAuthenticated);
  console.log('Navbar: User profile picture URL:', user?.profilePictureUrl);

  // Handle click outside to close profile dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (libraryDropdownRef.current && !libraryDropdownRef.current.contains(event.target as Node)) {
        setIsLibraryOpen(false);
      }
    };

    if (isProfileOpen || isLibraryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen, isLibraryOpen]);

  const handleLogout = async () => {
    console.log('Navbar: User logout initiated');
    setIsProfileOpen(false);
    
    try {
      await logout();
      console.log('Navbar: Logout completed, full page refresh will occur');
    } catch (error) {
      console.error('Navbar: Logout error:', error);
      // Force navigation in case of error
      window.location.href = '/';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'lifetime': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <>
      {/* Logout Overlay - Freezes the entire UI during logout */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Signing Out
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Clearing session data...
            </p>
          </div>
        </div>
      )}

      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg' 
            : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10"
              >
                <img 
                  src="/app-logo.svg" 
                  alt="ResumeZap Logo" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ResumeZap
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      location.pathname === '/dashboard'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/resume-analyzer"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      location.pathname === '/resume-analyzer'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    Resume Analyzer
                  </Link>
                  <Link
                    to="/cover-letter"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      location.pathname === '/cover-letter'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    Cover Letter
                  </Link>
                  <Link
                    to="/skill-gap-analysis"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      location.pathname === '/skill-gap-analysis'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                    }`}
                  >
                    Skill Gap Analysis
                  </Link>
                  
                  {/* Library Dropdown */}
                  <div className="relative" ref={libraryDropdownRef}>
                    <button
                      onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                      disabled={isLoggingOut}
                      className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-1"
                    >
                      <span>Library</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {isLibraryOpen && !isLoggingOut && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                      >
                        <Link
                          to="/applications"
                          onClick={() => setIsLibraryOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FolderOpen className="h-4 w-4" />
                          <span>Applications</span>
                        </Link>
                        <Link
                          to="/resume-library"
                          onClick={() => setIsLibraryOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Resume Library</span>
                        </Link>
                        <Link
                          to="/cover-letter-library"
                          onClick={() => setIsLibraryOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Cover Letter Library</span>
                        </Link>
                        <Link
                          to="/skill-gap-analysis-library"
                          onClick={() => setIsLibraryOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span>Skill Gap Analysis</span>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                disabled={isLoggingOut}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </motion.button>

              {isAuthenticated ? (
                /* User profile dropdown */
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    disabled={isLoggingOut}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600">
                      {user?.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Navbar: Failed to load profile picture:', user.profilePictureUrl);
                            // Hide the image and show fallback
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name}
                      </p>
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPlanBadgeColor(user?.plan || 'free')}`}>
                          {user?.plan}
                        </span>
                        {user?.plan === 'lifetime' && (
                          <Crown className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isProfileOpen && !isLoggingOut && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
                    >
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      <Link
                        to="/support"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Support</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Auth buttons */
                <div className="flex items-center space-x-2">
                  <Link
                    to="/auth"
                    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm font-medium transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  disabled={isLoggingOut}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && !isLoggingOut && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/dashboard"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/resume-analyzer"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Resume Analyzer
              </Link>
              <Link
                to="/cover-letter"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Cover Letter
              </Link>
              <Link
                to="/skill-gap-analysis"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Skill Gap Analysis
              </Link>
              <Link
                to="/applications"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Applications
              </Link>
              <Link
                to="/resume-library"
                className="block py-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Resume Library
              </Link>
            </div>
          </motion.div>
        )}
      </nav>
    </>
  );
};