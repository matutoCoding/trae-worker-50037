import { useMemo, useState, useEffect } from 'react';
import {
  Layers, Thermometer, Droplets, Sun, CloudRain, Gauge, ArrowUp, Box, Clock, AlertTriangle, CheckCircle, Sparkles, ChevronRight, FileArchive, ListTodo, Play, Pause, RotateCcw, Save, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useQxdStore } from '../../store/useQxdStore';
import { densityColor, calcFragilityRisk } from '../../utils/calculations';
import { clsx } from 'clsx';
import type { ConstructionItem } from '../../types';

export default function WindingPage() {
  const {
    pattern, formula, winding, updateWinding, recomputeWinding, setPage, saveCurrentToWorks,
    constructionPlan, generateConstructionPlan, updateConstructionItem, saveConstructionPlanToWork,
  } = useQxdStore();
  const [showConstruction, setShowConstruction] = useState(true);

  useEffect(() => {
    generateConstructionPlan();
  }, [pattern.id]);
  const elapsedHours = 2.5;
  const fragility = calcFragilityRisk(winding, elapsedHours);
  const fragColor = fragility.risk === 'low' ? '#2ECC71' : fragility.risk === 'medium' ? '#FF9F43' : '#EE2E2E';
  const fragLabel = fragility.risk === 'low' ? '低风险 · 状态良好' : fragility.risk === 'medium' ? '中风险 · 需关注' : '高风险 · 立即处理';

  const processGantt = useMemo(() => {
    const steps = [
      { n: '纹样设计', h: 5, color: '#8B2323' },
      { n: '线料搓制', h: 8, color: '#D4AF37' },
      { n: '盘绕成型', h: winding.stackingLayers.length * 3 + 8, color: '#BE3A2B' },
      { n: '干燥定型', h: winding.dryingHours, color: '#997221' },
      { n: '贴金箔', h: 4, color: '#DDB83D' },
      { n: '罩明漆', h: 6, color: '#6E1B1B' },
    ];
    const total = steps.reduce((s, x) => s + x.h, 0);
    let acc = 0;
    return steps.map(s => { const s_ = { ...s, start: acc, pct: (s.h / total) * 100, startPct: (acc / total) * 100 }; acc += s.h; return s_; });
  }, [winding.dryingHours, winding.stackingLayers.length]);
  const totalProcessHours = processGantt.reduce((s, x) => s + x.h, 0);

  return (
    <div className="grid grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[780px]">
      <aside className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Gauge className="w-4 h-4" /></div>
            <h2>盘绕密度参数</h2>
          </div>
          <div className="space-y-3">
            {pattern.zones.map(z => {
              const dm = winding.densityMap.find(d => d.zoneId === z.id);
              if (!dm) return null;
              const levelLabel: Record<string, string> = { sparse: '稀疏', medium: '适中', dense: '紧密', 'very-dense': '极密' };
              return (
                <div key={z.id} className="p-3 rounded-xl border border-gold-100 bg-rice-50/60">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3.5 h-3.5 rounded shadow-sm flex-shrink-0" style={{ background: z.color }} />
                    <span className="font-song font-semibold text-sm text-ink-700 flex-1 truncate">{z.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: densityColor(dm.level).replace('0.55', '1').replace('0.6', '1').replace('0.65', '1') }}>{levelLabel[dm.level as string]}</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-400">密度指数</span>
                      <span className="font-semibold text-ink-700">{dm.density}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, dm.density * 5)}%`, background: densityColor(dm.level) }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="text-ink-500">匝数 <span className="text-cinnabar-700 font-semibold">{(dm as any).loopCount}</span></div>
                      <div className="text-ink-500">间距 <span className="text-gold-700 font-semibold">{(dm as any).spacing}mm</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Thermometer className="w-4 h-4" /></div>
            <h2>环境与干燥</h2>
          </div>
          <div className="space-y-3.5">
            <div>
              <label className="qxd-label flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-warn-soft" /> 环境温度</span>
                <span className="text-cinnabar-700 font-semibold">{winding.temperature}°C</span>
              </label>
              <input type="range" min={5} max={40} value={winding.temperature}
                onChange={e => { const t = +e.target.value; updateWinding({ temperature: t, dryingHours: (t => { const base = formula.threadDiameter * 2.4; const hf = winding.humidity < 40 ? 0.8 : winding.humidity <= 65 ? 1.0 : 1.5; const tf = t < 18 ? 1.6 : t <= 28 ? 1.0 : 0.7; const lf = winding.stackingLayers.length <= 2 ? 1.0 : winding.stackingLayers.length <= 4 ? 1.2 : 1.5; return Math.round(base * hf * tf * lf * 10) / 10; })(t) }); }}
                className="range-slider" />
              <div className="flex justify-between text-[10px] text-ink-300 mt-0.5"><span>5°C</span><span>22°C</span><span>40°C</span></div>
            </div>
            <div>
              <label className="qxd-label flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-500" /> 相对湿度</span>
                <span className="text-cinnabar-700 font-semibold">{winding.humidity}% RH</span>
              </label>
              <input type="range" min={15} max={90} value={winding.humidity}
                onChange={e => { const h = +e.target.value; updateWinding({ humidity: h, dryingHours: (h => { const base = formula.threadDiameter * 2.4; const hf = h < 40 ? 0.8 : h <= 65 ? 1.0 : 1.5; const tf = winding.temperature < 18 ? 1.6 : winding.temperature <= 28 ? 1.0 : 0.7; const lf = winding.stackingLayers.length <= 2 ? 1.0 : winding.stackingLayers.length <= 4 ? 1.2 : 1.5; return Math.round(base * hf * tf * lf * 10) / 10; })(h) }); }}
                className="range-slider" />
              <div className="flex justify-between text-[10px] text-ink-300 mt-0.5"><span>干</span><span className="text-gold-600">理想 55%</span><span>湿</span></div>
            </div>

            <div className={clsx('p-3.5 rounded-xl border-2 mt-2', fragility.risk === 'high' ? 'risk-card' : fragility.risk === 'medium' ? 'warn-card' : 'border-emerald-300 bg-emerald-50/60')}>
              <div className="flex items-center gap-2 mb-1.5">
                {fragility.risk === 'high' ? <AlertTriangle className="w-4 h-4 text-warn-danger" /> : fragility.risk === 'medium' ? <AlertTriangle className="w-4 h-4 text-warn-soft" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                <span className="font-song font-semibold text-sm" style={{ color: fragColor }}>{fragLabel}</span>
              </div>
              <p className="text-[11px] text-ink-600 mb-2">
                失水风险指数 <span className="font-bold" style={{ color: fragColor }}>{fragility.index}</span>
                · 已静置 <b>{elapsedHours}h</b> / 预计 <b>{winding.dryingHours}h</b>
              </p>
              {fragility.risk !== 'low' && (
                <p className="text-[11px] text-ink-500 pl-3 border-l-2" style={{ borderColor: fragColor }}>
                  {fragility.risk === 'high' ? '⚠ 线料已接近变脆临界点，建议立即进入贴金工序或喷雾保湿。' : '湿度偏低/静置过半，关注表面起霜情况，准备进入下一步。'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-lg border border-gold-100 bg-gold-50/40 text-center">
                <p className="text-[10px] text-ink-400 mb-0.5">预计干燥</p>
                <p className="font-song font-bold text-lg text-gold-700">{winding.dryingHours}<span className="text-xs">h</span></p>
              </div>
              <div className="p-2.5 rounded-lg border border-ink-100 bg-rice-50 text-center">
                <p className="text-[10px] text-ink-400 mb-0.5">干燥进度</p>
                <p className="font-song font-bold text-lg text-ink-700">{Math.min(100, Math.round(elapsedHours / winding.dryingHours * 100))}<span className="text-xs">%</span></p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="col-span-12 lg:col-span-6 flex flex-col gap-4 min-h-0 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-5 huiwen-border relative overflow-hidden grain-overlay">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Box className="w-4 h-4" /></div>
            <h2>立体堆叠造型预览</h2>
            <div className="ml-auto flex items-center gap-2 text-xs text-ink-400">
              <Sun className="w-3.5 h-3.5 text-gold-600" /> 光源模拟
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative rounded-xl overflow-hidden shadow-inner border border-gold-100 aspect-[4/5] bg-gradient-to-br from-ink-50 via-rice-100 to-gold-50/40">
              <div className="absolute inset-0 opacity-70"
                   style={{
                     background: `radial-gradient(circle at ${30 + winding.lightAngle * 0.4}% ${30 + (90 - winding.lightElevation) * 0.4}%, rgba(255,248,220,0.9) 0%, rgba(255,230,180,0.4) 25%, transparent 55%),
                                linear-gradient(135deg, rgba(44,24,16,0.06) 0%, transparent 50%, rgba(44,24,16,0.1) 100%)`,
                   }} />
              <div className="absolute inset-0 flex items-center justify-center"
                   style={{ perspective: '900px' }}>
                <div className="relative" style={{
                  transform: `rotateX(${18 + (90 - winding.lightElevation) * 0.2}deg) rotateZ(-${winding.lightAngle * 0.15}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: 'transform .5s cubic-bezier(.34,1.56,.64,1)',
                }}>
                  {Array.from({ length: 6 }).map((_, layerIdx) => {
                    const scale = 1 - layerIdx * 0.04;
                    const offset = layerIdx * 6;
                    return (
                      <div key={layerIdx}
                        className="absolute top-0 left-0 rounded-full border-2"
                        style={{
                          width: `${220 * scale}px`, height: `${260 * scale}px`,
                          transform: `translate(${(1 - scale) * -110}px, ${(1 - scale) * -130 + offset}px) translateZ(${layerIdx * 3}px)`,
                          background: layerIdx === 5 && winding.goldApplied
                            ? 'linear-gradient(135deg,#F6CD70 0%,#D4AF37 40%,#B89127 70%,#F6CD70 100%)'
                            : `linear-gradient(${135 + layerIdx * 10}deg, rgba(190,58,43,${0.9 - layerIdx * 0.1}) 0%, rgba(139,35,35,${0.95 - layerIdx * 0.08}) 60%, rgba(74,16,16,${0.9 - layerIdx * 0.1}) 100%)`,
                          borderColor: layerIdx === 5 && winding.goldApplied ? '#997221' : 'rgba(74,16,16,0.6)',
                          boxShadow: `
                            inset ${3 + layerIdx}px ${-3 - layerIdx}px ${8 + layerIdx * 2}px rgba(255,255,255,${0.12 - layerIdx * 0.015}),
                            inset ${-4 - layerIdx}px ${4 + layerIdx}px ${10 + layerIdx * 2}px rgba(0,0,0,${0.25 + layerIdx * 0.03}),
                            ${offset * 0.6}px ${offset * 0.8}px ${6 + layerIdx * 4}px rgba(44,24,16,${0.2 + layerIdx * 0.06})
                          `,
                          zIndex: layerIdx,
                        }}>
                        <svg viewBox="0 0 220 260" className="w-full h-full" style={{ opacity: 0.35 + layerIdx * 0.05 }}>
                          <path d="M110 30 C 150 20 195 55 190 110 C 185 160 150 220 110 235 C 70 220 35 160 30 110 C 25 55 70 20 110 30 Z"
                                fill="none" stroke={winding.goldApplied ? '#7C5A20' : '#F5EFE0'} strokeWidth="0.8" strokeDasharray="3 2.5" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-rice-50/90 backdrop-blur border border-gold-200 text-[10px] text-ink-500 flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-gold-600" style={{ transform: `rotate(${winding.lightAngle - 45}deg)` }} />
                光源 {winding.lightAngle}°
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-[11px] bg-rice-50/85 backdrop-blur px-3 py-2 rounded-lg border border-gold-200/70">
                <div className="flex items-center gap-1 text-ink-500"><Layers className="w-3.5 h-3.5 text-cinnabar-700" /> 总高 <span className="font-semibold text-cinnabar-700">{winding.totalHeight}mm</span></div>
                <div className="flex items-center gap-1 text-ink-500"><Box className="w-3.5 h-3.5 text-gold-700" /> {winding.stackingLayers.length} 层</div>
                <label className="ml-auto flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={winding.goldApplied} onChange={e => updateWinding({ goldApplied: e.target.checked })} className="w-3.5 h-3.5 accent-gold-500" />
                  <span className="text-gold-700 font-medium">贴金效果</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-gold-100 bg-rice-50/60">
                <label className="qxd-label flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-gold-600" /> 光源方位角</label>
                <input type="range" min={0} max={360} value={winding.lightAngle}
                  onChange={e => updateWinding({ lightAngle: +e.target.value })} className="range-slider" />
                <div className="flex justify-between text-[10px] text-ink-300 mt-0.5"><span>左</span><span>前 {45}°</span><span>右</span></div>
              </div>
              <div className="p-3 rounded-xl border border-gold-100 bg-rice-50/60">
                <label className="qxd-label flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5 text-blue-500" /> 光源仰角</label>
                <input type="range" min={20} max={85} value={winding.lightElevation}
                  onChange={e => updateWinding({ lightElevation: +e.target.value })} className="range-slider" />
                <div className="flex justify-between text-[10px] text-ink-300 mt-0.5"><span>侧光</span><span>顶光</span></div>
              </div>

              <div className="p-3 rounded-xl border border-gold-100 bg-gradient-to-br from-ink-50 to-rice-50">
                <h4 className="font-song font-semibold text-sm text-ink-700 mb-2.5 flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-cinnabar-700" /> 堆叠侧剖
                </h4>
                <div className="relative h-36 rounded-lg bg-gradient-to-b from-white/70 to-ink-50 border border-ink-100 overflow-hidden">
                  {pattern.zones.map((z, zi) => {
                    const layers = winding.stackingLayers.filter(s => s.zoneId === z.id);
                    const baseX = 12 + zi * 72;
                    return (
                      <g key={z.id}>
                        {layers.map((l, li) => (
                          <div key={l.layerIndex}
                            className="absolute rounded-sm shadow-sm transition-all"
                            style={{
                              left: baseX + 'px',
                              bottom: 8 + li * 14 + 'px',
                              width: '56px',
                              height: '12px',
                              background: `linear-gradient(180deg, ${z.color} 0%, ${z.color}DD 60%, ${z.color}AA 100%)`,
                              border: `1px solid rgba(255,255,255,0.4)`,
                              boxShadow: `inset 0 -2px 3px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.35)`,
                              opacity: 0.88 - li * 0.02,
                            }}>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-white/95 font-bold pointer-events-none">
                              L{l.layerIndex}
                            </span>
                          </div>
                        ))}
                        <div className="absolute left-[12px] right-[12px] bottom-0 h-[1px] bg-gold-400/50" style={{ left: baseX - 2, width: 64 }} />
                      </g>
                    );
                  })}
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-ink-700/60 to-transparent pointer-events-none" />
                  <div className="absolute left-2 bottom-1 text-[9px] text-white/90 font-hei">基底</div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {pattern.zones.map(z => (
                    <span key={z.id} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-ink-100 bg-white/80 text-ink-500">
                      <span className="w-2 h-2 rounded-sm" style={{ background: z.color }} />
                      {z.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Sparkles className="w-4 h-4" /></div>
            <h2>盘绕密度热力图</h2>
            <div className="ml-auto flex items-center gap-1 text-[10px]">
              {[
                { c: 'rgba(144,238,144,0.8)', t: '疏' },
                { c: 'rgba(255,215,0,0.8)', t: '中' },
                { c: 'rgba(255,140,0,0.8)', t: '密' },
                { c: 'rgba(205,38,38,0.85)', t: '极密' },
              ].map(l => (
                <span key={l.t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/80 border border-ink-100">
                  <span className="w-3 h-3 rounded-sm" style={{ background: l.c }} /> {l.t}
                </span>
              ))}
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-gold-100 shadow-inner" style={{ background: '#FBF7EE', aspectRatio: '16/9' }}>
            <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="g2" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M16 0 L0 0 0 16" fill="none" stroke="rgba(139,124,108,0.07)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="400" height="220" fill="url(#g2)" />
              {pattern.zones.map(z => {
                const dm = winding.densityMap.find(d => d.zoneId === z.id);
                return (
                  <g key={z.id}>
                    <path d={z.pathD} fill={densityColor((dm?.level || 'medium') as string)}
                          stroke={z.color} strokeWidth="2" strokeLinejoin="round" opacity={0.92} />
                    <path d={z.pathD} fill="none" stroke="rgba(139,35,35,0.85)" strokeWidth="0.9" strokeDasharray="2 1.5" opacity={0.55}
                          transform="translate(2,-2)" />
                  </g>
                );
              })}
              {pattern.pathLayers.slice(0, 2).map(pl => (
                <path key={'t' + pl.id} d={pl.d} fill="none" stroke="#D4AF37" strokeWidth="1.2"
                      strokeDasharray="5 3" opacity={0.85} />
              ))}
            </svg>
            <div className="absolute top-3 left-3 text-xs bg-rice-50/90 backdrop-blur px-2.5 py-1 rounded-md border border-gold-200 text-ink-600 font-song font-semibold">
              平均密度 <span className="text-cinnabar-700">{(winding.densityMap.reduce((s, d) => s + (d as any).density, 0) / (winding.densityMap.length || 1)).toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Clock className="w-4 h-4" /></div>
            <h2>工序时间轴规划</h2>
            <div className="ml-auto text-xs text-ink-400 font-hei">
              合计 <span className="font-song font-bold text-cinnabar-700 text-sm">{totalProcessHours.toFixed(1)}</span> 工时
            </div>
          </div>
          <div className="space-y-2.5">
            {processGantt.map((g, i) => (
              <div key={i} className="group flex items-center gap-3">
                <div className="w-24 flex-shrink-0">
                  <div className="text-xs font-song font-semibold text-ink-700">{g.n}</div>
                  <div className="text-[10px] text-ink-400">{g.h.toFixed(1)} 小时</div>
                </div>
                <div className="flex-1 h-7 rounded-lg bg-ink-50 relative overflow-hidden border border-ink-100">
                  <div className="absolute top-0 h-full rounded-lg transition-all duration-500 group-hover:brightness-110"
                       style={{
                         left: g.startPct + '%', width: g.pct + '%',
                         background: `linear-gradient(135deg, ${g.color} 0%, ${g.color}CC 100%)`,
                         boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.2), 0 1px 2px rgba(44,24,16,0.2)`,
                       }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-hei transition-opacity">
                      第 {Math.floor(g.start / 8) + 1} 天 · 进度 {(g.pct).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="w-20 flex-shrink-0 text-right">
                  <span className="qxd-badge text-[10px]" style={{ background: g.color + '15', borderColor: g.color + '66', color: g.color }}>
                    {i < 2 ? '✓ 完成' : i === 2 ? '⚡ 进行中' : '待定'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t border-gold-100/70">
            <button onClick={() => { saveCurrentToWorks(); setPage('archive'); }} className="qxd-btn-primary flex-1">
              <FileArchive className="w-4 h-4" /> 存入工艺档案
            </button>
            <button onClick={() => setPage('templates')} className="qxd-btn-ghost">
              <ChevronRight className="w-4 h-4" /> 参考模板
            </button>
          </div>
        </div>
      </section>

      <aside className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3 cursor-pointer" onClick={() => setShowConstruction(!showConstruction)}>
            <div className="title-icon"><ListTodo className="w-4 h-4" /></div>
            <h2>分区施工清单</h2>
            <span className="ml-auto text-xs text-ink-400 mr-2">
              {constructionPlan?.items.length || 0} 道工序
            </span>
            {showConstruction ? <ChevronUp className="w-4 h-4 text-ink-400" /> : <ChevronDown className="w-4 h-4 text-ink-400" />}
          </div>
          {showConstruction && constructionPlan && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-cinnabar-50 border border-cinnabar-100 text-center">
                  <div className="text-[9px] text-ink-400">用线总长</div>
                  <div className="font-song font-bold text-cinnabar-700 text-sm">{constructionPlan.totalThreadLength}m</div>
                </div>
                <div className="p-2 rounded-lg bg-gold-50 border border-gold-200 text-center">
                  <div className="text-[9px] text-ink-400">预计工时</div>
                  <div className="font-song font-bold text-gold-700 text-sm">{constructionPlan.totalEstimatedHours.toFixed(1)}h</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[9px] text-ink-400">贴金节点</div>
                  <div className="font-song font-bold text-emerald-700 text-sm">{constructionPlan.totalGoldNodes}处</div>
                </div>
              </div>
              <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                {constructionPlan.items.map((item, idx) => (
                  <ConstructionItemRow
                    key={item.id}
                    item={item}
                    onUpdate={updateConstructionItem}
                  />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gold-100/70 flex gap-2">
                <button
                  onClick={() => generateConstructionPlan()}
                  className="flex-1 qxd-btn-ghost text-xs py-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 重新生成
                </button>
                <button
                  onClick={() => { saveConstructionPlanToWork(); setPage('archive'); }}
                  className="flex-1 qxd-btn-primary text-xs py-2"
                >
                  <Save className="w-3.5 h-3.5" /> 存入档案
                </button>
              </div>
            </>
          )}
        </div>

        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Layers className="w-4 h-4" /></div>
            <h2>堆叠层数明细</h2>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin pr-1">
            {winding.stackingLayers.map((l, i) => {
              const z = pattern.zones.find(zz => zz.id === l.zoneId);
              return (
                <div key={i} className="p-2.5 rounded-lg bg-rice-50 border border-gold-100 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm"
                       style={{ background: `linear-gradient(180deg, ${z?.color || '#ccc'}, ${z?.color || '#ccc'}AA)` }}>
                    <span className="text-white text-xs font-bold font-song">L{l.layerIndex}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-song font-semibold text-ink-700 truncate">{z?.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-ink-400">
                      <span>厚 <span className="text-cinnabar-700 font-semibold">{l.height.toFixed(2)}mm</span></span>
                      <span>长 <span className="text-gold-700 font-semibold">{l.threadLength}m</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-cinnabar-50/70 to-gold-50/50 border border-gold-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-500">堆叠总层数</span>
              <span className="font-song font-bold text-cinnabar-700 text-base">{winding.stackingLayers.length} 层</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1.5">
              <span className="text-ink-500">累计总高度</span>
              <span className="font-song font-bold text-gold-700 text-base">{winding.totalHeight} mm</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1.5">
              <span className="text-ink-500">用线总长度</span>
              <span className="font-song font-bold text-ink-800 text-base">{winding.stackingLayers.reduce((s, l) => s + l.threadLength, 0)} m</span>
            </div>
          </div>
        </div>

        <div className="qxd-panel p-4 huiwen-border">
          <h3 className="font-song font-semibold text-ink-700 mb-2">工序要点提醒</h3>
          <ul className="space-y-2 text-xs text-ink-600">
            {[
              { t: '先盘绕主纹后辅纹', ok: true },
              { t: '每层间隔 15~25 分钟半干', ok: true },
              { t: '堆叠第 3 层后需干燥 1h', ok: winding.stackingLayers.length > 3 },
              { t: '湿度 <40% 时需喷雾保湿', ok: winding.humidity < 40 },
              { t: '贴金前检查线料指触不粘', ok: true },
            ].map((r, i) => (
              <li key={i} className={clsx('flex items-start gap-2 p-2 rounded-lg',
                r.ok ? 'bg-emerald-50/60 border border-emerald-200/60' : 'bg-rice-50 border border-ink-100')}>
                <span className={clsx('w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] text-white font-bold',
                  r.ok ? 'bg-emerald-500' : 'bg-ink-300')}>
                  {r.ok ? '✓' : '!'}
                </span>
                <span className={r.ok ? 'text-emerald-800' : 'text-ink-500'}>{r.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ConstructionItemRow({
  item, onUpdate,
}: {
  item: ConstructionItem;
  onUpdate: (id: string, patch: Partial<ConstructionItem>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusColors: Record<ConstructionItem['status'], string> = {
    'pending': 'bg-ink-100 text-ink-500 border-ink-200',
    'in-progress': 'bg-cinnabar-50 text-cinnabar-700 border-cinnabar-200',
    'done': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const statusLabels: Record<ConstructionItem['status'], string> = {
    'pending': '待开始',
    'in-progress': '进行中',
    'done': '已完成',
  };

  return (
    <div className={clsx(
      'rounded-lg border-2 transition-all overflow-hidden',
      item.status === 'done' ? 'border-emerald-200 bg-emerald-50/40'
        : item.status === 'in-progress' ? 'border-cinnabar-300 bg-cinnabar-50/40'
        : 'border-gold-100 bg-rice-50/60'
    )}>
      <div className="p-2.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
               style={{ background: item.zoneColor }}>
            {item.sequence}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-song font-semibold text-ink-700 truncate">{item.zoneName}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/70 text-ink-500 border border-ink-100">
                第{item.layerIndex}层
              </span>
            </div>
          </div>
          <span className={clsx(
            'text-[9px] px-1.5 py-0.5 rounded border font-semibold',
            statusColors[item.status]
          )}>
            {statusLabels[item.status]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-ink-500">
            {item.windingDirection === 'cw' ? '↻ 顺时针' : '↺ 逆时针'} · {item.threadCount}匝
          </span>
          <span className="text-cinnabar-700 font-semibold">{item.threadLength}m</span>
          {item.isGoldNode && (
            <span className="ml-auto px-1.5 py-0.5 rounded bg-gold-100 text-gold-700 border border-gold-300 font-semibold">
              ✨ 贴金
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gold-100 p-2.5 bg-white/40 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-ink-400">线径</span>
              <span className="ml-1 font-semibold text-ink-700">Φ{item.threadDiameter}mm</span>
            </div>
            <div>
              <span className="text-ink-400">半干等待</span>
              <span className="ml-1 font-semibold text-ink-700">{item.waitTimeMinutes}分钟</span>
            </div>
          </div>
          <p className="text-[10px] text-ink-500 pl-2 border-l-2 border-gold-300">
            💡 {item.notes}
          </p>
          <div className="flex gap-1 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(item.id, {
                  status: item.status === 'done' ? 'pending' : item.status === 'pending' ? 'in-progress' : 'done',
                });
              }}
              className={clsx(
                'flex-1 py-1 rounded text-[9px] font-semibold flex items-center justify-center gap-1 border transition-all',
                item.status === 'done'
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'bg-rice-50 text-ink-500 border-ink-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
              )}>
              <CheckCircle className="w-3 h-3" />
              {item.status === 'done' ? '已完成' : '标记完成'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(item.id, {
                  waitTimeMinutes: Math.max(5, item.waitTimeMinutes + 10),
                });
              }}
              className="px-2 py-1 rounded text-[9px] font-semibold bg-rice-50 text-ink-500 border border-ink-200 hover:bg-gold-50 hover:border-gold-300 hover:text-gold-700"
            >
              ⏱ +10分钟
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
