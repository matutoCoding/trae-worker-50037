import { create } from 'zustand';
import type {
  AppState, PageKey, PatternScheme, ThreadFormula, WindingConfig, Work, Template,
  Version, VersionDiff, CompareFormula, ConstructionPlan, ConstructionItem, PathLayer,
} from '../types';
import {
  createDefaultPattern, createDefaultFormula, createDefaultWinding, seedWorks, seedTemplates, seedCategories,
} from '../data/mockData';
import { calcHardnessIndex, calcPlasticityIndex, analyzeWarnings, calcDryingHours, calcZoneDensity, vectorizeImage, autoPartition } from '../utils/calculations';
import { uid } from '../utils/calculations';

function createCompareFormulas(baseFormula: ThreadFormula): CompareFormula[] {
  return [
    {
      ...JSON.parse(JSON.stringify(baseFormula)),
      compareId: 'cf_' + uid(),
      label: '方案 A（标准）',
      enabled: true,
    },
    {
      ...JSON.parse(JSON.stringify(baseFormula)),
      compareId: 'cf_' + uid(),
      label: '方案 B（偏硬）',
      brickPowderRatio: baseFormula.brickPowderRatio + 5,
      tungOilRatio: baseFormula.tungOilRatio - 5,
      enabled: true,
    },
  ].map(f => ({ ...f, hardnessIndex: calcHardnessIndex(f), plasticityIndex: calcPlasticityIndex(f), warnings: analyzeWarnings(f) }));
}

function generateConstructionPlan(pattern: PatternScheme, formula: ThreadFormula, winding: WindingConfig): ConstructionPlan {
  const items: ConstructionItem[] = [];
  let seq = 1;
  const sortedZones = [...pattern.zones].sort((a, b) => a.layerOrder - b.layerOrder);

  sortedZones.forEach((zone, zi) => {
    const zonePathLayers = pattern.pathLayers.filter(p => p.zoneId === zone.id);
    zonePathLayers.forEach((pl, pli) => {
      const isGoldNode = winding.goldApplied && zi === sortedZones.length - 1 && pli === zonePathLayers.length - 1;
      const stackingLayer = winding.stackingLayers.find(s => s.zoneId === zone.id && s.layerIndex === pli + 1);
      items.push({
        id: 'ci_' + uid(),
        zoneId: zone.id,
        zoneName: zone.name,
        zoneColor: zone.color,
        sequence: seq++,
        layerIndex: pli + 1,
        threadLength: stackingLayer?.threadLength || Math.round(zone.area * 0.25),
        threadDiameter: formula.threadDiameter,
        windingDirection: pl.windingDirection,
        threadCount: pl.threadCount,
        waitTimeMinutes: pli === zonePathLayers.length - 1 ? 60 : 20,
        isGoldNode,
        notes: isGoldNode ? '贴金前检查线料指触不粘' : zone.priority === 'primary' ? '主纹饰，注意走向流畅' : '辅纹饰，控制均匀度',
        status: 'pending',
      });
    });
  });

  const totalThreadLength = items.reduce((s, i) => s + i.threadLength, 0);
  const totalEstimatedHours = items.reduce((s, i) => s + i.waitTimeMinutes / 60 + i.threadCount * 0.1, 0);
  const totalGoldNodes = items.filter(i => i.isGoldNode).length;

  return { items, totalThreadLength, totalEstimatedHours, totalGoldNodes };
}

function compareVersions(v1: Version, v2: Version): VersionDiff {
  const diffField = <T>(field: string, oldVal: T, newVal: T) => ({
    field, oldValue: oldVal, newValue: newVal, changed: JSON.stringify(oldVal) !== JSON.stringify(newVal),
  });

  const patternZonesDiff: Array<{ zoneName: string; changes: any[] }> = [];
  const allZoneNames = new Set([...v1.patternSnapshot.zones.map(z => z.name), ...v2.patternSnapshot.zones.map(z => z.name)]);
  allZoneNames.forEach(zoneName => {
    const z1 = v1.patternSnapshot.zones.find(z => z.name === zoneName);
    const z2 = v2.patternSnapshot.zones.find(z => z.name === zoneName);
    if (z1 && z2) {
      const changes = [
        diffField('layerOrder', z1.layerOrder, z2.layerOrder),
        diffField('priority', z1.priority, z2.priority),
        diffField('area', z1.area, z2.area),
      ].filter(c => c.changed);
      if (changes.length > 0) patternZonesDiff.push({ zoneName, changes });
    } else if (!z1) {
      patternZonesDiff.push({ zoneName, changes: [{ field: '新增', oldValue: null, newValue: z2, changed: true }] });
    } else {
      patternZonesDiff.push({ zoneName, changes: [{ field: '删除', oldValue: z1, newValue: null, changed: true }] });
    }
  });

  const formulaDiff = [
    diffField('lacquerRatio', v1.formulaSnapshot.lacquerRatio, v2.formulaSnapshot.lacquerRatio),
    diffField('tungOilRatio', v1.formulaSnapshot.tungOilRatio, v2.formulaSnapshot.tungOilRatio),
    diffField('brickPowderRatio', v1.formulaSnapshot.brickPowderRatio, v2.formulaSnapshot.brickPowderRatio),
    diffField('goldPowderRatio', v1.formulaSnapshot.goldPowderRatio, v2.formulaSnapshot.goldPowderRatio),
    diffField('threadDiameter', v1.formulaSnapshot.threadDiameter, v2.formulaSnapshot.threadDiameter),
    diffField('hardnessIndex', v1.formulaSnapshot.hardnessIndex, v2.formulaSnapshot.hardnessIndex),
    diffField('plasticityIndex', v1.formulaSnapshot.plasticityIndex, v2.formulaSnapshot.plasticityIndex),
  ].filter(c => c.changed);

  const densityDiff: Array<{ zoneName: string; density: any }> = [];
  v1.windingSnapshot.densityMap.forEach(d1 => {
    const z1 = v1.patternSnapshot.zones.find(z => z.id === d1.zoneId);
    const d2 = v2.windingSnapshot.densityMap.find(x => {
      const z2 = v2.patternSnapshot.zones.find(zz => zz.id === x.zoneId);
      return z1 && z2 && z1.name === z2.name;
    });
    if (d2 && d1.density !== d2.density) {
      densityDiff.push({ zoneName: z1?.name || '未知', density: diffField('density', d1.density, d2.density) });
    }
  });

  return {
    versionId: v2.id,
    compareToId: v1.id,
    pattern: {
      zoneCount: diffField('分区数', v1.patternSnapshot.zones.length, v2.patternSnapshot.zones.length),
      pathLayerCount: diffField('路径层数', v1.patternSnapshot.pathLayers.length, v2.patternSnapshot.pathLayers.length),
      zones: patternZonesDiff,
    },
    formula: formulaDiff,
    winding: {
      totalHeight: diffField('总高度(mm)', v1.windingSnapshot.totalHeight, v2.windingSnapshot.totalHeight),
      stackingLayers: diffField('堆叠层数', v1.windingSnapshot.stackingLayers.length, v2.windingSnapshot.stackingLayers.length),
      dryingHours: diffField('干燥时间(h)', v1.windingSnapshot.dryingHours, v2.windingSnapshot.dryingHours),
      densityChanges: densityDiff,
    },
  };
}

const initPattern = createDefaultPattern();
const initFormula = createDefaultFormula();
const initWinding = createDefaultWinding(initPattern.zones, initPattern.pathLayers, initFormula.threadDiameter);

const seedVersions: Version[] = [];

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
  updatePathLayer: (plid: string, patch: Partial<PathLayer>) => void;
  createWorkFromTemplate: (tpl: Template) => void;
  updateWork: (wid: string, patch: Partial<Work>) => void;
  saveCurrentToWorks: () => void;
  toggleTemplateDetail: (tid: string | null) => void;
  selectWork: (wid: string | null) => void;
  processVectorize: () => Promise<void>;
  processAutoPartition: () => Promise<void>;
  saveVersion: (note: string) => void;
  getVersionsByWork: (workId: string) => Version[];
  restoreVersion: (versionId: string) => void;
  compareTwoVersions: (v1Id: string, v2Id: string) => VersionDiff | null;
  setSelectedCompareVersion: (vid: string | null) => void;
  addCompareFormula: () => void;
  updateCompareFormula: (compareId: string, patch: Partial<ThreadFormula>) => void;
  removeCompareFormula: (compareId: string) => void;
  toggleCompareFormula: (compareId: string) => void;
  applyCompareFormula: (compareId: string) => void;
  resetCompareFormulas: () => void;
  generateConstructionPlan: () => void;
  updateConstructionItem: (itemId: string, patch: Partial<ConstructionItem>) => void;
  saveConstructionPlanToWork: () => void;
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
  versions: seedVersions,
  compareFormulas: createCompareFormulas(initFormula),
  selectedCompareVersionId: null,
  constructionPlan: generateConstructionPlan(initPattern, initFormula, initWinding),

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
    const dens = calcZoneDensity(pattern.zones, pattern.pathLayers);
    const stacking = pattern.zones.flatMap(z => {
      const zonePathLayers = pattern.pathLayers.filter(p => p.zoneId === z.id).sort((a, b) => a.order - b.order);
      if (zonePathLayers.length === 0) {
        return Array.from({ length: Math.max(1, z.layerOrder) }, (_, k) => ({
          zoneId: z.id, layerIndex: k + 1,
          height: formula.threadDiameter * (0.85 + k * 0.1),
          threadLength: Math.round(z.area * (0.2 + k * 0.08)),
        }));
      }
      return zonePathLayers.map((pl, k) => ({
        zoneId: z.id, layerIndex: pl.order,
        height: formula.threadDiameter * (0.85 + k * 0.1),
        threadLength: Math.round(z.area * (0.15 + pl.threadCount * 0.02)),
      }));
    });
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
    const { pattern, formula, winding, currentWorkId, works, versions } = get();
    const ts = Date.now();
    const patternSnapshot = JSON.parse(JSON.stringify(pattern));
    const formulaSnapshot = JSON.parse(JSON.stringify(formula));
    const windingSnapshot = JSON.parse(JSON.stringify(winding));
    let workId = currentWorkId;
    if (workId) {
      set({ works: works.map(w => w.id === workId ? { ...w, updatedAt: ts, patternSnapshot, formulaSnapshot, windingSnapshot } : w) });
    } else {
      const newWork: Work = {
        id: 'wk_' + uid(), name: pattern.name,
        thumbnail: 'linear-gradient(135deg,#BE3A2B,#8B2323 60%,#2C1810)',
        status: 'draft', author: '我', createdAt: ts, updatedAt: ts,
        patternId: pattern.id, formulaId: formula.id, windingId: winding.id,
        patternSnapshot, formulaSnapshot, windingSnapshot,
        alerts: [], steps: [], notes: '',
      };
      workId = newWork.id;
      set({ works: [newWork, ...works], currentWorkId: workId, selectedWorkId: workId });
    }
    const workVersions = versions.filter(v => v.workId === workId);
    const newVersion: Version = {
      id: 'v_' + uid(),
      workId,
      versionNumber: workVersions.length + 1,
      name: `v${workVersions.length + 1} · ${pattern.name}`,
      createdAt: ts,
      author: '我',
      note: '保存方案快照',
      patternSnapshot,
      formulaSnapshot,
      windingSnapshot,
    };
    set({ versions: [...versions, newVersion] });
  },

  toggleTemplateDetail: (tid) => set({ selectedTemplateId: tid, showTemplateDetail: !!tid }),

  selectWork: (wid) => {
    const work = get().works.find(w => w.id === wid);
    if (work) {
      const pattern = JSON.parse(JSON.stringify(work.patternSnapshot));
      const formula = JSON.parse(JSON.stringify(work.formulaSnapshot));
      const winding = JSON.parse(JSON.stringify(work.windingSnapshot));
      set({
        selectedWorkId: wid,
        currentWorkId: wid,
        pattern: { ...pattern, id: get().pattern.id },
        formula: { ...formula, id: get().formula.id },
        winding: { ...winding, id: get().winding.id },
      });
      setTimeout(() => get().generateConstructionPlan(), 0);
    } else {
      set({ selectedWorkId: wid });
    }
  },

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

  updatePathLayer: (plid, patch) => {
    const pathLayers = get().pattern.pathLayers.map(pl =>
      pl.id === plid ? { ...pl, ...patch } : pl
    );
    set({ pattern: { ...get().pattern, pathLayers } });
    setTimeout(() => {
      get().recomputeWinding();
      get().generateConstructionPlan();
    }, 0);
  },

  saveVersion: (note) => {
    const { currentWorkId, pattern, formula, winding, works, versions } = get();
    if (!currentWorkId) {
      alert('请先保存作品到档案，再创建版本');
      return;
    }
    const workVersions = versions.filter(v => v.workId === currentWorkId);
    const newVersion: Version = {
      id: 'v_' + uid(),
      workId: currentWorkId,
      versionNumber: workVersions.length + 1,
      name: `v${workVersions.length + 1} · ${pattern.name}`,
      createdAt: Date.now(),
      author: '我',
      note,
      patternSnapshot: JSON.parse(JSON.stringify(pattern)),
      formulaSnapshot: JSON.parse(JSON.stringify(formula)),
      windingSnapshot: JSON.parse(JSON.stringify(winding)),
    };
    set({ versions: [...versions, newVersion] });
  },

  getVersionsByWork: (workId) => {
    return get().versions.filter(v => v.workId === workId).sort((a, b) => b.versionNumber - a.versionNumber);
  },

  restoreVersion: (versionId) => {
    const version = get().versions.find(v => v.id === versionId);
    if (!version) return;
    const pattern = JSON.parse(JSON.stringify(version.patternSnapshot));
    const formula = JSON.parse(JSON.stringify(version.formulaSnapshot));
    const winding = JSON.parse(JSON.stringify(version.windingSnapshot));
    const works = get().works.map(w =>
      w.id === version.workId ? { ...w, patternSnapshot: pattern, formulaSnapshot: formula, windingSnapshot: winding, updatedAt: Date.now() } : w
    );
    set({
      pattern: { ...pattern, id: get().pattern.id },
      formula: { ...formula, id: get().formula.id },
      winding: { ...winding, id: get().winding.id },
      currentWorkId: version.workId,
      selectedWorkId: version.workId,
      works,
    });
    setTimeout(() => get().generateConstructionPlan(), 0);
  },

  compareTwoVersions: (v1Id, v2Id) => {
    const { versions } = get();
    const v1 = versions.find(v => v.id === v1Id);
    const v2 = versions.find(v => v.id === v2Id);
    if (!v1 || !v2) return null;
    return compareVersions(v1, v2);
  },

  setSelectedCompareVersion: (vid) => set({ selectedCompareVersionId: vid }),

  addCompareFormula: () => {
    const { compareFormulas, formula } = get();
    if (compareFormulas.length >= 3) {
      alert('最多支持 3 个配方同时对比');
      return;
    }
    const labels = ['方案 A（标准）', '方案 B（偏硬）', '方案 C（偏软）'];
    const newCf: CompareFormula = {
      ...JSON.parse(JSON.stringify(formula)),
      compareId: 'cf_' + uid(),
      label: labels[compareFormulas.length] || `方案 ${String.fromCharCode(65 + compareFormulas.length)}`,
      enabled: true,
    };
    newCf.hardnessIndex = calcHardnessIndex(newCf);
    newCf.plasticityIndex = calcPlasticityIndex(newCf);
    newCf.warnings = analyzeWarnings(newCf);
    set({ compareFormulas: [...compareFormulas, newCf] });
  },

  updateCompareFormula: (compareId, patch) => {
    const compareFormulas = get().compareFormulas.map(cf => {
      if (cf.compareId !== compareId) return cf;
      const updated = { ...cf, ...patch };
      updated.hardnessIndex = calcHardnessIndex(updated);
      updated.plasticityIndex = calcPlasticityIndex(updated);
      updated.warnings = analyzeWarnings(updated);
      return updated;
    });
    set({ compareFormulas });
  },

  removeCompareFormula: (compareId) => {
    set({ compareFormulas: get().compareFormulas.filter(cf => cf.compareId !== compareId) });
  },

  toggleCompareFormula: (compareId) => {
    set({
      compareFormulas: get().compareFormulas.map(cf =>
        cf.compareId === compareId ? { ...cf, enabled: !cf.enabled } : cf
      ),
    });
  },

  applyCompareFormula: (compareId) => {
    const cf = get().compareFormulas.find(c => c.compareId === compareId);
    if (!cf) return;
    const { id, ...rest } = cf;
    const formula = { ...rest, id: get().formula.id } as ThreadFormula;
    formula.hardnessIndex = calcHardnessIndex(formula);
    formula.plasticityIndex = calcPlasticityIndex(formula);
    formula.warnings = analyzeWarnings(formula);
    set({ formula });
    setTimeout(() => {
      get().recomputeWinding();
      get().generateConstructionPlan();
    }, 0);
  },

  resetCompareFormulas: () => {
    set({ compareFormulas: createCompareFormulas(get().formula) });
  },

  generateConstructionPlan: () => {
    const { pattern, formula, winding } = get();
    const plan = generateConstructionPlan(pattern, formula, winding);
    set({ constructionPlan: plan });
  },

  updateConstructionItem: (itemId, patch) => {
    const plan = get().constructionPlan;
    if (!plan) return;
    const items = plan.items.map(item =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    set({ constructionPlan: { ...plan, items } });
  },

  saveConstructionPlanToWork: () => {
    const { constructionPlan, currentWorkId, works, pattern } = get();
    if (!constructionPlan) return;
    let workId = currentWorkId;
    if (!workId) {
      const ts = Date.now();
      const patternSnapshot = JSON.parse(JSON.stringify(get().pattern));
      const formulaSnapshot = JSON.parse(JSON.stringify(get().formula));
      const windingSnapshot = JSON.parse(JSON.stringify(get().winding));
      const newWork: Work = {
        id: 'wk_' + uid(), name: pattern.name,
        thumbnail: 'linear-gradient(135deg,#BE3A2B,#8B2323 60%,#2C1810)',
        status: 'draft', author: '我', createdAt: ts, updatedAt: ts,
        patternId: pattern.id, formulaId: get().formula.id, windingId: get().winding.id,
        patternSnapshot, formulaSnapshot, windingSnapshot,
        alerts: [], steps: [], notes: '',
      };
      workId = newWork.id;
      const workVersions = get().versions.filter(v => v.workId === workId);
      const newVersion: Version = {
        id: 'v_' + uid(), workId, versionNumber: workVersions.length + 1,
        name: `v${workVersions.length + 1} · ${pattern.name}`, createdAt: ts, author: '我',
        note: '保存施工清单时自动创建', patternSnapshot, formulaSnapshot, windingSnapshot,
      };
      set({
        works: [newWork, ...works],
        versions: [...get().versions, newVersion],
        currentWorkId: workId, selectedWorkId: workId,
      });
    }
    const currentWorks = get().works;
    const work = currentWorks.find(w => w.id === workId);
    if (!work) return;
    const steps = constructionPlan.items.map((item, i) => ({
      id: 'ps_' + uid(),
      stepOrder: i + 1,
      name: `${item.zoneName} · 第${item.layerIndex}层`,
      description: `${item.windingDirection === 'cw' ? '顺时针' : '逆时针'}盘绕 ${item.threadCount} 匝，用线约 ${item.threadLength}m，半干等待 ${item.waitTimeMinutes} 分钟${item.isGoldNode ? '，贴金节点' : ''}`,
      durationHours: Math.round((item.waitTimeMinutes / 60 + item.threadCount * 0.1) * 10) / 10,
      status: item.status,
    }));
    set({
      works: currentWorks.map(w => w.id === workId ? { ...w, steps, updatedAt: Date.now() } : w),
      selectedWorkId: workId,
    });
  },
}));
