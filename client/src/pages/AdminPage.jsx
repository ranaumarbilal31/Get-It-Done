import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerificationBadge from '../components/VerificationBadge';
import {
  Users,
  CheckCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Protect Admin route
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, verifyRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/verifications/pending'),
        api.get('/admin/users?limit=50'),
      ]);
      setStats(statsRes.data.stats);
      setPendingVerifications(verifyRes.data.pendingUsers || []);
      setUsersList(usersRes.data.users || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const handleVerifyAction = async (userId, status, notes) => {
    try {
      await api.patch(`/admin/verifications/${userId}`, { status, notes });
      setActionSuccess(`User verification updated to ${status}!`);
      loadAdminData();
    } catch (err) {
      alert('Failed to update verification status.');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setActionSuccess(`User role updated to ${newRole}!`);
      loadAdminData();
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading admin control center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Administration & Trust Moderation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trust & Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulate manual identity KYC verification reviews and oversee platform escrow transactions.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-500">✕</button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
            <span className="text-[11px] text-slate-400">Posters & Taskers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Tasks</span>
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalTasks}</div>
            <span className="text-[11px] text-blue-600 font-semibold">
              {stats.completedTasks} Completed
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Escrow Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              ${(stats.escrowHeld + stats.totalReleased).toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              ${stats.escrowHeld.toFixed(2)} currently in Escrow
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">KYC Queue</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              {stats.pendingVerifications}
            </div>
            <span className="text-[11px] text-slate-400">Pending approval</span>
          </div>
        </div>
      )}

      {/* SECTION 1: Pending Identity Verification Queue (Mock KYC) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Identity Verification Queue (Mock KYC Review)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect submitted photo IDs and approve the official green "Verified Tasker" badge.
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
            {pendingVerifications.length} Pending
          </span>
        </div>

        {pendingVerifications.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
            No pending ID verifications in queue. All submissions have been processed!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingVerifications.map((pUser) => (
              <div
                key={pUser.id}
                className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={pUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={pUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{pUser.name}</h3>
                    <span className="text-xs text-slate-500">{pUser.email}</span>
                    <p className="text-[11px] text-slate-600 mt-1 italic">
                      Notes: "{pUser.verificationNotes || 'No notes provided'}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {pUser.idDocument && (
                    <button
                      onClick={() => setSelectedDoc(pUser.idDocument)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Uploaded ID
                    </button>
                  )}

                  <button
                    onClick={() => handleVerifyAction(pUser.id, 'APPROVED', 'Verified by Admin')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve ID
                  </button>

                  <button
                    onClick={() => handleVerifyAction(pUser.id, 'REJECTED', 'Document blurry or unverified')}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: User Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Registered Platform Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-900 uppercase tracking-wider font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Trust Status</th>
                <th className="p-3">Wallet</th>
                <th className="p-3">Rating</th>
                <th className="p-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="p-3 flex items-center gap-2">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">{u.name}</span>
                      <span className="text-[10px] text-slate-400">{u.email}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.isVerified ? (
                      <VerificationBadge size="sm" />
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Unverified</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-slate-900">
                    ${(u.walletBalance || 0).toFixed(2)}
                  </td>
                  <td className="p-3">
                    {u.ratingAvg > 0 ? `${u.ratingAvg} ★ (${u.ratingCount})` : 'No reviews'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className="text-[11px] text-brand-600 hover:underline font-semibold"
                    >
                      Toggle {u.role === 'ADMIN' ? 'User' : 'Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ID Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Submitted ID Document Preview</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96 flex items-center justify-center bg-slate-100">
              <img src={selectedDoc} alt="User ID Document" className="w-full h-auto object-contain" />
            </div>
            <div className="text-right">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
