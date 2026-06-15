import { useEffect } from 'react';
import { FlaskConical, AlertTriangle, Gauge, Ruler, Clock, ListChecks, ArrowRight, Droplets, Sparkles } from 'lucide-react';
import { useQxdStore } from '../../store/useQxdStore';
import { clsx } from 'clsx';

function HardnessGauge({ value }: { value: number }) {
  const clamped = Math.max(20, Math.min(110, value));
  const angle = ((clamped - 20) / 90) * 180;
  const zone = value < 45 ? 'hard' : value < 55 ? 'warn-low' : value <= 85 ? 'safe' : value <= 95 ? 'warn-high' : 'soft';
  const colors: Record<string, string> = {
    'hard': '#EE2E2E', 'warn-low': '#FF9F43', 'safe': '#2ECC71', 'warn-high': '#FF9F43', 'soft': '#EE2E2E'
  };
  const labels: Record<string, string> = {
    'hard': '过硬·易断', 'warn-low': '偏硬', 'safe': '安全区间', 'warn-high': '偏软', 'soft': '过软·坍塌'
  };
  return (
    <div className="relative pt-3">
      <svg viewBox="0 0 240 140" className="w-full">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#EE2E2E" />
            <stop offset="28%" stopColor="#FF9F43" />
            <stop offset="50%" stopColor="#2ECC71" />
            <stop offset="72%" stopColor="#FF9F43" />
            <stop offset="100%" stopColor="#EE2E2E" />
          </linearGradient>
        </defs>
        <path d="M20 120 A 100 100 0 0 1 220 120" fill="none" stroke="#EDE9E3" strokeWidth="16" strokeLinecap="round" />
        <path d="M20 120 A 100 100 0 0 1 220 120" fill="none" stroke="url(#gauge-grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray="314" strokeDashoffset="0" />
        <g>
          {[20, 45, 55, 85, 95, 110].map((v, i) => {
            const a = ((v - 20) / 90) * Math.PI;
            const x1 = 120 - 92 * Math.cos(a), y1 = 120 - 92 * Math.sin(a);
            const x2 = 120 - 104 * Math.cos(a), y2 = 120 - 104 * Math.sin(a);
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5F4F3F" strokeWidth="1.5" />
                <text x={120 - 114 * Math.cos(a)} y={120 - 114 * Math.sin(a) + 3} textAnchor="middle" fontSize="9" fill="#5F4F3F" fontFamily="sans-serif">{v}</text>
              </g>
            );
          })}
        </g>
        <g transform={`rotate(${angle - 90} 120 120)`} style={{ transition: 'transform .6s cubic-bezier(.34,1.56,.64,1)' }}>
          <circle cx="120" cy="120" r="7" fill="#2C1810" />
          <path d={`M115 120 L38 120 L36 118 L36 122 Z`} fill="#8B2323" stroke="#D4AF37" strokeWidth="0.8" />
        </g>
        <circle cx="120" cy="120" r="4" fill="#D4AF37" />
      </svg>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center w-full">
        <div className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-hei border',
          zone === 'safe' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : zone.startsWith('warn') ? 'bg-amber-50 border-amber-300 text-amber-700'
          : 'bg-red-50 border-red-300 text-red-700')}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[zone] }} />
          {labels[zone]}
        </div>
        <div className="font-song font-bold text-3xl mt-1 text-ink-800" style={{ color: colors[zone] }}>
          {value.toFixed(1)}
        </div>
        <div className="text-[11px] text-ink-400 mt-0.5">硬度指数 · 安全 55~85</div>
      </div>
    </div>
  );
}

function RatioPieChart({ ratios }: { ratios: { name: string; v: number; color: string }[] }) {
  const total = ratios.reduce((s, r) => s + r.v, 0);
  let start = -Math.PI / 2;
  const paths = ratios.map(r => {
    const a = (r.v / total) * Math.PI * 2;
    const x1 = 80 + 58 * Math.cos(start), y1 = 80 + 58 * Math.sin(start);
    const x2 = 80 + 58 * Math.cos(start + a), y2 = 80 + 58 * Math.sin(start + a);
    const large = a > Math.PI ? 1 : 0;
    start += a;
    return { d: `M80,80 L${x1},${y1} A58,58 0 ${large} 1 ${x2},${y2} Z`, color: r.color, name: r.name, v: r.v, pct: ((r.v / total) * 100).toFixed(0) };
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-32 h-32 flex-shrink-0 drop-shadow-sm">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="#fff" strokeWidth="1.5" />
        ))}
        <circle cx="80" cy="80" r="30" fill="#fff" />
        <text x="80" y="76" textAnchor="middle" fontSize="10" fill="#8B7C6C" fontFamily="serif">配比</text>
        <text x="80" y="92" textAnchor="middle" fontSize="15" fill="#2C1810" fontFamily="serif" fontWeight="700">{total}%</text>
      </svg>
      <div className="flex-1 space-y-1.5 text-xs">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm shadow-sm flex-shrink-0" style={{ background: p.color }} />
            <span className="font-song text-ink-600 flex-1 truncate">{p.name}</span>
            <span className="text-ink-500 w-8 text-right">{p.v}%</span>
            <span className="text-cinnabar-700 font-semibold w-10 text-right">{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThreadPage() {
  const { formula, updateFormula, recomputeFormula, recomputeWinding, setPage } = useQxdStore();

  useEffect(() => { recomputeFormula(); recomputeWinding(); }, []);
  useEffect(() => { recomputeFormula(); }, [formula.lacquerRatio, formula.tungOilRatio, formula.brickPowderRatio, formula.goldPowderRatio, formula.otherAdditives, formula.threadDiameter]);

  const ratios = [
    { name: '漆料', v: formula.lacquerRatio, color: '#8B2323' },
    { name: '熟桐油', v: formula.tungOilRatio, color: '#D4AF37' },
    { name: '砖粉', v: formula.brickPowderRatio, color: '#8B7C6C' },
    { name: '金粉', v: formula.goldPowderRatio, color: '#E7C75D' },
    { name: '其它助剂', v: formula.otherAdditives, color: '#CB503B' },
  ];
  const total = ratios.reduce((s, r) => s + r.v, 0);

  const processSteps = [
    { n: 1, t: '备料过筛', d: '砖粉160目过筛两次，去除杂质；漆料过滤去除漆皮。', dur: '1.5小时', st: '22°C / 55%RH', ok: true },
    { n: 2, t: '调和打捻', d: '按比例混合漆料、砖粉、熟桐油，顺时针搅拌30分钟至均匀起黏。', dur: '1.0小时', st: '22°C / 60%RH', ok: true },
    { n: 3, t: '静置熟成', d: '调和好的漆团密封静置24小时，使成分充分融合。', dur: '24.0小时', st: '20°C / 65%RH · 阴处', ok: false },
    { n: 4, t: '手工搓线', d: '取3~5g漆团于掌心，双掌同向前搓出，初搓直径约2mm。', dur: '0.5小时', st: '23°C / 55%RH', ok: false },
    { n: 5, t: '复搓定径', d: '粗线再过搓线板2~3次，达到目标直径 ' + formula.threadDiameter + 'mm。', dur: '1.0小时', st: '23°C / 55%RH', ok: false },
    { n: 6, t: '保湿备用', d: '成品线料平铺于湿绒布上，湿度75%环境暂存，48小时内用完。', dur: '-', st: '18°C / 75%RH', ok: false },
  ];

  return (
    <div className="grid grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[720px]">
      <aside className="col-span-12 xl:col-span-4 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><FlaskConical className="w-4 h-4" /></div>
            <h2>线料配方配比</h2>
            {total === 100 ? (
              <span className="qxd-badge border-emerald-300 bg-emerald-50 text-emerald-700 ml-auto">合计 {total}% · 平衡</span>
            ) : (
              <span className="qxd-badge border-warn-danger/60 bg-warn-danger/10 text-warn-danger ml-auto">合计 {total}% · 失衡</span>
            )}
          </div>
          <RatioPieChart ratios={ratios} />
          <div className="mt-4 space-y-4 border-t border-gold-100/70 pt-4">
            {[
              { k: 'lacquerRatio', name: '大漆比例', desc: '黏合成膜主剂，占比越高可塑性越强', color: 'bg-cinnabar-700', min: 25, max: 60, unit: '%' },
              { k: 'tungOilRatio', name: '熟桐油比例', desc: '增塑、降低硬度，过量易致坍塌', color: 'bg-gold-500', min: 5, max: 35, unit: '%' },
              { k: 'brickPowderRatio', name: '老砖粉比例', desc: '填充剂、提升硬度与可堆叠性', color: 'bg-ink-400', min: 15, max: 50, unit: '%' },
              { k: 'goldPowderRatio', name: '金粉比例', desc: '金线专用，增色泽并略降塑性', color: 'bg-yellow-500', min: 0, max: 20, unit: '%' },
              { k: 'otherAdditives', name: '其它助剂', desc: '樟脑/石灰水等，少量调节干燥', color: 'bg-orange-500', min: 0, max: 8, unit: '%' },
            ].map(s => (
              <div key={s.k}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={clsx('w-2.5 h-2.5 rounded-full shadow-sm', s.color)} />
                    <span className="font-song font-medium text-sm text-ink-700">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input type="number" min={s.min} max={s.max}
                      value={(formula as any)[s.k]}
                      onChange={e => updateFormula({ [s.k]: Math.max(s.min, Math.min(s.max, +e.target.value || 0)) } as any)}
                      className="w-16 px-2 py-1 text-right text-sm rounded border border-ink-200 bg-white outline-none focus:border-gold-400" />
                    <span className="text-xs text-ink-400 w-5">{s.unit}</span>
                  </div>
                </div>
                <input type="range" min={s.min} max={s.max} step={0.5}
                  value={(formula as any)[s.k]}
                  onChange={e => updateFormula({ [s.k]: +e.target.value } as any)}
                  className="range-slider" />
                <p className="text-[11px] text-ink-400 mt-1">{s.desc} · 建议区间 {s.min}~{s.max}{s.unit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Ruler className="w-4 h-4" /></div>
            <h2>线径规格</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input type="range" min={0.2} max={4} step={0.05}
                value={formula.threadDiameter}
                onChange={e => updateFormula({ threadDiameter: +e.target.value })}
                className="range-slider" />
              <div className="flex justify-between text-[10px] text-ink-300 mt-1">
                <span>0.2mm 极细</span><span>1mm</span><span>2mm</span><span>4mm 粗</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {[0.5, 0.9, 1.5, 2.5].map(d => (
                <button key={d} onClick={() => updateFormula({ threadDiameter: d })}
                  className={clsx('px-2 py-1 rounded text-xs border',
                    Math.abs(formula.threadDiameter - d) < 0.01
                      ? 'border-cinnabar-400 bg-cinnabar-50 text-cinnabar-700 shadow-sm'
                      : 'border-ink-200 bg-rice-50 text-ink-500 hover:border-gold-300')}>
                  {d}mm
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-end gap-3 p-3 rounded-xl bg-gradient-to-br from-rice-50 to-gold-50/60 border border-gold-100">
            {[0.4, 0.9, 1.8, 3].map((d, i) => {
              const scale = Math.min(1.6, d / formula.threadDiameter);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="h-16 w-full flex items-center justify-center">
                    <div className="rounded-full bg-gradient-to-br from-cinnabar-700 via-cinnabar-600 to-gold-400 shadow-md"
                         style={{
                           width: Math.max(2, Math.min(80, d * 12)) + 'px',
                           height: Math.max(2, Math.min(80, d * 12)) + 'px',
                           opacity: Math.abs(formula.threadDiameter - d) < 0.2 ? 1 : 0.28,
                           transform: `scale(${Math.abs(formula.threadDiameter - d) < 0.2 ? 1.15 : 0.85})`,
                           transition: 'all .3s',
                         }} />
                  </div>
                  <div className={clsx('text-xs font-hei', Math.abs(formula.threadDiameter - d) < 0.2 ? 'text-cinnabar-700 font-semibold' : 'text-ink-400')}>
                    {d}mm · {['细节点缀', '常规主纹', '粗边纹饰', '堆叠填层'][i]}
                  </div>
                </div>
              );
            })}
            <div className="flex flex-col items-center gap-1.5 border-l border-gold-200 pl-3">
              <div className="font-song text-[11px] text-ink-400 mb-1">当前</div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-song font-bold text-sm shadow-cinnabar-glow"
                   style={{ background: 'linear-gradient(135deg,#BE3A2B,#8B2323 70%,#4A1010)' }}>
                Φ{formula.threadDiameter}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="col-span-12 xl:col-span-5 flex flex-col gap-4 min-h-0 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar mb-2">
            <div className="title-icon"><Gauge className="w-4 h-4" /></div>
            <h2>工艺参数仪表</h2>
          </div>
          <HardnessGauge value={formula.hardnessIndex} />
          <div className="grid grid-cols-3 gap-3 mt-16 pt-4">
            {[
              { label: '可塑性指数', val: formula.plasticityIndex.toFixed(1), bar: formula.plasticityIndex, max: 100, color: 'from-gold-500 to-amber-600', good: formula.plasticityIndex >= 45, unit: '' },
              { label: '预估断裂力', val: (formula.hardnessIndex * 0.18).toFixed(1) + 'N', bar: Math.min(100, formula.hardnessIndex * 1.2), max: 100, color: 'from-cinnabar-600 to-red-800', good: formula.hardnessIndex >= 55, unit: '' },
              { label: '搓制难度', val: formula.threadDiameter < 0.5 ? '★★★★★' : formula.threadDiameter < 1 ? '★★★★' : formula.threadDiameter < 2 ? '★★★' : '★★', bar: Math.max(20, 120 - formula.threadDiameter * 30), max: 100, color: 'from-ink-600 to-ink-800', good: formula.threadDiameter >= 0.6, unit: '' },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-xl border border-gold-100 bg-rice-50/60">
                <p className="text-[11px] text-ink-400 mb-1">{m.label}</p>
                <p className={clsx('font-song text-lg font-bold mb-2', m.good ? 'text-ink-800' : 'text-warn-danger')}>{m.val}{m.unit}</p>
                <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                  <div className={clsx('h-full rounded-full bg-gradient-to-r', m.color)} style={{ width: `${(m.bar / m.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {formula.warnings.length === 0 ? (
            <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-song font-semibold text-emerald-800">配方均衡 · 处于安全区间</h4>
                <p className="text-sm text-emerald-700/80">当前线料配比软硬适中，可塑性良好，可满足搓制与盘绕成型要求。</p>
              </div>
            </div>
          ) : (
            formula.warnings.map(w => (
              <div key={w.id} className={clsx('flex items-start gap-3 p-4 rounded-xl border-2',
                w.severity === 'danger' ? 'risk-card' : 'warn-card')}>
                <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-md',
                  w.severity === 'danger' ? 'bg-warn-danger' : 'bg-warn-soft')}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={clsx('font-song font-semibold', w.severity === 'danger' ? 'text-warn-danger' : 'text-warn-soft')}>
                      {w.title}
                    </h4>
                    <span className={clsx('qxd-badge text-[10px]',
                      w.severity === 'danger' ? 'border-warn-danger/40 bg-warn-danger/10 text-warn-danger' : 'border-warn-soft/40 bg-warn-soft/10 text-warn-soft')}>
                      {w.severity === 'danger' ? '高风险' : '注意'}
                    </span>
                  </div>
                  <p className="text-sm text-ink-600 mb-1.5">{w.message}</p>
                  <p className="text-xs text-ink-500 pl-3 border-l-2 border-current" style={{ borderColor: w.severity === 'danger' ? '#EE2E2E' : '#FF9F43' }}>
                    💡 建议：{w.suggestion}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><ListChecks className="w-4 h-4" /></div>
            <h2>搓制工序指引</h2>
            <button className="ml-auto text-xs text-gold-700 underline underline-offset-2 hover:text-cinnabar-700">导出作业指导书</button>
          </div>
          <div className="space-y-0">
            {processSteps.map((s, i) => (
              <div key={s.n} className={clsx('flex gap-3 py-3 relative', i !== processSteps.length - 1 ? 'before:absolute before:left-[17px] before:top-[42px] before:bottom-[-3px] before:w-px before:bg-gold-200' : '')}>
                <div className={clsx('step-dot border-2',
                  s.ok ? 'bg-gradient-to-br from-cinnabar-600 to-red-900 text-gold-300 border-gold-400 shadow-gold-glow'
                  : i === 2 ? 'bg-gradient-to-br from-gold-400 to-amber-600 text-ink-800 border-gold-300 shadow-gold-glow animate-pulse'
                  : 'bg-rice-50 text-ink-400 border-ink-200')}>
                  {s.ok ? '✓' : s.n}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={clsx('font-song font-semibold', s.ok ? 'text-ink-700' : i === 2 ? 'text-cinnabar-700' : 'text-ink-500')}>{s.t}</h4>
                    {i === 2 && <span className="qxd-badge border-cinnabar-300/50 bg-cinnabar-50 text-cinnabar-700 text-[10px]">进行中</span>}
                  </div>
                  <p className="text-xs text-ink-500 mb-1.5 leading-relaxed">{s.d}</p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rice-100 text-ink-500 border border-ink-100">
                      <Clock className="w-3 h-3 text-gold-600" /> {s.dur}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gold-50 text-gold-700 border border-gold-200">
                      <Droplets className="w-3 h-3" /> {s.st}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="col-span-12 xl:col-span-3 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Sparkles className="w-4 h-4" /></div>
            <h2>配方速查</h2>
          </div>
          <div className="space-y-2">
            {[
              { n: '标准金线', r: [40, 18, 32, 8, 2], d: 0.8, dsc: '最常用规格，主纹饰通用' },
              { n: '细线勾勒', r: [42, 20, 30, 5, 3], d: 0.45, dsc: '毛发、叶脉等细节部位' },
              { n: '堆叠粗线', r: [38, 15, 40, 5, 2], d: 2.0, dsc: '背景填层、边框加粗' },
              { n: '柔性盘绕', r: [45, 22, 27, 4, 2], d: 1.0, dsc: '复杂曲线、云纹水纹' },
            ].map((r, i) => {
              const matched = Math.abs(r.r[0] - formula.lacquerRatio) < 3 && Math.abs(r.d - formula.threadDiameter) < 0.1;
              return (
                <button key={i}
                  onClick={() => updateFormula({ lacquerRatio: r.r[0], tungOilRatio: r.r[1], brickPowderRatio: r.r[2], goldPowderRatio: r.r[3], otherAdditives: r.r[4], threadDiameter: r.d } as any)}
                  className={clsx('w-full text-left p-3 rounded-xl border transition-all',
                    matched ? 'border-cinnabar-400 bg-cinnabar-50/60 shadow-sm' : 'border-gold-100 bg-rice-50/60 hover:border-gold-300 hover:bg-gold-50/40')}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-song font-semibold text-sm text-ink-700">{r.n}</span>
                    {matched && <span className="text-[10px] qxd-badge border-cinnabar-300 bg-cinnabar-50 text-cinnabar-700">当前匹配</span>}
                  </div>
                  <p className="text-[11px] text-ink-500 mb-1.5">{r.dsc}</p>
                  <div className="flex items-center gap-1">
                    {['漆', '油', '砖', '金', '助'].map((t, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 text-ink-500 border border-ink-100">
                        {t}{r.r[j]}
                      </span>
                    ))}
                    <span className="ml-auto text-[10px] text-cinnabar-700 font-semibold">Φ{r.d}mm</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="qxd-panel p-5 huiwen-border">
          <h3 className="font-song font-semibold text-ink-700 mb-3">材料用量估算</h3>
          <dl className="space-y-2 text-sm">
            {[
              { k: '线料总长', v: (1800 * Math.PI * formula.threadDiameter / 2).toFixed(0) + ' m', c: 'text-cinnabar-700' },
              { k: '漆团总重', v: ((formula.threadDiameter ** 2) * 320).toFixed(1) + ' g', c: 'text-ink-800' },
              { k: '大漆用量', v: (((formula.threadDiameter ** 2) * 320) * formula.lacquerRatio / 100).toFixed(1) + ' g', c: 'text-gold-700' },
              { k: '金粉用量', v: (((formula.threadDiameter ** 2) * 320) * formula.goldPowderRatio / 100).toFixed(1) + ' g', c: 'text-amber-600' },
              { k: '搓制工数', v: Math.ceil((formula.threadDiameter ** 2) * 20) + ' 工时', c: 'text-ink-600' },
            ].map(m => (
              <div key={m.k} className="flex justify-between items-center py-1.5 border-b border-gold-100/50 last:border-0">
                <dt className="text-ink-400 text-xs">{m.k}</dt>
                <dd className={clsx('font-song font-semibold', m.c)}>{m.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <button onClick={() => { recomputeWinding(); setPage('winding'); }} className="qxd-btn-gold w-full py-3.5 text-base shadow-lacquer">
          进入盘绕造型 <ArrowRight className="w-5 h-5" />
        </button>
      </aside>
    </div>
  );
}
