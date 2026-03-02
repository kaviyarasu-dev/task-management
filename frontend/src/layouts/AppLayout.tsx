import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileSidebar } from './components/MobileSidebar';
import { SkipLink } from '@/shared/components/SkipLink';
import { cn } from '@/shared/lib/utils';

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <SkipLink />

      {/* Desktop Sidebar */}
      <nav className="hidden lg:block" aria-label="Main navigation">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </nav>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-col transition-all duration-300',
          isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main id="main-content" className="flex-1 p-4 lg:p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
