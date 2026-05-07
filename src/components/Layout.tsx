import { Link, useLocation } from 'react-router-dom';
import { Home, FileSpreadsheet, ClipboardList, History, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Início', path: '/', icon: Home },
    { name: 'Importar CSV', path: '/import', icon: FileSpreadsheet },
    { name: 'Contagem Farmacêutico', path: '/pharmacist-count', icon: ClipboardList },
    { name: 'Contagem Diária', path: '/count', icon: ClipboardList },
    { name: 'Histórico', path: '/history', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden bg-brand-purple text-white p-4 flex justify-between items-center shadow-lg relative z-20">
        <h1 className="font-bold text-lg">FarmaControl</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu />
        </button>
      </div>

      <div className={cn(
        "fixed inset-y-0 left-0 bg-brand-purple text-white w-64 flex flex-col z-10 transition-transform duration-300 md:relative md:translate-x-0 hidden md:flex",
        isSidebarOpen ? "translate-x-0 flex" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/10 hidden md:block text-center">
          <img src="/logo.png" alt="Logo" className="h-12 mx-auto object-contain bg-white rounded-lg p-1 mb-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <h1 className="font-bold text-2xl tracking-tight">FarmaControl</h1>
          <p className="text-white/80 text-sm mt-1">{user?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-16 md:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-colors font-medium",
                  isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"
                )}
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-white/70 hover:bg-white/10 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto h-[calc(100vh-60px)] md:h-screen overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
