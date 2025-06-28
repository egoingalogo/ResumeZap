import { supabase, handleSupabaseError } from './supabase';

export interface CoverLetter {
  id: string;
  title: string;
  content: string;
  companyName: string;
  jobTitle: string;
  tone: 'professional' | 'enthusiastic' | 'concise';
  jobPosting?: string;
  resumeContentSnapshot?: string;
  customizations: string[];
  keyStrengths: string[];
  callToAction?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch user's cover letters with comprehensive error handling
 * Returns cover letters sorted by creation date (newest first)
 */
export const fetchCoverLetters = async (): Promise<CoverLetter[]> => {
  console.log('CoverLetters: Fetching user cover letters');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('CoverLetters: Database error:', error);
      throw new Error(handleSupabaseError(error, 'fetch cover letters'));
    }
    
    if (!data) {
      console.log('CoverLetters: No data returned from database');
      return [];
    }
    
    const coverLetters: CoverLetter[] = data.map(cl => ({
      id: cl.id,
      title: cl.title,
      content: cl.content,
      companyName: cl.company_name,
      jobTitle: cl.job_title,
      tone: cl.tone,
      jobPosting: cl.job_posting,
      resumeContentSnapshot: cl.resume_content_snapshot,
      customizations: cl.customizations as string[],
      keyStrengths: cl.key_strengths as string[],
      callToAction: cl.call_to_action,
      createdAt: cl.created_at,
      updatedAt: cl.updated_at,
    }));
    
    console.log('CoverLetters: Successfully fetched', coverLetters.length, 'cover letters');
    return coverLetters;
    
  } catch (error) {
    console.error('CoverLetters: Failed to fetch cover letters:', error);
    throw error;
  }
};

/**
 * Create new cover letter with validation
 * Automatically sets user_id and timestamps
 */
export const createCoverLetter = async (coverLetterData: Omit<CoverLetter, 'id' | 'createdAt' | 'updatedAt'>): Promise<CoverLetter> => {
  console.log('CoverLetters: Creating new cover letter for:', coverLetterData.companyName);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Validate required fields
    if (!coverLetterData.title?.trim()) {
      throw new Error('Cover letter title is required');
    }
    
    if (!coverLetterData.content?.trim()) {
      throw new Error('Cover letter content is required');
    }
    
    if (!coverLetterData.companyName?.trim()) {
      throw new Error('Company name is required');
    }
    
    if (!coverLetterData.jobTitle?.trim()) {
      throw new Error('Job title is required');
    }
    
    // Validate tone
    const validTones = ['professional', 'enthusiastic', 'concise'];
    if (!validTones.includes(coverLetterData.tone)) {
      throw new Error('Invalid cover letter tone');
    }
    
    const insertData = {
      user_id: user.id,
      title: coverLetterData.title.trim(),
      content: coverLetterData.content.trim(),
      company_name: coverLetterData.companyName.trim(),
      job_title: coverLetterData.jobTitle.trim(),
      tone: coverLetterData.tone,
      job_posting: coverLetterData.jobPosting?.trim() || null,
      resume_content_snapshot: coverLetterData.resumeContentSnapshot?.trim() || null,
      customizations: coverLetterData.customizations || [],
      key_strengths: coverLetterData.keyStrengths || [],
      call_to_action: coverLetterData.callToAction?.trim() || null,
    };
    
    const { data, error } = await supabase
      .from('cover_letters')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('CoverLetters: Database error during creation:', error);
      throw new Error(handleSupabaseError(error, 'create cover letter'));
    }
    
    if (!data) {
      throw new Error('No data returned after creating cover letter');
    }
    
    const newCoverLetter: CoverLetter = {
      id: data.id,
      title: data.title,
      content: data.content,
      companyName: data.company_name,
      jobTitle: data.job_title,
      tone: data.tone,
      jobPosting: data.job_posting,
      resumeContentSnapshot: data.resume_content_snapshot,
      customizations: data.customizations as string[],
      keyStrengths: data.key_strengths as string[],
      callToAction: data.call_to_action,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    console.log('CoverLetters: Successfully created cover letter with ID:', newCoverLetter.id);
    return newCoverLetter;
    
  } catch (error) {
    console.error('CoverLetters: Failed to create cover letter:', error);
    throw error;
  }
};

/**
 * Update existing cover letter with validation
 * Automatically updates the updated_at timestamp
 */
export const updateCoverLetter = async (id: string, updates: Partial<CoverLetter>): Promise<void> => {
  console.log('CoverLetters: Updating cover letter:', id);
  
  try {
    if (!id?.trim()) {
      throw new Error('Cover letter ID is required');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Validate updates if provided
    if (updates.title !== undefined && !updates.title?.trim()) {
      throw new Error('Cover letter title cannot be empty');
    }
    
    if (updates.content !== undefined && !updates.content?.trim()) {
      throw new Error('Cover letter content cannot be empty');
    }
    
    if (updates.companyName !== undefined && !updates.companyName?.trim()) {
      throw new Error('Company name cannot be empty');
    }
    
    if (updates.jobTitle !== undefined && !updates.jobTitle?.trim()) {
      throw new Error('Job title cannot be empty');
    }
    
    if (updates.tone !== undefined) {
      const validTones = ['professional', 'enthusiastic', 'concise'];
      if (!validTones.includes(updates.tone)) {
        throw new Error('Invalid cover letter tone');
      }
    }
    
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title.trim();
    if (updates.content !== undefined) updateData.content = updates.content.trim();
    if (updates.companyName !== undefined) updateData.company_name = updates.companyName.trim();
    if (updates.jobTitle !== undefined) updateData.job_title = updates.jobTitle.trim();
    if (updates.tone !== undefined) updateData.tone = updates.tone;
    if (updates.jobPosting !== undefined) updateData.job_posting = updates.jobPosting?.trim() || null;
    if (updates.resumeContentSnapshot !== undefined) updateData.resume_content_snapshot = updates.resumeContentSnapshot?.trim() || null;
    if (updates.customizations !== undefined) updateData.customizations = updates.customizations;
    if (updates.keyStrengths !== undefined) updateData.key_strengths = updates.keyStrengths;
    if (updates.callToAction !== undefined) updateData.call_to_action = updates.callToAction?.trim() || null;
    
    // Only proceed if there are actual updates
    if (Object.keys(updateData).length === 0) {
      console.log('CoverLetters: No updates provided');
      return;
    }
    
    const { error } = await supabase
      .from('cover_letters')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user can only update their own cover letters
    
    if (error) {
      console.error('CoverLetters: Database error during update:', error);
      throw new Error(handleSupabaseError(error, 'update cover letter'));
    }
    
    console.log('CoverLetters: Successfully updated cover letter:', id);
    
  } catch (error) {
    console.error('CoverLetters: Failed to update cover letter:', error);
    throw error;
  }
};

/**
 * Delete cover letter with security checks
 * Ensures users can only delete their own cover letters
 */
export const deleteCoverLetter = async (id: string): Promise<void> => {
  console.log('CoverLetters: Deleting cover letter:', id);
  
  try {
    if (!id?.trim()) {
      throw new Error('Cover letter ID is required');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // First, verify the cover letter exists and belongs to the user
    const { data: existingCoverLetter, error: fetchError } = await supabase
      .from('cover_letters')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Cover letter not found or you do not have permission to delete it');
      }
      console.error('CoverLetters: Error checking cover letter ownership:', fetchError);
      throw new Error(handleSupabaseError(fetchError, 'verify cover letter ownership'));
    }
    
    if (!existingCoverLetter) {
      throw new Error('Cover letter not found or you do not have permission to delete it');
    }
    
    // Proceed with deletion
    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Double-check user ownership
    
    if (error) {
      console.error('CoverLetters: Database error during deletion:', error);
      throw new Error(handleSupabaseError(error, 'delete cover letter'));
    }
    
    console.log('CoverLetters: Successfully deleted cover letter:', id);
    
  } catch (error) {
    console.error('CoverLetters: Failed to delete cover letter:', error);
    throw error;
  }
};

/**
 * Get cover letter statistics for the current user
 * Returns counts by tone and usage metrics
 */
export const getCoverLetterStats = async (): Promise<{
  total: number;
  professional: number;
  enthusiastic: number;
  concise: number;
  thisMonth: number;
}> => {
  console.log('CoverLetters: Fetching cover letter statistics');
  
  try {
    const coverLetters = await fetchCoverLetters();
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats = {
      total: coverLetters.length,
      professional: coverLetters.filter(cl => cl.tone === 'professional').length,
      enthusiastic: coverLetters.filter(cl => cl.tone === 'enthusiastic').length,
      concise: coverLetters.filter(cl => cl.tone === 'concise').length,
      thisMonth: coverLetters.filter(cl => new Date(cl.createdAt) >= startOfMonth).length,
    };
    
    console.log('CoverLetters: Statistics calculated:', stats);
    return stats;
    
  } catch (error) {
    console.error('CoverLetters: Failed to get statistics:', error);
    throw error;
  }
};

/**
 * Search cover letters by company, job title, or content
 * Returns filtered results based on search term
 */
export const searchCoverLetters = async (searchTerm: string): Promise<CoverLetter[]> => {
  console.log('CoverLetters: Searching cover letters with term:', searchTerm);
  
  try {
    if (!searchTerm?.trim()) {
      return await fetchCoverLetters();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const term = searchTerm.trim().toLowerCase();
    
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${term}%,company_name.ilike.%${term}%,job_title.ilike.%${term}%,content.ilike.%${term}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('CoverLetters: Search error:', error);
      throw new Error(handleSupabaseError(error, 'search cover letters'));
    }
    
    if (!data) {
      return [];
    }
    
    const coverLetters: CoverLetter[] = data.map(cl => ({
      id: cl.id,
      title: cl.title,
      content: cl.content,
      companyName: cl.company_name,
      jobTitle: cl.job_title,
      tone: cl.tone,
      jobPosting: cl.job_posting,
      resumeContentSnapshot: cl.resume_content_snapshot,
      customizations: cl.customizations as string[],
      keyStrengths: cl.key_strengths as string[],
      callToAction: cl.call_to_action,
      createdAt: cl.created_at,
      updatedAt: cl.updated_at,
    }));
    
    console.log('CoverLetters: Search returned', coverLetters.length, 'results');
    return coverLetters;
    
  } catch (error) {
    console.error('CoverLetters: Search failed:', error);
    throw error;
  }
};