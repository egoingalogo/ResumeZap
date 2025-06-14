import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Phone,
  MapPin,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

/**
 * Email support page with contact form and support information
 * Auto-fills user email and provides multiple support categories
 */
const EmailSupport: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  console.log('EmailSupport: Component mounted for user:', user?.email);

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('EmailSupport: User not authenticated, redirecting');
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Auto-fill user data when component mounts or user changes
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  const categories = [
    { value: 'general', label: 'General Inquiry', description: 'General questions about ResumeZap' },
    { value: 'technical', label: 'Technical Issue', description: 'Bugs, errors, or technical problems' },
    { value: 'billing', label: 'Billing & Subscription', description: 'Payment, subscription, or billing questions' },
    { value: 'feature', label: 'Feature Request', description: 'Suggest new features or improvements' },
    { value: 'account', label: 'Account Management', description: 'Account settings, password, or profile issues' },
    { value: 'feedback', label: 'Feedback', description: 'Share your experience or suggestions' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400', description: 'Non-urgent inquiry' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400', description: 'Standard priority' },
    { value: 'high', label: 'High', color: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400', description: 'Urgent issue' },
  ];

  const responseTimeInfo = {
    free: { time: '48-72 hours', description: 'Email support during business hours' },
    premium: { time: '24-48 hours', description: 'Priority email support' },
    pro: { time: '12-24 hours', description: 'Priority support with live chat option' },
    lifetime: { time: '12-24 hours', description: 'VIP support with priority handling' },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('EmailSupport: Submitting support request:', formData);
    setIsSubmitting(true);

    try {
      // Simulate API call to send email - replace with actual email service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      toast.success('Support request sent successfully!');
      console.log('EmailSupport: Support request submitted successfully');
      
    } catch (error) {
      console.error('EmailSupport: Failed to send support request:', error);
      toast.error('Failed to send support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      subject: '',
      category: 'general',
      priority: 'medium',
      message: '',
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const currentResponseTime = responseTimeInfo[user.plan];

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
              Email Support
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get help from our support team. We're here to assist you with any questions or issues.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              {!isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Contact Support
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Fill out the form below and we'll get back to you soon
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white bg-gray-50 dark:bg-gray-600"
                          placeholder="your@email.com"
                          readOnly
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Auto-filled from your account
                        </p>
                      </div>
                    </div>

                    {/* Category and Priority */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category *
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                        >
                          {categories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {categories.find(c => c.value === formData.category)?.description}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority *
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                        >
                          {priorities.map((priority) => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {priorities.find(p => p.value === formData.priority)?.description}
                        </p>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                        placeholder="Please provide detailed information about your inquiry, including any error messages, steps to reproduce issues, or specific questions you have..."
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formData.message.length}/1000 characters
                      </p>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Send Support Request</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                /* Success Message */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Support Request Sent!
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Thank you for contacting us. We've received your support request and will respond within{' '}
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {currentResponseTime.time}
                    </span>.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Request Details:
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div><strong>Category:</strong> {categories.find(c => c.value === formData.category)?.label}</div>
                      <div><strong>Priority:</strong> {priorities.find(p => p.value === formData.priority)?.label}</div>
                      <div><strong>Subject:</strong> {formData.subject}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Send Another Request
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Support Information Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Response Time */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Response Time
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Your Plan:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize">
                      {user.plan}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Expected Response:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {currentResponseTime.time}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentResponseTime.description}
                  </p>
                </div>
              </div>

              {/* Contact Methods */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Other Ways to Reach Us
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Email</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">support@resumezap.com</div>
                    </div>
                  </div>
                  
                  {(user.plan === 'pro' || user.plan === 'lifetime') && (
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Live Chat</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Available 9 AM - 6 PM EST</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Help Center</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">help.resumezap.com</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Quick Links */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Help
                </h3>
                
                <div className="space-y-3">
                  {[
                    'How to upload a resume',
                    'Understanding match scores',
                    'Billing and subscription',
                    'Account settings',
                    'Export formats',
                  ].map((item, index) => (
                    <button
                      key={index}
                      className="w-full text-left text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="font-semibold text-red-900 dark:text-red-400">
                    Urgent Issues
                  </h3>
                </div>
                
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  For account security issues or billing emergencies:
                </p>
                
                <div className="text-sm text-red-800 dark:text-red-200">
                  <div className="font-medium">urgent@resumezap.com</div>
                  <div className="text-xs mt-1">Response within 4 hours</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSupport;