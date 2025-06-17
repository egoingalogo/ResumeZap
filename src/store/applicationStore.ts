import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../types/database';

type DatabaseApplication = Database['public']['Tables']['applications']['Row'];

interface Application extends Omit<DatabaseApplication, 'user_id' | 'applied_date' | 'last_update' | 'created_at' | 'updated_at'> {
  appliedDate: string;
  lastUpdate: string;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationState {
  applications: Application[];
  isLoading: boolean;
  
  fetchApplications: () => Promise<void>;
  addApplication: (application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<boolean>;
  deleteApplication: (id: string) => Promise<boolean>;
}

/**
 * Application tracking store with Supabase integration
 * Manages job applications and their status updates
 */
export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  isLoading: false,
  
  /**
   * Fetch all applications for the current user
   */
  fetchApplications: async () => {
    console.log('ApplicationStore: Fetching user applications');
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('applied_date', { ascending: false });
      
      if (error) {
        console.error('ApplicationStore: Failed to fetch applications:', error);
        set({ isLoading: false });
        return;
      }
      
      const applications: Application[] = data.map(app => ({
        id: app.id,
        company: app.company,
        position: app.position,
        location: app.location,
        status: app.status,
        appliedDate: app.applied_date,
        lastUpdate: app.last_update,
        salary: app.salary,
        notes: app.notes,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
      }));
      
      set({ applications, isLoading: false });
      console.log('ApplicationStore: Fetched', applications.length, 'applications');
    } catch (error) {
      console.error('ApplicationStore: Fetch applications error:', error);
      set({ isLoading: false });
    }
  },
  
  /**
   * Add new job application
   */
  addApplication: async (applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('ApplicationStore: Adding new application');
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          company: applicationData.company,
          position: applicationData.position,
          location: applicationData.location,
          status: applicationData.status,
          applied_date: applicationData.appliedDate,
          last_update: applicationData.lastUpdate,
          salary: applicationData.salary,
          notes: applicationData.notes,
        })
        .select()
        .single();
      
      if (error) {
        console.error('ApplicationStore: Failed to add application:', error);
        set({ isLoading: false });
        return false;
      }
      
      const newApplication: Application = {
        id: data.id,
        company: data.company,
        position: data.position,
        location: data.location,
        status: data.status,
        appliedDate: data.applied_date,
        lastUpdate: data.last_update,
        salary: data.salary,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      set((state) => ({
        applications: [newApplication, ...state.applications],
        isLoading: false,
      }));
      
      console.log('ApplicationStore: Application added successfully');
      return true;
    } catch (error) {
      console.error('ApplicationStore: Add application error:', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  /**
   * Update existing application
   */
  updateApplication: async (id: string, updates: Partial<Application>) => {
    console.log('ApplicationStore: Updating application:', id);
    set({ isLoading: true });
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          company: updates.company,
          position: updates.position,
          location: updates.location,
          status: updates.status,
          applied_date: updates.appliedDate,
          last_update: updates.lastUpdate,
          salary: updates.salary,
          notes: updates.notes,
        })
        .eq('id', id);
      
      if (error) {
        console.error('ApplicationStore: Failed to update application:', error);
        set({ isLoading: false });
        return false;
      }
      
      set((state) => ({
        applications: state.applications.map((app) =>
          app.id === id 
            ? { ...app, ...updates, updatedAt: new Date().toISOString() } 
            : app
        ),
        isLoading: false,
      }));
      
      console.log('ApplicationStore: Application updated successfully');
      return true;
    } catch (error) {
      console.error('ApplicationStore: Update application error:', error);
      set({ isLoading: false });
      return false;
    }
  },
  
  /**
   * Delete application
   */
  deleteApplication: async (id: string) => {
    console.log('ApplicationStore: Deleting application:', id);
    set({ isLoading: true });
    
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('ApplicationStore: Failed to delete application:', error);
        set({ isLoading: false });
        return false;
      }
      
      set((state) => ({
        applications: state.applications.filter((app) => app.id !== id),
        isLoading: false,
      }));
      
      console.log('ApplicationStore: Application deleted successfully');
      return true;
    } catch (error) {
      console.error('ApplicationStore: Delete application error:', error);
      set({ isLoading: false });
      return false;
    }
  },
}));