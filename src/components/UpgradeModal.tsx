import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  Star,
  CreditCard,
  Shield,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'free' | 'premium' | 'pro' | 'lifetime';
  lifetimeUserCount?: number | null;
}

/**
 * Upgrade modal component for in-app plan upgrades
 * Provides seamless upgrade experience without redirecting to landing page
 * Prevents body scroll and ensures proper content visibility
 * Handles lifetime quota checking based on current user count
 */
export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  currentPlan = 'free',
  lifetimeUserCount = null
}) => {
  const { upgradePlan, user } = useAuthStore();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'pro' | 'lifetime' | null>(null);

  console.log('UpgradeModal: Rendered with current plan:', currentPlan);
  console.log('UpgradeModal: Lifetime user count:', lifetimeUserCount);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Check if lifetime quota has been reached
  const isLifetimeQuotaReached = lifetimeUserCount !== null && lifetimeUserCount >= 1000;

  const plans = [
    {
      id: 'premium' as const,
      name: 'Premium',
      price: isAnnual ? '$79.99' : '$7.99',
      period: isAnnual ? '/year' : '/month',
      originalPrice: isAnnual ? '$95.88' : null,
      savings: isAnnual ? 'Save $16 annually' : null,
      description: 'Enhanced features for serious job seekers',
      icon: Star,
      color: 'from-blue-500 to-blue-600',
      features: [
        '40 resume tailoring sessions per month',
        '30 cover letter generations per month',
        'Enhanced skill gap analysis with priority ranking',
        'Detailed AI learning recommendations with time estimates',
        'Multiple resume version storage',
        'Priority email support (24-48 hours)',
        'Usage analytics dashboard',
      ],
      isPopular: true,
      disabled: currentPlan === 'premium' || currentPlan === 'pro' || currentPlan === 'lifetime',
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: isAnnual ? '$149.99' : '$14.99',
      period: isAnnual ? '/year' : '/month',
      originalPrice: isAnnual ? '$179.88' : null,
      savings: isAnnual ? 'Save $30 annually' : null,
      description: 'Complete suite for serious professionals',
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
      features: [
        'Unlimited resume tailoring',
        'Unlimited cover letter generation',
        'Advanced skill gap analysis with development roadmaps',
        'Comprehensive AI learning recommendations including certification pathways',
        'Unlimited document storage and version history',
        'Advanced analytics and success tracking',
        'Priority email support (4 hours)',
        'Custom cover letter templates',
        'Bulk processing for multiple job applications',
      ],
      disabled: currentPlan === 'pro' || currentPlan === 'lifetime',
    },
    {
      id: 'lifetime' as const,
      name: 'Lifetime',
      price: '$79.99',
      period: 'one-time',
      description: isLifetimeQuotaReached 
        ? 'Limited early adopter offer - SOLD OUT' 
        : `Limited early adopter offer - all Pro features forever (${lifetimeUserCount || 0}/1000 claimed)`,
      icon: Crown,
      color: 'from-amber-500 to-orange-500',
      features: [
        'All Pro Plan features permanently',
        'Exclusive early adopter badge',
        'Direct feedback channel to development team',
        'VIP email support (4 hours)',
        '30-day early access to future feature updates before general release',
        isLifetimeQuotaReached 
          ? 'Limited to first 1,000 customers - QUOTA REACHED'
          : `Limited to first 1,000 customers (${1000 - (lifetimeUserCount || 0)} remaining)`,
        '60-day money-back guarantee',
      ],
      isLifetime: true,
      disabled: currentPlan === 'lifetime' || isLifetimeQuotaReached,
    },
  ];

  const handleUpgrade = async (planId: 'premium' | 'pro' | 'lifetime') => {
    console.log('UpgradeModal: Upgrading to plan:', planId);
    
    // Additional check for lifetime quota
    if (planId === 'lifetime' && isLifetimeQuotaReached) {
      toast.error('Lifetime plan quota has been reached. Please choose a different plan.');
      return;
    }
    
    setIsProcessing(true);
    setSelectedPlan(planId);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the plan in the store
      await upgradePlan(planId);
      
      toast.success(`Successfully upgraded to ${planId} plan!`);
      onClose();
    } catch (error) {
      console.error('UpgradeModal: Upgrade failed:', error);
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'lifetime': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Upgrade Your Plan
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Unlock more features and accelerate your job search
              </p>
            </div>
            
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Current Plan Info */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Plan:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(currentPlan)}`}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </span>
                {currentPlan === 'lifetime' && (
                  <Crown className="h-4 w-4 text-amber-500" />
                )}
              </div>
              
              {user && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Usage this month: {user.usageThisMonth.resumeTailoring + user.usageThisMonth.coverLetters} actions
                </div>
              )}
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center">
                <button
                  onClick={() => setIsAnnual(false)}
                  disabled={isProcessing}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                    !isAnnual
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  disabled={isProcessing}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 relative disabled:opacity-50 ${
                    isAnnual
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Annual
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Save
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Plans - Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const PlanIcon = plan.icon;
                  const isCurrentlySelected = selectedPlan === plan.id;
                  const isCurrentPlan = currentPlan === plan.id;
                  
                  return (
                    <motion.div
                      key={plan.id}
                      whileHover={{ scale: plan.disabled ? 1 : 1.02 }}
                      className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border transition-all duration-300 ${
                        plan.isPopular && !plan.disabled
                          ? 'border-purple-500 ring-2 ring-purple-500/20' 
                          : plan.disabled
                          ? 'border-gray-200 dark:border-gray-700 opacity-60'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                      }`}
                    >
                      {/* Popular badge */}
                      {plan.isPopular && !plan.disabled && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                          <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                            Most Popular
                          </span>
                        </div>
                      )}

                      {/* Lifetime badge */}
                      {plan.isLifetime && !plan.disabled && (
                        <div className="absolute -top-3 right-4 z-10">
                          <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 whitespace-nowrap">
                            <Crown className="h-4 w-4" />
                            <span>Limited Time</span>
                          </div>
                        </div>
                      )}

                      {/* Sold out badge for lifetime */}
                      {plan.isLifetime && isLifetimeQuotaReached && (
                        <div className="absolute -top-3 right-4 z-10">
                          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 whitespace-nowrap">
                            <X className="h-4 w-4" />
                            <span>Sold Out</span>
                          </div>
                        </div>
                      )}

                      {/* Current plan badge */}
                      {isCurrentPlan && (
                        <div className="absolute -top-3 left-4 z-10">
                          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 whitespace-nowrap">
                            <Check className="h-4 w-4" />
                            <span>Current Plan</span>
                          </div>
                        </div>
                      )}

                      {/* Header */}
                      <div className="text-center mb-6 pt-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4 mx-auto`}>
                          <PlanIcon className="h-6 w-6 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {plan.name}
                        </h3>
                        
                        <div className="flex items-baseline justify-center mb-4">
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            {plan.price}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            {plan.period}
                          </span>
                        </div>
                        
                        {plan.originalPrice && plan.savings && (
                          <div className="text-center mb-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                              {plan.originalPrice}
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400 ml-2 font-medium">
                              {plan.savings}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {plan.description}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                              plan.isPopular && !plan.disabled
                                ? 'bg-purple-100 dark:bg-purple-900' 
                                : 'bg-green-100 dark:bg-green-900'
                            }`}>
                              <Check className={`h-3 w-3 ${
                                plan.isPopular && !plan.disabled
                                  ? 'text-purple-600 dark:text-purple-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`} />
                            </div>
                            <span className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={plan.disabled || isProcessing}
                        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                          plan.disabled
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            : isCurrentlySelected && isProcessing
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : plan.isPopular
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                            : plan.isLifetime
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'
                        }`}
                      >
                        {isCurrentlySelected && isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : plan.disabled ? (
                          isCurrentPlan ? 'Current Plan' : 
                          (plan.isLifetime && isLifetimeQuotaReached) ? 'Sold Out' : 'Not Available'
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            <span>Upgrade to {plan.name}</span>
                          </>
                        )}
                      </button>

                      {/* Guarantee for lifetime */}
                      {plan.isLifetime && !plan.disabled && (
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                          60-day money-back guarantee
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Instant Activation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};