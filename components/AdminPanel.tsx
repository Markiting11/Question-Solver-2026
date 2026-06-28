import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { Check, Trash2, UserX, ToggleLeft as ToggleOff, ToggleRight as ToggleOn } from 'lucide-react';
import { 
  subscribeToUsers, 
  updateUserStatusInDb, 
  deleteUserFromDb,
  fetchPlatformConfig,
  updatePlatformConfig
} from '../services/firebase';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState({ allowSignup: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to users real-time
    const unsubscribe = subscribeToUsers(
      (updatedUsers) => {
        setUsers(updatedUsers);
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing to users:", err);
        setError("Missing or insufficient permissions. Please check that you are logged in as Arshad2097@gmail.com.");
        setLoading(false);
      }
    );

    // Fetch config
    fetchPlatformConfig()
      .then(cfg => setConfig(cfg))
      .catch(err => console.error("Error fetching config:", err));

    return () => unsubscribe();
  }, []);

  const toggleSignup = async () => {
    try {
      const newValue = !config.allowSignup;
      setConfig({ allowSignup: newValue });
      await updatePlatformConfig(newValue);
    } catch (err) {
      console.error("Error updating config:", err);
    }
  };

  const updateUserStatus = async (user: User, status: UserStatus) => {
    if (!user.uid) return;
    try {
      await updateUserStatusInDb(user.uid, status);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const deleteUser = async (user: User) => {
    if (!user.uid) return;
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await deleteUserFromDb(user.uid);
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading user list...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-8 max-w-5xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-slate-500">Manage user approvals and platform settings securely via Firestore.</p>
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
                  <tr key={user.uid || user.email} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">
                          {user.name.charAt(0).toUpperCase()}
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
                            onClick={() => updateUserStatus(user, 'approved')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {user.status !== 'rejected' && (
                          <button 
                            onClick={() => updateUserStatus(user, 'rejected')}
                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                            title="Reject"
                          >
                            <UserX size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteUser(user)}
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
