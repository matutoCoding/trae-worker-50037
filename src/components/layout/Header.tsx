import { Scroll, Paintbrush, Circle, Layers, FileArchive, Library, Home, Bell, User } from 'lucide-react';
import { useQxdStore } from '@/store/useQxdStore';
import type { PageKey } from '@/types';
import { clsx } from 'clsx';

interface NavItem { key: PageKey; label: string; Icon: any; hint?: string; }
const navItems: NavItem[] = [
  { key: 'dashboard', label: '总览', Icon: Home, hint: '仪表盘' },
  { key: 'pattern', label: '纹样解析', Icon: Scroll, hint: '导入·分区·走向' },
  { key: 'thread', label: '线料搓制', Icon: Circle, hint: '配比·软硬·预警' },
  { key: 'winding', label: '盘绕造型', Icon: Paintbrush, hint: '密度·堆叠·光影' },
  { key: 'archive', label: '工艺档案', Icon: FileArchive, hint: '作品·记录·追溯' },
  { key: 'templates', label: '模板库', Icon: Library, hint: '经典·检索·复用' },
];

export default function Header() {
  const { currentPage, setPage, works } = useQxdStore();
  const unresolvedAlerts = works.reduce((s, w) => s + w.alerts.filter(a => !a.resolved).length, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-gold-200/60 bg-rice-50/85 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-6 h-[68px] flex items-center gap-6">
        <div className="flex items-center gap-3 pr-5 border-r border-gold-200/50">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lacquer"
               style={{ background: 'linear-gradient(135deg,#BE3A2B 0%,#8B2323 60%,#4A1010 100%)' }}>
            <Layers className="w-5 h-5 text-gold-300" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <h1 className="font-song text-lg font-semibold text-ink-700 text-shadow-gold">漆线雕工艺工坊</h1>
            <p className="text-[11px] text-ink-400 font-hei tracking-wider">QIANXIAN DIAO · 非遗数字化生产力系统</p>
          </div>
        </div>

        <nav className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {navItems.map(({ key, label, Icon, hint }) => {
            const active = currentPage === key;
            return (
              <button key={key} onClick={() => setPage(key)}
                className={clsx(
                  'group relative px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2',
                  active
                    ? 'text-white shadow-cinnabar-glow'
                    : 'text-ink-500 hover:text-cinnabar-700 hover:bg-rice-100'
                )}
                style={active ? { background: 'linear-gradient(135deg,#D45D4C 0%,#8B2323 55%,#6E1B1B 100%)' } : undefined}>
                <Icon className={clsx('w-4.5 h-4.5 transition-transform', active ? 'text-gold-300' : 'group-hover:scale-110')} strokeWidth={2} />
                <span className="font-song font-medium text-[15px]">{label}</span>
                {active && (
                  <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold-400 shadow-gold-glow" />
                )}
                {hint && !active && (
                  <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none text-[10px] bg-ink-700 text-gold-100 px-2 py-0.5 rounded whitespace-nowrap z-50 transition-opacity">{hint}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 pl-4 border-l border-gold-200/50">
          <button className="relative w-9 h-9 rounded-lg border border-gold-200 bg-rice-100 flex items-center justify-center text-ink-500 hover:text-cinnabar-700 hover:border-cinnabar-400 transition-colors">
            <Bell className="w-4 h-4" />
            {unresolvedAlerts > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-warn-danger text-white text-[10px] font-bold flex items-center justify-center border-2 border-rice-50">
                {unresolvedAlerts}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 pl-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-panel"
                 style={{ background: 'linear-gradient(135deg,#D4AF37,#B89127 60%,#7C5A20)' }}>
              <User className="w-4 h-4" />
            </div>
            <div className="leading-tight hidden md:block">
              <p className="font-song font-semibold text-sm text-ink-700">工艺师</p>
              <p className="text-[11px] text-ink-400">高级传承人</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
