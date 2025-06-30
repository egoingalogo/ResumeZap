import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Edge function to update the lifetime plan price in the app_settings table
 * CRITICAL: This endpoint should be restricted to admin access only in production!
 * 
 * Request body:
 * {
 *   "price": "89.99",
 *   "adminKey": "your-secure-admin-key"  // Required for authorization
 * }
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
    const { price, adminKey } = reqData;

    // Validate inputs
    if (!price || typeof price !== "string") {
      return new Response(
        JSON.stringify({ error: "Price is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate price format (e.g., "79.99")
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(price)) {
      return new Response(
        JSON.stringify({ error: "Price must be in format: '79.99'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin key (this should be more secure in production)
    const expectedAdminKey = Deno.env.get("ADMIN_API_KEY");
    if (!expectedAdminKey || adminKey !== expectedAdminKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the lifetime plan price in app_settings
    const { error: updateError } = await supabase
      .from("app_settings")
      .update({
        setting_value: { price, currency: "USD" },
        updated_at: new Date().toISOString()
      })
      .eq("setting_key", "lifetime_plan_price");

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update lifetime plan price", details: updateError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Lifetime plan price updated successfully",
        price: price
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in update-lifetime-price function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});