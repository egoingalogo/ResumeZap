import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Target, 
  Brain, 
  FileText, 
  Mail, 
  BarChart3,
  CheckCircle,
  Star,
  ArrowRight,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Award,
  Sparkles,
  Crown,
  Heart,
  Briefcase
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { PricingCard } from '../components/PricingCard';
import { useAuthStore } from '../store/authStore';
import { getLifetimeUserCount } from '../lib/supabase';

/**
 * Landing page component with hero section, features, pricing, and testimonials
 * Showcases ResumeZap's AI-powered resume optimization capabilities
 * Includes responsive design and smooth animations throughout
 */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, lifetimeUserCount, fetchLifetimeUserCount } = useAuthStore();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAnnual, setIsAnnual] = useState(false);

  console.log('LandingPage: Component mounted');

  useEffect(() => {
    // Fetch lifetime user count on component mount
    fetchLifetimeUserCount();
  }, [fetchLifetimeUserCount]);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI analyzes your resume against job requirements and provides detailed optimization recommendations.',
      color: 'from-purple-500 to-blue-500',
    },
    {
      icon: Target,
      title: 'ATS Optimization',
      description: 'Ensure your resume passes Applicant Tracking Systems with keyword optimization and formatting improvements.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FileText,
      title: 'Smart Tailoring',
      description: 'Automatically tailor your resume for specific job postings with intelligent content suggestions.',
      color: 'from-cyan-500 to-teal-500',
    },
    {
      icon: Mail,
      title: 'Cover Letter Generator',
      description: 'Generate compelling, personalized cover letters that complement your optimized resume.',
      color: 'from-teal-500 to-green-500',
    },
    {
      icon: BarChart3,
      title: 'Skill Gap Analysis',
      description: 'Identify missing skills and get personalized learning recommendations to advance your career.',
      color: 'from-green-500 to-yellow-500',
    },
    {
      icon: TrendingUp,
      title: 'Application Tracking',
      description: 'Track your job applications, interview progress, and success metrics in one organized dashboard.',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'Google',
      content: 'ResumeZap helped me land my dream job at Google! The AI suggestions were spot-on and improved my resume significantly.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Product Manager',
      company: 'Microsoft',
      content: 'The skill gap analysis feature is incredible. It showed me exactly what I needed to learn to advance my career.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    },
    {
      name: 'Emily Johnson',
      role: 'Data Scientist',
      company: 'Amazon',
      content: 'I got 3x more interview calls after using ResumeZap. The ATS optimization really works!',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    },
  ];

  const stats = [
    { number: '50,000+', label: 'Resumes Optimized' },
    { number: '85%', label: 'Success Rate' },
    { number: '3x', label: 'More Interviews' },
    { number: '24/7', label: 'AI Support' },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      {/* Bolt Badge */}
      <div className="fixed top-20 right-4 z-40 lg:top-24 lg:right-8">
        <motion.a
          href="https://bolt.new/"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="block"
        >
          <img
            src="/white_circle_360x360.png"
            alt="Powered by Bolt"
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 
                     hover:shadow-lg transition-all duration-300 rounded-full
                     filter hover:brightness-110"
            loading="lazy"
          />
        </motion.a>
      </div>
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AI-Powered
                </span>
                <br />
                Resume Optimization
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Transform your resume with cutting-edge AI technology. Get more interviews, 
                land better jobs, and accelerate your career growth.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="border-1 border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Learn More
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {' '}Career Success
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our comprehensive suite of AI-powered tools helps you optimize every aspect of your job search
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Your
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {' '}Success Plan
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Start free and upgrade as you grow. All plans include our core AI optimization features.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mt-8 mb-8">
              <span className="text-gray-600 dark:text-gray-400 mr-3">Monthly</span>
              <div className="relative">
                <input
                  type="checkbox"
                  id="billing-toggle"
                  className="sr-only"
                  onChange={(e) => setIsAnnual(e.target.checked)}
                />
                <label
                  htmlFor="billing-toggle"
                  className="flex items-center cursor-pointer"
                >
                  <div className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                    isAnnual ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                      isAnnual ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>
              <span className="text-gray-600 dark:text-gray-400 ml-3">
                Annual 
                <span className="text-green-600 dark:text-green-400 font-medium ml-1">(Save 17%)</span>
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <PricingCard
                tier={{
                  name: "Free",
                  price: "$0",
                  period: "forever",
                  description: "Perfect for getting started with AI resume optimization",
                  features: [
                    '3 resume tailoring sessions/month',
                    '2 cover letter generations/month',
                    'Basic skill gap analysis',
                    'Email support (48-72 hours)',
                    'Export to PDF, DOCX, TXT'
                  ],
                  buttonText: "Get Started Free"
                }}
                onSelect={() => handleGetStarted()}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <PricingCard
                tier={{
                  name: "Premium",
                  price: isAnnual ? "$79.99" : "$7.99",
                  period: isAnnual ? "/year" : "/month",
                  description: "Enhanced features for active job seekers",
                  features: [
                    '40 resume tailoring sessions/month',
                    '30 cover letter generations/month',
                    'Enhanced skill gap analysis',
                    'Priority email support (24-48 hours)',
                    'Usage analytics dashboard',
                    'All export formats',
                    ...(isAnnual ? ['Save $16/year vs monthly'] : [])
                  ],
                  buttonText: "Upgrade to Premium",
                  isPopular: true
                }}
                onSelect={() => handleGetStarted()}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <PricingCard
                tier={{
                  name: "Pro",
                  price: isAnnual ? "$149.99" : "$14.99",
                  period: isAnnual ? "/year" : "/month",
                  description: "Advanced tools for career professionals",
                  features: [
                    'Unlimited resume tailoring',
                    'Unlimited cover letters',
                    'Advanced skill gap analysis',
                    'Priority email support (4 hours)',
                    'Advanced analytics & tracking',
                    'Custom templates',
                    'Bulk processing',
                    ...(isAnnual ? ['Save $30/year vs monthly'] : [])
                  ],
                  buttonText: "Go Pro"
                }}
                onSelect={() => handleGetStarted()}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <PricingCard
                tier={{
                  name: "Lifetime",
                  price: "$79.99",
                  period: "one-time",
                  description: "All Pro features forever - limited time offer",
                  features: [
                    'All Pro features permanently',
                    'Unlimited everything forever',
                    'VIP support & early access',
                    'Future feature updates included',
                    '60-day money-back guarantee',
                    `Limited to first 1,000 customers`,
                    lifetimeUserCount !== null ? `${Math.max(0, 1000 - lifetimeUserCount)} spots remaining` : 'Limited availability'
                  ],
                  buttonText: "Get Lifetime Access",
                  isLifetime: true
                }}
                onSelect={() => handleGetStarted()}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have accelerated their careers with AI-powered resume optimization.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Your Success Story
              <ArrowRight className="inline-block ml-2 h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold">ResumeZap</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                AI-powered resume optimization platform helping professionals land their dream jobs with intelligent career tools.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Shield className="h-4 w-4" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>24/7 Available</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Resume Analysis</li>
                <li>Cover Letter Generator</li>
                <li>Skill Gap Analysis</li>
                <li>Application Tracking</li>
                <li>ATS Optimization</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button 
                    onClick={() => navigate('/support')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Contact Us
                  </button>
                </li>
                <li>Help Center</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ResumeZap. All rights reserved. Accelerate your career with AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;