import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Search,
  Bell,
  PlusCircle,
  ShieldCheck,
  User,
  LogOut,
  Wallet,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import VerificationBadge from './VerificationBadge';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotification();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 text-slate-900 group">
              <img
                src="/favicon.png"
                alt="Get It Done Logo"
                className="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200"
              />
              <div className="leading-tight">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Get <span className="text-brand-600">It Done</span>
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  Community Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600">
              <Link
                to="/tasks"
                className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Browse Tasks
              </Link>
              <Link
                to="/#how-it-works"
                className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition"
              >
                How It Works
              </Link>
            </nav>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex flex-1 max-w-xs items-center relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100/80 border border-transparent focus:border-brand-500 focus:bg-white rounded-full transition outline-none"
            />
          </form>

          {/* Right Action Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Post a Task CTA */}
            <Link
              to="/post-task"
              className="hidden sm:inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Task</span>
            </Link>

            {user ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition relative"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-800">Notifications</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAsRead('all')}
                            className="text-xs text-brand-600 hover:underline font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.link) navigate(notif.link);
                                setShowNotifications(false);
                              }}
                              className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                                !notif.isRead ? 'bg-brand-50/40 font-semibold' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between text-slate-900">
                                <span>{notif.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(notif.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-600 font-normal mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Menu */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition"
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span className="hidden sm:block text-xs font-bold text-slate-700 max-w-[100px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                          {user.isVerified && <VerificationBadge size="sm" showText={false} />}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <div className="mt-2.5 flex items-center justify-between bg-teal-50/70 px-2.5 py-1.5 rounded-lg border border-teal-100">
                          <span className="text-xs text-teal-800 flex items-center gap-1 font-medium">
                            <Wallet className="w-3 h-3 text-teal-600" /> Wallet Balance:
                          </span>
                          <span className="text-xs font-extrabold text-teal-900">
                            ${(user.walletBalance || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="py-1 text-xs">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          My Profile & Reviews
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-purple-50 text-purple-700 font-semibold"
                          >
                            <LayoutDashboard className="w-4 h-4 text-purple-600" />
                            Admin Moderation Panel
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-bold text-slate-700 hover:text-brand-600 px-3 py-2 rounded-xl transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-2 text-sm font-semibold">
            <Link
              to="/tasks"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              Browse Tasks
            </Link>
            <Link
              to="/post-task"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 py-2 rounded-lg bg-brand-50 text-brand-700 font-bold"
            >
              + Post a Task
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
