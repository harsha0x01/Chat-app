import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { ActivityLog } from '../types';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

export function ActivityFeed() {
  const { appUser } = useAuth();
  const { t } = useI18n();
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (!appUser) return;
    const q = query(
      collection(db, 'activity'),
      where('userId', '==', appUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setLogs(newLogs);
    });

    return unsubscribe;
  }, [appUser]);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{t('activity')}</h1>
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No recent activity found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-6 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="mt-1 bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 dark:text-slate-100 font-medium">{log.action}</p>
                  {log.details && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{log.details}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {format(log.timestamp, 'PPpp')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
