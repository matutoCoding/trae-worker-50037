export interface PatternZone {
  id: string;
  name: string;
  color: string;
  layerOrder: number;
  priority: 'primary' | 'secondary' | 'background';
  pathD: string;
  area: number;
}

export interface PathLayer {
  id: string;
  zoneId: string;
  order: number;
  d: string;
  threadCount: number;
  windingDirection: 'cw' | 'ccw';
}

export interface PatternScheme {
  id: string;
  name: string;
  imageData: string | null;
  zones: PatternZone[];
  pathLayers: PathLayer[];
  createdAt: number;
}

export interface ThreadWarning {
  id: string;
  type: 'soft' | 'hard' | 'diameter' | 'plasticity';
  severity: 'warn' | 'danger';
  title: string;
  message: string;
  suggestion: string;
}

export interface ThreadFormula {
  id: string;
  lacquerRatio: number;
  tungOilRatio: number;
  brickPowderRatio: number;
  goldPowderRatio: number;
  otherAdditives: number;
  hardnessIndex: number;
  plasticityIndex: number;
  threadDiameter: number;
  warnings: ThreadWarning[];
}

export interface DensityZone {
  zoneId: string;
  density: number;
  level: 'sparse' | 'medium' | 'dense' | 'very-dense';
  loopCount: number;
  spacing: number;
}

export interface StackingLayer {
  zoneId: string;
  layerIndex: number;
  height: number;
  threadLength: number;
}

export interface WindingConfig {
  id: string;
  densityMap: DensityZone[];
  stackingLayers: StackingLayer[];
  totalHeight: number;
  temperature: number;
  humidity: number;
  dryingHours: number;
  lightAngle: number;
  lightElevation: number;
  goldApplied: boolean;
}

export interface RiskAlert {
  id: string;
  type: 'fragile' | 'collapse' | 'crack' | 'drying' | 'humidity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedAt: number;
  resolved: boolean;
}

export interface ProcessStep {
  id: string;
  stepOrder: number;
  name: string;
  description: string;
  durationHours: number;
  status: 'pending' | 'in-progress' | 'done';
}

export interface Work {
  id: string;
  name: string;
  thumbnail: string;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  author: string;
  createdAt: number;
  updatedAt: number;
  patternId: string;
  formulaId: string;
  windingId: string;
  alerts: RiskAlert[];
  steps: ProcessStep[];
  notes: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  coverImage: string;
  tags: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
  version: number;
  versionDate: number;
  author: string;
  patternScheme: PatternScheme;
  formula: ThreadFormula;
  winding: WindingConfig;
  usageCount: number;
}

export type PageKey = 'dashboard' | 'pattern' | 'thread' | 'winding' | 'archive' | 'templates';

export interface AppState {
  currentPage: PageKey;
  currentWorkId: string | null;
  pattern: PatternScheme;
  formula: ThreadFormula;
  winding: WindingConfig;
  works: Work[];
  templates: Template[];
  categories: TemplateCategory[];
  selectedTemplateId: string | null;
  selectedWorkId: string | null;
  showTemplateDetail: boolean;
}
