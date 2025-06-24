import { supabase, handleSupabaseError } from './supabase';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Create new support ticket
 */
export const createSupportTicket = async (ticketData: {
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
}): Promise<SupportTicket> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject: ticketData.subject,
      category: ticketData.category,
      priority: ticketData.priority,
      message: ticketData.message,
      status: 'open',
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(handleSupabaseError(error, 'create support ticket'));
  }
  
  return {
    id: data.id,
    subject: data.subject,
    category: data.category,
    priority: data.priority,
    message: data.message,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Fetch user's support tickets
 */
const fetchSupportTickets = async (): Promise<SupportTicket[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(handleSupabaseError(error, 'fetch support tickets'));
  }
  
  return data.map(ticket => ({
    id: ticket.id,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    message: ticket.message,
    status: ticket.status,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  }));
};