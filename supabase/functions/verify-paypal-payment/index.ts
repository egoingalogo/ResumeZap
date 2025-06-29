import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const { orderID, planType } = reqData;

    // Validate inputs
    if (!orderID || !planType) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
    const tokenResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
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

    // Verify the order with PayPal
    const verifyResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error("PayPal verification error:", verifyData);
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure payment is completed
    if (verifyData.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        paypal_order_id: orderID,
        plan_type: planType,
        amount: verifyData.purchase_units[0].amount.value,
        currency: verifyData.purchase_units[0].amount.currency_code,
        status: verifyData.status,
        payment_data: verifyData,
      });

    if (paymentRecordError) {
      console.error("Payment record error:", paymentRecordError);
      // This is not critical, so we continue even if it fails
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and plan updated",
        planType: planType,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-paypal-payment function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});