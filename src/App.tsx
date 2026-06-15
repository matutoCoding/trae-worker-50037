import Header from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import PatternPage from '@/pages/pattern/PatternPage';
import ThreadPage from '@/pages/thread/ThreadPage';
import WindingPage from '@/pages/winding/WindingPage';
import ArchivePage from '@/pages/archive/ArchivePage';
import TemplatesPage from '@/pages/templates/TemplatesPage';
import { useQxdStore } from '@/store/useQxdStore';
import { clsx } from 'clsx';

export default function App() {
  const { currentPage } = useQxdStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'pattern': return <PatternPage />;
      case 'thread': return <ThreadPage />;
      case 'winding': return <WindingPage />;
      case 'archive': return <ArchivePage />;
      case 'templates': return <TemplatesPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={clsx('flex-1 w-full', 'max-w-[1440px] mx-auto px-6 py-5')}>
        {renderPage()}
      </main>
      <footer className="mt-8 border-t border-gold-200/50 bg-rice-100/50 py-5">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white"
                 style={{ background: 'linear-gradient(135deg,#BE3A2B,#8B2323)' }}>漆</div>
            <span className="font-song font-semibold text-ink-500">漆线雕工艺生产力系统</span>
            <span>·</span>
            <span>Qianxian Diao Craft Digital Workbench</span>
          </div>
          <div className="flex items-center gap-4">
            <span>非遗数字化传承 · 匠心独运 以线载道</span>
            <span>© 2026 v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
