/*
  # Get Lifetime User Count Edge Function

  This function counts the number of users with a 'lifetime' plan.
  Used for displaying lifetime user statistics on the frontend.

  ## Security
  - Uses service role key to bypass RLS for counting users
  - Only returns count, no sensitive user data
  - No authentication required (public endpoint for stats)
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  try {
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Only allow GET requests for this function
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Method not allowed. Only GET requests are supported.' 
        }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching lifetime user count...');

    // Count users with lifetime plan using service role to bypass RLS
    const { count, error } = await supabaseServiceRole
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'lifetime');

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch user count from database',
          details: error.message 
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const lifetimeUserCount = count ?? 0;
    console.log(`Successfully retrieved lifetime user count: ${lifetimeUserCount}`);

    // Return successful response with the count
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: lifetimeUserCount,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-lifetime-user-count function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});