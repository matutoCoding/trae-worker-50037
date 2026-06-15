import type { ThreadFormula, ThreadWarning, WindingConfig, PatternZone } from '../types';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export function calcHardnessIndex(formula: Pick<ThreadFormula, 'lacquerRatio' | 'tungOilRatio' | 'brickPowderRatio' | 'goldPowderRatio'>): number {
  const { lacquerRatio, tungOilRatio, brickPowderRatio, goldPowderRatio } = formula;
  const hi = (lacquerRatio * 2.5 + brickPowderRatio * 4.0 + goldPowderRatio * 1.8 - tungOilRatio * 3.2) * 10;
  return Math.round(hi * 10) / 10;
}

export function calcPlasticityIndex(formula: Pick<ThreadFormula, 'lacquerRatio' | 'tungOilRatio' | 'brickPowderRatio'>): number {
  const { lacquerRatio, tungOilRatio, brickPowderRatio } = formula;
  const pi = lacquerRatio * 1.4 + tungOilRatio * 2.6 - brickPowderRatio * 1.8 + 25;
  return Math.round(clamp(pi, 10, 95) * 10) / 10;
}

export function analyzeWarnings(formula: ThreadFormula): ThreadWarning[] {
  const warnings: ThreadWarning[] = [];
  const hi = formula.hardnessIndex;
  const pi = formula.plasticityIndex;
  const diameter = formula.threadDiameter;

  if (hi < 45) {
    warnings.push({
      id: uid(), type: 'hard', severity: 'danger',
      title: '线料过硬 · 易断裂',
      message: `硬度指数 ${hi} 远低于安全下限 55，砖粉比例过高或桐油不足，搓制时易脆断。`,
      suggestion: '建议增加桐油占比 5~10%，或减少砖粉占比，使硬度回升至 55~85 区间。'
    });
  } else if (hi < 55) {
    warnings.push({
      id: uid(), type: 'hard', severity: 'warn',
      title: '线料偏硬 · 搓制阻力大',
      message: `硬度指数 ${hi} 略低于安全区间，搓制手感偏硬，细径线易出毛边。`,
      suggestion: '微调增加桐油 2~4%，或减少砖粉比例。'
    });
  } else if (hi > 95) {
    warnings.push({
      id: uid(), type: 'soft', severity: 'danger',
      title: '线料过软 · 坍塌风险高',
      message: `硬度指数 ${hi} 远高于安全上限 85，盘绕堆叠后易发生坍塌变形。`,
      suggestion: '建议增加砖粉占比 6~12%，或减少桐油比例，使硬度回落至 55~85 区间。'
    });
  } else if (hi > 85) {
    warnings.push({
      id: uid(), type: 'soft', severity: 'warn',
      title: '线料偏软 · 需控制堆叠',
      message: `硬度指数 ${hi} 略超出安全区间，多层堆叠高度不宜超过 4 层。`,
      suggestion: '增加少量砖粉 2~5%，或减少堆叠层数。'
    });
  }

  if (pi < 30) {
    warnings.push({
      id: uid(), type: 'plasticity', severity: 'danger',
      title: '可塑性过低 · 盘绕易断',
      message: `可塑性指数 ${pi}，弯折时易出现裂纹，不适合复杂曲线纹样。`,
      suggestion: '提升漆料比例或适当增加熟桐油，改善线料延展性。'
    });
  } else if (pi < 45) {
    warnings.push({
      id: uid(), type: 'plasticity', severity: 'warn',
      title: '可塑性偏低',
      message: `可塑性指数 ${pi}，盘绕急弯处需放慢手法。`,
      suggestion: '适当提高环境湿度至 55~65% RH 可改善手感。'
    });
  }

  if (diameter < 0.3) {
    warnings.push({
      id: uid(), type: 'diameter', severity: 'warn',
      title: '线径过细',
      message: `线径 ${diameter}mm 极细，搓制难度高、断裂风险大，仅适合细节点缀。`,
      suggestion: '初学者建议选用 0.6~1.2mm 线径进行练习。'
    });
  } else if (diameter > 3.0) {
    warnings.push({
      id: uid(), type: 'diameter', severity: 'warn',
      title: '线径过粗',
      message: `线径 ${diameter}mm 过粗，难以贴合精细纹样轮廓。`,
      suggestion: '粗线适合大面积背景堆叠，主纹饰建议 0.8~2.0mm。'
    });
  }

  return warnings;
}

export function calcDryingHours(cfg: Pick<WindingConfig, 'temperature' | 'humidity' | 'stackingLayers'>, diameterMM: number): number {
  const base = diameterMM * 2.4;
  const h = cfg.humidity;
  const t = cfg.temperature;
  const layers = cfg.stackingLayers.length;
  const humFactor = h < 40 ? 0.8 : h <= 65 ? 1.0 : 1.5;
  const tempFactor = t < 18 ? 1.6 : t <= 28 ? 1.0 : 0.7;
  const layerFactor = layers <= 2 ? 1.0 : layers <= 4 ? 1.2 : 1.5;
  return Math.round(base * humFactor * tempFactor * layerFactor * 10) / 10;
}

export function calcFragilityRisk(cfg: WindingConfig, elapsedHours: number): { risk: 'low' | 'medium' | 'high'; index: number } {
  const ideal = 55;
  const humidityTerm = Math.abs(cfg.humidity - ideal) / 20;
  const dryingTerm = cfg.dryingHours > 0 ? elapsedHours / cfg.dryingHours : 0;
  const index = clamp(humidityTerm + dryingTerm, 0, 2);
  const risk = index < 0.6 ? 'low' : index < 1.0 ? 'medium' : 'high';
  return { risk, index: Math.round(index * 100) / 100 };
}

export function calcZoneDensity(zones: PatternZone[]): Record<string, { density: number; level: string; loopCount: number; spacing: number }> {
  const result: Record<string, any> = {};
  zones.forEach(z => {
    let density = 0;
    switch (z.priority) {
      case 'primary': density = 15 + z.layerOrder * 2.4; break;
      case 'secondary': density = 9 + z.layerOrder * 1.8; break;
      case 'background': density = 4 + z.layerOrder * 1.2; break;
    }
    const level = density < 5 ? 'sparse' : density < 12 ? 'medium' : density < 20 ? 'dense' : 'very-dense';
    const loopCount = Math.round((density * z.area) / 100);
    const spacing = Math.max(0.3, 3.2 - density * 0.12);
    result[z.id] = { density: Math.round(density * 10) / 10, level, loopCount, spacing: Math.round(spacing * 100) / 100 };
  });
  return result;
}

export function densityColor(level: string): string {
  switch (level) {
    case 'sparse': return 'rgba(144,238,144,0.55)';
    case 'medium': return 'rgba(255,215,0,0.55)';
    case 'dense': return 'rgba(255,140,0,0.6)';
    case 'very-dense': return 'rgba(205,38,38,0.65)';
    default: return 'rgba(180,180,180,0.4)';
  }
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${formatDate(ts)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
