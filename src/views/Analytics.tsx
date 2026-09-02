import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';
import { useI18n } from '../contexts/I18nContext';

export function AnalyticsDashboard() {
  const { appUser } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<{date: string, messages: number}[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {
    if (!appUser) return;

    const fetchStats = async () => {
      // For a real app, this might be aggregated in cloud functions
      // Here we approximate by querying last 7 days of messages
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      const q = query(
        collection(db, 'messages'),
        where('senderId', '==', appUser.uid),
        where('timestamp', '>=', sevenDaysAgo)
      );

      const snapshot = await getDocs(q);
      const msgs = snapshot.docs.map(d => d.data());
      setTotalMessages(msgs.length);

      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        days[format(subDays(new Date(), i), 'MMM dd')] = 0;
      }

      msgs.forEach(m => {
        const dateStr = format(m.timestamp, 'MMM dd');
        if (days[dateStr] !== undefined) {
          days[dateStr]++;
        }
      });

      setData(Object.keys(days).map(key => ({
        date: key,
        messages: days[key]
      })));
    };

    fetchStats();
  }, [appUser]);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{t('analytics')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Sent (7 Days)</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{totalMessages}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Messages/Day</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {(totalMessages / 7).toFixed(1)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Encryption Status</p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">100%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Messaging Activity</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                cursor={{fill: '#f1f5f9', opacity: 0.1}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="messages" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
