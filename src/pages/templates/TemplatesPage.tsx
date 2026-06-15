import { useState } from 'react';
import { Library, Search, Star, ArrowRight, X, Download, Eye, Layers, Sparkles, Gauge, Box, ChevronDown, Clock, FileArchive, Plus } from 'lucide-react';
import { useQxdStore } from '../../store/useQxdStore';
import type { Template } from '../../types';
import { formatDate } from '../../utils/calculations';
import { clsx } from 'clsx';

const complexityColors = ['', '#9EE66A', '#D4AF37', '#FF9F43', '#E74C3C', '#8B2323'];

export default function TemplatesPage() {
  const { templates, categories, selectedTemplateId, showTemplateDetail, toggleTemplateDetail, createWorkFromTemplate } = useQxdStore();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [complexityFilter, setComplexityFilter] = useState<number | 'all'>('all');

  const tpl = templates.find(t => t.id === selectedTemplateId) || null;
  const filtered = templates.filter(t =>
    (activeCat === 'all' || t.category === activeCat) &&
    (complexityFilter === 'all' || t.complexity === complexityFilter) &&
    (query === '' || t.name.includes(query) || t.description.includes(query) || t.tags.some(tg => tg.includes(query)))
  );

  return (
    <div className="grid grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[720px]">
      <aside className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto scrollbar-thin pr-1">
        <div className="qxd-panel p-4 huiwen-border">
          <div className="qxd-title-bar mb-3">
            <div className="title-icon"><Library className="w-4 h-4" /></div>
            <h2>分类导航</h2>
          </div>
          <button onClick={() => setActiveCat('all')}
            className={clsx('w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all mb-1.5',
              activeCat === 'all' ? 'bg-cinnabar-gradient text-white shadow-cinnabar-glow' : 'text-ink-600 hover:bg-gold-50/60 hover:text-cinnabar-700')}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: activeCat === 'all' ? 'rgba(255,255,255,0.18)' : 'rgba(212,175,55,0.15)' }}>
              🎨
            </span>
            <span className="font-song font-semibold flex-1">全部模板</span>
            <span className={clsx('text-xs font-bold', activeCat === 'all' ? 'text-gold-200' : 'text-ink-300')}>{templates.length}</span>
          </button>
          <div className="space-y-1">
            {categories.map(c => {
              const active = activeCat === c.id;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className={clsx('w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all',
                    active ? 'bg-cinnabar-gradient text-white shadow-cinnabar-glow' : 'text-ink-600 hover:bg-gold-50/60 hover:text-cinnabar-700')}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                        style={{ background: active ? 'rgba(255,255,255,0.18)' : 'rgba(212,175,55,0.15)' }}>
                    {c.icon}
                  </span>
                  <span className="font-song font-medium flex-1">{c.name}</span>
                  <span className={clsx('text-xs font-bold', active ? 'text-gold-200' : 'text-ink-300')}>{c.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="qxd-panel p-4 huiwen-border">
          <h3 className="font-song font-semibold text-ink-700 mb-2.5 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-gold-500" /> 复杂度筛选
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 1, 2, 3, 4, 5] as const).map(c => {
              const active = complexityFilter === c;
              return (
                <button key={String(c)} onClick={() => setComplexityFilter(c as any)}
                  className={clsx('px-2.5 py-1 rounded-lg text-xs font-hei border transition-all',
                    active ? 'bg-cinnabar-600 text-white border-cinnabar-500 shadow-sm' : 'bg-rice-50 text-ink-500 border-ink-100 hover:border-gold-300')}>
                  {c === 'all' ? '全部' : (
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: c as number }).map((_, i) => (
                        <Star key={i} className="w-3 h-3" fill={complexityColors[c as number]} color={complexityColors[c as number]} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="qxd-panel p-4 huiwen-border">
          <h3 className="font-song font-semibold text-ink-700 mb-2.5">🔥 使用热榜</h3>
          <ol className="space-y-1.5">
            {[...templates].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5).map((t, i) => (
              <li key={t.id}>
                <button onClick={() => toggleTemplateDetail(t.id)}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg hover:bg-gold-50/50 transition-colors group">
                  <span className={clsx('w-5 h-5 rounded-md flex items-center justify-center font-song font-bold text-[11px] text-white flex-shrink-0',
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-600 shadow-gold-glow'
                    : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500'
                    : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                    : 'bg-ink-200 text-ink-500')}>{i + 1}</span>
                  <span className="text-xs font-song text-ink-600 truncate group-hover:text-cinnabar-700 flex-1">{t.name}</span>
                  <span className="text-[10px] text-gold-600 font-bold">{t.usageCount}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <section className="col-span-12 lg:col-span-9 flex flex-col gap-4 min-h-0 overflow-hidden">
        <div className="qxd-panel p-4 huiwen-border">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                     placeholder="搜索模板名称、描述、标签..."
                     className="qxd-input pl-9 text-sm" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-ink-400 whitespace-nowrap">
                找到 <span className="font-song font-bold text-cinnabar-700">{filtered.length}</span> 个模板
              </span>
              <button className="qxd-btn-ghost !py-2 text-xs">
                <ChevronDown className="w-3.5 h-3.5" /> 排序：热度
              </button>
              <button className="qxd-btn-gold !py-2 text-xs">
                <Plus className="w-3.5 h-3.5" /> 提交新模板
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 qxd-panel p-4 huiwen-border overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto scrollbar-thin pr-1">
            {filtered.map(t => (
              <TemplateCard key={t.id} t={t} onDetail={() => toggleTemplateDetail(t.id)} onApply={() => createWorkFromTemplate(t)} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center text-ink-400">
                <Library className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>未找到匹配的模板</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {showTemplateDetail && tpl && (
        <TemplateDetailModal tpl={tpl} onClose={() => toggleTemplateDetail(null)} onApply={() => createWorkFromTemplate(tpl)} />
      )}
    </div>
  );
}

function TemplateCard({ t, onDetail, onApply }: { t: Template; onDetail: () => void; onApply: () => void }) {
  return (
    <div className="group rounded-2xl overflow-hidden border border-gold-100 bg-rice-50/80 hover:shadow-gold-glow hover:-translate-y-1 transition-all duration-300 relative grain-overlay">
      <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={onDetail} style={{ background: t.coverImage }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg,rgba(212,175,55,0.22) 0%,transparent 50%),linear-gradient(180deg,transparent 55%,rgba(44,24,16,0.7) 100%)',
        }} />
        <svg viewBox="0 0 200 150" className="absolute inset-0 w-full h-full opacity-55 mix-blend-screen">
          <g stroke="rgba(246,205,112,0.55)" fill="none" strokeWidth="1" strokeLinecap="round">
            <path d="M40 90 Q80 30 120 90 Q160 150 180 80" />
            <path d="M20 120 Q60 70 100 120 Q140 170 180 110" transform="translate(-4 4)" strokeOpacity="0.4" />
            <circle cx="100" cy="75" r="32" strokeDasharray="3 2.5" />
            <circle cx="100" cy="75" r="18" strokeDasharray="2 2" />
          </g>
        </svg>
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="qxd-badge border-gold-300/60 bg-ink-800/50 backdrop-blur text-gold-200 text-[10px]">
            v{t.version}
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-800/45 backdrop-blur text-[10px] text-gold-200">
          <Star className="w-3 h-3" fill="#F6CD70" color="#F6CD70" />
          {t.usageCount} 次使用
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 pt-6">
          <h3 className="font-song font-bold text-lg text-white text-shadow-gold drop-shadow-lg mb-1 leading-tight">{t.name}</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-gold-100/90">
            <span className="font-hei">{t.author}</span>
            <span>·</span>
            <span>更新于 {formatDate(t.versionDate)}</span>
          </div>
        </div>
        <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 border-2 border-gold-400 flex items-center justify-center text-cinnabar-700 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-gold-glow">
          <Eye className="w-5 h-5" />
        </button>
      </div>
      <div className="p-3.5">
        <p className="text-xs text-ink-500 leading-relaxed line-clamp-2 mb-2.5 min-h-[32px]">{t.description}</p>
        <div className="flex flex-wrap gap-1 mb-3 min-h-[22px]">
          {t.tags.slice(0, 3).map(tg => (
            <span key={tg} className="text-[10px] px-1.5 py-0.5 rounded border border-gold-200 bg-gold-50 text-gold-700">#{tg}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3" fill={i < t.complexity ? complexityColors[t.complexity] : 'none'} color={i < t.complexity ? complexityColors[t.complexity] : '#D5CEC3'} />
            ))}
          </div>
          <button onClick={onApply} className="qxd-btn-gold !py-1.5 !px-3 text-[11px]">
            套用 <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateDetailModal({ tpl, onClose, onApply }: { tpl: Template; onClose: () => void; onApply: () => void }) {
  const catName: Record<string, string> = { dragon: '龙凤呈祥', flora: '瑞花珍禽', cloud: '云水山川', figure: '仙佛人物', geo: '万字回纹', border: '花边边框' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-ink-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl grain-overlay relative"
           style={{ background: '#FBF7EE' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-ink-800/50 backdrop-blur text-white flex items-center justify-center hover:bg-cinnabar-700 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="grid md:grid-cols-5 max-h-[92vh] overflow-hidden">
          <div className="md:col-span-2 relative min-h-[280px] md:min-h-0 flex flex-col" style={{ background: tpl.coverImage }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.28) 0%,transparent 55%),linear-gradient(180deg,transparent 50%,rgba(44,24,16,0.85) 100%)' }} />
            <svg viewBox="0 0 200 260" className="flex-1 w-full h-full opacity-65 mix-blend-screen">
              <g stroke="#F6CD70" fill="none" strokeWidth="1" strokeLinecap="round">
                <path d="M100 60 C 140 30 180 70 170 130 C 160 190 120 230 100 210 C 80 230 40 190 30 130 C 20 70 60 30 100 60 Z" />
                <path d="M100 80 Q 130 60 140 110 Q 140 160 100 175 Q 60 160 60 110 Q 70 60 100 80 Z" strokeDasharray="4 3" />
                <circle cx="100" cy="130" r="18" />
              </g>
            </svg>
            <div className="relative p-5 pt-8 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="qxd-badge border-gold-300/50 bg-white/15 backdrop-blur text-gold-100">{catName[tpl.category] || tpl.category}</span>
                <span className="qxd-badge border-gold-300/50 bg-white/15 backdrop-blur text-gold-100">v{tpl.version}</span>
              </div>
              <h2 className="font-song text-2xl font-bold text-shadow-gold drop-shadow-lg mb-1">{tpl.name}</h2>
              <p className="text-xs text-gold-100/80">by {tpl.author} · 更新于 {formatDate(tpl.versionDate)}</p>
            </div>
          </div>

          <div className="md:col-span-3 overflow-y-auto scrollbar-thin p-5 md:p-6 bg-rice-100">
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {tpl.tags.map(tg => (
                <span key={tg} className="text-[11px] px-2 py-0.5 rounded-full border border-gold-300/60 bg-gold-50 text-gold-700 font-hei">#{tg}</span>
              ))}
              <div className="flex items-center gap-0.5 ml-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4" fill={i < tpl.complexity ? complexityColors[tpl.complexity] : 'none'} color={i < tpl.complexity ? complexityColors[tpl.complexity] : '#D5CEC3'} />
                ))}
              </div>
            </div>
            <p className="text-sm text-ink-600 leading-relaxed mb-5">{tpl.description}</p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { Icon: Layers, label: '分区数', val: tpl.patternScheme.zones.length, color: 'text-cinnabar-700' },
                { Icon: Gauge, label: '硬度', val: tpl.formula.hardnessIndex, color: 'text-emerald-600' },
                { Icon: Box, label: '堆叠', val: tpl.winding.stackingLayers.length + '层 / ' + tpl.winding.totalHeight + 'mm', color: 'text-gold-700' },
                { Icon: Sparkles, label: '线径', val: 'Φ ' + tpl.formula.threadDiameter + 'mm', color: 'text-cinnabar-700' },
                { Icon: Clock, label: '干燥', val: tpl.winding.dryingHours + ' h', color: 'text-ink-700' },
                { Icon: FileArchive, label: '使用', val: tpl.usageCount + ' 次', color: 'text-gold-700' },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-xl border border-gold-100 bg-white/70">
                  <div className="flex items-center gap-1 text-[10px] text-ink-400 mb-1">
                    <m.Icon className="w-3 h-3" /> {m.label}
                  </div>
                  <div className={clsx('font-song font-bold', m.color)}>{m.val}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-3.5 rounded-xl border border-gold-100 bg-gradient-to-br from-rice-50 to-white">
                <h4 className="font-song font-semibold text-sm text-ink-700 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cinnabar-700" /> 纹样分区方案
                </h4>
                <div className="space-y-1.5">
                  {tpl.patternScheme.zones.map(z => (
                    <div key={z.id} className="flex items-center gap-2 p-2 rounded-lg bg-rice-50/80 text-xs">
                      <span className="w-3 h-3 rounded shadow-sm" style={{ background: z.color }} />
                      <span className="font-song font-semibold text-ink-700 flex-1">{z.name}</span>
                      <span className="text-ink-400">第{z.layerOrder}层</span>
                      <span className={clsx('qxd-badge !py-0 text-[10px]',
                        z.priority === 'primary' ? 'border-cinnabar-300 bg-cinnabar-50 text-cinnabar-700'
                        : z.priority === 'secondary' ? 'border-gold-300 bg-gold-50 text-gold-700'
                        : 'border-ink-200 bg-ink-50 text-ink-500')}>
                        {({ primary: '主纹', secondary: '辅纹', background: '地纹' } as any)[z.priority]}
                      </span>
                      <span className="text-ink-400">{z.area} px²</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-gold-100 bg-gradient-to-br from-gold-50/60 to-rice-50">
                <h4 className="font-song font-semibold text-sm text-ink-700 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-gold-700" /> 推荐线料配方
                </h4>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { n: '漆料', v: tpl.formula.lacquerRatio, c: '#8B2323' },
                    { n: '桐油', v: tpl.formula.tungOilRatio, c: '#D4AF37' },
                    { n: '砖粉', v: tpl.formula.brickPowderRatio, c: '#8B7C6C' },
                    { n: '金粉', v: tpl.formula.goldPowderRatio, c: '#E7C75D' },
                    { n: '助剂', v: tpl.formula.otherAdditives, c: '#CB503B' },
                  ].map(m => (
                    <div key={m.n}>
                      <div className="h-20 w-full rounded-lg relative overflow-hidden bg-ink-50 border border-ink-100">
                        <div className="absolute bottom-0 left-0 right-0 transition-all" style={{ height: m.v + '%', background: m.c, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} />
                        <span className="absolute inset-0 flex items-end justify-center pb-1 text-[10px] font-bold text-white drop-shadow">{m.v}%</span>
                      </div>
                      <div className="text-[10px] text-ink-500 mt-1">{m.n}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-ink-500">硬度 <span className="font-semibold text-emerald-600">{tpl.formula.hardnessIndex}</span> · 可塑性 <span className="font-semibold text-cinnabar-700">{tpl.formula.plasticityIndex}</span></span>
                  <span className="text-gold-700 font-semibold">线径 Φ{tpl.formula.threadDiameter}mm</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-gold-100/70 sticky bottom-0 bg-rice-100 -mx-5 md:-mx-6 px-5 md:px-6 pb-1">
              <button onClick={onApply} className="qxd-btn-primary flex-1 py-3 text-base shadow-lacquer">
                <Sparkles className="w-4 h-4" /> 套用此模板开始创作
              </button>
              <button className="qxd-btn-gold py-3"><Download className="w-4 h-4" /> 下载方案</button>
              <button className="qxd-btn-ghost py-3"><Eye className="w-4 h-4" /> 预览</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
