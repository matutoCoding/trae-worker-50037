import { create } from 'zustand';
import type { AppState, PageKey, PatternScheme, ThreadFormula, WindingConfig, Work, Template } from '../types';
import {
  createDefaultPattern, createDefaultFormula, createDefaultWinding, seedWorks, seedTemplates, seedCategories,
} from '../data/mockData';
import { calcHardnessIndex, calcPlasticityIndex, analyzeWarnings, calcDryingHours, calcZoneDensity, vectorizeImage, autoPartition } from '../utils/calculations';
import { uid } from '../utils/calculations';

const initPattern = createDefaultPattern();
const initFormula = createDefaultFormula();
const initWinding = createDefaultWinding(initPattern.zones, initFormula.threadDiameter);

export const useQxdStore = create<AppState & {
  setPage: (p: PageKey) => void;
  setCurrentWork: (id: string | null) => void;
  updatePattern: (patch: Partial<PatternScheme>) => void;
  updateFormula: (patch: Partial<ThreadFormula>) => void;
  updateWinding: (patch: Partial<WindingConfig>) => void;
  recomputeFormula: () => void;
  recomputeWinding: () => void;
  addZone: () => void;
  updateZone: (zid: string, patch: Record<string, any>) => void;
  removeZone: (zid: string) => void;
  createWorkFromTemplate: (tpl: Template) => void;
  updateWork: (wid: string, patch: Partial<Work>) => void;
  saveCurrentToWorks: () => void;
  toggleTemplateDetail: (tid: string | null) => void;
  selectWork: (wid: string | null) => void;
  processVectorize: () => Promise<void>;
  processAutoPartition: () => Promise<void>;
}>()((set, get) => ({
  currentPage: 'dashboard',
  currentWorkId: null,
  pattern: initPattern,
  formula: initFormula,
  winding: initWinding,
  works: seedWorks,
  templates: seedTemplates,
  categories: seedCategories,
  selectedTemplateId: null,
  selectedWorkId: null,
  showTemplateDetail: false,

  setPage: (p) => set({ currentPage: p }),
  setCurrentWork: (id) => set({ currentWorkId: id }),

  updatePattern: (patch) => set({ pattern: { ...get().pattern, ...patch, id: get().pattern.id } }),

  updateFormula: (patch) => {
    set({ formula: { ...get().formula, ...patch } });
  },

  recomputeFormula: () => {
    const f = get().formula;
    const hardnessIndex = calcHardnessIndex(f);
    const plasticityIndex = calcPlasticityIndex(f);
    const warnings = analyzeWarnings({ ...f, hardnessIndex, plasticityIndex });
    set({ formula: { ...f, hardnessIndex, plasticityIndex, warnings } });
  },

  updateWinding: (patch) => set({ winding: { ...get().winding, ...patch } }),

  recomputeWinding: () => {
    const { winding, pattern, formula } = get();
    const dens = calcZoneDensity(pattern.zones);
    const stacking = pattern.zones.flatMap(z => Array.from({ length: Math.max(1, z.layerOrder) }, (_, k) => ({
      zoneId: z.id, layerIndex: k + 1,
      height: formula.threadDiameter * (0.85 + k * 0.1),
      threadLength: Math.round(z.area * (0.2 + k * 0.08)),
    })));
    const totalHeight = stacking.reduce((s, l) => Math.max(s, l.height * l.layerIndex), 0);
    const densityMap = pattern.zones.map(z => ({ zoneId: z.id, ...(dens[z.id] as any) }));
    const dryingHours = calcDryingHours({ ...winding, stackingLayers: stacking }, formula.threadDiameter);
    set({
      winding: { ...winding, densityMap, stackingLayers: stacking, totalHeight: Math.round(totalHeight * 10) / 10, dryingHours },
    });
  },

  addZone: () => {
    const palette = ['#BE3A2B', '#D4AF37', '#8B7C6C', '#CB503B', '#6E8B3D', '#4169E1', '#9932CC', '#2E8B57'];
    const zones = get().pattern.zones;
    const idx = zones.length;
    const newZone = {
      id: 'z_' + uid(), name: `分区 ${idx + 1}`, color: palette[idx % palette.length],
      layerOrder: idx + 1, priority: idx === 0 ? 'primary' : idx < 3 ? 'secondary' : 'background' as any,
      area: 1000 + idx * 200,
      pathD: `M${80 + idx * 20},${80 + idx * 20} h160 v160 h-160 Z`,
    };
    const pathLayers = [...get().pattern.pathLayers, {
      id: 'p_' + uid(), zoneId: newZone.id, order: idx + 1, d: newZone.pathD, threadCount: 3, windingDirection: 'cw' as const,
    }];
    set({ pattern: { ...get().pattern, zones: [...zones, newZone], pathLayers } });
    setTimeout(() => get().recomputeWinding(), 0);
  },

  updateZone: (zid, patch) => {
    const zones = get().pattern.zones.map(z => z.id === zid ? { ...z, ...patch } : z);
    set({ pattern: { ...get().pattern, zones } });
    setTimeout(() => get().recomputeWinding(), 0);
  },

  removeZone: (zid) => {
    const zones = get().pattern.zones.filter(z => z.id !== zid);
    const pathLayers = get().pattern.pathLayers.filter(p => p.zoneId !== zid);
    set({ pattern: { ...get().pattern, zones, pathLayers } });
    setTimeout(() => get().recomputeWinding(), 0);
  },

  createWorkFromTemplate: (tpl) => {
    const pattern = { ...tpl.patternScheme, id: 'pat_' + uid(), name: tpl.name + '（衍生）', createdAt: Date.now() };
    const formula = { ...tpl.formula, id: 'form_' + uid(), warnings: [] };
    const winding = { ...tpl.winding, id: 'win_' + uid() };
    const newWork: Work = {
      id: 'wk_' + uid(), name: tpl.name + ' · 新作',
      thumbnail: tpl.coverImage, status: 'draft', author: '我',
      createdAt: Date.now(), updatedAt: Date.now(),
      patternId: pattern.id, formulaId: formula.id, windingId: winding.id,
      patternSnapshot: JSON.parse(JSON.stringify(pattern)),
      formulaSnapshot: JSON.parse(JSON.stringify(formula)),
      windingSnapshot: JSON.parse(JSON.stringify(winding)),
      alerts: [], steps: [], notes: `基于模板「${tpl.name}」创建，可按需求微调参数。`,
    };
    set({
      pattern, formula, winding,
      works: [newWork, ...get().works],
      currentWorkId: newWork.id, currentPage: 'pattern', showTemplateDetail: false,
    });
  },

  updateWork: (wid, patch) => set({ works: get().works.map(w => w.id === wid ? { ...w, ...patch, updatedAt: Date.now() } : w) }),

  saveCurrentToWorks: () => {
    const { pattern, formula, winding, currentWorkId, works } = get();
    const ts = Date.now();
    const patternSnapshot = JSON.parse(JSON.stringify(pattern));
    const formulaSnapshot = JSON.parse(JSON.stringify(formula));
    const windingSnapshot = JSON.parse(JSON.stringify(winding));
    if (currentWorkId) {
      set({ works: works.map(w => w.id === currentWorkId ? { ...w, updatedAt: ts, patternSnapshot, formulaSnapshot, windingSnapshot } : w) });
    } else {
      const newWork: Work = {
        id: 'wk_' + uid(), name: pattern.name,
        thumbnail: 'linear-gradient(135deg,#BE3A2B,#8B2323 60%,#2C1810)',
        status: 'draft', author: '我', createdAt: ts, updatedAt: ts,
        patternId: pattern.id, formulaId: formula.id, windingId: winding.id,
        patternSnapshot, formulaSnapshot, windingSnapshot,
        alerts: [], steps: [], notes: '',
      };
      set({ works: [newWork, ...works], currentWorkId: newWork.id });
    }
  },

  toggleTemplateDetail: (tid) => set({ selectedTemplateId: tid, showTemplateDetail: !!tid }),

  selectWork: (wid) => set({ selectedWorkId: wid }),

  processVectorize: async () => {
    const { pattern } = get();
    if (!pattern.imageData) {
      alert('请先上传纹样图片');
      return;
    }
    const result = await vectorizeImage(pattern.imageData, pattern);
    set({
      pattern: {
        ...pattern,
        zones: result.zones,
        pathLayers: result.pathLayers,
      },
    });
    setTimeout(() => get().recomputeWinding(), 0);
  },

  processAutoPartition: async () => {
    const { pattern } = get();
    if (!pattern.imageData) {
      alert('请先上传纹样图片');
      return;
    }
    const result = await autoPartition(pattern.imageData, pattern);
    set({
      pattern: {
        ...pattern,
        zones: result.zones,
        pathLayers: result.pathLayers,
      },
    });
    setTimeout(() => get().recomputeWinding(), 0);
  },
}));
