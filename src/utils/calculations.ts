import type { ThreadFormula, ThreadWarning, WindingConfig, PatternZone, PathLayer, PatternScheme } from '../types';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export interface VectorizeResult {
  zones: PatternZone[];
  pathLayers: PathLayer[];
}

function getImageDataFromDataUrl(dataUrl: string): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not available')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      resolve({ data: imgData.data, width: w, height: h });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function grayscale(data: Uint8ClampedArray): number[] {
  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    gray.push(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return gray;
}

function sobelEdge(gray: number[], w: number, h: number): number[] {
  const edges: number[] = new Array(w * h).fill(0);
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sx = 0, sy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * w + (x + kx);
          const kidx = (ky + 1) * 3 + (kx + 1);
          sx += gray[idx] * gx[kidx];
          sy += gray[idx] * gy[kidx];
        }
      }
      edges[y * w + x] = Math.sqrt(sx * sx + sy * sy);
    }
  }
  return edges;
}

function findContours(edges: number[], w: number, h: number, threshold: number): { x: number; y: number }[][] {
  const visited = new Set<number>();
  const contours: { x: number; y: number }[][] = [];
  const edgeThreshold = edges.reduce((s, v) => s + v, 0) / edges.length * threshold;

  for (let y = 0; y < h; y += 3) {
    for (let x = 0; x < w; x += 3) {
      const idx = y * w + x;
      if (visited.has(idx) || edges[idx] < edgeThreshold) continue;

      const contour: { x: number; y: number }[] = [];
      const stack = [x, y];
      while (stack.length) {
        const cy = stack.pop()!;
        const cx = stack.pop()!;
        const cidx = cy * w + cx;
        if (visited.has(cidx) || cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
        if (edges[cidx] < edgeThreshold * 0.6) continue;
        visited.add(cidx);
        contour.push({ x: cx, y: cy });
        stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
      }
      if (contour.length > 20) contours.push(contour);
    }
  }
  return contours.sort((a, b) => b.length - a.length).slice(0, 6);
}

function contourToPath(contour: { x: number; y: number }[], w: number, h: number, scaleX: number, scaleY: number): string {
  if (contour.length < 3) return '';
  const step = Math.max(1, Math.floor(contour.length / 12));
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < contour.length; i += step) {
    points.push(contour[i]);
  }
  if (points.length < 3) return '';

  let d = `M${points[0].x * scaleX},${points[0].y * scaleY}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2 * scaleX;
    const cpy = (prev.y + curr.y) / 2 * scaleY;
    d += ` Q${prev.x * scaleX},${prev.y * scaleY} ${cpx},${cpy}`;
  }
  d += ' Z';
  return d;
}

export async function vectorizeImage(imageData: string, existingPattern: PatternScheme): Promise<VectorizeResult> {
  try {
    const { data, width, height } = await getImageDataFromDataUrl(imageData);
    const gray = grayscale(data);
    const edges = sobelEdge(gray, width, height);
    const contours = findContours(edges, width, height, 1.5);

    const palette = ['#BE3A2B', '#D4AF37', '#8B7C6C', '#CB503B', '#6E8B3D', '#4169E1'];
    const svgW = 400, svgH = 440;
    const scaleX = svgW / width;
    const scaleY = svgH / height;

    const zones: PatternZone[] = [];
    const pathLayers: PathLayer[] = [];

    contours.forEach((contour, i) => {
      const pathD = contourToPath(contour, width, height, scaleX, scaleY);
      if (!pathD) return;
      const zid = 'z_' + uid();
      const area = Math.round(contour.length * 8);
      const zone: PatternZone = {
        id: zid,
        name: `轮廓区 ${i + 1}`,
        color: palette[i % palette.length],
        layerOrder: contours.length - i,
        priority: i === 0 ? 'primary' : i < 3 ? 'secondary' : 'background',
        area,
        pathD,
      };
      zones.push(zone);
      pathLayers.push({
        id: 'p_' + uid(),
        zoneId: zid,
        order: i + 1,
        d: pathD,
        threadCount: Math.max(2, 8 - i),
        windingDirection: i % 2 === 0 ? 'cw' : 'ccw',
      });
    });

    if (zones.length === 0) {
      const bgZone: PatternZone = {
        id: 'z_' + uid(),
        name: '背景区',
        color: '#ECE2CA',
        layerOrder: 1,
        priority: 'background',
        area: width * height,
        pathD: `M20,20 L${svgW - 20},20 L${svgW - 20},${svgH - 20} L20,${svgH - 20} Z`,
      };
      zones.push(bgZone);
      pathLayers.push({
        id: 'p_' + uid(),
        zoneId: bgZone.id,
        order: 1,
        d: bgZone.pathD,
        threadCount: 3,
        windingDirection: 'cw',
      });
    }

    return { zones, pathLayers };
  } catch (e) {
    console.warn('矢量化处理失败，使用默认分区', e);
    const fallback = createDefaultPatternZones();
    return fallback;
  }
}

function createDefaultPatternZones(): VectorizeResult {
  const palette = ['#BE3A2B', '#D4AF37', '#8B7C6C', '#ECE2CA'];
  const defaultPaths = [
    'M100,200 C150,120 250,120 300,200 C350,280 250,360 200,300 C150,360 50,280 100,200 Z',
    'M60,100 Q200,40 340,100 Q320,130 200,120 Q80,130 60,100 Z',
    'M70,320 Q120,280 170,320 Q220,280 270,320 Q320,280 350,320 L340,380 L80,380 Z',
    'M40,40 L360,40 L360,400 L40,400 Z',
  ];
  const zones: PatternZone[] = defaultPaths.map((d, i) => ({
    id: 'z_' + uid(),
    name: ['中央主纹', '上沿边饰', '下沿边饰', '背景地纹'][i],
    color: palette[i],
    layerOrder: defaultPaths.length - i,
    priority: i === 0 ? 'primary' : i < 3 ? 'secondary' : 'background',
    area: [3200, 1800, 2100, 5200][i],
    pathD: d,
  }));
  const pathLayers: PathLayer[] = zones.map((z, i) => ({
    id: 'p_' + uid(),
    zoneId: z.id,
    order: i + 1,
    d: z.pathD,
    threadCount: [8, 4, 5, 2][i],
    windingDirection: i % 2 === 0 ? 'cw' : 'ccw',
  }));
  return { zones, pathLayers };
}

export async function autoPartition(imageData: string, existingPattern: PatternScheme): Promise<VectorizeResult> {
  const result = await vectorizeImage(imageData, existingPattern);
  result.zones.forEach((z, i) => {
    z.name = ['主纹饰区', '辅纹饰区 A', '辅纹饰区 B', '辅纹饰区 C', '边饰区', '背景区'][i] || `分区 ${i + 1}`;
  });
  return result;
}

export function calcHardnessIndex(formula: Pick<ThreadFormula, 'lacquerRatio' | 'tungOilRatio' | 'brickPowderRatio' | 'goldPowderRatio'>): number {
  const { lacquerRatio, tungOilRatio, brickPowderRatio, goldPowderRatio } = formula;
  const hi = lacquerRatio * 0.4 + brickPowderRatio * 1.3 + goldPowderRatio * 0.25 - tungOilRatio * 1.0 + 25;
  return Math.round(hi * 10) / 10;
}

export function calcPlasticityIndex(formula: Pick<ThreadFormula, 'lacquerRatio' | 'tungOilRatio' | 'brickPowderRatio'>): number {
  const { lacquerRatio, tungOilRatio, brickPowderRatio } = formula;
  const pi = lacquerRatio * 0.9 + tungOilRatio * 1.4 - brickPowderRatio * 0.6 + 35;
  return Math.round(clamp(pi, 20, 95) * 10) / 10;
}

export function analyzeWarnings(formula: ThreadFormula): ThreadWarning[] {
  const warnings: ThreadWarning[] = [];
  const hi = formula.hardnessIndex;
  const pi = formula.plasticityIndex;
  const diameter = formula.threadDiameter;

  if (hi > 85) {
    warnings.push({
      id: uid(), type: 'hard', severity: 'danger',
      title: '线料过硬 · 易断裂',
      message: `硬度指数 ${hi} 超出安全上限 75，砖粉比例过高或桐油不足，搓制时易脆断，盘绕急弯处易开裂。`,
      suggestion: '建议增加桐油占比 5~10%，或减少砖粉占比 8~15%，使硬度回落至 55~75 安全区间。'
    });
  } else if (hi > 75) {
    warnings.push({
      id: uid(), type: 'hard', severity: 'warn',
      title: '线料偏硬 · 搓制阻力大',
      message: `硬度指数 ${hi} 略高于安全区间上限，搓制手感偏硬，细径线易出毛边，盘绕时需放慢速度。`,
      suggestion: '微调增加桐油 2~4%，或减少砖粉 3~5%。'
    });
  } else if (hi < 45) {
    warnings.push({
      id: uid(), type: 'soft', severity: 'danger',
      title: '线料过软 · 坍塌风险高',
      message: `硬度指数 ${hi} 低于安全下限 55，桐油比例过高或砖粉不足，盘绕堆叠后易发生坍塌变形，无法保持立体造型。`,
      suggestion: '建议增加砖粉占比 8~15%，或减少桐油比例 5~10%，使硬度回升至 55~75 安全区间。'
    });
  } else if (hi < 55) {
    warnings.push({
      id: uid(), type: 'soft', severity: 'warn',
      title: '线料偏软 · 需控制堆叠',
      message: `硬度指数 ${hi} 略低于安全区间下限，多层堆叠高度不宜超过 3 层，每层需延长半干时间。`,
      suggestion: '增加少量砖粉 3~6%，或减少桐油 1~3%。'
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

export function calcZoneDensity(zones: PatternZone[], pathLayers: PathLayer[]): Record<string, { density: number; level: string; loopCount: number; spacing: number }> {
  const result: Record<string, any> = {};
  zones.forEach(z => {
    const zonePathLayers = pathLayers.filter(p => p.zoneId === z.id);
    const totalThreadCount = zonePathLayers.reduce((s, p) => s + p.threadCount, 0);
    const layerCount = zonePathLayers.length || 1;
    let baseDensity = 0;
    switch (z.priority) {
      case 'primary': baseDensity = 12 + z.layerOrder * 2.0; break;
      case 'secondary': baseDensity = 7 + z.layerOrder * 1.5; break;
      case 'background': baseDensity = 3 + z.layerOrder * 1.0; break;
    }
    const density = baseDensity + (totalThreadCount / layerCount) * 0.8;
    const level = density < 5 ? 'sparse' : density < 12 ? 'medium' : density < 20 ? 'dense' : 'very-dense';
    const loopCount = totalThreadCount || Math.round((density * z.area) / 100);
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
