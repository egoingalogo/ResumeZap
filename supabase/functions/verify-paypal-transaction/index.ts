import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Edge function to verify PayPal transactions (both one-time orders and recurring subscriptions)
 * Updates user plan and records transaction details in the database
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
      transactionId, // orderID or subscriptionID
      planType, // "premium", "pro", or "lifetime"
      isAnnual // boolean for subscription periodicity
    } = reqData;

    // Validate inputs
    if (!type || !transactionId || !planType) {
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

    // Get environment variables
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const isProduction = Deno.env.get("PAYPAL_ENVIRONMENT") === "production";
    const baseUrl = isProduction 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";

    if (!paypalClientId || !paypalSecret || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user information from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Variable for PayPal transaction data
    let verifyData;
    let status;
    let amount = "0";
    let currency = "USD";

    // Handle based on transaction type
    if (type === "order") {
      // Verify the order with PayPal
      const verifyResponse = await fetch(`${baseUrl}/v2/checkout/orders/${transactionId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        console.error("PayPal order verification error:", verifyData);
        return new Response(
          JSON.stringify({ error: "Payment verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      status = verifyData.status;
      
      // Only proceed if payment is completed
      if (status !== "COMPLETED") {
        return new Response(
          JSON.stringify({ error: "Payment not completed", status: status }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract amount and currency
      if (verifyData.purchase_units && 
          verifyData.purchase_units[0] && 
          verifyData.purchase_units[0].payments && 
          verifyData.purchase_units[0].payments.captures && 
          verifyData.purchase_units[0].payments.captures[0]) {
        amount = verifyData.purchase_units[0].payments.captures[0].amount.value;
        currency = verifyData.purchase_units[0].payments.captures[0].amount.currency_code;
      }
    } else {
      // Verify subscription with PayPal
      const verifyResponse = await fetch(`${baseUrl}/v1/billing/subscriptions/${transactionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        console.error("PayPal subscription verification error:", verifyData);
        return new Response(
          JSON.stringify({ error: "Subscription verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      status = verifyData.status;
      
      // Only proceed if subscription is active
      if (status !== "ACTIVE" && status !== "APPROVED") {
        return new Response(
          JSON.stringify({ error: "Subscription not active", status: status }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract amount and currency if available
      if (verifyData.billing_info && 
          verifyData.billing_info.last_payment && 
          verifyData.billing_info.last_payment.amount) {
        amount = verifyData.billing_info.last_payment.amount.value;
        currency = verifyData.billing_info.last_payment.amount.currency_code;
      }
    }

    // Validate plan type
    if (!["premium", "pro", "lifetime"].includes(planType)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update user plan in database
    const { error: updateError } = await supabase
      .from("users")
      .update({ plan: planType })
      .eq("id", user.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update user plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create payment record in database
    const { error: paymentRecordError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        paypal_order_id: transactionId,
        plan_type: planType,
        amount: amount,
        currency: currency,
        status: status,
        payment_data: {
          type: type,
          isAnnual: isAnnual || false,
          ...verifyData
        },
      });

    if (paymentRecordError) {
      console.error("Payment record error:", paymentRecordError);
      // This is not critical, so we continue even if it fails
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: `${type === "order" ? "Payment" : "Subscription"} verified and plan updated`,
        planType: planType,
        isAnnual: isAnnual || false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-paypal-transaction function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});