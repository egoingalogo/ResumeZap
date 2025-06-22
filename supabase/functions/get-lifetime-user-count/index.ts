/*
  # Get Lifetime User Count Edge Function

  This function provides a secure way to get the count of users with lifetime plans
  by bypassing Row Level Security (RLS) restrictions using service role access.

  ## Purpose
  - Count users with 'lifetime' plan status
  - Bypass RLS to get accurate global count
  - Provide secure access without exposing sensitive data

  ## Security
  - Uses service role key for database access
  - No authentication required (public endpoint)
  - Only returns count, no user data
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Only allow GET requests for this endpoint
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed',
          success: false 
        }),
        {
          status: 405,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    console.log('get-lifetime-user-count: Starting function execution');

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Validate environment variables
    if (!supabaseUrl) {
      console.error('get-lifetime-user-count: Missing SUPABASE_URL environment variable');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing Supabase URL',
          success: false 
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    if (!supabaseServiceKey) {
      console.error('get-lifetime-user-count: Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing service role key',
          success: false 
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    console.log('get-lifetime-user-count: Environment variables validated');

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('get-lifetime-user-count: Supabase client created, querying database');

    // Query the users table for lifetime plan count
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'lifetime');

    if (error) {
      console.error('get-lifetime-user-count: Database query error:', error);
      return new Response(
        JSON.stringify({ 
          error: `Database query failed: ${error.message}`,
          success: false 
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    const lifetimeUserCount = count || 0;
    console.log('get-lifetime-user-count: Query successful, count:', lifetimeUserCount);

    // Return the count
    return new Response(
      JSON.stringify({ 
        count: lifetimeUserCount,
        success: true 
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('get-lifetime-user-count: Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});