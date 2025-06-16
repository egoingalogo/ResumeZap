import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Target, 
  Brain, 
  FileText, 
  BarChart3, 
  Users, 
  Star,
  ChevronRight,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { PricingCard } from '../components/PricingCard';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { LiveChatButton } from '../components/LiveChatButton';
import toast from 'react-hot-toast';

/**
 * Landing page component with hero section, features, pricing, and testimonials
 * Implements smooth scrolling, animations, and responsive design
 */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, upgradePlan } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [isScrolled, setIsScrolled] = useState(false);

  // Debug log for dark mode state
  console.log('LandingPage: isDarkMode state:', isDarkMode);

  console.log('LandingPage: Component mounted');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    console.log('LandingPage: Get started button clicked');
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=register');
    }
  };

  const handlePlanSelection = (plan: 'premium' | 'pro' | 'lifetime') => {
    console.log('LandingPage: Plan selected:', plan);
    if (isAuthenticated) {
      upgradePlan(plan);
      toast.success(`Successfully upgraded to ${plan} plan!`);
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=register&plan=' + plan);
    }
  };

  const features = [
    {
      icon: Target,
      title: 'AI-Powered Resume Tailoring',
      description: 'Transform your resume with AI to perfectly match job requirements and increase your interview chances.',
    },
    {
      icon: Brain,
      title: 'Intelligent Skill Gap Analysis & AI Learning Recommendations',
      description: 'Identify missing skills and get personalized learning recommendations with step-by-step development roadmaps.',
    },
    {
      icon: FileText,
      title: 'Dynamic Cover Letter Generation',
      description: 'Generate compelling, personalized cover letters that highlight your unique value proposition for each role.',
    },
    {
      icon: BarChart3,
      title: 'ATS Optimization & Scoring',
      description: 'Ensure your resume passes applicant tracking systems with our ATS-friendly formatting and match scoring.',
    },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started with essential resume optimization',
      features: [
        '3 resume tailoring sessions per month',
        '2 cover letter generations per month',
        'Basic skill gap analysis',
        'Standard export formats (PDF, DOCX)',
        'Email support only',
        'Basic learning resource suggestions',
      ],
      buttonText: 'Get Started Free',
      onSelect: handleGetStarted,
    },
    {
      name: 'Premium',
      price: '$7.99',
      period: '/month',
      description: 'Enhanced features for serious job seekers',
      features: [
        '40 resume tailoring sessions per month',
        '30 cover letter generations per month',
        'Enhanced skill gap analysis with priority ranking',
        'Detailed AI learning recommendations with time estimates',
        'Multiple resume version storage',
        'Priority email support',
        'Usage analytics dashboard',
      ],
      isPopular: true,
      buttonText: 'Start Premium',
      onSelect: () => handlePlanSelection('premium'),
    },
    {
      name: 'Pro',
      price: '$14.99',
      period: '/month',
      description: 'Complete suite for serious professionals',
      features: [
        'Unlimited resume tailoring',
        'Unlimited cover letter generation',
        'Advanced skill gap analysis with development roadmaps',
        'Comprehensive AI learning recommendations including certification pathways',
        'Unlimited document storage and version history',
        'Advanced analytics and success tracking',
        'Live chat support',
        'Custom cover letter templates',
        'Bulk processing for multiple job applications',
      ],
      buttonText: 'Go Pro',
      onSelect: () => handlePlanSelection('pro'),
    },
    {
      name: 'Lifetime',
      price: '$79.99',
      period: 'one-time',
      description: 'Limited early adopter offer - all Pro features forever',
      features: [
        'All Pro Plan features permanently',
        'Exclusive early adopter badge',
        'Direct feedback channel to development team',
        '30-day early access to future feature updates before general release',
        'Limited to first 1,000 customers',
        '60-day money-back guarantee',
      ],
      isLifetime: true,
      buttonText: 'Claim Lifetime Deal',
      onSelect: () => handlePlanSelection('lifetime'),
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'Google',
      content: 'ResumeZap helped me land my dream job at Google. The AI tailoring increased my interview rate by 300%!',
      rating: 5,
    },
    {
      name: 'Michael Rodriguez',
      role: 'Product Manager',
      company: 'Microsoft',
      content: 'The skill gap analysis was a game-changer. I focused my learning and got promoted within 6 months.',
      rating: 5,
    },
    {
      name: 'Emily Johnson',
      role: 'Data Scientist',
      company: 'Netflix',
      content: 'Best investment for my career. The cover letter generator alone saved me hours and improved my response rate.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Navbar isScrolled={isScrolled} />
      
      {/* Floating Dark Mode Toggle */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-40 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
        aria-label="Toggle dark mode"
      >
        <div className="relative w-6 h-6">
          <motion.div
            initial={false}
            animate={{
              scale: isDarkMode ? 0 : 1,
              rotate: isDarkMode ? 180 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Sun className="w-6 h-6 text-yellow-500" />
          </motion.div>
          <motion.div
            initial={false}
            animate={{
              scale: isDarkMode ? 1 : 0,
              rotate: isDarkMode ? 0 : -180,
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Moon className="w-6 h-6 text-blue-400" />
          </motion.div>
        </div>
      </motion.button>
      
      {/* Live Chat Button for Pro & Lifetime users */}
      <LiveChatButton />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full text-purple-600 dark:text-purple-400 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Transform Your Resume with{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Power
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Land your dream job with AI-powered resume tailoring, intelligent skill gap analysis, 
              and personalized cover letters that get you noticed by hiring managers.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ChevronRight className="h-5 w-5" />
              </motion.button>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No credit card required • 2 free sessions
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
          >
            {[
              { number: '10K+', label: 'Resumes Optimized' },
              { number: '85%', label: 'Interview Rate Increase' },
              { number: '50+', label: 'Industries Supported' },
              { number: '4.9/5', label: 'User Rating' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our AI-powered platform provides comprehensive tools to optimize your job search 
              and accelerate your career growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of successful job seekers who've transformed their careers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Career Acceleration Plan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start free and upgrade as your job search intensifies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingTiers.map((tier, index) => (
              <PricingCard key={index} tier={tier} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-800 dark:to-blue-800 rounded-3xl p-12 text-white shadow-2xl"
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of professionals who've accelerated their job search with AI
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <Zap className="h-5 w-5" />
              <span>Start Your Journey</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white dark:text-gray-200 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">ResumeZap</span>
            </div>
            
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              © 2025 ResumeZap. All rights reserved. Powered by AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

export default LandingPage