import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { DashboardSidebar } from './DashboardSidebar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DashboardSidebar />
      <main className="pt-16 pl-60 min-h-screen transition-all duration-300">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
