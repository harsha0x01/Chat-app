import { MessageSquare, Activity, BarChart2, Settings, LogOut, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { cn } from '../lib/utils';
import { logActivity } from '../lib/activity';
import { db } from '../lib/firebase';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { appUser, logOut } = useAuth();
  const { t } = useI18n();

  const handleLogout = async () => {
    if (appUser) await logActivity(db, appUser.uid, 'Logged out');
    await logOut();
  };

  const isAdmin = appUser?.email === 'pharshavardhan201@gmail.com';

  const navItems = [
    { id: 'chats', icon: MessageSquare, label: t('chats') },
    { id: 'activity', icon: Activity, label: t('activity') },
    { id: 'analytics', icon: BarChart2, label: t('analytics') },
    ...(isAdmin ? [{ id: 'directory', icon: Users, label: 'Directory' }] : []),
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="w-20 md:w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center md:items-stretch py-6 px-2 md:px-4 transition-colors">
      <div className="flex items-center gap-3 px-2 mb-10 text-emerald-600 dark:text-emerald-400">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <MessageSquare className="w-6 h-6" />
        </div>
        <span className="hidden md:block font-bold text-xl tracking-tight">CipherChat</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
              currentView === item.id 
                ? "bg-slate-200 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-medium" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
          title={t('logout')}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden md:block">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
