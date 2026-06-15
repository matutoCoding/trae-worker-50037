import { useState } from 'react';
import {
  FileArchive, Search, Filter, AlertTriangle, Clock, Layers, Sparkles, ChevronRight, X, Play, Pause,
  Download, Share2, Trash2, CheckCircle2, AlertCircle, GitBranch, RotateCcw, Save, GitCompare,
  ChevronDown, ChevronUp, ArrowUpDown,
} from 'lucide-react';
import { useQxdStore } from '../../store/useQxdStore';
import { formatDateTime, formatDate } from '../../utils/calculations';
import { clsx } from 'clsx';
import type { Work, VersionDiff } from '../../types';

const statusMap: Record<Work['status'], { label: string; dot: string; cls: string; icon: any }> = {
  draft: { label: '草稿', dot: 'bg-ink-400', cls: 'border-ink-200 bg-ink-50 text-ink-500', icon: Clock },
  'in-progress': { label: '制作中', dot: 'bg-cinnabar-500 animate-pulse', cls: 'border-cinnabar-300 bg-cinnabar-50 text-cinnabar-700', icon: Sparkles },
  completed: { label: '已完成', dot: 'bg-emerald-500', cls: 'border-emerald-300 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  archived: { label: '已归档', dot: 'bg-gold-500', cls: 'border-gold-300 bg-gold-50 text-gold-700', icon: FileArchive },
};

export default function ArchivePage() {
  const {
    works, selectedWorkId, selectWork, updateWork, setPage,
    versions, saveVersion, getVersionsByWork, restoreVersion, compareTwoVersions,
    setSelectedCompareVersion, selectedCompareVersionId,
  } = useQxdStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Work['status'] | 'all'>('all');
  const [playing, setPlaying] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(true);
  const [versionNote, setVersionNote] = useState('');
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const selected = works.find(w => w.id === selectedWorkId);
  const displayPattern = selected?.patternSnapshot;
  const displayFormula = selected?.formulaSnapshot;
  const displayWinding = selected?.windingSnapshot;
  const workVersions = selectedWorkId ? getVersionsByWork(selectedWorkId) : [];
  const compareDiff: VersionDiff | null = showVersionCompare && selectedCompareVersionId && workVersions[0]
    ? compareTwoVersions(selectedCompareVersionId, workVersions[0].id)
    : null;

  const filtered = works.filter(w => (filter === 'all' || w.status === filter) && (w.name.includes(query) || w.notes.includes(query)));
  const progress = (w: Work) => w.steps.length ? Math.round((w.steps.filter(s => s.status === 'done').length / w.steps.length) * 100) : 0;

  return (
    <div className="grid grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[720px]">
      <section className="col-span-12 lg:col-span-5 flex flex-col gap-4 min-h-0">
        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><FileArchive className="w-4 h-4" /></div>
            <h2>工艺档案库</h2>
            <span className="ml-auto text-xs text-ink-400">共 {works.length} 件作品</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索作品名称、备注..."
                className="qxd-input pl-9 text-sm" />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value as any)}
                    className="px-3 py-2.5 rounded-lg border border-ink-200 bg-white text-sm text-ink-600 outline-none focus:border-gold-400">
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="in-progress">制作中</option>
              <option value="completed">已完成</option>
              <option value="archived">已归档</option>
            </select>
            <button className="w-9 h-9 rounded-lg border border-gold-200 bg-rice-50 flex items-center justify-center text-ink-500 hover:text-cinnabar-700 hover:border-cinnabar-300">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3 text-center">
            {(['all', 'draft', 'in-progress', 'completed'] as const).map(k => {
              const n = k === 'all' ? works.length : works.filter(w => w.status === k).length;
              const active = filter === k;
              return (
                <button key={k} onClick={() => setFilter(k)}
                  className={clsx('py-2 rounded-lg text-xs font-hei transition-all border',
                    active ? 'bg-cinnabar-gradient text-white border-gold-400 shadow-cinnabar-glow' : 'bg-rice-50 text-ink-500 border-ink-100 hover:border-gold-200')}>
                  {({ all: '全部', draft: '草稿', 'in-progress': '在制', completed: '完成' } as any)[k]}
                  <span className={clsx('ml-1 font-bold', active ? 'text-gold-200' : 'text-ink-400')}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 qxd-panel p-3 huiwen-border overflow-hidden flex flex-col">
          <div className="space-y-2.5 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {filtered.map(w => {
              const s = statusMap[w.status];
              const openAlert = w.alerts.filter(a => !a.resolved).length;
              const pct = progress(w);
              const active = w.id === selectedWorkId;
              return (
                <div key={w.id} onClick={() => selectWork(w.id)}
                  className={clsx('group rounded-xl overflow-hidden cursor-pointer transition-all border',
                    active ? 'border-cinnabar-400 bg-cinnabar-50/40 shadow-gold-glow' : 'border-gold-100 bg-rice-50/60 hover:border-gold-300 hover:shadow-panel')}>
                  <div className="flex gap-3 p-3">
                    <div className="w-16 h-16 rounded-lg shadow-panel grain-overlay flex-shrink-0 relative overflow-hidden" style={{ background: w.thumbnail }}>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.28) 0%,transparent 55%)' }} />
                      <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full shadow-sm border border-white/60 ' + s.dot" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-song font-semibold text-ink-800 truncate group-hover:text-cinnabar-700">{w.name}</h4>
                        {openAlert > 0 && (
                          <span className="qxd-badge border-warn-danger/40 bg-warn-danger/10 text-warn-danger gap-1">
                            <AlertTriangle className="w-3 h-3" /> {openAlert}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-ink-400 mb-2">
                        <span className={clsx('qxd-badge gap-1', s.cls)}>
                          <s.icon className="w-3 h-3" /> {s.label}
                        </span>
                        <span>更新 {formatDate(w.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-cinnabar-500 to-gold-500 transition-all"
                               style={{ width: pct + '%' }} />
                        </div>
                        <span className="text-[10px] font-bold text-ink-500 w-9 text-right">{pct}%</span>
                      </div>
                    </div>
                    <ChevronRight className={clsx('w-4 h-4 transition-all flex-shrink-0 mt-4',
                      active ? 'text-cinnabar-700 translate-x-0.5' : 'text-ink-300 group-hover:text-cinnabar-600')} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="col-span-12 lg:col-span-7 flex flex-col gap-4 min-h-0 overflow-y-auto scrollbar-thin pr-1">
        {!selected ? (
          <div className="flex-1 qxd-panel huiwen-border flex flex-col items-center justify-center p-10 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-float-gentle shadow-lacquer"
                 style={{ background: 'linear-gradient(135deg,#D45D4C 0%,#8B2323 55%,#4A1010 100%)' }}>
              <FileArchive className="w-11 h-11 text-gold-300" />
            </div>
            <h3 className="font-song text-xl font-semibold text-ink-700 mb-2">选择作品查看工艺档案</h3>
            <p className="text-ink-500 max-w-md">点击左侧作品列表，查看完整的盘绕走向记录、工艺参数、工序时间轴与风险预警追溯。</p>
            <button onClick={() => setPage('pattern')} className="mt-6 qxd-btn-primary">
              <Sparkles className="w-4 h-4" /> 开启新作品
            </button>
          </div>
        ) : (
          <>
            <div className="qxd-panel p-5 huiwen-border relative overflow-hidden">
              <div className="absolute -right-16 -top-12 w-48 h-48 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle,#D4AF37,transparent 70%)' }} />
              <div className="relative flex flex-col md:flex-row gap-5 items-start md:items-center">
                <div className="w-24 h-24 rounded-2xl shadow-lacquer grain-overlay flex-shrink-0 relative overflow-hidden" style={{ background: selected.thumbnail }}>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.35) 0%,transparent 55%),linear-gradient(0deg,rgba(0,0,0,0.2) 0%,transparent 50%)' }} />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px]">
                    <span className="font-song font-semibold text-shadow-gold">#{selected.id.slice(-4)}</span>
                    <span>{formatDate(selected.createdAt)}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className={clsx('qxd-badge gap-1', statusMap[selected.status].cls)}>
                      {(() => { const Icon = statusMap[selected.status].icon; return <Icon className="w-3 h-3" />; })()}
                      {statusMap[selected.status].label}
                    </div>
                    {selected.alerts.filter(a => !a.resolved).map(a => (
                      <span key={a.id} className={clsx('qxd-badge gap-1',
                        a.severity === 'high' ? 'border-warn-danger/40 bg-warn-danger/10 text-warn-danger animate-pulse-warn'
                        : a.severity === 'medium' ? 'border-warn-soft/40 bg-warn-soft/10 text-warn-soft'
                        : 'border-ink-200 bg-ink-50 text-ink-500')}>
                        <AlertCircle className="w-3 h-3" />
                        {({ fragile: '变脆风险', collapse: '坍塌', crack: '裂纹', drying: '干燥', humidity: '湿度' } as any)[a.type]}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-song text-2xl font-bold text-ink-800 mb-1 text-shadow-gold">{selected.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-500">
                    <span>作者 <b className="text-ink-700">{selected.author}</b></span>
                    <span>创建 {formatDateTime(selected.createdAt)}</span>
                    <span>更新 {formatDateTime(selected.updatedAt)}</span>
                    <span>工序 {selected.steps.filter(s => s.status === 'done').length}/{selected.steps.length}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:flex-col w-full md:w-auto">
                  <button className="qxd-btn-gold md:w-full py-2 text-sm">
                    <Download className="w-4 h-4" /> 导出档案
                  </button>
                  <button className="qxd-btn-ghost md:w-full py-2 text-sm"><Share2 className="w-4 h-4" /> 分享</button>
                  <button className="qxd-btn-ghost md:w-full py-2 text-sm text-warn-danger hover:!text-warn-danger hover:!border-warn-danger/40">
                    <Trash2 className="w-4 h-4" /> 删除
                  </button>
                </div>
              </div>
              {selected.notes && (
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-gold-50/70 to-rice-100 border border-gold-200/70 text-sm text-ink-600 italic">
                  <span className="text-gold-700 font-song font-semibold not-italic">📜 工艺备注：</span>{selected.notes}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="qxd-panel p-4 huiwen-border">
                <div className="qxd-title-bar mb-2">
                  <div className="title-icon !w-6 !h-6 !rounded-md"><Layers className="w-3.5 h-3.5" /></div>
                  <h2 className="!text-base">纹样方案</h2>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-ink-400">方案名</span><span className="text-ink-700 font-song font-semibold">{displayPattern?.name}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">分区数</span><span className="text-cinnabar-700 font-semibold">{displayPattern?.zones.length}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">路径层</span><span className="text-cinnabar-700 font-semibold">{displayPattern?.pathLayers.length}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">总面积</span><span className="text-gold-700 font-semibold">{displayPattern?.zones.reduce((s, z) => s + z.area, 0).toLocaleString()} px²</span></div>
                </div>
              </div>
              <div className="qxd-panel p-4 huiwen-border">
                <div className="qxd-title-bar mb-2">
                  <div className="title-icon !w-6 !h-6 !rounded-md"><Sparkles className="w-3.5 h-3.5" /></div>
                  <h2 className="!text-base">线料配方</h2>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-ink-400">硬度指数</span><span className={clsx('font-bold', displayFormula && displayFormula.hardnessIndex >= 55 && displayFormula.hardnessIndex <= 75 ? 'text-emerald-600' : 'text-warn-danger')}>{displayFormula?.hardnessIndex}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">可塑性</span><span className="text-cinnabar-700 font-semibold">{displayFormula?.plasticityIndex}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">漆/油/砖/金</span><span className="text-ink-700 font-hei">{displayFormula?.lacquerRatio}/{displayFormula?.tungOilRatio}/{displayFormula?.brickPowderRatio}/{displayFormula?.goldPowderRatio}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">线径</span><span className="text-gold-700 font-semibold">Φ {displayFormula?.threadDiameter}mm</span></div>
                </div>
              </div>
              <div className="qxd-panel p-4 huiwen-border">
                <div className="qxd-title-bar mb-2">
                  <div className="title-icon !w-6 !h-6 !rounded-md"><Clock className="w-3.5 h-3.5" /></div>
                  <h2 className="!text-base">盘绕参数</h2>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-ink-400">堆叠层数</span><span className="text-cinnabar-700 font-semibold">{displayWinding?.stackingLayers.length}</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">总高度</span><span className="text-cinnabar-700 font-semibold">{displayWinding?.totalHeight} mm</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">温湿度</span><span className="text-ink-700 font-hei">{displayWinding?.temperature}°C / {displayWinding?.humidity}%</span></div>
                  <div className="flex justify-between"><span className="text-ink-400">预计干燥</span><span className="text-gold-700 font-semibold">{displayWinding?.dryingHours} h</span></div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="qxd-panel p-5 huiwen-border">
                <div className="qxd-title-bar mb-3">
                  <div className="title-icon"><Play className="w-4 h-4" /></div>
                  <h2>盘绕走向动画</h2>
                  <button onClick={() => setPlaying(p => !p)}
                    className={clsx('ml-auto text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1',
                      playing ? 'bg-cinnabar-600 text-white border-cinnabar-400' : 'bg-gold-50 text-gold-700 border-gold-300 hover:bg-gold-100')}>
                    {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {playing ? '暂停' : '播放'}
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-gold-100 shadow-inner aspect-[4/3]" style={{ background: '#FBF7EE' }}>
                  <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
                    <defs>
                      <linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8B2323" />
                        <stop offset="100%" stopColor="#D4AF37" />
                      </linearGradient>
                      <filter id="sGold"><feGaussianBlur stdDeviation="1.5" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    </defs>
                    {displayPattern?.zones.map(z => (
                      <path key={z.id} d={z.pathD} fill={z.color} fillOpacity="0.08" stroke={z.color} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
                    ))}
                    {displayPattern?.pathLayers.map((pl, i) => {
                      const z = displayPattern.zones.find(zz => zz.id === pl.zoneId);
                      const len = 3000;
                      return (
                        <g key={'anim' + pl.id}>
                          <path d={pl.d} fill="none" stroke={z?.color || '#D4AF37'} strokeWidth={2.5 - i * 0.3}
                                strokeLinecap="round" filter="url(#sGold)"
                                strokeDasharray={len}
                                style={{
                                  strokeDashoffset: playing ? 0 : len,
                                  transition: `stroke-dashoffset ${3 + i * 0.8}s ease-in-out`,
                                  opacity: 0.85 - i * 0.1,
                                }} />
                        </g>
                      );
                    })}
                  </svg>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-rice-50/90 backdrop-blur border border-gold-200 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: playing ? '#2ECC71' : '#8B7C6C' }} />
                    {playing ? '走针播放中' : '点击播放查看走向'}
                  </div>
                </div>
              </div>

              <div className="qxd-panel p-5 huiwen-border">
                <div className="qxd-title-bar mb-3">
                  <div className="title-icon"><Clock className="w-4 h-4" /></div>
                  <h2>工序时间轴</h2>
                </div>
                <div className="space-y-0.5 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                  {selected.steps.length === 0 ? (
                    <p className="text-sm text-ink-400 py-6 text-center">暂无工序记录</p>
                  ) : selected.steps.map((s, i) => {
                    const stColor = s.status === 'done' ? 'emerald' : s.status === 'in-progress' ? 'cinnabar' : 'ink';
                    const StepIcon = s.status === 'done' ? CheckCircle2 : s.status === 'in-progress' ? Sparkles : Clock;
                    return (
                      <div key={s.id} className={clsx('relative flex gap-3 p-2.5 rounded-lg hover:bg-gold-50/40 transition-colors',
                        i !== selected.steps.length - 1 ? 'before:absolute before:left-[17px] before:top-[38px] before:bottom-0 before:w-px before:bg-gold-200' : '')}>
                        <div className={clsx('step-dot border-2 relative z-10',
                          s.status === 'done' ? 'bg-emerald-500 text-white border-emerald-300 shadow-md'
                          : s.status === 'in-progress' ? 'bg-cinnabar-gradient text-gold-200 border-gold-400 shadow-cinnabar-glow animate-pulse'
                          : 'bg-rice-50 text-ink-400 border-ink-200')}>
                          {s.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : s.stepOrder}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h4 className={clsx('font-song font-semibold text-sm',
                              s.status === 'done' ? 'text-ink-700' : s.status === 'in-progress' ? 'text-cinnabar-700' : 'text-ink-400')}>
                              {s.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-ink-400">{s.durationHours}h</span>
                              <button onClick={() => updateWork(selected.id, {
                                steps: selected.steps.map((st, j) => j === i ? { ...st, status: st.status === 'done' ? 'pending' : st.status === 'pending' ? 'in-progress' : 'done' } as any : st)
                              })} className={clsx('qxd-badge cursor-pointer hover:scale-105 transition-transform',
                                'border-' + stColor + '-200 bg-' + stColor + '-50 text-' + stColor + '-700')}>
                                <StepIcon className="w-3 h-3" />
                                {{ done: '已完成', 'in-progress': '进行中', pending: '待开始' }[s.status]}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-ink-500 leading-relaxed">{s.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selected.alerts.length > 0 && (
              <div className="qxd-panel p-5 huiwen-border">
                <div className="qxd-title-bar mb-3">
                  <div className="title-icon"><AlertTriangle className="w-4 h-4" /></div>
                  <h2>风险预警 · 追溯记录</h2>
                  <span className="ml-auto text-xs text-ink-400">{selected.alerts.filter(a => !a.resolved).length} 条待处理</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {selected.alerts.map(a => (
                    <div key={a.id} className={clsx('p-3.5 rounded-xl border-2 transition-all',
                      a.resolved ? 'bg-emerald-50/50 border-emerald-200/60'
                      : a.severity === 'high' ? 'risk-card' : 'warn-card')}>
                      <div className="flex items-start gap-3">
                        <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-md',
                          a.resolved ? 'bg-emerald-500' : a.severity === 'high' ? 'bg-warn-danger' : 'bg-warn-soft')}>
                          {a.resolved ? <CheckCircle2 className="w-4.5 h-4.5" /> : <AlertTriangle className="w-4.5 h-4.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className={clsx('font-song font-semibold text-sm',
                              a.resolved ? 'text-emerald-800' : a.severity === 'high' ? 'text-warn-danger' : 'text-warn-soft')}>
                              {({ fragile: '线料失水变脆', collapse: '堆叠坍塌风险', crack: '盘绕裂纹', drying: '干燥超时', humidity: '湿度偏离' } as any)[a.type]}
                            </h4>
                            <span className={clsx('qxd-badge text-[10px]',
                              a.resolved ? 'border-emerald-300/60 bg-emerald-50 text-emerald-700'
                              : a.severity === 'high' ? 'border-warn-danger/40 bg-warn-danger/10 text-warn-danger'
                              : 'border-warn-soft/40 bg-warn-soft/10 text-warn-soft')}>
                              {a.resolved ? '已处理' : ({ low: '低风险', medium: '中风险', high: '高风险' } as any)[a.severity]}
                            </span>
                          </div>
                          <p className="text-xs text-ink-600 mb-1.5 leading-relaxed">{a.message}</p>
                          <div className="flex items-center justify-between text-[11px] text-ink-400">
                            <span>检测于 {formatDateTime(a.detectedAt)}</span>
                            <button onClick={() => updateWork(selected.id, { alerts: selected.alerts.map(x => x.id === a.id ? { ...x, resolved: !x.resolved } : x) })}
                              className={clsx('font-semibold hover:underline', a.resolved ? 'text-ink-400' : 'text-cinnabar-700')}>
                              {a.resolved ? '撤销处理' : '标记已处理'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="qxd-panel p-5 huiwen-border">
              <div className="qxd-title-bar mb-3 cursor-pointer" onClick={() => setShowVersionPanel(!showVersionPanel)}>
                <div className="title-icon"><GitBranch className="w-4 h-4" /></div>
                <h2>版本管理 · 历史记录</h2>
                <span className="ml-auto text-xs text-ink-400 mr-2">{workVersions.length} 个版本</span>
                {showVersionPanel ? <ChevronUp className="w-4 h-4 text-ink-400" /> : <ChevronDown className="w-4 h-4 text-ink-400" />}
              </div>
              {showVersionPanel && (
                <>
                  <div className="flex gap-2 mb-4">
                    <input
                      value={versionNote}
                      onChange={e => setVersionNote(e.target.value)}
                      placeholder="输入版本备注（如：调整砖粉比例至30%）..."
                      className="flex-1 qxd-input text-sm"
                    />
                    <button
                      onClick={() => {
                        if (!selectedWorkId) {
                          alert('请先保存当前方案到档案');
                          return;
                        }
                        saveVersion(versionNote || '保存方案快照');
                        setVersionNote('');
                      }}
                      className="qxd-btn-primary text-sm whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" /> 保存当前版本
                    </button>
                  </div>

                  {workVersions.length === 0 ? (
                    <p className="text-sm text-ink-400 py-6 text-center">暂无版本记录，保存方案后可创建版本快照</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                      {workVersions.map((v, i) => {
                        const isLatest = i === 0;
                        const isCompareSelected = v.id === selectedCompareVersionId;
                        return (
                          <div key={v.id} className={clsx(
                            'p-3 rounded-xl border transition-all',
                            isCompareSelected ? 'border-cinnabar-400 bg-cinnabar-50/40' : 'border-gold-100 bg-rice-50/60 hover:border-gold-300'
                          )}>
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <div className="flex items-center gap-2">
                                <span className={clsx(
                                  'qxd-badge text-[10px] font-bold',
                                  isLatest ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-gold-100 text-gold-700 border-gold-300'
                                )}>
                                  {v.name.split(' ')[0]} {isLatest && '· 当前'}
                                </span>
                                <span className="text-xs text-ink-600 font-song font-semibold">{v.name.split(' ').slice(1).join(' ')}</span>
                              </div>
                              <span className="text-[10px] text-ink-400">{formatDateTime(v.createdAt)}</span>
                            </div>
                            <p className="text-xs text-ink-500 mb-2">{v.note}</p>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-ink-400">分区 {v.patternSnapshot.zones.length}</span>
                              <span className="text-ink-400">硬度 {v.formulaSnapshot.hardnessIndex}</span>
                              <span className="text-ink-400">堆叠 {v.windingSnapshot.totalHeight}mm</span>
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    if (!isCompareSelected && showVersionCompare) {
                                      setSelectedCompareVersion(v.id);
                                    } else if (isLatest) {
                                      setShowVersionCompare(false);
                                      setSelectedCompareVersion(null);
                                    } else {
                                      setShowVersionCompare(true);
                                      setSelectedCompareVersion(v.id);
                                    }
                                  }}
                                  className={clsx(
                                    'px-2 py-1 rounded-md border transition-all',
                                    isCompareSelected
                                      ? 'bg-cinnabar-600 text-white border-cinnabar-400'
                                      : 'border-gold-200 bg-rice-50 text-ink-500 hover:border-gold-400 hover:text-cinnabar-700'
                                  )}
                                  title={isCompareSelected ? '取消对比' : '与当前版本对比'}
                                >
                                  <GitCompare className="w-3 h-3" />
                                </button>
                                {!isLatest && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`确定要恢复到 ${v.name} 吗？当前编辑内容将被覆盖。`)) {
                                        restoreVersion(v.id);
                                      }
                                    }}
                                    className="px-2 py-1 rounded-md border border-gold-200 bg-rice-50 text-ink-500 hover:border-cinnabar-300 hover:text-cinnabar-700 transition-all"
                                    title="恢复此版本到编辑区"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showVersionCompare && compareDiff && (
                    <div className="mt-4 pt-4 border-t border-gold-200">
                      <div className="qxd-title-bar mb-3">
                        <div className="title-icon !bg-blue-500/10"><ArrowUpDown className="w-3.5 h-3.5 text-blue-600" /></div>
                        <h2 className="!text-base text-blue-700">版本差异对比</h2>
                        <button onClick={() => { setShowVersionCompare(false); setSelectedCompareVersion(null); }}
                          className="ml-auto text-xs text-ink-400 hover:text-warn-danger">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                        <div className="p-3 rounded-lg bg-ink-50 border border-ink-100">
                          <h4 className="text-xs font-song font-semibold text-ink-700 mb-2">纹样分区</h4>
                          <div className="space-y-1.5 text-[11px]">
                            <DiffRow label={compareDiff.pattern.zoneCount.field} diff={compareDiff.pattern.zoneCount} />
                            <DiffRow label={compareDiff.pattern.pathLayerCount.field} diff={compareDiff.pattern.pathLayerCount} />
                            {compareDiff.pattern.zones.map(zd => (
                              <div key={zd.zoneName} className="pl-2 border-l-2 border-gold-200">
                                <span className="text-ink-600 font-semibold">{zd.zoneName}</span>
                                {zd.changes.map((c, ci) => (
                                  <div key={ci} className="text-ink-500 ml-2">
                                    {c.field}: <span className="text-warn-soft">{c.oldValue}</span>
                                    <ArrowUpDown className="w-3 h-3 inline mx-1 text-ink-300" />
                                    <span className="text-emerald-600">{c.newValue}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-ink-50 border border-ink-100">
                          <h4 className="text-xs font-song font-semibold text-ink-700 mb-2">线料配方</h4>
                          {compareDiff.formula.length === 0 ? (
                            <p className="text-[11px] text-ink-400">无变化</p>
                          ) : (
                            <div className="space-y-1.5 text-[11px]">
                              {compareDiff.formula.map(d => <DiffRow key={d.field} label={d.field} diff={d} />)}
                            </div>
                          )}
                        </div>
                        <div className="p-3 rounded-lg bg-ink-50 border border-ink-100">
                          <h4 className="text-xs font-song font-semibold text-ink-700 mb-2">盘绕参数</h4>
                          <div className="space-y-1.5 text-[11px]">
                            <DiffRow label={compareDiff.winding.totalHeight.field} diff={compareDiff.winding.totalHeight} />
                            <DiffRow label={compareDiff.winding.stackingLayers.field} diff={compareDiff.winding.stackingLayers} />
                            <DiffRow label={compareDiff.winding.dryingHours.field} diff={compareDiff.winding.dryingHours} />
                            {compareDiff.winding.densityChanges.map(dc => (
                              <div key={dc.zoneName} className="pl-2 border-l-2 border-gold-200">
                                <span className="text-ink-600 font-semibold">{dc.zoneName}</span>
                                <div className="text-ink-500 ml-2">
                                  密度: <span className="text-warn-soft">{dc.density.oldValue}</span>
                                  <ArrowUpDown className="w-3 h-3 inline mx-1 text-ink-300" />
                                  <span className="text-emerald-600">{dc.density.newValue}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function DiffRow({ label, diff }: { label: string; diff: { oldValue: any; newValue: any; changed: boolean } }) {
  if (!diff.changed) {
    return (
      <div className="flex justify-between">
        <span className="text-ink-400">{label}</span>
        <span className="text-ink-500">{diff.newValue}</span>
      </div>
    );
  }
  return (
    <div className="flex justify-between">
      <span className="text-ink-600 font-semibold">{label}</span>
      <span className="flex items-center gap-1">
        <span className="text-warn-soft line-through">{diff.oldValue}</span>
        <ArrowUpDown className="w-3 h-3 text-cinnabar-500" />
        <span className="text-emerald-600 font-bold">{diff.newValue}</span>
      </span>
    </div>
  );
}
