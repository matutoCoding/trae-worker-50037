import { useMemo, useState } from 'react';
import { Upload, Layers, PenLine, Grid3X3, Download, Plus, Trash2, ChevronDown, Eye, EyeOff, Move, ArrowRight, Palette, Sparkles } from 'lucide-react';
import { useQxdStore } from '../../store/useQxdStore';
import { clsx } from 'clsx';

export default function PatternPage() {
  const { pattern, updatePattern, addZone, updateZone, removeZone, recomputeWinding, setPage, formula, saveCurrentToWorks, processVectorize, processAutoPartition } = useQxdStore();
  const [tool, setTool] = useState<'select' | 'zone' | 'path'>('select');
  const [activeZoneId, setActiveZoneId] = useState(pattern.zones[0]?.id ?? null);
  const [showGrid, setShowGrid] = useState(true);
  const [processing, setProcessing] = useState<'vectorize' | 'partition' | null>(null);

  const layerCounts = useMemo(() => {
    return pattern.pathLayers.reduce((acc: Record<string, number>, p) => {
      acc[p.zoneId] = (acc[p.zoneId] ?? 0) + 1;
      return acc;
    }, {});
  }, [pattern.pathLayers]);

  const totalArea = pattern.zones.reduce((s, z) => s + z.area, 0);

  return (
    <div className="grid grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[680px]">
      <aside className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Upload className="w-4 h-4" /></div>
            <h2>纹样导入</h2>
          </div>
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gold-300 rounded-xl p-6 text-center bg-rice-50/60 hover:bg-gold-50/60 hover:border-gold-400 transition-colors relative overflow-hidden group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-ink-800" />
              </div>
              <p className="font-song font-medium text-ink-700 mb-1">{pattern.imageData ? '已载入纹样图片' : '点击上传纹样图片'}</p>
              <p className="text-xs text-ink-400">支持 PNG / JPG / SVG 格式</p>
              <input type="file" className="hidden" accept="image/*,.svg" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = ev => updatePattern({ imageData: ev.target?.result as string, name: f.name.replace(/\.[^.]+$/, '') });
                reader.readAsDataURL(f);
              }} />
            </div>
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={async () => {
              if (!pattern.imageData) { alert('请先上传纹样图片'); return; }
              setProcessing('vectorize');
              try { await processVectorize(); } finally { setProcessing(null); }
            }} disabled={processing !== null}
              className="flex-1 min-w-[90px] text-xs py-2 rounded-lg border border-gold-200 bg-rice-50 text-ink-600 hover:bg-gold-50 hover:text-cinnabar-700 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
              <Sparkles className={clsx('w-3.5 h-3.5', processing === 'vectorize' && 'animate-spin')} />
              {processing === 'vectorize' ? '处理中...' : '矢量化处理'}
            </button>
            <button onClick={async () => {
              if (!pattern.imageData) { alert('请先上传纹样图片'); return; }
              setProcessing('partition');
              try { await processAutoPartition(); } finally { setProcessing(null); }
            }} disabled={processing !== null}
              className="flex-1 min-w-[90px] text-xs py-2 rounded-lg border border-gold-200 bg-rice-50 text-ink-600 hover:bg-gold-50 hover:text-cinnabar-700 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
              <Grid3X3 className={clsx('w-3.5 h-3.5', processing === 'partition' && 'animate-spin')} />
              {processing === 'partition' ? '分析中...' : '智能分区'}
            </button>
          </div>
        </div>

        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><PenLine className="w-4 h-4" /></div>
            <h2>绘制工具</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { k: 'select', Icon: Move, label: '选择' },
              { k: 'zone', Icon: Grid3X3, label: '分区' },
              { k: 'path', Icon: PenLine, label: '路径' },
            ].map(t => (
              <button key={t.k} onClick={() => setTool(t.k as any)}
                className={clsx('py-2.5 rounded-lg text-xs font-hei flex flex-col items-center gap-1 border transition-all',
                  tool === t.k
                    ? 'border-gold-400 text-white shadow-cinnabar-glow'
                    : 'border-ink-200 bg-rice-50 text-ink-500 hover:border-gold-300 hover:text-cinnabar-700')}
                style={tool === t.k ? { background: 'linear-gradient(135deg,#D45D4C,#8B2323)' } : undefined}>
                <t.Icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer select-none">
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)}
                   className="w-4 h-4 accent-cinnabar-600 rounded" />
            <Grid3X3 className="w-3.5 h-3.5 text-gold-600" />
            显示参考网格
          </label>
        </div>

        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Layers className="w-4 h-4" /></div>
            <h2>分区与层次</h2>
            <button onClick={addZone}
              className="ml-auto w-7 h-7 rounded-lg bg-cinnabar-gradient text-white flex items-center justify-center hover:scale-105 transition-transform shadow-cinnabar-glow">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
            {[...pattern.zones].sort((a, b) => b.layerOrder - a.layerOrder).map(z => {
              const active = activeZoneId === z.id;
              return (
                <div key={z.id} onClick={() => setActiveZoneId(z.id)}
                  className={clsx('p-3 rounded-xl border cursor-pointer transition-all group',
                    active ? 'border-cinnabar-400 bg-cinnabar-50/60 shadow-panel' : 'border-ink-100 bg-rice-50 hover:border-gold-300 hover:bg-gold-50/40')}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-md shadow-sm flex-shrink-0 border border-white/80" style={{ background: z.color }} />
                    <input value={z.name} onChange={e => updateZone(z.id, { name: e.target.value })}
                      className="flex-1 bg-transparent outline-none font-song font-semibold text-sm text-ink-700 min-w-0" />
                    <div className="w-7 h-7 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-warn-danger/10 text-warn-danger transition-all"
                         onClick={e => { e.stopPropagation(); removeZone(z.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-ink-400 mb-0.5">层次</p>
                      <select value={z.layerOrder} onChange={e => updateZone(z.id, { layerOrder: +e.target.value })}
                              className="w-full rounded-md border border-ink-200 bg-white px-2 py-1 text-ink-700 outline-none focus:border-gold-400">
                        {Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>第 {i + 1} 层</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-ink-400 mb-0.5">级别</p>
                      <select value={z.priority} onChange={e => updateZone(z.id, { priority: e.target.value })}
                              className="w-full rounded-md border border-ink-200 bg-white px-2 py-1 text-ink-700 outline-none focus:border-gold-400">
                        <option value="primary">主纹饰</option>
                        <option value="secondary">辅纹饰</option>
                        <option value="background">地纹</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-ink-400">
                    <span>面积 <span className="text-ink-600 font-medium">{z.area.toLocaleString()} px²</span></span>
                    <span>路径层数 <span className="text-cinnabar-700 font-medium">{layerCounts[z.id] ?? 0}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="col-span-12 lg:col-span-6 flex flex-col gap-4 min-h-0">
        <div className="qxd-panel p-4 huiwen-border flex-1 flex flex-col min-h-0">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Palette className="w-4 h-4" /></div>
            <input value={pattern.name} onChange={e => updatePattern({ name: e.target.value })}
              className="font-song text-lg font-semibold text-ink-700 bg-transparent outline-none flex-1" />
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <span>{pattern.zones.length} 分区</span>
              <span>·</span>
              <span>{pattern.pathLayers.length} 路径层</span>
            </div>
          </div>
          <div className="flex-1 relative rounded-xl overflow-hidden border border-gold-100 shadow-inner"
               style={{ background: pattern.imageData ? `url(${pattern.imageData}) center/cover no-repeat` : '#FBF7EE' }}>
            <svg viewBox="0 0 400 440" className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="grid-pat" width="20" height="20" patternUnits="userSpaceOnUse">
                  {showGrid && <><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(139,124,108,0.12)" strokeWidth="0.5" /></>}
                </pattern>
                <filter id="goldGlow"><feGaussianBlur stdDeviation="2" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              <rect width="400" height="440" fill="url(#grid-pat)" />
              {!pattern.imageData && (
                <g opacity="0.18">
                  <circle cx="200" cy="220" r="140" fill="none" stroke="#8B2323" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle cx="200" cy="220" r="90" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="2 3" />
                </g>
              )}
              {[...pattern.zones].sort((a, b) => a.layerOrder - b.layerOrder).map(z => (
                <g key={z.id} opacity={activeZoneId === z.id ? 1 : 0.92} style={{ filter: activeZoneId === z.id ? 'drop-shadow(0 0 8px rgba(212,175,55,0.6))' : undefined }}>
                  <path d={z.pathD} fill={z.color} fillOpacity={activeZoneId === z.id ? 0.28 : 0.18}
                        stroke={z.color} strokeWidth={activeZoneId === z.id ? 2.5 : 1.5} strokeLinejoin="round" strokeLinecap="round" />
                  {pattern.pathLayers.filter(p => p.zoneId === z.id).map((pl, i) => (
                    <path key={pl.id} d={pl.d} fill="none"
                          stroke={i % 2 ? '#D4AF37' : '#8B2323'} strokeWidth={Math.max(1, 3 - i * 0.5)}
                          strokeLinecap="round" strokeLinejoin="round"
                          transform={`translate(${i * 3 - 3}, ${i * 2 - 2})`}
                          opacity={0.75 - i * 0.1} filter="url(#goldGlow)" strokeDasharray={pl.windingDirection === 'ccw' ? '6 3' : undefined} />
                  ))}
                  <text x={+z.pathD.match(/M([\d.]+)/)?.[1] || 100}
                        y={(+z.pathD.match(/[,M]([\d.]+)[^,]*$/)?.[1] || 100) - 10}
                        textAnchor="middle" className="font-song" fontSize="11" fill="#2C1810" fontWeight="600">
                    {z.layerOrder}层·{z.priority === 'primary' ? '主' : z.priority === 'secondary' ? '辅' : '地'}
                  </text>
                </g>
              ))}
              {pattern.pathLayers.slice(0, 1).map(pl => {
                const match = pl.d.match(/C([\d.,\s]+)Z/);
                if (!match) return null;
                const pts = match[1].trim().split(/[\s,]+/).map(Number);
                if (pts.length < 6) return null;
                return (
                  <g key={'arrow_' + pl.id}>
                    <circle cx={pts[0]} cy={pts[1]} r="3" fill="#8B2323" />
                    <path d={`M${pts[0]},${pts[1]} l6,-3 l-3,5 z`} fill="#D4AF37" stroke="#8B2323" strokeWidth="0.8" />
                  </g>
                );
              })}
            </svg>
            <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs bg-rice-50/90 backdrop-blur px-3 py-1.5 rounded-full border border-gold-200">
              <span className="w-2 h-2 rounded-full bg-cinnabar-600" /> 盘绕路径
              <span className="w-2 h-2 rounded-full bg-gold-500" /> 堆叠层次
              <span className="w-2 h-2 rounded-full bg-ink-400" /> 参考网格
            </div>
            <div className="absolute top-3 right-3 flex gap-1">
              <button className="w-8 h-8 rounded-lg bg-rice-50/90 backdrop-blur border border-gold-200 flex items-center justify-center text-ink-500 hover:text-cinnabar-700 hover:bg-gold-50">
                <Eye className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-rice-50/90 backdrop-blur border border-gold-200 flex items-center justify-center text-ink-500 hover:text-cinnabar-700 hover:bg-gold-50">
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><ChevronDown className="w-4 h-4" /></div>
            <h2>走向层次规划</h2>
          </div>
          <div className="space-y-2.5">
            {pattern.pathLayers.map((pl, i) => {
              const z = pattern.zones.find(zz => zz.id === pl.zoneId);
              return (
                <div key={pl.id} className="p-2.5 rounded-lg bg-rice-50 border border-gold-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ background: z?.color }}>{i + 1}</span>
                    <span className="font-song text-sm font-medium text-ink-700 flex-1 truncate">{z?.name || '路径层'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-gold-200 bg-gold-50 text-gold-700">
                      {pl.windingDirection === 'cw' ? '顺时针' : '逆时针'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="text-ink-500">盘绕匝数 <span className="text-ink-700 font-medium">{pl.threadCount}</span></div>
                    <div className="text-ink-500">Z轴顺序 <span className="text-ink-700 font-medium">{pl.order}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Download className="w-4 h-4" /></div>
            <h2>方案信息</h2>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-gold-100/60">
              <dt className="text-ink-400">分区数量</dt>
              <dd className="font-song font-semibold text-ink-700">{pattern.zones.length}</dd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gold-100/60">
              <dt className="text-ink-400">路径层数</dt>
              <dd className="font-song font-semibold text-ink-700">{pattern.pathLayers.length}</dd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gold-100/60">
              <dt className="text-ink-400">纹样总面积</dt>
              <dd className="font-song font-semibold text-cinnabar-700">{totalArea.toLocaleString()} px²</dd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gold-100/60">
              <dt className="text-ink-400">推荐线径</dt>
              <dd className="font-song font-semibold text-gold-700">{formula.threadDiameter} mm</dd>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <dt className="text-ink-400">方案版本</dt>
              <dd className="font-hei text-xs text-ink-500">v1.0 · 草稿</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={() => { recomputeWinding(); setPage('thread'); }} className="qxd-btn-gold w-full">
              前往线料搓制 <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={saveCurrentToWorks} className="qxd-btn-primary w-full">
              保存方案到档案
            </button>
            <button className="qxd-btn-ghost w-full">
              <Download className="w-4 h-4" /> 导出 JSON
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
