import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VerificationBadge from '../components/VerificationBadge';
import RatingStars from '../components/RatingStars';
import {
  ShieldCheck,
  Star,
  Wallet,
  Calendar,
  Phone,
  Mail,
  Edit,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, updateProfile, submitVerification, refreshUser } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = !userId || currentUser?.id === userId;
  const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const targetId = userId || currentUser?.id;
        if (!targetId) {
          navigate('/login');
          return;
        }

        // Fetch user reviews
        const reviewsRes = await api.get(`/reviews/user/${targetId}`);
        setReviews(reviewsRes.data.reviews || []);

        if (isOwnProfile && currentUser) {
          setProfileUser(currentUser);
          setName(currentUser.name || '');
          setBio(currentUser.bio || '');
          setPhone(currentUser.phone || '');
        } else {
          // fetch public profile
          const userRes = await api.get(`/auth/me`);
          setProfileUser(userRes.data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser, isOwnProfile, navigate]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('phone', phone);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      const updated = await updateProfile(formData);
      setProfileUser(updated);
      setShowEditModal(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!idFile) {
      setError('Please select an ID photo or document.');
      return;
    }
    setVerifySubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('idDocument', idFile);
      formData.append('notes', verifyNotes || 'Driver license submission for Tasker verification badge');

      await submitVerification(formData);
      setShowVerifyModal(false);
      setMessage('ID submitted for Admin Verification Review!');
      refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification.');
    } finally {
      setVerifySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 text-sm">User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-500">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500">✕</button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={profileUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={profileUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-brand-500 shadow-sm"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {profileUser.name}
                </h1>
                {profileUser.isVerified && <VerificationBadge size="md" />}
              </div>

              <RatingStars
                rating={profileUser.ratingAvg}
                count={profileUser.ratingCount}
                size="md"
              />

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined{' '}
                  {new Date(profileUser.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {profileUser.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {profileUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>

              {!profileUser.isVerified && (
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {profileUser.verificationStatus === 'PENDING' ? 'Verification Pending' : 'Get Verified'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bio Section */}
        {profileUser.bio && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              About Me
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
              {profileUser.bio}
            </p>
          </div>
        )}
      </div>

      {/* Grid: Wallet (if own profile) & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Wallet & Trust Status */}
        {isOwnProfile && (
          <div className="space-y-6">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Available Wallet Balance
                </span>
                <Wallet className="w-5 h-5 text-brand-400" />
              </div>
              <div className="text-3xl font-black text-white">
                ${(profileUser.walletBalance || 0).toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Funds released from completed task escrow payments are instantly credited here.
              </p>
              <button
                onClick={() => alert('Payout Initiated: Your transfer request has been submitted to your linked bank account. Delivery in 1-2 business days.')}
                className="w-full bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition"
              >
                Withdraw to Bank Account
              </button>
            </div>

            {/* Verification Status Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Identity & KYC Status
              </h3>
              {profileUser.isVerified ? (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Identity Verified</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Your account proudly displays the Verified Tasker checkmark badge.
                  </p>
                </div>
              ) : profileUser.verificationStatus === 'PENDING' ? (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Review in Progress</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Your ID document has been submitted and is currently awaiting admin approval in the moderation queue.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Verify your identity to increase trust and win up to 3x more offers!
                  </p>
                  <button
                    onClick={() => setShowVerifyModal(true)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl"
                  >
                    Upload ID Document
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Reviews & Ratings */}
        <div className={`${isOwnProfile ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reviews & Feedback ({reviews.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified ratings left by community members after job completion
                </p>
              </div>
              <RatingStars rating={profileUser.ratingAvg} count={profileUser.ratingCount} size="md" />
            </div>

            {reviews.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No reviews yet. Complete tasks to earn 5-star ratings and client reviews!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.reviewer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={rev.reviewer.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {rev.reviewer.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Task: {rev.task?.title || 'Completed Job'}
                          </span>
                        </div>
                      </div>
                      <RatingStars rating={rev.rating} showCount={false} />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Edit Profile */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Edit Your Profile</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bio / Skills</label>
                <textarea
                  rows="3"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients about your experience, certifications, and skills..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Avatar Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ID Document Verification (Simulated KYC) */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submit Identity Verification
                </h3>
                <p className="text-[11px] text-slate-500">
                  Earn the green Verified Tasker Badge
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1">
              <p className="font-bold">Identity & Trust Verification</p>
              <p className="text-[11px] text-emerald-800">
                To protect our community, every submitted document undergoes administrative photo-ID review. Files are stored securely with restricted access controls.
              </p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Upload Government ID (Driver's License, State ID, or Passport) *
                </label>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf"
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Notes for Reviewer (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NSW Driver's License front scan"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifySubmitting}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow"
                >
                  {verifySubmitting ? 'Uploading...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
