import { MarkComponent, SubjectGradeConfig, GradeScenario } from '@/lib/types';

const COMPONENTS_KEY = 'marks_components_v1';
const CONFIGS_KEY = 'marks_grade_configs_v1';
const SCENARIOS_KEY = 'marks_scenarios_v1';

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const marksStorage = {
  loadComponents: (): MarkComponent[] => loadJSON<MarkComponent[]>(COMPONENTS_KEY, []),
  saveComponents: (components: MarkComponent[]) => saveJSON(COMPONENTS_KEY, components),
  
  loadGradeConfigs: (): SubjectGradeConfig[] => loadJSON<SubjectGradeConfig[]>(CONFIGS_KEY, []),
  saveGradeConfigs: (configs: SubjectGradeConfig[]) => saveJSON(CONFIGS_KEY, configs),
  
  loadScenarios: (): GradeScenario[] => loadJSON<GradeScenario[]>(SCENARIOS_KEY, []),
  saveScenarios: (scenarios: GradeScenario[]) => saveJSON(SCENARIOS_KEY, scenarios),
  
  saveAll: (components: MarkComponent[], configs: SubjectGradeConfig[], scenarios: GradeScenario[]) => {
    saveJSON(COMPONENTS_KEY, components);
    saveJSON(CONFIGS_KEY, configs);
    saveJSON(SCENARIOS_KEY, scenarios);
  },
  
  reset: () => {
    saveJSON(COMPONENTS_KEY, []);
    saveJSON(CONFIGS_KEY, []);
    saveJSON(SCENARIOS_KEY, []);
  },
  
  exportData: (components: MarkComponent[], configs: SubjectGradeConfig[], scenarios: GradeScenario[]): string => {
    return JSON.stringify({ components, configs, scenarios, exportedAt: new Date().toISOString() }, null, 2);
  },
  
  importData: (json: string): { components: MarkComponent[]; configs: SubjectGradeConfig[]; scenarios: GradeScenario[] } | null => {
    try {
      const data = JSON.parse(json);
      if (data.components) saveJSON(COMPONENTS_KEY, data.components);
      if (data.configs) saveJSON(CONFIGS_KEY, data.configs);
      if (data.scenarios) saveJSON(SCENARIOS_KEY, data.scenarios);
      return { components: data.components || [], configs: data.configs || [], scenarios: data.scenarios || [] };
    } catch {
      return null;
    }
  },
};