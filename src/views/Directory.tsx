import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User as AppUser } from '../types';
import { Users, Mail } from 'lucide-react';

export function DirectoryView() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersData = snapshot.docs.map(doc => doc.data() as AppUser);
        setUsers(usersData);
      } catch (e) {
        console.error("Failed to fetch users", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Directory</h1>
      </div>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Manage and view all registered users in the application.
      </p>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading directory...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider">Language</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider">Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                            {user.displayName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{user.displayName}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{user.uid.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 uppercase text-sm font-medium">
                      {user.language}
                    </td>
                    <td className="px-6 py-4">
                      {user.biometricEnabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Biometrics On
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                          Password Only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
