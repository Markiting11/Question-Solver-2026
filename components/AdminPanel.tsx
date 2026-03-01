
import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { Check, X, Trash2, UserPlus, Shield, UserX, ToggleLeft as ToggleOff, ToggleRight as ToggleOn } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState({ allowSignup: true });

  useEffect(() => {
    const savedUsers = localStorage.getItem('sqs_users');
    const savedConfig = localStorage.getItem('sqs_config');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, []);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem('sqs_users', JSON.stringify(updatedUsers));
  };

  const toggleSignup = () => {
    const newConfig = { ...config, allowSignup: !config.allowSignup };
    setConfig(newConfig);
    localStorage.setItem('sqs_config', JSON.stringify(newConfig));
  };

  const updateUserStatus = (email: string, status: UserStatus) => {
    const updated = users.map(u => u.email === email ? { ...u, status } : u);
    saveUsers(updated);
  };

  const deleteUser = (email: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      saveUsers(users.filter(u => u.email !== email));
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="animate-fade-in-up space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-slate-500">Manage user approvals and platform settings.</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
          <span className="text-sm font-bold text-slate-700">Public Signup</span>
          <button onClick={toggleSignup} className="text-indigo-600 transition-transform active:scale-95">
            {config.allowSignup ? <ToggleOn size={48} /> : <ToggleOff size={48} className="text-slate-400" />}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No registered users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.email} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {user.status !== 'approved' && (
                          <button 
                            onClick={() => updateUserStatus(user.email, 'approved')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {user.status !== 'rejected' && (
                          <button 
                            onClick={() => updateUserStatus(user.email, 'rejected')}
                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                            title="Reject"
                          >
                            <UserX size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteUser(user.email)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
