import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Edge function to create PayPal transactions (both one-time orders and recurring subscriptions)
 * Supports both createOrder and createSubscription functionality
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get request data
    const reqData = await req.json();
    const { 
      type, // "order" or "subscription"
      planType, // "premium", "pro", or "lifetime"
      isAnnual, // boolean for annual vs. monthly billing
      planId, // PayPal plan ID for subscriptions
      amount, // For one-time payments (Lifetime plan)
      currency = "USD" 
    } = reqData;

    // Validate inputs
    if (!type || !planType) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate type
    if (type !== "order" && type !== "subscription") {
      return new Response(
        JSON.stringify({ error: "Invalid transaction type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For order type, amount is required
    if (type === "order" && !amount) {
      return new Response(
        JSON.stringify({ error: "Amount is required for order transactions" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For subscription type, planId is required
    if (type === "subscription" && !planId) {
      return new Response(
        JSON.stringify({ error: "Plan ID is required for subscription transactions" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_SECRET");
    const isProduction = Deno.env.get("PAYPAL_ENVIRONMENT") === "production";
    const baseUrl = isProduction 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";

    if (!paypalClientId || !paypalSecret) {
      return new Response(
        JSON.stringify({ error: "PayPal configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("PayPal token error:", tokenData);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with PayPal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create description based on plan
    let description = "";
    if (planType === "premium") {
      description = isAnnual ? "ResumeZap Premium Annual Plan" : "ResumeZap Premium Monthly Plan";
    } else if (planType === "pro") {
      description = isAnnual ? "ResumeZap Pro Annual Plan" : "ResumeZap Pro Monthly Plan";
    } else if (planType === "lifetime") {
      description = "ResumeZap Lifetime Access";
    }

    // Handle based on transaction type
    if (type === "order") {
      // Create one-time payment order (for Lifetime plan)
      const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount,
              },
              description: description,
            },
          ],
          application_context: {
            brand_name: "ResumeZap",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: "https://resumezap.com/dashboard?upgrade_success=true",
            cancel_url: "https://resumezap.com/dashboard?upgrade_cancelled=true",
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error("PayPal order error:", orderData);
        return new Response(
          JSON.stringify({ error: "Failed to create PayPal order", details: orderData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return successful response with order ID
      return new Response(
        JSON.stringify({
          id: orderData.id,
          status: orderData.status,
          type: "order",
          planType: planType,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Create subscription
      const subscriptionResponse = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          application_context: {
            brand_name: "ResumeZap",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: "https://resumezap.com/dashboard?subscription_success=true",
            cancel_url: "https://resumezap.com/dashboard?subscription_cancelled=true",
          },
        }),
      });

      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionResponse.ok) {
        console.error("PayPal subscription error:", subscriptionData);
        return new Response(
          JSON.stringify({ error: "Failed to create PayPal subscription", details: subscriptionData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return successful response with subscription ID
      return new Response(
        JSON.stringify({
          id: subscriptionData.id,
          status: subscriptionData.status,
          type: "subscription",
          planType: planType,
          links: subscriptionData.links,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in create-paypal-transaction function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});