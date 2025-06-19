import { supabase, handleSupabaseError } from './supabase';

export interface SkillAnalysis {
  id: string;
  userId: string;
  resumeId?: string | null;
  jobPostingContent: string;
  resumeContentSnapshot: string;
  analysisDate: string;
  overallSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRecommendation {
  id: string;
  skillAnalysisId: string;
  skillName: string;
  importance: 'low' | 'medium' | 'high';
  hasSkill: boolean;
  recommendedCourses: string[];
  recommendedResources: string[];
  timeEstimate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillGap {
  skill: string;
  importance: 'high' | 'medium' | 'low';
  hasSkill: boolean;
  recommendations: {
    courses: string[];
    resources: string[];
    timeEstimate: string;
  };
}

export interface SkillAnalysisWithRecommendations extends SkillAnalysis {
  recommendations: SkillRecommendation[];
}

/**
 * Create a new skill analysis with recommendations
 * Saves both the analysis metadata and individual skill recommendations
 */
export const createSkillAnalysis = async (
  resumeContent: string,
  jobPosting: string,
  skillGaps: SkillGap[],
  resumeId?: string | null,
  overallSummary?: string | null
): Promise<SkillAnalysisWithRecommendations> => {
  console.log('SkillAnalysis: Creating new skill analysis');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Validate input data
    if (!resumeContent?.trim()) {
      throw new Error('Resume content is required');
    }
    
    if (!jobPosting?.trim()) {
      throw new Error('Job posting content is required');
    }
    
    if (!skillGaps || skillGaps.length === 0) {
      throw new Error('At least one skill gap is required');
    }
    
    // Step 1: Create the skill analysis record
    const analysisData = {
      user_id: user.id,
      resume_id: resumeId,
      job_posting_content: jobPosting.trim(),
      resume_content_snapshot: resumeContent.trim(),
      overall_summary: overallSummary?.trim() || null,
    };
    
    const { data: analysisRecord, error: analysisError } = await supabase
      .from('skill_analyses')
      .insert(analysisData)
      .select()
      .single();
    
    if (analysisError) {
      console.error('SkillAnalysis: Failed to create analysis record:', analysisError);
      throw new Error(handleSupabaseError(analysisError, 'create skill analysis'));
    }
    
    if (!analysisRecord) {
      throw new Error('No analysis record returned after creation');
    }
    
    console.log('SkillAnalysis: Created analysis record with ID:', analysisRecord.id);
    
    // Step 2: Create skill recommendation records
    const recommendationData = skillGaps.map(gap => ({
      skill_analysis_id: analysisRecord.id,
      skill_name: gap.skill.trim(),
      importance: gap.importance,
      has_skill: gap.hasSkill,
      recommended_courses: gap.recommendations.courses || [],
      recommended_resources: gap.recommendations.resources || [],
      time_estimate: gap.recommendations.timeEstimate?.trim() || null,
    }));
    
    const { data: recommendationRecords, error: recommendationError } = await supabase
      .from('skill_recommendations')
      .insert(recommendationData)
      .select();
    
    if (recommendationError) {
      console.error('SkillAnalysis: Failed to create recommendation records:', recommendationError);
      
      // Clean up the analysis record if recommendations failed
      await supabase
        .from('skill_analyses')
        .delete()
        .eq('id', analysisRecord.id);
      
      throw new Error(handleSupabaseError(recommendationError, 'create skill recommendations'));
    }
    
    if (!recommendationRecords) {
      throw new Error('No recommendation records returned after creation');
    }
    
    console.log('SkillAnalysis: Created', recommendationRecords.length, 'recommendation records');
    
    // Step 3: Transform and return the complete analysis
    const analysis: SkillAnalysisWithRecommendations = {
      id: analysisRecord.id,
      userId: analysisRecord.user_id,
      resumeId: analysisRecord.resume_id,
      jobPostingContent: analysisRecord.job_posting_content,
      resumeContentSnapshot: analysisRecord.resume_content_snapshot,
      analysisDate: analysisRecord.analysis_date,
      overallSummary: analysisRecord.overall_summary,
      createdAt: analysisRecord.created_at,
      updatedAt: analysisRecord.updated_at,
      recommendations: recommendationRecords.map(rec => ({
        id: rec.id,
        skillAnalysisId: rec.skill_analysis_id,
        skillName: rec.skill_name,
        importance: rec.importance,
        hasSkill: rec.has_skill,
        recommendedCourses: rec.recommended_courses as string[],
        recommendedResources: rec.recommended_resources as string[],
        timeEstimate: rec.time_estimate,
        createdAt: rec.created_at,
        updatedAt: rec.updated_at,
      })),
    };
    
    console.log('SkillAnalysis: Successfully created complete skill analysis');
    return analysis;
    
  } catch (error) {
    console.error('SkillAnalysis: Failed to create skill analysis:', error);
    throw error;
  }
};

/**
 * Fetch all skill analyses for the current user
 * Returns analyses sorted by analysis date (newest first)
 */
export const fetchSkillAnalyses = async (): Promise<SkillAnalysisWithRecommendations[]> => {
  console.log('SkillAnalysis: Fetching user skill analyses');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Fetch analyses with their recommendations
    const { data: analyses, error: analysesError } = await supabase
      .from('skill_analyses')
      .select(`
        *,
        skill_recommendations (*)
      `)
      .eq('user_id', user.id)
      .order('analysis_date', { ascending: false });
    
    if (analysesError) {
      console.error('SkillAnalysis: Database error:', analysesError);
      throw new Error(handleSupabaseError(analysesError, 'fetch skill analyses'));
    }
    
    if (!analyses) {
      console.log('SkillAnalysis: No analyses found');
      return [];
    }
    
    // Transform the data to match our interface
    const transformedAnalyses: SkillAnalysisWithRecommendations[] = analyses.map(analysis => ({
      id: analysis.id,
      userId: analysis.user_id,
      resumeId: analysis.resume_id,
      jobPostingContent: analysis.job_posting_content,
      resumeContentSnapshot: analysis.resume_content_snapshot,
      analysisDate: analysis.analysis_date,
      overallSummary: analysis.overall_summary,
      createdAt: analysis.created_at,
      updatedAt: analysis.updated_at,
      recommendations: (analysis.skill_recommendations || []).map((rec: any) => ({
        id: rec.id,
        skillAnalysisId: rec.skill_analysis_id,
        skillName: rec.skill_name,
        importance: rec.importance,
        hasSkill: rec.has_skill,
        recommendedCourses: rec.recommended_courses as string[],
        recommendedResources: rec.recommended_resources as string[],
        timeEstimate: rec.time_estimate,
        createdAt: rec.created_at,
        updatedAt: rec.updated_at,
      })),
    }));
    
    console.log('SkillAnalysis: Successfully fetched', transformedAnalyses.length, 'analyses');
    return transformedAnalyses;
    
  } catch (error) {
    console.error('SkillAnalysis: Failed to fetch skill analyses:', error);
    throw error;
  }
};

/**
 * Fetch a specific skill analysis by ID
 * Includes all recommendations for the analysis
 */
export const fetchSkillAnalysisById = async (analysisId: string): Promise<SkillAnalysisWithRecommendations | null> => {
  console.log('SkillAnalysis: Fetching analysis by ID:', analysisId);
  
  try {
    if (!analysisId?.trim()) {
      throw new Error('Analysis ID is required');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const { data: analysis, error } = await supabase
      .from('skill_analyses')
      .select(`
        *,
        skill_recommendations (*)
      `)
      .eq('id', analysisId)
      .eq('user_id', user.id) // Ensure user can only access their own analyses
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('SkillAnalysis: Analysis not found or access denied');
        return null;
      }
      console.error('SkillAnalysis: Database error:', error);
      throw new Error(handleSupabaseError(error, 'fetch skill analysis'));
    }
    
    if (!analysis) {
      return null;
    }
    
    // Transform the data
    const transformedAnalysis: SkillAnalysisWithRecommendations = {
      id: analysis.id,
      userId: analysis.user_id,
      resumeId: analysis.resume_id,
      jobPostingContent: analysis.job_posting_content,
      resumeContentSnapshot: analysis.resume_content_snapshot,
      analysisDate: analysis.analysis_date,
      overallSummary: analysis.overall_summary,
      createdAt: analysis.created_at,
      updatedAt: analysis.updated_at,
      recommendations: (analysis.skill_recommendations || []).map((rec: any) => ({
        id: rec.id,
        skillAnalysisId: rec.skill_analysis_id,
        skillName: rec.skill_name,
        importance: rec.importance,
        hasSkill: rec.has_skill,
        recommendedCourses: rec.recommended_courses as string[],
        recommendedResources: rec.recommended_resources as string[],
        timeEstimate: rec.time_estimate,
        createdAt: rec.created_at,
        updatedAt: rec.updated_at,
      })),
    };
    
    console.log('SkillAnalysis: Successfully fetched analysis');
    return transformedAnalysis;
    
  } catch (error) {
    console.error('SkillAnalysis: Failed to fetch skill analysis:', error);
    throw error;
  }
};

/**
 * Delete a skill analysis and all its recommendations
 * Ensures users can only delete their own analyses
 */
export const deleteSkillAnalysis = async (analysisId: string): Promise<void> => {
  console.log('SkillAnalysis: Deleting analysis:', analysisId);
  
  try {
    if (!analysisId?.trim()) {
      throw new Error('Analysis ID is required');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Verify ownership before deletion
    const { data: existingAnalysis, error: fetchError } = await supabase
      .from('skill_analyses')
      .select('id, user_id')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Analysis not found or you do not have permission to delete it');
      }
      console.error('SkillAnalysis: Error checking analysis ownership:', fetchError);
      throw new Error(handleSupabaseError(fetchError, 'verify analysis ownership'));
    }
    
    if (!existingAnalysis) {
      throw new Error('Analysis not found or you do not have permission to delete it');
    }
    
    // Delete the analysis (recommendations will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('skill_analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', user.id); // Double-check user ownership
    
    if (error) {
      console.error('SkillAnalysis: Database error during deletion:', error);
      throw new Error(handleSupabaseError(error, 'delete skill analysis'));
    }
    
    console.log('SkillAnalysis: Successfully deleted analysis:', analysisId);
    
  } catch (error) {
    console.error('SkillAnalysis: Failed to delete skill analysis:', error);
    throw error;
  }
};

/**
 * Get skill analysis statistics for the current user
 * Returns counts and insights about skill gaps
 */
export const getSkillAnalysisStats = async (): Promise<{
  totalAnalyses: number;
  totalSkillsAnalyzed: number;
  skillsToLearn: number;
  skillsAlreadyHave: number;
  highPriorityGaps: number;
  mediumPriorityGaps: number;
  lowPriorityGaps: number;
}> => {
  console.log('SkillAnalysis: Fetching skill analysis statistics');
  
  try {
    const analyses = await fetchSkillAnalyses();
    
    let totalSkillsAnalyzed = 0;
    let skillsToLearn = 0;
    let skillsAlreadyHave = 0;
    let highPriorityGaps = 0;
    let mediumPriorityGaps = 0;
    let lowPriorityGaps = 0;
    
    analyses.forEach(analysis => {
      analysis.recommendations.forEach(rec => {
        totalSkillsAnalyzed++;
        
        if (rec.hasSkill) {
          skillsAlreadyHave++;
        } else {
          skillsToLearn++;
          
          switch (rec.importance) {
            case 'high':
              highPriorityGaps++;
              break;
            case 'medium':
              mediumPriorityGaps++;
              break;
            case 'low':
              lowPriorityGaps++;
              break;
          }
        }
      });
    });
    
    const stats = {
      totalAnalyses: analyses.length,
      totalSkillsAnalyzed,
      skillsToLearn,
      skillsAlreadyHave,
      highPriorityGaps,
      mediumPriorityGaps,
      lowPriorityGaps,
    };
    
    console.log('SkillAnalysis: Statistics calculated:', stats);
    return stats;
    
  } catch (error) {
    console.error('SkillAnalysis: Failed to get statistics:', error);
    throw error;
  }
};

/**
 * Convert SkillAnalysisWithRecommendations to SkillGap array
 * Used for displaying analysis results in the UI
 */
export const convertAnalysisToSkillGaps = (analysis: SkillAnalysisWithRecommendations): SkillGap[] => {
  return analysis.recommendations.map(rec => ({
    skill: rec.skillName,
    importance: rec.importance,
    hasSkill: rec.hasSkill,
    recommendations: {
      courses: rec.recommendedCourses,
      resources: rec.recommendedResources,
      timeEstimate: rec.timeEstimate || 'Not specified',
    },
  }));
};