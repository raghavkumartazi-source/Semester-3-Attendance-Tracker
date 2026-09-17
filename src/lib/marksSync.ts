import { MarkComponent, SubjectGradeConfig, GradeScenario } from '@/lib/types';
import { supabase } from './supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapComponentFromDB(row: any): MarkComponent {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_code: row.subject_code,
    component_type: row.component_type,
    component_name: row.component_name,
    weightage: row.weightage,
    scored: row.scored,
    max_marks: row.max_marks,
    date: row.date,
    is_published: row.is_published,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConfigFromDB(row: any): SubjectGradeConfig {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_code: row.subject_code,
    grade_aa_min: row.grade_aa_min,
    grade_ab_min: row.grade_ab_min,
    grade_bb_min: row.grade_bb_min,
    grade_bc_min: row.grade_bc_min,
    grade_cc_min: row.grade_cc_min,
    grade_cd_min: row.grade_cd_min,
    grade_dd_min: row.grade_dd_min,
    credits: row.credits,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScenarioFromDB(row: any): GradeScenario {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_code: row.subject_code,
    name: row.name,
    assumptions: row.assumptions,
    projected_final_percentage: row.projected_final_percentage,
    projected_grade: row.projected_grade,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapComponentToDB(component: MarkComponent) {
  return {
    id: component.id,
    user_id: component.user_id,
    subject_code: component.subject_code,
    component_type: component.component_type,
    component_name: component.component_name,
    weightage: component.weightage,
    scored: component.scored,
    max_marks: component.max_marks,
    date: component.date,
    is_published: component.is_published,
    notes: component.notes,
    created_at: component.created_at,
    updated_at: component.updated_at,
  };
}

function mapConfigToDB(config: SubjectGradeConfig) {
  return {
    id: config.id,
    user_id: config.user_id,
    subject_code: config.subject_code,
    grade_aa_min: config.grade_aa_min,
    grade_ab_min: config.grade_ab_min,
    grade_bb_min: config.grade_bb_min,
    grade_bc_min: config.grade_bc_min,
    grade_cc_min: config.grade_cc_min,
    grade_cd_min: config.grade_cd_min,
    grade_dd_min: config.grade_dd_min,
    credits: config.credits,
    created_at: config.created_at,
    updated_at: config.updated_at,
  };
}

function mapScenarioToDB(scenario: GradeScenario) {
  return {
    id: scenario.id,
    user_id: scenario.user_id,
    subject_code: scenario.subject_code,
    name: scenario.name,
    assumptions: scenario.assumptions,
    projected_final_percentage: scenario.projected_final_percentage,
    projected_grade: scenario.projected_grade,
    created_at: scenario.created_at,
    updated_at: scenario.updated_at,
  };
}

export const marksSync = {
  async fetchCloudComponents(userId: string): Promise<MarkComponent[]> {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(mapComponentFromDB);
  },

  async fetchCloudGradeConfigs(userId: string): Promise<SubjectGradeConfig[]> {
    const { data, error } = await supabase
      .from('subject_grade_config')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(mapConfigFromDB);
  },

  async fetchCloudScenarios(userId: string): Promise<GradeScenario[]> {
    const { data, error } = await supabase
      .from('grade_scenarios')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(mapScenarioFromDB);
  },

  async uploadLocalComponents(userId: string, components: MarkComponent[]): Promise<void> {
    const payload = components.map(mapComponentToDB);
    const { error } = await supabase.from('marks').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalGradeConfigs(userId: string, configs: SubjectGradeConfig[]): Promise<void> {
    const payload = configs.map(mapConfigToDB);
    const { error } = await supabase.from('subject_grade_config').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalScenarios(userId: string, scenarios: GradeScenario[]): Promise<void> {
    const payload = scenarios.map(mapScenarioToDB);
    const { error } = await supabase.from('grade_scenarios').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSingleComponent(userId: string, component: MarkComponent): Promise<void> {
    const payload = mapComponentToDB(component);
    const { error } = await supabase.from('marks').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSingleGradeConfig(userId: string, config: SubjectGradeConfig): Promise<void> {
    const payload = mapConfigToDB(config);
    const { error } = await supabase.from('subject_grade_config').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSingleScenario(userId: string, scenario: GradeScenario): Promise<void> {
    const payload = mapScenarioToDB(scenario);
    const { error } = await supabase.from('grade_scenarios').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },
};