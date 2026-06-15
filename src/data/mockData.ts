import type { Work, PatternScheme, ThreadFormula, WindingConfig, Template, TemplateCategory, PatternZone, PathLayer } from '../types';
import { uid, calcHardnessIndex, calcPlasticityIndex, analyzeWarnings, calcDryingHours, calcZoneDensity } from '@/utils/calculations';

const now = Date.now();

export const defaultZones: PatternZone[] = [
  { id: 'z1', name: '中央主纹·团龙', color: '#BE3A2B', layerOrder: 4, priority: 'primary', area: 3200, pathD: 'M100,200 C150,120 250,120 300,200 C350,280 250,360 200,300 C150,360 50,280 100,200 Z' },
  { id: 'z2', name: '上沿·祥云边', color: '#D4AF37', layerOrder: 2, priority: 'secondary', area: 1800, pathD: 'M60,100 Q200,40 340,100 Q320,130 200,120 Q80,130 60,100 Z' },
  { id: 'z3', name: '下沿·仰莲瓣', color: '#8B7C6C', layerOrder: 3, priority: 'secondary', area: 2100, pathD: 'M70,320 Q120,280 170,320 Q220,280 270,320 Q320,280 350,320 L340,380 L80,380 Z' },
  { id: 'z4', name: '背景·地纹', color: '#ECE2CA', layerOrder: 1, priority: 'background', area: 5200, pathD: 'M40,40 L360,40 L360,400 L40,400 Z' },
];

export const defaultPathLayers: PathLayer[] = [
  { id: 'p1', zoneId: 'z1', order: 1, d: defaultZones[0].pathD, threadCount: 8, windingDirection: 'cw' },
  { id: 'p2', zoneId: 'z2', order: 2, d: defaultZones[1].pathD, threadCount: 4, windingDirection: 'ccw' },
  { id: 'p3', zoneId: 'z3', order: 3, d: defaultZones[2].pathD, threadCount: 5, windingDirection: 'cw' },
  { id: 'p4', zoneId: 'z4', order: 4, d: defaultZones[3].pathD, threadCount: 2, windingDirection: 'cw' },
];

export function createDefaultPattern(): PatternScheme {
  return {
    id: 'pat_' + uid(),
    name: '团龙祥云纹（示例）',
    imageData: null,
    zones: defaultZones.map(z => ({ ...z, id: z.id + '_' + uid().slice(0,4) })),
    pathLayers: defaultPathLayers.map(p => ({ ...p, id: p.id + '_' + uid().slice(0,4) })),
    createdAt: now,
  };
}

export function createDefaultFormula(): ThreadFormula {
  const base = {
    id: 'form_' + uid(),
    lacquerRatio: 42,
    tungOilRatio: 18,
    brickPowderRatio: 32,
    goldPowderRatio: 5,
    otherAdditives: 3,
    threadDiameter: 0.9,
  } as ThreadFormula;
  base.hardnessIndex = calcHardnessIndex(base);
  base.plasticityIndex = calcPlasticityIndex(base);
  base.warnings = analyzeWarnings(base);
  return base;
}

export function createDefaultWinding(zones: PatternZone[], diameter: number): WindingConfig {
  const dens = calcZoneDensity(zones);
  const stacking = zones.flatMap((z, i) => Array.from({ length: Math.max(1, z.layerOrder) }, (_, k) => ({
    zoneId: z.id, layerIndex: k + 1, height: diameter * (0.85 + k * 0.1), threadLength: Math.round(z.area * (0.2 + k * 0.08)),
  })));
  const totalHeight = stacking.reduce((s, l) => Math.max(s, l.height * l.layerIndex), 0);
  const baseCfg = {
    id: 'win_' + uid(),
    densityMap: zones.map(z => ({ zoneId: z.id, ...dens[z.id] })) as any,
    stackingLayers: stacking,
    totalHeight: Math.round(totalHeight * 10) / 10,
    temperature: 23,
    humidity: 58,
    lightAngle: 45,
    lightElevation: 60,
    goldApplied: true,
  } as WindingConfig;
  baseCfg.dryingHours = calcDryingHours(baseCfg, diameter);
  return baseCfg;
}

const basePattern = createDefaultPattern();
const baseFormula = createDefaultFormula();
const baseWinding = createDefaultWinding(basePattern.zones, baseFormula.threadDiameter);

export const seedCategories: TemplateCategory[] = [
  { id: 'dragon', name: '龙凤呈祥', icon: '🐉', count: 12 },
  { id: 'flora', name: '瑞花珍禽', icon: '🌸', count: 18 },
  { id: 'cloud', name: '云水山川', icon: '☁️', count: 9 },
  { id: 'figure', name: '仙佛人物', icon: '🧘', count: 7 },
  { id: 'geo', name: '万字回纹', icon: '⬢', count: 14 },
  { id: 'border', name: '花边边框', icon: '🪷', count: 11 },
];

const sampleCovers = [
  'linear-gradient(135deg,#BE3A2B 0%,#8B2323 50%,#3E2F22 100%)',
  'linear-gradient(135deg,#D4AF37 0%,#997221 55%,#2C1810 100%)',
  'linear-gradient(135deg,#CB503B 0%,#D4AF37 50%,#6E1B1B 100%)',
  'linear-gradient(135deg,#2C1810 0%,#8B2323 50%,#D4AF37 100%)',
  'linear-gradient(135deg,#B8ADA0 0%,#997221 40%,#8B2323 100%)',
  'linear-gradient(135deg,#6E1B1B 0%,#B54133 35%,#DDB83D 100%)',
];

export const seedTemplates: Template[] = [
  {
    id: 'tpl_dragon_01', name: '九龙戏珠·大盘', category: 'dragon',
    description: '经典九龙盘绕纹样，中央火珠主纹，九龙循环盘绕，层次丰富，气势恢宏。适合30cm以上大盘制作。',
    coverImage: sampleCovers[0], tags: ['皇家制式','龙纹','大盘','高难度'],
    complexity: 5, version: 2, versionDate: now - 86400000 * 30, author: '国家级传承人·陈大师',
    patternScheme: { ...basePattern, name: '九龙戏珠纹', id: 'p_d01' },
    formula: { ...baseFormula, id: 'f_d01', goldPowderRatio: 8, brickPowderRatio: 30, lacquerRatio: 40, threadDiameter: 0.8, hardnessIndex: 68, plasticityIndex: 58, warnings: [] },
    winding: { ...baseWinding, id: 'w_d01', totalHeight: 14.6 },
    usageCount: 127,
  },
  {
    id: 'tpl_flora_04', name: '缠枝牡丹·捧盒', category: 'flora',
    description: '缠枝牡丹纹连绵不断，寓意富贵长久。适合圆形漆盒顶面装饰，线径适中，适合进阶工艺师。',
    coverImage: sampleCovers[1], tags: ['缠枝纹','牡丹','捧盒','经典'],
    complexity: 3, version: 1, versionDate: now - 86400000 * 60, author: '传承人·林师傅',
    patternScheme: { ...basePattern, name: '缠枝牡丹纹', id: 'p_f04' },
    formula: { ...baseFormula, id: 'f_f04', threadDiameter: 1.0, hardnessIndex: 72, plasticityIndex: 62, warnings: [] },
    winding: { ...baseWinding, id: 'w_f04', totalHeight: 9.8 },
    usageCount: 342,
  },
  {
    id: 'tpl_cloud_02', name: '四合如意云·插屏', category: 'cloud',
    description: '四合如意云纹，寓意四方平安如意。线条流畅柔和，适合入门练习，密度适中易上手。',
    coverImage: sampleCovers[2], tags: ['如意纹','云纹','入门','插屏'],
    complexity: 2, version: 3, versionDate: now - 86400000 * 14, author: '工艺师·王小姐',
    patternScheme: { ...basePattern, name: '四合如意云纹', id: 'p_c02' },
    formula: { ...baseFormula, id: 'f_c02', threadDiameter: 1.2, tungOilRatio: 20, lacquerRatio: 44, hardnessIndex: 74, plasticityIndex: 65, warnings: [] },
    winding: { ...baseWinding, id: 'w_c02', totalHeight: 7.2 },
    usageCount: 518,
  },
  {
    id: 'tpl_geo_08', name: '万字不到头·长盘', category: 'geo',
    description: '万字不到头几何连续纹，寓意吉祥绵延无尽。规整对称，对搓线均匀度要求较高。',
    coverImage: sampleCovers[3], tags: ['万字纹','几何','长盘','中难度'],
    complexity: 4, version: 1, versionDate: now - 86400000 * 90, author: '老艺人·张师傅',
    patternScheme: { ...basePattern, name: '万字不到头纹', id: 'p_g08' },
    formula: { ...baseFormula, id: 'f_g08', threadDiameter: 0.7, hardnessIndex: 80, plasticityIndex: 55, warnings: [] },
    winding: { ...baseWinding, id: 'w_g08', totalHeight: 5.4 },
    usageCount: 203,
  },
  {
    id: 'tpl_border_03', name: '仰莲须弥座·瓶身', category: 'border',
    description: '仰莲瓣+须弥座组合边饰，适合器身下部装饰。层次分明，贴金后效果华贵。',
    coverImage: sampleCovers[4], tags: ['莲瓣纹','须弥座','边饰','瓶身'],
    complexity: 3, version: 2, versionDate: now - 86400000 * 45, author: '传承人·李师傅',
    patternScheme: { ...basePattern, name: '仰莲须弥座纹', id: 'p_b03' },
    formula: { ...baseFormula, id: 'f_b03', goldPowderRatio: 10, brickPowderRatio: 28, lacquerRatio: 42, threadDiameter: 0.9, hardnessIndex: 70, plasticityIndex: 60, warnings: [] },
    winding: { ...baseWinding, id: 'w_b03', totalHeight: 11.2 },
    usageCount: 176,
  },
  {
    id: 'tpl_figure_01', name: '观音踏莲·挂屏', category: 'figure',
    description: '观音踏莲造像挂屏，衣纹流畅层次多，需细腻手法表现飘带与莲瓣。人物开面精细。',
    coverImage: sampleCovers[5], tags: ['观音','人物','挂屏','大师级'],
    complexity: 5, version: 1, versionDate: now - 86400000 * 120, author: '国家级传承人·陈大师',
    patternScheme: { ...basePattern, name: '观音踏莲纹', id: 'p_fg01' },
    formula: { ...baseFormula, id: 'f_fg01', threadDiameter: 0.5, hardnessIndex: 78, plasticityIndex: 56, warnings: [] },
    winding: { ...baseWinding, id: 'w_fg01', totalHeight: 6.8 },
    usageCount: 64,
  },
];

export const seedWorks: Work[] = [
  {
    id: 'wk_001', name: '云鹤寿字盘（创作中）',
    thumbnail: sampleCovers[2], status: 'in-progress', author: '我',
    createdAt: now - 86400000 * 5, updatedAt: now - 3600000 * 3,
    patternId: 'p_w01', formulaId: 'f_w01', windingId: 'w_w01',
    alerts: [
      { id: 'a1', type: 'humidity', severity: 'medium', message: '当前工作间湿度 38% 偏低，线料失水速度加快，建议启用加湿器。', detectedAt: now - 3600000 * 2, resolved: false },
    ],
    steps: [
      { id: 's1', stepOrder: 1, name: '纹样设计定稿', description: '导入云鹤纹样并规划走向层次', durationHours: 4, status: 'done' },
      { id: 's2', stepOrder: 2, name: '线料搓制', description: '按配比制备漆料，搓制三种规格线料', durationHours: 6, status: 'done' },
      { id: 's3', stepOrder: 3, name: '盘绕造型', description: '按走向规划盘绕主纹与辅纹', durationHours: 12, status: 'in-progress' },
      { id: 's4', stepOrder: 4, name: '堆叠定型', description: '多层堆叠高度 8.5mm，干燥静置', durationHours: 8, status: 'pending' },
      { id: 's5', stepOrder: 5, name: '贴金罩明', description: '贴金箔两道，罩明漆三道', durationHours: 5, status: 'pending' },
    ],
    notes: '寿字笔画用 0.8mm 金漆线，鹤羽用 0.5mm 细线分 6 层堆叠。',
  },
  {
    id: 'wk_002', name: '缠枝莲茶叶罐',
    thumbnail: sampleCovers[1], status: 'completed', author: '我',
    createdAt: now - 86400000 * 22, updatedAt: now - 86400000 * 8,
    patternId: 'p_w02', formulaId: 'f_w02', windingId: 'w_w02',
    alerts: [
      { id: 'a2', type: 'drying', severity: 'low', message: '干燥时间延长 2 小时，属正常范围。', detectedAt: now - 86400000 * 10, resolved: true },
    ],
    steps: Array.from({ length: 5 }, (_, i) => ({ id: 's' + i, stepOrder: i + 1, name: ['纹样设计', '线料搓制', '盘绕', '堆叠定型', '贴金罩明'][i], description: '-', durationHours: [3,5,10,6,4][i], status: 'done' as const })),
    notes: '学员作品，缠枝纹走向流畅度良好，可作为示范案例。',
  },
  {
    id: 'wk_003', name: '饕餮纹方鼎·样稿',
    thumbnail: sampleCovers[3], status: 'draft', author: '我',
    createdAt: now - 86400000 * 2, updatedAt: now - 86400000,
    patternId: 'p_w03', formulaId: 'f_w03', windingId: 'w_w03',
    alerts: [],
    steps: [{ id: 's0', stepOrder: 1, name: '前期方案', description: '查阅青铜纹样资料', durationHours: 6, status: 'in-progress' }],
    notes: '参考商代青铜饕餮纹，计划 4 条夔龙+中央饕餮，尚在构图阶段。',
  },
  {
    id: 'wk_004', name: '描金山水折沿盘',
    thumbnail: sampleCovers[5], status: 'archived', author: '我',
    createdAt: now - 86400000 * 180, updatedAt: now - 86400000 * 100,
    patternId: 'p_w04', formulaId: 'f_w04', windingId: 'w_w04',
    alerts: [
      { id: 'a3', type: 'crack', severity: 'high', message: '第 3 层盘绕时发现裂纹，返工修复，已记录方案偏差。', detectedAt: now - 86400000 * 120, resolved: true },
    ],
    steps: Array.from({ length: 5 }, (_, i) => ({ id: 's' + i, stepOrder: i + 1, name: ['纹样设计', '线料搓制', '盘绕', '堆叠定型', '贴金罩明'][i], description: '-', durationHours: [4,7,14,10,5][i], status: 'done' as const })),
    notes: '山水皴法用交叉盘绕技巧，远山近水分层次表现。断裂问题已通过调整硬度指数解决。',
  },
  {
    id: 'wk_005', name: '百福图挂屏',
    thumbnail: sampleCovers[0], status: 'in-progress', author: '我',
    createdAt: now - 86400000 * 12, updatedAt: now - 86400000,
    patternId: 'p_w05', formulaId: 'f_w05', windingId: 'w_w05',
    alerts: [
      { id: 'a4', type: 'fragile', severity: 'high', message: '线料已干燥 12 小时（预计 8 小时），存在变脆断裂高风险，请尽快贴金罩明。', detectedAt: now - 1800000, resolved: false },
    ],
    steps: Array.from({ length: 5 }, (_, i) => ({ id: 's' + i, stepOrder: i + 1, name: ['纹样设计', '线料搓制', '盘绕', '堆叠定型', '贴金罩明'][i], description: '-', durationHours: [8,8,18,12,6][i], status: i < 4 ? 'done' : 'in-progress' as const })),
    notes: '共 88 个福字，每字独立盘绕后组装。',
  },
];
