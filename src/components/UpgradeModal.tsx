import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  Star,
  Infinity,
  Users,
  Clock,
  Mail,
  BarChart3,
  FileText,
  Download,
  Award,
  MessageSquare,
  Shield,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  lifetimeUserCount: number | null;
}

/**
 * Upgrade modal component displaying pricing plans and features
 * Shows different plan options with detailed feature comparisons
 * Handles plan upgrades and displays lifetime plan availability
 */
export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  lifetimeUserCount
}) => {
  const { upgradePlan } = useAuthStore();
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  console.log('UpgradeModal: Rendered with current plan:', currentPlan);
  console.log('UpgradeModal: Lifetime user count:', lifetimeUserCount);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Show PayPal payment options
  const initiatePayment = (plan: 'premium' | 'pro' | 'lifetime') => {
    console.log('UpgradeModal: Initiating payment for plan:', plan);
    setPaymentVisible(plan);
  };
  
  // Complete upgrade after successful payment
  const completeUpgrade = async (plan: 'premium' | 'pro' | 'lifetime') => {
    setIsUpgrading(plan);
    
    try {
      await upgradePlan(plan);
      toast.success(`Successfully upgraded to ${plan} plan!`);
      onClose();
    } catch (error) {
      console.error('UpgradeModal: Upgrade failed:', error);
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setIsUpgrading(null);
      setPaymentVisible(null);
    }
  };

  // Get plan amount based on selected plan and billing period
  const getPlanAmount = (plan: string): string => {
    if (plan === 'premium') {
      return isAnnual ? '79.99' : '7.99';
    } else if (plan === 'pro') {
      return isAnnual ? '149.99' : '14.99';
    } else if (plan === 'lifetime') {
      return '79.99';
    }
    return '0.00';
  };

  // Create PayPal order
  const createPayPalOrder = (plan: string) => {
    return async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paypal-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            planType: plan,
            isAnnual: isAnnual,
            amount: getPlanAmount(plan),
            currency: 'USD',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create order');
        }

        const order = await response.json();
        return order.id;
      } catch (error) {
        console.error('Failed to create PayPal order:', error);
        toast.error('Failed to initialize payment. Please try again.');
        setPaymentVisible(null);
        return null;
      }
    };
  };

  // Determine if lifetime plan should be shown (only for first 1000 users)
  const showLifetimePlan = lifetimeUserCount !== null && lifetimeUserCount < 1000;
  const lifetimeUsersRemaining = showLifetimePlan ? 1000 - (lifetimeUserCount || 0) : 0;

  const plans = [
    {
      name: 'Premium',
      id: 'premium',
      icon: Crown,
      monthlyPrice: 7.99,
      annualPrice: 79.99,
      description: 'Perfect for active job seekers',
      badge: 'Most Popular',
      features: [
        'Unlimited resume tailoring',
        'Advanced skill gap analysis',
        'Priority support',
        'Export to PDF/Word',
        'Application tracking',
        'Cover letter generation'
      ]
    },
    {
      name: 'Pro',
      id: 'pro',
      icon: Zap,
      monthlyPrice: 14.99,
      annualPrice: 149.99,
      description: 'For professionals and recruiters',
      badge: 'Best Value',
      features: [
        'Everything in Premium',
        'Advanced analytics dashboard',
        'Team collaboration tools',
        'Custom branding',
        'API access',
        'White-label solutions'
      ]
    }
  ];

  if (showLifetimePlan) {
    plans.push({
      name: 'Lifetime',
      id: 'lifetime',
      icon: Infinity,
      monthlyPrice: 0,
      annualPrice: 79.99,
      description: 'Limited time offer',
      badge: `Only ${lifetimeUsersRemaining} left!`,
      features: [
        'Everything in Premium forever',
        'No monthly fees',
        'Priority feature access',
        'Exclusive community access',
        'Lifetime updates',
        'VIP support'
      ]
    });
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Upgrade Your Plan
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Choose the perfect plan for your career journey
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mt-6">
              <span className={`mr-3 ${!isAnnual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`ml-3 ${isAnnual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                Annual
              </span>
              {isAnnual && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Save 20%
                </span>
              )}
            </div>
          </div>

          {/* Plans */}
          <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.id;
              const price = plan.id === 'lifetime' ? plan.annualPrice : (isAnnual ? plan.annualPrice : plan.monthlyPrice);
              const isPaymentActive = paymentVisible === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    plan.badge === 'Most Popular' || plan.badge === 'Best Value'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : isCurrentPlan
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
                      plan.badge === 'Most Popular' || plan.badge === 'Best Value'
                        ? 'bg-blue-600 text-white'
                        : plan.badge.includes('left')
                        ? 'bg-red-600 text-white'
                        : 'bg-green-600 text-white'
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Current Plan
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <Icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {plan.description}
                    </p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${price}
                      </span>
                      {plan.id !== 'lifetime' && (
                        <span className="text-gray-600 dark:text-gray-400">
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                      )}
                      {plan.id === 'lifetime' && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          One-time payment
                        </div>
                      )}
                    </div>

                    {/* Annual Savings */}
                    {isAnnual && plan.id !== 'lifetime' && (
                      <div className="text-sm text-green-600 font-semibold">
                        Save ${(plan.monthlyPrice * 12 - plan.annualPrice).toFixed(2)} per year
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button or Payment */}
                  {!isPaymentActive ? (
                    <button
                      onClick={() => initiatePayment(plan.id as 'premium' | 'pro' | 'lifetime')}
                      disabled={isCurrentPlan || isUpgrading === plan.id}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                        isCurrentPlan
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : isUpgrading === plan.id
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
                      }`}
                    >
                      {isCurrentPlan
                        ? 'Current Plan'
                        : isUpgrading === plan.id
                        ? 'Upgrading...'
                        : `Upgrade to ${plan.name}`
                      }
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <PayPalScriptProvider
                        options={{
                          "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "",
                          currency: "USD",
                        }}
                        onLoadScript={() => setPaypalLoaded(true)}
                      >
                        {paypalLoaded && (
                          <PayPalButtons
                            style={{ layout: "vertical" }}
                            createOrder={createPayPalOrder(plan.id)}
                            onApprove={async (data) => {
                              try {
                                // Verify payment with backend
                                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-paypal-payment`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                                  },
                                  body: JSON.stringify({
                                    orderID: data.orderID,
                                    planType: plan.id,
                                  }),
                                });

                                if (response.ok) {
                                  await completeUpgrade(plan.id as 'premium' | 'pro' | 'lifetime');
                                } else {
                                  throw new Error('Payment verification failed');
                                }
                              } catch (error) {
                                console.error('Payment approval failed:', error);
                                toast.error('Payment failed. Please try again.');
                                setPaymentVisible(null);
                              }
                            }}
                            onError={(err) => {
                              console.error('PayPal error:', err);
                              toast.error('Payment failed. Please try again.');
                              setPaymentVisible(null);
                            }}
                            onCancel={() => {
                              setPaymentVisible(null);
                            }}
                          />
                        )}
                      </PayPalScriptProvider>
                      
                      <button
                        onClick={() => setPaymentVisible(null)}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              All plans include a 30-day money-back guarantee. Cancel anytime.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};