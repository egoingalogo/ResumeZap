/**
 * Payment management utility functions for handling PayPal payments and subscription
 * Provides functions to initiate and validate transactions
 */

import { supabase } from './supabase';

interface CreateTransactionResult {
  success: boolean;
  id?: string;
  type?: 'order' | 'subscription';
  error?: string;
}

interface VerifyTransactionResult {
  success: boolean;
  planType?: string;
  isAnnual?: boolean;
  error?: string;
}

/**
 * Create a PayPal transaction (either a one-time order or recurring subscription)
 * @param type Transaction type ('order' or 'subscription')
 * @param planType Plan type ('premium', 'pro', 'lifetime')
 * @param options Additional options (planId, isAnnual, amount, currency)
 */
export const createPayPalTransaction = async (
  type: 'order' | 'subscription',
  planType: 'premium' | 'pro' | 'lifetime',
  options: {
    planId?: string;
    isAnnual?: boolean;
    amount?: string;
    currency?: string;
  }
): Promise<CreateTransactionResult> => {
  console.log(`payments: Creating PayPal ${type} for ${planType} plan`);
  
  try {
    // Get the Supabase URL and anon key
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    // Create request data
    const requestData: Record<string, unknown> = {
      type,
      planType,
      ...options
    };
    
    // Make request to Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/create-paypal-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create PayPal ${type}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      id: data.id,
      type: data.type
    };
    
  } catch (error) {
    console.error(`payments: Failed to create PayPal ${type}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Verify a completed PayPal transaction
 * @param type Transaction type ('order' or 'subscription')
 * @param transactionId PayPal order ID or subscription ID
 * @param planType Plan type ('premium', 'pro', 'lifetime')
 * @param isAnnual Whether this is an annual subscription
 */
export const verifyPayPalTransaction = async (
  type: 'order' | 'subscription',
  transactionId: string,
  planType: 'premium' | 'pro' | 'lifetime',
  isAnnual?: boolean
): Promise<VerifyTransactionResult> => {
  console.log(`payments: Verifying PayPal ${type} ${transactionId} for ${planType} plan`);
  
  try {
    // Get the Supabase URL and anon key
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    // Make request to Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/verify-paypal-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        type,
        transactionId,
        planType,
        isAnnual
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to verify PayPal ${type}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      planType: data.planType,
      isAnnual: data.isAnnual
    };
    
  } catch (error) {
    console.error(`payments: Failed to verify PayPal ${type}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Fetch user's payment history
 */
export const fetchPaymentHistory = async () => {
  console.log('payments: Fetching payment history');
  
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      payments: data
    };
    
  } catch (error) {
    console.error('payments: Failed to fetch payment history:', error);
    return {
      success: false,
      payments: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};