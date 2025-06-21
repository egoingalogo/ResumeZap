import { supabase } from './supabase';

/**
 * Interface for support ticket creation
 */
export interface SupportTicket {
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
}

/**
 * Interface for support ticket response
 */
export interface SupportTicketResponse {
  success: boolean;
  error?: string;
  ticket?: any;
}

/**
 * Interface for user deletion response
 */
export interface DeleteUserResponse {
  success: boolean;
  error?: string;
}

/**
 * Creates a new support ticket for the authenticated user
 * @param ticket - The support ticket data
 * @returns Promise with success status and ticket data or error
 */
export async function createSupportTicket(ticket: SupportTicket): Promise<SupportTicketResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        message: ticket.message,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating support ticket:', error);
      return { success: false, error: error.message };
    }

    return { success: true, ticket: data };
  } catch (error) {
    console.error('Unexpected error creating support ticket:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

/**
 * Retrieves all support tickets for the authenticated user
 * @returns Promise with success status and tickets data or error
 */
export async function getUserSupportTickets(): Promise<SupportTicketResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching support tickets:', error);
      return { success: false, error: error.message };
    }

    return { success: true, ticket: data };
  } catch (error) {
    console.error('Unexpected error fetching support tickets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}

/**
 * Deletes a user account and all associated data
 * This function calls the Supabase edge function to handle the deletion
 * @param userId - The ID of the user to delete
 * @returns Promise with success status or error
 */
export async function deleteUserAccount(userId: string): Promise<DeleteUserResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'User not authenticated' };
    }

    // Call the edge function to delete the user
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Error calling delete-user function:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error || 'Failed to delete user account' };
    }

    // Sign out the user after successful deletion
    await supabase.auth.signOut();

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting user account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
}