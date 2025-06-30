import React, { useEffect, useState } from 'react';
import { 
  PayPalScriptProvider,
  PayPalButtons,
  FUNDING
} from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

// Define plan pricing information
const PLAN_PRICES = {
  premium: {
    monthly: '7.99',
    annual: '79.99'
  },
  pro: {
    monthly: '14.99',
    annual: '149.99'
  },
  lifetime: '79.99'
};

// Define PayPal plan IDs (replace these with your actual PayPal plan IDs)
const PAYPAL_PLAN_IDS = {
  premium: {
    monthly: 'P-43T78580KT298912NNBQWC2Q',
    annual: 'P-1HA64172F2382503FNBQ6PEI'
  },
  pro: {
    monthly: 'P-PRO_MONTHLY',      // Replace with actual ID
    annual: 'P-PRO_ANNUAL'         // Replace with actual ID
  }
};

interface PayPalButtonProps {
  planType: 'premium' | 'pro' | 'lifetime';
  isAnnual?: boolean;
  onSuccess?: (planType: string, isAnnual?: boolean) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
  buttonStyle?: 'color' | 'white' | 'black' | 'white-border' | 'gold' | 'silver' | 'blue';
  label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment';
}

/**
 * PayPal Button component that handles both subscriptions and one-time payments
 * Uses PayPal's createSubscription for Premium and Pro plans, and createOrder for Lifetime plan
 */
export const PayPalButton: React.FC<PayPalButtonProps> = ({
  planType,
  isAnnual = false,
  onSuccess,
  onCancel,
  onError,
  disabled = false,
  className = '',
  buttonStyle = 'gold',
  label = 'paypal'
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { upgradePlan } = useAuthStore();
  
  // Get client ID from environment
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

  // Reset error when props change
  useEffect(() => {
    setError(null);
  }, [planType, isAnnual]);

  // Function to create PayPal order for one-time payments (Lifetime plan)
  const createOrder = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Creating PayPal order for ${planType} plan`);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paypal-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'order',
          planType: planType,
          amount: PLAN_PRICES.lifetime,
          currency: 'USD'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create PayPal order:', errorData);
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }
      
      const data = await response.json();
      console.log('PayPal order created:', data);
      return data.id;
    } catch (err) {
      console.error('Error creating PayPal order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create PayPal order');
      if (onError) onError(err instanceof Error ? err : new Error('Failed to create PayPal order'));
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to create PayPal subscription for recurring payments (Premium and Pro plans)
  const createSubscription = async (data: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    
    // Get the appropriate plan ID based on plan type and billing frequency
    const planId = planType === 'premium' 
      ? (isAnnual ? PAYPAL_PLAN_IDS.premium.annual : PAYPAL_PLAN_IDS.premium.monthly)
      : (isAnnual ? PAYPAL_PLAN_IDS.pro.annual : PAYPAL_PLAN_IDS.pro.monthly);
    
    try {
      console.log(`Creating PayPal subscription for ${planType} plan (${isAnnual ? 'annual' : 'monthly'})`);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paypal-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'subscription',
          planType: planType,
          isAnnual: isAnnual,
          planId: planId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create PayPal subscription:', errorData);
        throw new Error(errorData.error || 'Failed to create PayPal subscription');
      }
      
      const responseData = await response.json();
      console.log('PayPal subscription created:', responseData);
      
      return responseData.id;
    } catch (err) {
      console.error('Error creating PayPal subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to create PayPal subscription');
      if (onError) onError(err instanceof Error ? err : new Error('Failed to create PayPal subscription'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Function to handle approved transactions
  const handleApprove = async (data: { orderID?: string; subscriptionID?: string }) => {
    setLoading(true);
    
    try {
      console.log('Transaction approved:', data);
      const transactionId = data.orderID || data.subscriptionID;
      
      if (!transactionId) {
        throw new Error('No transaction ID received from PayPal');
      }
      
      // Verify transaction with backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-paypal-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: data.orderID ? 'order' : 'subscription',
          transactionId: transactionId,
          planType: planType,
          isAnnual: isAnnual
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to verify transaction:', errorData);
        throw new Error(errorData.error || 'Failed to verify transaction');
      }
      
      const verificationData = await response.json();
      console.log('Transaction verified:', verificationData);
      
      // Update local user state
      await upgradePlan(planType);
      
      // Show success toast
      toast.success(`Successfully upgraded to ${planType} plan!`);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(planType, isAnnual);
      }
      
    } catch (err) {
      console.error('Error processing transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to process transaction');
      toast.error('Payment verification failed. Please try again.');
      if (onError) onError(err instanceof Error ? err : new Error('Failed to process transaction'));
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle canceled transactions
  const handleCancel = () => {
    console.log('Transaction canceled by user');
    toast.info('Payment canceled');
    if (onCancel) onCancel();
  };
  
  // Function to handle errors
  const handleError = (err: Record<string, unknown>) => {
    console.error('PayPal error:', err);
    setError('Payment processing error. Please try again.');
    toast.error('Payment processing error. Please try again.');
    if (onError) onError(new Error(JSON.stringify(err)));
  };

  // If client ID is missing, show error
  if (!clientId) {
    return (
      <div className="p-2 text-red-600 dark:text-red-400 text-sm">
        PayPal configuration is missing. Please check your environment variables.
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {error && (
        <div className="p-2 text-red-600 dark:text-red-400 text-sm mb-2">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-3">
          <Loader2 className="animate-spin h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Processing payment...</span>
        </div>
      ) : (
        <PayPalScriptProvider options={{ 
          clientId: clientId,
          currency: 'USD',
          intent: planType === 'lifetime' ? 'capture' : undefined,
          vault: planType !== 'lifetime',
          components: 'buttons'
        }}>
          {planType === 'lifetime' ? (
            <PayPalButtons
              style={{ 
                layout: 'vertical',
                color: buttonStyle,
                label: label,
                shape: 'rect',
                tagline: false,
              }}
              disabled={disabled || loading}
              fundingSource={FUNDING.PAYPAL}
              createOrder={createOrder}
              onApprove={(data) => handleApprove({ orderID: data.orderID })}
              onCancel={handleCancel}
              onError={handleError}
            />
          ) : (
            <PayPalButtons
              style={{ 
                layout: 'vertical',
                color: buttonStyle,
                label: label,
                shape: 'rect',
                tagline: false,
              }}
              disabled={disabled || loading}
              fundingSource={FUNDING.PAYPAL}
              createSubscription={createSubscription}
              onApprove={(data) => handleApprove({ subscriptionID: data.subscriptionID })}
              onCancel={handleCancel}
              onError={handleError}
            />
          )}
        </PayPalScriptProvider>
      )}
    </div>
  );
};