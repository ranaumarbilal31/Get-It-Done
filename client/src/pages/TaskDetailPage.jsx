import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import VerificationBadge from '../components/VerificationBadge';
import RatingStars from '../components/RatingStars';
import EscrowBadge from '../components/EscrowBadge';
import MapPicker from '../components/MapPicker';
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  Lock,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Star,
  Trash2,
} from 'lucide-react';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected, joinTask, leaveTask, sendMessage, startTyping, stopTyping } = useSocket();

  const [task, setTask] = useState(null);
  const [offers, setOffers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'chat'
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);

  // Modals state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  const [showAcceptModal, setShowAcceptModal] = useState(null); // Selected offer to accept
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const chatBottomRef = useRef(null);

  // Load Task & Offers
  const fetchTaskDetails = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
      setOffers(res.data.task.offers || []);
    } catch (err) {
      console.error('Failed to load task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Messages
  const fetchMessages = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/messages/task/${id}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
    fetchMessages();
  }, [id, user]);

  // Socket.IO Room Joining & Message Listeners
  useEffect(() => {
    if (!socket || !id) return;

    joinTask(id);

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    const handleUserTyping = ({ userName }) => {
      setTypingUser(userName);
    };

    const handleUserStoppedTyping = () => {
      setTypingUser(null);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      leaveTask(id);
    };
  }, [socket, id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Submit Offer
  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setOfferSubmitting(true);
    setActionError('');
    try {
      await api.post(`/offers/task/${id}`, {
        amount: offerAmount,
        message: offerMessage,
      });
      setShowOfferModal(false);
      setOfferAmount('');
      setOfferMessage('');
      setActionSuccess('Your offer has been submitted successfully!');
      fetchTaskDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to submit offer.');
    } finally {
      setOfferSubmitting(false);
    }
  };

  // Accept Offer with Simulated Escrow
  const handleAcceptOfferConfirm = async () => {
    if (!showAcceptModal) return;
    setAcceptSubmitting(true);
    setActionError('');
    try {
      await api.post(`/offers/${showAcceptModal.id}/accept`);
      setShowAcceptModal(null);
      setActionSuccess('Offer accepted! Payment is securely held in Platform Escrow.');
      fetchTaskDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to accept offer.');
    } finally {
      setAcceptSubmitting(false);
    }
  };

  // Mark Completed & Release Escrow
  const handleCompleteTask = async () => {
    if (!window.confirm('Are you sure the work is fully completed? This will release the escrow funds to the Tasker.')) {
      return;
    }
    setActionError('');
    try {
      await api.patch(`/tasks/${id}/complete`);
      setActionSuccess('Task marked as completed and escrow payment released!');
      fetchTaskDetails();
      setShowReviewModal(true); // Open review modal right after completion
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to complete task.');
    }
  };

  // Submit Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setActionError('');
    try {
      await api.post(`/reviews/task/${id}`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setShowReviewModal(false);
      setActionSuccess('Thank you! Your review and rating have been posted.');
      fetchTaskDetails();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const content = newMessage.trim();
    setNewMessage('');
    stopTyping(id);

    try {
      // Determine receiver
      const receiverId = isPoster ? task.offers.find((o) => o.status === 'ACCEPTED')?.taskerId : task.posterId;
      sendMessage({
        taskId: id,
        senderId: user.id,
        receiverId,
        content,
      });
      // Fallback post if socket offline
      if (!isConnected) {
        await api.post(`/messages/task/${id}`, { content, receiverId });
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Task Not Found</h2>
        <p className="text-slate-500 text-sm mt-2">This task may have been removed or does not exist.</p>
        <Link to="/tasks" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
          Return to Browse Tasks
        </Link>
      </div>
    );
  }

  const isPoster = user?.id === task.posterId;
  const userOffer = offers.find((o) => o.taskerId === user?.id);
  const acceptedOffer = offers.find((o) => o.status === 'ACCEPTED');
  const isAssignedTasker = user?.id === acceptedOffer?.taskerId;

  const imagesList = task.images ? (typeof task.images === 'string' ? JSON.parse(task.images) : task.images) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Action Notification Toasts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  task.status === 'OPEN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : task.status === 'ASSIGNED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {task.status}
              </span>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {task.category?.name}
              </span>
              {task.isRemote && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  Online / Remote
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {task.title}
            </h1>

            <div className="flex items-center flex-wrap gap-4 text-xs font-medium text-slate-500 pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>{task.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>
                  {task.dueDate
                    ? `Due ${new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : 'Flexible timing'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Posted {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Budget & Primary CTA Box */}
          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl shrink-0 flex flex-col items-center lg:items-end justify-center text-center lg:text-right min-w-[220px]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Task Budget
            </span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 mt-0.5">
              ${task.budget}
            </span>

            {/* Contextual Action Button */}
            <div className="mt-4 w-full">
              {task.status === 'OPEN' && !isPoster && (
                <button
                  onClick={() => {
                    if (!user) navigate('/login');
                    else setShowOfferModal(true);
                  }}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition"
                >
                  {userOffer ? 'Update Your Offer' : 'Make an Offer'}
                </button>
              )}

              {task.status === 'ASSIGNED' && isPoster && (
                <button
                  onClick={handleCompleteTask}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve & Release Funds
                </button>
              )}

              {task.status === 'ASSIGNED' && isAssignedTasker && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 font-semibold text-center">
                  You are assigned to this task. Escrow is secured!
                </div>
              )}

              {task.status === 'COMPLETED' && (
                <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded-xl border border-blue-200 font-semibold text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Task Completed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Toggle (Details vs Chat) */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'details'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Task Details & Offers ({offers.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'chat'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chat ({messages.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid Body */}
      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Description, Photos, Map, Offers */}
          <div className="lg:col-span-8 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Task Details</h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {task.description}
              </p>

              {/* Photos Gallery */}
              {imagesList.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Attached Photos
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imagesList.map((imgUrl, idx) => (
                      <a
                        key={idx}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl overflow-hidden border border-slate-200 aspect-video group block"
                      >
                        <img
                          src={imgUrl}
                          alt="Task attachment"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Escrow Guarantee Banner */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl border border-teal-200/80 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-teal-950">
                  Get It Done Escrow Payment Guarantee
                </h3>
                <p className="text-xs text-teal-800 leading-relaxed">
                  When an offer is accepted, the agreed amount is held securely in platform escrow. The Tasker only receives payment after the Poster verifies and confirms satisfactory completion.
                </p>
                {task.payment && (
                  <div className="mt-2 inline-block font-mono text-xs font-bold text-teal-900 bg-white/80 px-2.5 py-1 rounded-lg border border-teal-200">
                    Escrow Status: {task.payment.status} (${task.payment.amount})
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Leaflet Map Preview (if in-person) */}
            {!task.isRemote && task.latitude && task.longitude && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span>Job Location: {task.location}</span>
                </h2>
                <div className="h-56 rounded-2xl overflow-hidden border border-slate-200">
                  <MapPicker initialLat={task.latitude} initialLng={task.longitude} />
                </div>
              </div>
            )}

            {/* Offers Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Offers ({offers.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Taskers proposing quotes to complete this task
                  </p>
                </div>

                {task.status === 'OPEN' && !isPoster && (
                  <button
                    onClick={() => {
                      if (!user) navigate('/login');
                      else setShowOfferModal(true);
                    }}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition"
                  >
                    {userOffer ? 'Edit Offer' : 'Submit Offer'}
                  </button>
                )}
              </div>

              {offers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No offers submitted yet. Be the first tasker to make an offer!
                </div>
              ) : (
                <div className="divide-y divide-slate-100 space-y-4 pt-2">
                  {offers.map((offer) => {
                    const isMyOffer = user?.id === offer.taskerId;
                    const isAccepted = offer.status === 'ACCEPTED';

                    return (
                      <div
                        key={offer.id}
                        className={`pt-4 first:pt-0 ${
                          isAccepted ? 'bg-amber-50/50 -mx-4 px-4 py-3 rounded-2xl border border-amber-200/80' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={offer.tasker.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt={offer.tasker.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  to={`/users/${offer.tasker.id}`}
                                  className="text-sm font-bold text-slate-900 hover:text-brand-600"
                                >
                                  {offer.tasker.name}
                                </Link>
                                {offer.tasker.isVerified && <VerificationBadge size="sm" />}
                              </div>
                              <RatingStars
                                rating={offer.tasker.ratingAvg}
                                count={offer.tasker.ratingCount}
                              />
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-lg font-black text-slate-900 block">
                              ${offer.amount}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isAccepted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : offer.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {offer.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                          {offer.message}
                        </p>

                        {/* Accept Offer Action (Poster Only, when Task is OPEN) */}
                        {isPoster && task.status === 'OPEN' && offer.status === 'PENDING' && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => setShowAcceptModal(offer)}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                              Accept Offer & Hold Escrow
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reviews Section if task is completed */}
            {task.review && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Task Review & Rating</h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Reviewed by {task.review.reviewer?.name}
                    </span>
                    <RatingStars rating={task.review.rating} showCount={false} size="md" />
                  </div>
                  <p className="text-xs text-slate-600 italic">"{task.review.comment}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Poster Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Posted By
              </h3>

              <div className="flex items-center gap-3">
                <img
                  src={task.poster.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={task.poster.name}
                  className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-slate-900">{task.poster.name}</h4>
                    {task.poster.isVerified && <VerificationBadge size="sm" showText={false} />}
                  </div>
                  <RatingStars rating={task.poster.ratingAvg} count={task.poster.ratingCount} />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Member since {new Date(task.poster.createdAt).getFullYear()}
                  </p>
                </div>
              </div>

              {task.poster.bio && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {task.poster.bio}
                </p>
              )}

              <button
                onClick={() => setActiveTab('chat')}
                className="w-full border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span>Chat with Poster</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Real-Time Chat Section */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Live Discussion: {task.title}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {isConnected ? 'Real-time WebSocket connected' : 'Connecting to chat...'}
                </span>
              </div>
            </div>
            {typingUser && (
              <span className="text-xs text-brand-600 font-medium italic animate-pulse">
                {typingUser} is typing...
              </span>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                No messages yet. Send a message to start the discussion!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = user?.id === msg.senderId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={msg.sender.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={msg.sender.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 mb-1"
                      />
                    )}
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-slate-900 text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span
                        className={`text-[9px] block mt-1 ${
                          isMe ? 'text-slate-400 text-right' : 'text-slate-400'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={user ? 'Type a message...' : 'Log in to join the conversation'}
              disabled={!user}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                startTyping(id, user?.name);
              }}
              onBlur={() => stopTyping(id)}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!user || !newMessage.trim()}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-2xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Submit / Edit Offer */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Submit Your Offer</h3>
            <p className="text-xs text-slate-500">
              Provide your proposed total price and explain why you are the ideal tasker for this job.
            </p>

            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Offer Amount ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="1"
                    min="5"
                    required
                    placeholder={task.budget.toString()}
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Proposal Message
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Introduce yourself, mention relevant experience, availability, and tools..."
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offerSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow"
                >
                  {offerSubmitting ? 'Submitting...' : 'Submit Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Accept Offer (Simulated Escrow Checkout) */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Accept Offer & Authorize Escrow
                </h3>
                <p className="text-xs text-slate-500">
                  256-Bit SSL Encrypted Escrow Payment Authorization
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tasker:</span>
                <span className="font-bold text-slate-900">{showAcceptModal.tasker.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Agreed Offer:</span>
                <span className="font-bold text-slate-900">${showAcceptModal.amount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Fee (10%):</span>
                <span className="font-bold text-slate-900">
                  ${(showAcceptModal.amount * 0.1).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Total Escrow Amount:</span>
                <span>${showAcceptModal.amount}</span>
              </div>
            </div>

            {/* Escrow Guarantee Box */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Authorized Payment Card on File (•••• 4242)</span>
              </div>
              <p className="text-[11px] text-teal-700">
                Payment is pre-authorized and held safely in platform escrow. Funds will remain locked and will not be disbursed until you confirm satisfactory completion.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAcceptModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptOfferConfirm}
                disabled={acceptSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow flex items-center gap-1.5"
              >
                {acceptSubmitting ? 'Processing Escrow...' : 'Confirm & Hold in Escrow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Post-Completion Review */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Leave a Review</h3>
            <p className="text-xs text-slate-500">
              Rate your experience with the Tasker to build trust in our community.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-800 ml-2">
                    {reviewRating} Star{reviewRating > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Review
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Was the work done cleanly, on time, and as described?..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow"
                >
                  {reviewSubmitting ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
