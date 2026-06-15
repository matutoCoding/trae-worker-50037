import { Layers, Circle, AlertTriangle, Clock, TrendingUp, ChevronRight, Sparkles, Crown } from 'lucide-react';
import { useQxdStore } from '@/store/useQxdStore';
import { formatDate } from '@/utils/calculations';
import type { PageKey } from '@/types';
import { clsx } from 'clsx';

const entryCards: { key: PageKey; title: string; sub: string; color: string; icon: any; metric: string; hint: string }[] = [
  { key: 'pattern', title: '纹样解析', sub: '规划盘绕走向与层次', color: 'from-rose-600 to-red-900', icon: Layers, metric: '4 分区方案', hint: '从导入纹样图片开始' },
  { key: 'thread', title: '线料搓制', sub: '配比软硬·偏差预警', color: 'from-amber-500 to-yellow-800', icon: Circle, metric: '硬度 72 / 安全', hint: '调整漆料/桐油/砖粉比例' },
  { key: 'winding', title: '盘绕造型', sub: '密度堆叠·光影模拟', color: 'from-slate-600 to-stone-900', icon: Sparkles, metric: '总高 9.4mm', hint: '查看立体层次与贴金效果' },
];

export default function Dashboard() {
  const { works, templates, setPage, updateWork } = useQxdStore();
  const inProgress = works.filter(w => w.status === 'in-progress');
  const completed = works.filter(w => w.status === 'completed');
  const totalAlerts = works.reduce((s, w) => s + w.alerts.filter(a => !a.resolved).length, 0);
  const highAlerts = works.reduce((s, w) => s + w.alerts.filter(a => !a.resolved && a.severity === 'high').length, 0);
  const totalHours = works.reduce((s, w) => s + w.steps.reduce((a, st) => st.status === 'done' ? a + st.durationHours : a, 0), 0);

  return (
    <div className="space-y-6">
      <section className="qxd-panel p-6 huiwen-border grain-overlay relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full opacity-[0.08] pointer-events-none"
             style={{ background: 'radial-gradient(circle,#D4AF37 0%,transparent 70%)' }} />
        <div className="absolute -left-10 bottom-0 w-[220px] h-[220px] rounded-full opacity-[0.07] pointer-events-none"
             style={{ background: 'radial-gradient(circle,#8B2323 0%,transparent 70%)' }} />
        <div className="relative flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-gold-500" />
              <span className="qxd-badge border-gold-300 bg-gold-50 text-gold-700">非遗传承 · 大师工坊</span>
            </div>
            <h2 className="font-song text-2xl md:text-3xl font-semibold text-ink-800 mb-2">
              匠心独运，<span className="text-cinnabar-700">以线载道</span>
            </h2>
            <p className="text-ink-500 max-w-2xl leading-relaxed">
              欢迎使用漆线雕数字化工艺生产力系统。从纹样解析、线料搓制、盘绕造型到工艺归档，
              为您提供全流程可量化、可追溯、可复用的非遗传承工具。
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <button className="qxd-btn-primary" onClick={() => setPage('pattern')}>
                <Sparkles className="w-4 h-4" /> 开启新创作
              </button>
              <button className="qxd-btn-gold" onClick={() => setPage('templates')}>
                <ChevronRight className="w-4 h-4" /> 浏览模板库
              </button>
              <button className="qxd-btn-ghost" onClick={() => setPage('archive')}>
                <Clock className="w-4 h-4" /> 查看工艺档案
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-3 w-full lg:w-auto">
            {[
              { label: '在制作品', val: inProgress.length, color: 'text-cinnabar-700', bg: 'from-cinnabar-50 to-rose-50', bd: 'border-cinnabar-200' },
              { label: '已完成', val: completed.length, color: 'text-emerald-700', bg: 'from-emerald-50 to-green-50', bd: 'border-emerald-200' },
              { label: '模板总数', val: templates.length, color: 'text-gold-700', bg: 'from-gold-50 to-amber-50', bd: 'border-gold-300' },
              { label: '累计工时', val: totalHours + 'h', color: 'text-ink-700', bg: 'from-ink-50 to-rice-100', bd: 'border-ink-200' },
            ].map(m => (
              <div key={m.label} className={clsx('rounded-xl border p-3.5 bg-gradient-to-br', m.bd, m.bg)}>
                <p className="text-xs text-ink-400 mb-1">{m.label}</p>
                <p className={clsx('font-song text-2xl font-bold', m.color)}>{m.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {highAlerts > 0 && (
        <div className="risk-card flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-warn-danger text-white flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-song font-semibold text-warn-danger mb-1">风险预警 · {highAlerts} 条高优先级待处理</h3>
            <p className="text-sm text-ink-600">
              共有 {totalAlerts} 条未解决工艺预警。部分作品线料存在失水变脆、盘绕断裂的高风险，请及时检查干燥状态并采取补救措施。
            </p>
            <button className="mt-2 text-sm font-medium text-cinnabar-700 underline underline-offset-2 hover:text-cinnabar-800" onClick={() => setPage('archive')}>
              前往工艺档案排查 →
            </button>
          </div>
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-5">
        {entryCards.map(c => (
          <button key={c.key} onClick={() => setPage(c.key)}
            className="group text-left qxd-panel p-5 huiwen-border hover:-translate-y-1 hover:shadow-gold-glow transition-all duration-300 relative overflow-hidden">
            <div className={clsx('absolute top-0 right-0 w-32 h-32 opacity-[0.09] rounded-full -translate-y-1/3 translate-x-1/3 bg-gradient-to-br', c.color)} />
            <div className="relative">
              <div className={clsx('w-12 h-12 rounded-xl mb-4 text-white flex items-center justify-center shadow-lacquer bg-gradient-to-br', c.color)}>
                <c.icon className="w-6 h-6" strokeWidth={2} />
              </div>
              <h3 className="font-song text-lg font-semibold text-ink-800 mb-1 group-hover:text-cinnabar-700 transition-colors">
                {c.title}
                <ChevronRight className="w-4 h-4 inline-block ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-ink-500 mb-4">{c.sub}</p>
              <div className="flex items-center justify-between">
                <span className="qxd-badge border-gold-300/60 bg-gold-50/80 text-gold-700">{c.metric}</span>
                <span className="text-xs text-ink-400">{c.hint}</span>
              </div>
            </div>
          </button>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar">
            <div className="title-icon"><Clock className="w-4 h-4" /></div>
            <h2>最近作品动态</h2>
            <span className="ml-auto text-xs text-ink-400">共 {works.length} 件作品</span>
          </div>
          <div className="space-y-3">
            {works.slice(0, 5).map(w => {
              const openAlerts = w.alerts.filter(a => !a.resolved).length;
              const statusMap: Record<string, { label: string; cls: string }> = {
                'draft': { label: '草稿', cls: 'border-ink-200 bg-ink-50 text-ink-500' },
                'in-progress': { label: '制作中', cls: 'border-cinnabar-300 bg-cinnabar-50 text-cinnabar-700' },
                'completed': { label: '已完成', cls: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
                'archived': { label: '已归档', cls: 'border-gold-300 bg-gold-50 text-gold-700' },
              };
              const s = statusMap[w.status];
              return (
                <div key={w.id} className="group flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-gold-200 hover:bg-rice-100/60 transition-colors cursor-pointer"
                     onClick={() => { updateWork(w.id, {}); setPage('archive'); }}>
                  <div className="w-14 h-14 rounded-lg flex-shrink-0 shadow-panel grain-overlay" style={{ background: w.thumbnail }}>
                    <div className="w-full h-full rounded-lg" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.25) 0%,transparent 60%)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-song font-semibold text-ink-700 truncate group-hover:text-cinnabar-700">{w.name}</h4>
                      <span className={clsx('qxd-badge', s.cls)}>{s.label}</span>
                      {openAlerts > 0 && <span className="qxd-badge border-warn-danger/60 bg-warn-danger/10 text-warn-danger">⚠ {openAlerts}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-400">
                      <span>更新于 {formatDate(w.updatedAt)}</span>
                      <span>·</span>
                      <span>工序 {w.steps.filter(st => st.status === 'done').length}/{w.steps.length}</span>
                    </div>
                  </div>
                  <div className="hidden sm:block w-24 h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cinnabar-500 to-gold-500"
                         style={{ width: w.steps.length ? `${(w.steps.filter(st => st.status === 'done').length / w.steps.length) * 100}%` : '0%' }} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-cinnabar-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        </section>

        <section className="qxd-panel p-5 huiwen-border">
          <div className="qxd-title-bar">
            <div className="title-icon"><TrendingUp className="w-4 h-4" /></div>
            <h2>模板热门榜</h2>
          </div>
          <div className="space-y-3">
            {[...templates].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5).map((t, i) => (
              <button key={t.id} onClick={() => setPage('templates')}
                className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-rice-100 transition-colors group">
                <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center font-song font-bold text-sm',
                  i === 0 ? 'bg-gold-gradient text-ink-800 shadow-gold-glow' :
                  i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                  i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                  'bg-ink-100 text-ink-500')}>
                  {i + 1}
                </div>
                <div className="w-10 h-10 rounded-md shadow-panel grain-overlay flex-shrink-0" style={{ background: t.coverImage }} />
                <div className="flex-1 min-w-0">
                  <p className="font-song font-medium text-sm text-ink-700 truncate group-hover:text-cinnabar-700">{t.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-ink-400">
                    <span>★★★★★</span>
                    <span>·</span>
                    <span>{t.usageCount} 次使用</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setPage('templates')}
            className="w-full mt-4 py-2.5 rounded-lg border border-dashed border-gold-300 text-gold-700 font-song text-sm hover:bg-gold-50 hover:border-gold-400 transition-colors">
            查看全部 {templates.length} 个模板 →
          </button>
        </section>
      </div>
    </div>
  );
}
