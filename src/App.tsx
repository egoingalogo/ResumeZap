import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import SkillGapAnalysis from './pages/SkillGapAnalysis';
import ApplicationTracker from './pages/ApplicationTracker';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';
import { useThemeStore } from './store/themeStore';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * Main App component that handles routing and global theme management
 * Provides error boundary protection and toast notifications
 */
function App() {
  const { isDarkMode } = useThemeStore();

  // Debug log for dark mode state
  console.log('App: isDarkMode state:', isDarkMode);

  console.log('App: Initializing ResumeZap application');

  return (
    <ErrorBoundary>
      <div className={isDarkMode ? 'dark' : ''}>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
              <Route path="/cover-letter" element={<CoverLetterGenerator />} />
              <Route path="/skill-gap-analysis" element={<SkillGapAnalysis />} />
              <Route path="/applications" element={<ApplicationTracker />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </div>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;