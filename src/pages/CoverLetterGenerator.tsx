import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Zap, 
  Copy, 
  Download, 
  RefreshCw,
  MessageSquare,
  Briefcase,
  Heart,
  Clock
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { LiveChatButton } from '../components/LiveChatButton';
import toast from 'react-hot-toast';

/**
 * Cover letter generator component with tone selection and AI-powered personalization
 * Provides multiple templates and real-time preview functionality
 */
const CoverLetterGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUsage } = useAuthStore();
  
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    hiringManager: '',
    jobDescription: '',
    personalExperience: '',
    tone: 'professional' as 'professional' | 'enthusiastic' | 'concise',
  });
  
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  console.log('CoverLetterGenerator: Component mounted');

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('CoverLetterGenerator: User not authenticated, redirecting to landing page');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const tones = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'Formal and business-appropriate tone',
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'enthusiastic',
      name: 'Enthusiastic',
      description: 'Energetic and passionate tone',
      icon: Heart,
      color: 'from-red-500 to-pink-600',
    },
    {
      id: 'concise',
      name: 'Concise',
      description: 'Brief and to-the-point tone',
      icon: Clock,
      color: 'from-green-500 to-green-600',
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateCoverLetter = async () => {
    if (!formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('CoverLetterGenerator: Starting generation with tone:', formData.tone);
    setIsGenerating(true);
    updateUsage('coverLetters');

    try {
      // Simulate AI generation - replace with actual Claude API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      const templates = {
        professional: `Dear ${formData.hiringManager || 'Hiring Manager'},

I am writing to express my strong interest in the ${formData.jobTitle} position at ${formData.companyName}. With my background in software development and proven track record of delivering high-quality solutions, I am confident I would be a valuable addition to your team.

Based on your job posting, I understand you are seeking someone with experience in modern web technologies and collaborative development practices. In my previous roles, I have:

• Developed and maintained multiple React applications serving thousands of users
• Collaborated effectively with cross-functional teams using agile methodologies
• Implemented best practices for code quality, testing, and deployment

${formData.personalExperience ? `Additionally, ${formData.personalExperience.toLowerCase()}` : ''}

I am particularly drawn to ${formData.companyName} because of your commitment to innovation and technological excellence. I would welcome the opportunity to discuss how my skills and enthusiasm can contribute to your team's continued success.

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
[Your Name]`,

        enthusiastic: `Dear ${formData.hiringManager || 'Hiring Manager'},

I am absolutely excited to apply for the ${formData.jobTitle} position at ${formData.companyName}! Your job posting immediately caught my attention, and I can't wait to share why I'd be a perfect fit for your team.

What makes me particularly excited about this opportunity is how perfectly it aligns with my passion for technology and problem-solving. I've spent years honing my skills in:

🚀 Building engaging, user-friendly web applications with React and modern JavaScript
🤝 Thriving in collaborative environments where innovation happens
💡 Turning complex requirements into elegant, scalable solutions

${formData.personalExperience ? `I'm especially proud of ${formData.personalExperience.toLowerCase()}` : ''}

${formData.companyName} has always impressed me with its forward-thinking approach and commitment to excellence. I'm genuinely excited about the possibility of contributing my energy, creativity, and technical expertise to help drive your projects forward.

I would love the chance to discuss how my passion and skills can benefit your team. Thank you for considering my application!

Best regards,
[Your Name]`,

        concise: `Dear ${formData.hiringManager || 'Hiring Manager'},

I am applying for the ${formData.jobTitle} position at ${formData.companyName}.

Key qualifications:
• 3+ years React/JavaScript development
• Strong collaboration and agile experience
• Proven track record of successful project delivery

${formData.personalExperience ? `Recent achievement: ${formData.personalExperience}` : ''}

I am interested in contributing to ${formData.companyName}'s continued success and would welcome the opportunity to discuss my candidacy.

Thank you for your consideration.

Best regards,
[Your Name]`
      };

      setGeneratedLetter(templates[formData.tone]);
      toast.success('Cover letter generated successfully!');
      
    } catch (error) {
      console.error('CoverLetterGenerator: Generation failed:', error);
      toast.error('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success('Cover letter copied to clipboard!');
  };

  const downloadLetter = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.companyName}_${formData.jobTitle}_CoverLetter.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Cover letter downloaded!');
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cover Letter Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create personalized, compelling cover letters that make you stand out
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Job Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Job Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g., Google, Microsoft, Startup Inc."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Software Engineer, Product Manager"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hiring Manager Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="hiringManager"
                      value={formData.hiringManager}
                      onChange={handleInputChange}
                      placeholder="e.g., John Smith, Ms. Johnson"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Job Description *
                </h2>
                
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Paste the job description or key requirements here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Personal Experience */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Personal Highlights (Optional)
                </h2>
                
                <textarea
                  name="personalExperience"
                  value={formData.personalExperience}
                  onChange={handleInputChange}
                  placeholder="Share a specific achievement or experience that makes you stand out for this role..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* Tone Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Choose Tone
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {tones.map((tone) => (
                    <motion.button
                      key={tone.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData(prev => ({ ...prev, tone: tone.id as any }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.tone === tone.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${tone.color} flex items-center justify-center mb-3 mx-auto`}>
                        <tone.icon className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {tone.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tone.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateCoverLetter}
                disabled={isGenerating || !formData.companyName || !formData.jobTitle || !formData.jobDescription}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    <span>Generate Cover Letter</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Output Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {generatedLetter ? (
                <>
                  {/* Generated Letter */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Generated Cover Letter
                      </h2>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={copyToClipboard}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={generateCoverLetter}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                          title="Regenerate"
                        >
                          <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                        {generatedLetter}
                      </pre>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      onClick={downloadLetter}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Download className="h-5 w-5" />
                      <span>Download as TXT</span>
                    </button>
                    
                    <button
                      onClick={() => navigate('/applications')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>Save to Applications</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Placeholder */
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Ready to Generate
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Fill in the job details and click generate to create your personalized cover letter
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterGenerator;