import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Bell, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotification();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    setShowNotifications(false);
  }, [location]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <img src="/brand.svg" alt="" width="40" height="40" />
          <span>
            Get It Done<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          <NavLink to="/tasks">Find a task</NavLink>
          <Link to="/#how-it-works">How it works</Link>
          <NavLink to="/trust-safety">Trust & safety</NavLink>
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <div className="notification-wrap">
                <button
                  className="icon-button"
                  aria-label={
                    unreadCount ? 'Notifications, ' + unreadCount + ' unread' : 'Notifications'
                  }
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notification-dot" />}
                </button>
                {showNotifications && (
                  <div className="notification-panel">
                    <div className="flex justify-between gap-3">
                      <strong>Notifications</strong>
                      <button onClick={() => markAsRead('all')}>Mark all read</button>
                    </div>
                    {notifications.length ? (
                      notifications.slice(0, 10).map((n) => (
                        <Link
                          key={n.id}
                          to={n.link || '/profile'}
                          onClick={() => markAsRead(n.id)}
                          className={n.isRead ? '' : 'unread'}
                        >
                          <strong>{n.title}</strong>
                          <span>{n.message}</span>
                        </Link>
                      ))
                    ) : (
                      <p>No notifications yet.</p>
                    )}
                  </div>
                )}
              </div>
              <Link className="account-link" to="/profile">
                {user.name.split(' ')[0]}
              </Link>
              {isAdmin && (
                <Link className="desktop-only" to="/admin">
                  Admin
                </Link>
              )}
              <button className="desktop-only" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <Link className="account-link" to="/login">
              Log in
            </Link>
          )}
          <Link to="/post-task" className="button nav-cta">
            Post a task <ArrowUpRight size={17} />
          </Link>
          <button
            className="icon-button mobile-toggle"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav">
          <Link to="/tasks">Find a task</Link>
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/trust-safety">Trust & safety</Link>
          <Link to="/post-task">Post a task</Link>
          {user ? (
            <>
              <Link to="/profile">Your profile</Link>
              {isAdmin && <Link to="/admin">Admin</Link>}
              <button onClick={logout}>Log out</button>
            </>
          ) : (
            <Link to="/register">Create an account</Link>
          )}
        </nav>
      )}
    </header>
  );
}
