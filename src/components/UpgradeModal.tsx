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
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

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
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        { icon: FileText, text: '1 resume tailoring session/month', included: true },
        { icon: Mail, text: '2 cover letter generations/month', included: true },
        { icon: BarChart3, text: '2 skill gap analysis/month', included: true },
        { icon: Download, text: 'Export to PDF only', included: true },
        { icon: MessageSquare, text: 'Email support (48-72 hours)', included: true },
      ],
      buttonText: 'Current Plan',
      buttonStyle: 'bg-gray-400 cursor-not-allowed text-white',
      isPopular: false,
      current: currentPlan === 'free',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: isAnnual ? '$79.99' : '$7.99',
      period: isAnnual ? '/year' : '/month',
      originalPrice: isAnnual ? '$95.88' : null,
      savings: isAnnual ? 'Save $15.89' : null,
      description: 'For active job seekers',
      features: [
        { icon: FileText, text: '20 resume tailoring sessions/month', included: true },
        { icon: Mail, text: '25 cover letter generations/month', included: true },
        { icon: BarChart3, text: '20 skill gap analysis/month', included: true },
        { icon: Download, text: 'All export formats (PDF, RTF, TXT)', included: true },
        { icon: MessageSquare, text: 'Priority email support (24-48 hours)', included: true },
      ],
      buttonText: currentPlan === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      buttonStyle: currentPlan === 'premium' 
        ? 'bg-gray-400 cursor-not-allowed text-white' 
        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
      isPopular: true,
      current: currentPlan === 'premium',
      disabled: currentPlan === 'pro' || currentPlan === 'lifetime',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: isAnnual ? '$149.99' : '$14.99',
      period: isAnnual ? '/year' : '/month',
      originalPrice: isAnnual ? '$179.88' : null,
      savings: isAnnual ? 'Save $29.89' : null,
      description: 'For career professionals',
      features: [
        { icon: Infinity, text: 'Unlimited resume tailoring', included: true },
        { icon: Infinity, text: 'Unlimited cover letters', included: true },
        { icon: Infinity, text: 'Unlimited skill gap analysis', included: true },
        { icon: Download, text: 'All export formats (PDF, RTF, TXT)', included: true },
        { icon: MessageSquare, text: 'Priority email support (4 hours)', included: true },
        { icon: Users, text: 'Bulk processing capabilities', included: true },
      ],
      buttonText: currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      buttonStyle: currentPlan === 'pro' 
        ? 'bg-gray-400 cursor-not-allowed text-white' 
        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white',
      isPopular: false,
      current: currentPlan === 'pro',
      disabled: currentPlan === 'lifetime',
    },
  ];

  // Add lifetime plan if available
  if (showLifetimePlan) {
    plans.push({
      id: 'lifetime',
      name: 'Lifetime',
      price: '$79.99',
      period: 'one-time',
      description: 'Limited early adopter offer',
      features: [
        { icon: Infinity, text: 'All Pro features permanently', included: true },
        { icon: Award, text: 'Exclusive early adopter badge', included: true },
        { icon: MessageSquare, text: 'Direct feedback channel to development team', included: true },
        { icon: Calendar, text: '30-day early access to future feature updates before general release', included: true },
        { icon: Shield, text: '60-day money-back guarantee', included: true },
      ],
      buttonText: currentPlan === 'lifetime' ? 'Current Plan' : 'Get Lifetime Access',
      buttonStyle: currentPlan === 'lifetime' 
        ? 'bg-gray-400 cursor-not-allowed text-white' 
        : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white',
      isPopular: true,
      current: currentPlan === 'lifetime',
    });
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Choose Your Plan
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Unlock the full power of AI-driven career acceleration
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Lifetime Plan Alert */}
          {showLifetimePlan && (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-b border-amber-200 dark:border-amber-800 p-4">
              <div className="flex items-center space-x-3">
                <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                    🔥 Limited Time: Lifetime Plan Available
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-500">
                    Only {lifetimeUsersRemaining} lifetime memberships remaining for early adopters
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-6">
            <span className={`text-gray-600 dark:text-gray-400 mr-3 ${!isAnnual ? 'font-medium' : ''}`}>Monthly</span>
            <div className="relative">
              <input
                type="checkbox"
                id="modal-billing-toggle"
                className="sr-only"
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
              />
              <label
                htmlFor="modal-billing-toggle"
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
            <span className={`text-gray-600 dark:text-gray-400 ml-3 ${isAnnual ? 'font-medium' : ''}`}>
              Annual 
              <span className="text-green-600 dark:text-green-400 font-medium ml-1">(Save 17%)</span>
            </span>
          </div>

          {/* Plans Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={`grid gap-6 ${showLifetimePlan ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: plans.indexOf(plan) * 0.1 }}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                    plan.isPopular 
                      ? 'border-purple-500 shadow-lg ring-2 ring-purple-500/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  } ${plan.current ? 'opacity-75' : ''}`}
                >
                  {/* Popular Badge */}
                  {plan.isPopular && !plan.current && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        {plan.id === 'lifetime' ? 'Limited Time' : 'Most Popular'}
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {plan.period}
                      </span>
                    </div>
                    {plan.originalPrice && plan.savings && (
                      <div className="text-center mt-1 mb-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                          {plan.originalPrice}
                        </span>
                        <span className="text-sm text-green-600 dark:text-green-400 ml-2 font-medium">
                          {plan.savings}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 p-1 rounded-full ${
                          feature.included 
                            ? 'bg-green-100 dark:bg-green-900/20' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          {feature.included ? (
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        <span className={`text-sm ${
                          feature.included 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => plan.current || plan.disabled ? null : initiatePayment(plan.id as any)}
                    disabled={plan.current || isUpgrading === plan.id || plan.disabled}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${plan.buttonStyle}`}
                    title={plan.disabled ? `You already have a ${currentPlan} plan which includes these features` : ''}
                  >
                    {isUpgrading === plan.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Upgrading...</span>
                      </>
                    ) : (
                      <span>{plan.disabled ? `Included in ${currentPlan}` : plan.buttonText}</span>
                    )}

                    {paymentVisible === plan.id && (
                      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700">
                          <h3 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">
                            Upgrade to {plan.name} Plan
                          </h3>
                          
                          <div className="mb-6 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {plan.price} {plan.period}
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {plan.id === 'lifetime' ? 'One-time payment' : isAnnual ? 'Annual billing' : 'Monthly billing'}
                            </p>
                          </div>
                          
                          <div className="mb-6">
                            <PayPalScriptProvider
                              options={{
                                clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb',
                                currency: 'USD',
                                intent: 'capture',
                                components: 'buttons',
                                onLoad: () => setPaypalLoaded(true),
                              }}
                            >
                              {!paypalLoaded && (
                                <div className="flex items-center justify-center h-12">
                                  <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading payment options...</span>
                                </div>
                              )}

                              <PayPalButtons
                                style={{
                                  layout: 'vertical',
                                  shape: 'rect',
                                  color: 'blue',
                                }}
                                createOrder={createPayPalOrder(plan.id)}
                                onApprove={async (data) => {
                                  try {
                                    // Verify payment on server
                                    const verifyResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-paypal-payment`, {
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
                                    
                                    if (!verifyResponse.ok) {
                                      const errorData = await verifyResponse.json();
                                      throw new Error(errorData.error || 'Payment verification failed');
                                    }
                                    
                                    // Payment successful - upgrade plan
                                    await completeUpgrade(plan.id as any);
                                    toast.success(`Successfully upgraded to ${plan.name} plan!`);
                                  } catch (error) {
                                    console.error('Payment verification failed:', error);
                                    toast.error('Payment verification failed. Please contact support.');
                                  }
                                }}
                                onCancel={() => {
                                  toast.info('Payment cancelled');
                                  setPaymentVisible(null);
                                }}
                                onError={(err) => {
                                  console.error('PayPal error:', err);
                                  toast.error('Payment failed. Please try again.');
                                  setPaymentVisible(null);
                                }}
                              />
                            </PayPalScriptProvider>
                          </div>
                          
                          <div className="flex justify-center">
                            <button
                              onClick={() => setPaymentVisible(null)}
                              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Lifetime Plan Special Note */}
                  {plan.id === 'lifetime' && !plan.current && (
                    <div className="mt-4 text-center">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        🎉 Early Adopter Special
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Help shape ResumeZap's future
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All plans include secure data encryption and can be cancelled anytime.
              </p>
              {showLifetimePlan && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Lifetime plan price will increase after the first 1,000 members.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};