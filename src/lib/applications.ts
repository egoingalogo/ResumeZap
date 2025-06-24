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
 * Fetch user's job applications with comprehensive error handling
 * Returns applications sorted by applied date (newest first)
 */
export const fetchApplications = async (): Promise<Application[]> => {
  console.log('Applications: Fetching user applications');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('applied_date', { ascending: false });
    
    if (error) {
      console.error('Applications: Database error:', error);
      throw new Error(handleSupabaseError(error, 'fetch applications'));
    }
    
    if (!data) {
      console.log('Applications: No data returned from database');
      return [];
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
    
    console.log('Applications: Successfully fetched', applications.length, 'applications');
    return applications;
    
  } catch (error) {
    console.error('Applications: Failed to fetch applications:', error);
    throw error;
  }
};

/**
 * Create new job application with validation
 * Automatically sets user_id and timestamps
 */
export const createApplication = async (applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> => {
  console.log('Applications: Creating new application for:', applicationData.company);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Validate required fields
    if (!applicationData.company?.trim()) {
      throw new Error('Company name is required');
    }
    
    if (!applicationData.position?.trim()) {
      throw new Error('Position is required');
    }
    
    if (!applicationData.appliedDate) {
      throw new Error('Applied date is required');
    }
    
    // Validate status
    const validStatuses = ['applied', 'interview', 'offer', 'rejected'];
    if (!validStatuses.includes(applicationData.status)) {
      throw new Error('Invalid application status');
    }
    
    // Validate dates
    const appliedDate = new Date(applicationData.appliedDate);
    const lastUpdate = new Date(applicationData.lastUpdate);
    
    if (isNaN(appliedDate.getTime())) {
      throw new Error('Invalid applied date');
    }
    
    if (isNaN(lastUpdate.getTime())) {
      throw new Error('Invalid last update date');
    }
    
    // Ensure last update is not before applied date
    if (lastUpdate < appliedDate) {
      throw new Error('Last update date cannot be before applied date');
    }
    
    const insertData = {
      user_id: user.id,
      company: applicationData.company.trim(),
      position: applicationData.position.trim(),
      location: applicationData.location?.trim() || '',
      status: applicationData.status,
      applied_date: applicationData.appliedDate,
      last_update: applicationData.lastUpdate,
      salary: applicationData.salary?.trim() || null,
      notes: applicationData.notes?.trim() || null,
    };
    
    const { data, error } = await supabase
      .from('applications')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Applications: Database error during creation:', error);
      throw new Error(handleSupabaseError(error, 'create application'));
    }
    
    if (!data) {
      throw new Error('No data returned after creating application');
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
    
    console.log('Applications: Successfully created application with ID:', newApplication.id);
    return newApplication;
    
  } catch (error) {
    console.error('Applications: Failed to create application:', error);
    throw error;
  }
};

/**
 * Update existing job application with validation
 * Automatically updates the updated_at timestamp
 */
export const updateApplication = async (id: string, updates: Partial<Application>): Promise<void> => {
  console.log('Applications: Updating application:', id);
  
  try {
    if (!id?.trim()) {
      throw new Error('Application ID is required');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Validate updates if provided
    if (updates.company !== undefined && !updates.company?.trim()) {
      throw new Error('Company name cannot be empty');
    }
    
    if (updates.position !== undefined && !updates.position?.trim()) {
      throw new Error('Position cannot be empty');
    }
    
    if (updates.status !== undefined) {
      const validStatuses = ['applied', 'interview', 'offer', 'rejected'];
      if (!validStatuses.includes(updates.status)) {
        throw new Error('Invalid application status');
      }
    }
    
    // Validate dates if provided
    if (updates.appliedDate !== undefined) {
      const appliedDate = new Date(updates.appliedDate);
      if (isNaN(appliedDate.getTime())) {
        throw new Error('Invalid applied date');
      }
    }
    
    if (updates.lastUpdate !== undefined) {
      const lastUpdate = new Date(updates.lastUpdate);
      if (isNaN(lastUpdate.getTime())) {
        throw new Error('Invalid last update date');
      }
    }
    
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (updates.company !== undefined) updateData.company = updates.company.trim();
    if (updates.position !== undefined) updateData.position = updates.position.trim();
    if (updates.location !== undefined) updateData.location = updates.location?.trim() || '';
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.appliedDate !== undefined) updateData.applied_date = updates.appliedDate;
    if (updates.lastUpdate !== undefined) updateData.last_update = updates.lastUpdate;
    if (updates.salary !== undefined) updateData.salary = updates.salary?.trim() || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null;
    
    // Only proceed if there are actual updates
    if (Object.keys(updateData).length === 0) {
      console.log('Applications: No updates provided');
      return;
    }
    
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user can only update their own applications
    
    if (error) {
      console.error('Applications: Database error during update:', error);
      throw new Error(handleSupabaseError(error, 'update application'));
    }
    
    console.log('Applications: Successfully updated application:', id);
    
  } catch (error) {
    console.error('Applications: Failed to update application:', error);
    throw error;
  }
};

/**
 * Delete job application with security checks
 * Ensures users can only delete their own applications
 */
export const deleteApplication = async (id: string): Promise<void> => {
  console.log('Applications: Deleting application:', id);
  
  try {
    if (!id?.trim()) {
      throw new Error('Application ID is required');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // First, verify the application exists and belongs to the user
    const { data: existingApp, error: fetchError } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Application not found or you do not have permission to delete it');
      }
      console.error('Applications: Error checking application ownership:', fetchError);
      throw new Error(handleSupabaseError(fetchError, 'verify application ownership'));
    }
    
    if (!existingApp) {
      throw new Error('Application not found or you do not have permission to delete it');
    }
    
    // Proceed with deletion
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Double-check user ownership
    
    if (error) {
      console.error('Applications: Database error during deletion:', error);
      throw new Error(handleSupabaseError(error, 'delete application'));
    }
    
    console.log('Applications: Successfully deleted application:', id);
    
  } catch (error) {
    console.error('Applications: Failed to delete application:', error);
    throw error;
  }
};

/**
 * Get application statistics for the current user
 * Returns counts by status and response rate
 */
const getApplicationStats = async (): Promise<{
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  responseRate: number;
}> => {
  console.log('Applications: Fetching application statistics');
  
  try {
    const applications = await fetchApplications();
    
    const stats = {
      total: applications.length,
      applied: applications.filter(app => app.status === 'applied').length,
      interview: applications.filter(app => app.status === 'interview').length,
      offer: applications.filter(app => app.status === 'offer').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      responseRate: 0,
    };
    
    // Calculate response rate (any status other than 'applied')
    if (stats.total > 0) {
      const responses = stats.total - stats.applied;
      stats.responseRate = Math.round((responses / stats.total) * 100);
    }
    
    console.log('Applications: Statistics calculated:', stats);
    return stats;
    
  } catch (error) {
    console.error('Applications: Failed to get statistics:', error);
    throw error;
  }
};

/**
 * Search applications by company, position, or location
 * Returns filtered results based on search term
 */
const searchApplications = async (searchTerm: string): Promise<Application[]> => {
  console.log('Applications: Searching applications with term:', searchTerm);
  
  try {
    if (!searchTerm?.trim()) {
      return await fetchApplications();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const term = searchTerm.trim().toLowerCase();
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .or(`company.ilike.%${term}%,position.ilike.%${term}%,location.ilike.%${term}%`)
      .order('applied_date', { ascending: false });
    
    if (error) {
      console.error('Applications: Search error:', error);
      throw new Error(handleSupabaseError(error, 'search applications'));
    }
    
    if (!data) {
      return [];
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
    
    console.log('Applications: Search returned', applications.length, 'results');
    return applications;
    
  } catch (error) {
    console.error('Applications: Search failed:', error);
    throw error;
  }
};