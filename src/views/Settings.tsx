import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { logActivity } from '../lib/activity';
import { db } from '../lib/firebase';
import { Fingerprint, Cloud, Download, Moon, Languages, Bell } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function SettingsView() {
  const { appUser, updateAppUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const [exporting, setExporting] = useState(false);

  if (!appUser) return null;

  const handleToggle = async (field: 'biometricEnabled' | 'cloudBackupEnabled' | 'notificationsEnabled') => {
    const newValue = !appUser[field];
    await updateAppUser({ [field]: newValue });
    logActivity(db, appUser.uid, `Toggled ${field} to ${newValue}`);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('senderId', '==', appUser.uid));
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => doc.data());
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "cipherchat_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      logActivity(db, appUser.uid, 'Exported data');
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{t('settings')}</h1>
      
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          {appUser.photoURL ? (
            <img src={appUser.photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500">
              {appUser.displayName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{appUser.displayName}</h2>
            <p className="text-slate-500 dark:text-slate-400">{appUser.email}</p>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{t('theme')}</span>
            </div>
            <select 
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value as any);
                updateAppUser({ theme: e.target.value as any });
              }}
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{t('language')}</span>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Notifications</span>
            </div>
            <button 
              onClick={() => handleToggle('notificationsEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative ${appUser.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${appUser.notificationsEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{t('biometric')}</span>
            </div>
            <button 
              onClick={() => handleToggle('biometricEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative ${appUser.biometricEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${appUser.biometricEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{t('cloudBackup')}</span>
            </div>
            <button 
              onClick={() => handleToggle('cloudBackupEnabled')}
              className={`w-12 h-6 rounded-full transition-colors relative ${appUser.cloudBackupEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${appUser.cloudBackupEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{t('exportData')}</span>
            </div>
            <button 
              onClick={handleExportData}
              disabled={exporting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
