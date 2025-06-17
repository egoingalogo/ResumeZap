import { supabase, handleSupabaseError } from './supabase';

export interface Application {
  id: string;
  company: string;
  position: string;
  location: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  appliedDate: string;
  lastUpdate: string;
  salary?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch user's job applications
 */
export const fetchApplications = async (): Promise<Application[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false });
  
  if (error) {
    throw new Error(handleSupabaseError(error, 'fetch applications'));
  }
  
  return data.map(app => ({
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
};

/**
 * Create new job application
 */
export const createApplication = async (applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
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
    throw new Error(handleSupabaseError(error, 'create application'));
  }
  
  return {
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
};

/**
 * Update job application
 */
export const updateApplication = async (id: string, updates: Partial<Application>): Promise<void> => {
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
    throw new Error(handleSupabaseError(error, 'update application'));
  }
};

/**
 * Delete job application
 */
export const deleteApplication = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(handleSupabaseError(error, 'delete application'));
  }
};