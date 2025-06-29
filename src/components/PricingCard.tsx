import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap } from 'lucide-react';
import { PayPalButton } from './PayPalButton';

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  originalPrice?: string | null;
  savings?: string | null;
  originalPrice?: string | null;
  savings?: string | null;
  description: string;
  features: string[];
  isPopular?: boolean;
  isLifetime?: boolean;
  buttonText: string;
  onSelect: () => void;
  planId?: string;
  isAnnual?: boolean;
  showPayPalButton?: boolean;
  disabled?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
  index: number;
}

/**
 * Pricing card component with glassmorphic design and feature highlighting
 * Handles different subscription tiers with visual emphasis for popular plans
 */
export const PricingCard: React.FC<PricingCardProps> = ({ tier, index }) => {
  console.log('PricingCard: Rendering tier:', tier.name);

  // Determine plan type for PayPal integration
  const getPlanType = (name: string): 'premium' | 'pro' | 'lifetime' => {
    if (name.toLowerCase() === 'premium') return 'premium';
    if (name.toLowerCase() === 'pro') return 'pro';
    if (name.toLowerCase() === 'lifetime') return 'lifetime';
    return 'premium'; // Default fallback
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border transition-all duration-300 hover:shadow-2xl ${
        tier.isPopular 
          ? 'border-purple-500 ring-2 ring-purple-500/20 scale-105' 
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
      }`}
    >
      {/* Popular badge */}
      {tier.isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      {/* Lifetime badge */}
      {tier.isLifetime && (
        <div className="absolute -top-4 right-8">
          <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <Crown className="h-4 w-4" />
            <span>Limited Time</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {tier.name}
        </h3>
        <div className="flex items-baseline justify-center mb-4">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">
            {tier.price}
          </span>
          {tier.period && !tier.isLifetime && (
            <span className="text-gray-500 dark:text-gray-400 ml-2">
              {tier.period}
            </span>
          )}
        </div>
        {tier.originalPrice && tier.savings && (
          <div className="text-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
              {tier.originalPrice}
            </span>
            <span className="text-sm text-green-600 dark:text-green-400 ml-2 font-medium">
              {tier.savings}
            </span>
          </div>
        )}
        {tier.originalPrice && tier.savings && (
          <div className="text-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
              {tier.originalPrice}
            </span>
            <span className="text-sm text-green-600 dark:text-green-400 ml-2 font-medium">
              {tier.savings}
            </span>
          </div>
        )}
        <p className="text-gray-600 dark:text-gray-400">
          {tier.description}
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        {tier.features.map((feature, featureIndex) => (
          <div key={featureIndex} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
              tier.isPopular 
                ? 'bg-purple-100 dark:bg-purple-900' 
                : 'bg-green-100 dark:bg-green-900'
            }`}>
              <Check className={`h-3 w-3 ${
                tier.isPopular 
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
      {tier.showPayPalButton ? (
        <PayPalButton
          planType={getPlanType(tier.name)}
          isAnnual={tier.isAnnual}
          onSuccess={(planType) => {
            console.log(`PricingCard: PayPal payment successful for ${planType} plan`);
            tier.onSelect();
          }}
          disabled={tier.disabled}
          className="w-full"
        />
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={tier.onSelect}
          disabled={tier.disabled}
          className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
            tier.isPopular
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
              : tier.isLifetime
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
          }${tier.disabled ? ' opacity-50 cursor-not-allowed' : ''}`}
          <div className="flex items-center justify-center space-x-2">
            {tier.isLifetime && <Crown className="h-4 w-4" />}
            {tier.isPopular && <Zap className="h-4 w-4" />}
            <span>{tier.buttonText}</span>
          </div>
        </motion.button>
      )}

      {/* Guarantee for lifetime */}
      {tier.isLifetime && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
          60-day money-back guarantee
        </p>
      )}
    </motion.div>
  );
};