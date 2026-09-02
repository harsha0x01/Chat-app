/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './views/Chat';
import { ActivityFeed } from './views/ActivityFeed';
import { AnalyticsDashboard } from './views/Analytics';
import { SettingsView } from './views/Settings';
import { DirectoryView } from './views/Directory';
import { MessageSquare, Lock } from 'lucide-react';

function AppContent() {
  const { user, appUser, loading, signIn } = useAuth();
  const [currentView, setCurrentView] = useState('chats');

  const isAdmin = appUser?.email === 'pharshavardhan201@gmail.com';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !appUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-700">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <MessageSquare className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">CipherChat</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Secure, decentralized messaging. Your conversations are end-to-end encrypted and completely private.
          </p>
          
          <button 
            onClick={signIn}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Sign in with Google
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            End-to-End Encrypted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden selection:bg-emerald-500/30">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex overflow-hidden">
        {currentView === 'chats' && <ChatView />}
        {currentView === 'activity' && <ActivityFeed />}
        {currentView === 'analytics' && <AnalyticsDashboard />}
        {currentView === 'directory' && isAdmin && <DirectoryView />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
