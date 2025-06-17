import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../types/database';

type DatabaseTicket = Database['public']['Tables']['support_tickets']['Row'];

interface SupportTicket extends Omit<DatabaseTicket, 'user_id' | 'created_at' | 'updated_at'> {
  createdAt: string;
  updatedAt: string;
}

interface SupportState {
  tickets: SupportTicket[];
  isLoading: boolean;
  
  fetchTickets: () => Promise<void>;
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateTicket: (id: string, updates: Partial<SupportTicket>) => Promise<boolean>;
}

/**
 * Support ticket store with Supabase integration
 * Manages customer support tickets and communication
 */
export const useSupportStore = create<SupportState>((set, get) => ({
  tickets: [],
  isLoading: false,
  
  /**
   * Fetch all support tickets for the current user
   */
  fetchTickets: async () => {
    console.log('SupportStore: Fetching user support tickets');
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('SupportStore: Failed to fetch tickets:', error);
        set({ isLoading: false });
        return;
      }
      
      const tickets: SupportTicket[] = data.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
      }));
      
      set({ tickets, isLoading: false });
      console.log('SupportStore: Fetched', tickets.length, 'tickets');
    } catch (error) {
      console.error('SupportStore: Fetch tickets error:', error);
      set({ isLoading: false });
    }
  },
  
  /**
   * Create new support ticket
   */
  createTicket: async (ticketData: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    console.log('SupportStore: Creating new support ticket');
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          subject: ticketData.subject,
          category: ticketData.category,
          priority: ticketData.priority,
          message: ticketData.message,
          status: 'open',
        })
        .select()
        .single();
      
      if (error) {
        console.error('SupportStore: Failed to create ticket:', error);
        set({ isLoading: false });
        return false;
      }
      
      const newTicket: SupportTicket = {
        id: data.id,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        message: data.message,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      set((state) => ({
        tickets: [newTicket, ...state.tickets],
        isLoading: false,
      }));
      
      console.log('SupportStore: Support ticket created successfully');
      return true;
    } catch (error) {
      console.error('SupportStore: Create ticket error:', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  /**
   * Update existing support ticket
   */
  updateTicket: async (id: string, updates: Partial<SupportTicket>) => {
    console.log('SupportStore: Updating support ticket:', id);
    set({ isLoading: true });
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          subject: updates.subject,
          category: updates.category,
          priority: updates.priority,
          message: updates.message,
          status: updates.status,
        })
        .eq('id', id);
      
      if (error) {
        console.error('SupportStore: Failed to update ticket:', error);
        set({ isLoading: false });
        return false;
      }
      
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === id 
            ? { ...ticket, ...updates, updatedAt: new Date().toISOString() } 
            : ticket
        ),
        isLoading: false,
      }));
      
      console.log('SupportStore: Support ticket updated successfully');
      return true;
    } catch (error) {
      console.error('SupportStore: Update ticket error:', error);
      set({ isLoading: false });
      return false;
    }
  },
}));