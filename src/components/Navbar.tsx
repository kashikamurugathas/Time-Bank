import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Clock, Shield, User, LogOut, Bell, MessageSquare,
  Sparkles, Menu, X, ChevronDown, CheckCircle, ExternalLink, Key
} from 'lucide-react';
import { api } from '../services/api.ts';
import { NotificationItem } from '../types/index.ts';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, openChat }) => {
  const { user, logout, setShowLoginModal, setShowRegisterModal, setShowChangePasswordModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState<number>(0);

  const fetchNotifsAndMessages = async () => {
    if (!user) return;
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs || []);
      const msgRes = await api.getUnreadCount();
      setUnreadMsgCount(msgRes?.count || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifsAndMessages();
    const interval = setInterval(fetchNotifsAndMessages, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  const handleMarkNotifRead = async (id: string, linkUrl?: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    if (linkUrl) {
      if (linkUrl.startsWith('/admin')) setCurrentView('admin');
      else if (linkUrl.startsWith('/bookings')) setCurrentView('bookings');
      else if (linkUrl.startsWith('/wallet')) setCurrentView('wallet');
      else if (linkUrl.startsWith('/requests')) setCurrentView('requests');
      else setCurrentView('dashboard');
    }
    setNotifDropdownOpen(false);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const isAdmin = user?.roleId === 'SUPER_ADMIN' || user?.roleId === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE7F6] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C3FC5] to-[#452080] flex items-center justify-center text-white shadow-md shadow-[#6C3FC5]/20 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl tracking-tight text-[#452080]">Time Bank</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">SL</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Community Time Exchange</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'home' ? 'text-[#6C3FC5] bg-[#F2ECFF]' : 'text-gray-600 hover:text-[#6C3FC5] hover:bg-gray-50'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('skills')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'skills' ? 'text-[#6C3FC5] bg-[#F2ECFF]' : 'text-gray-600 hover:text-[#6C3FC5] hover:bg-gray-50'
              }`}
            >
              Explore Skills
            </button>
            <button
              onClick={() => setCurrentView('nearby')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'nearby' ? 'text-[#6C3FC5] bg-[#F2ECFF]' : 'text-gray-600 hover:text-[#6C3FC5] hover:bg-gray-50'
              }`}
            >
              Nearby Helpers
            </button>
            <button
              onClick={() => setCurrentView('how-it-works')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'how-it-works' ? 'text-[#6C3FC5] bg-[#F2ECFF]' : 'text-gray-600 hover:text-[#6C3FC5] hover:bg-gray-50'
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setCurrentView('communities')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'communities' ? 'text-[#6C3FC5] bg-[#F2ECFF]' : 'text-gray-600 hover:text-[#6C3FC5] hover:bg-gray-50'
              }`}
            >
              Communities
            </button>
            <button
              onClick={() => setCurrentView('membership')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'membership' ? 'text-[#6C3FC5] bg-[#F2ECFF]' : 'text-gray-600 hover:text-[#6C3FC5] hover:bg-gray-50'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'contact' ? 'text-[#6C3FC5] bg-[#F2ECFF]' : 'text-gray-600 hover:text-[#6C3FC5] hover:bg-gray-50'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Right Action Icons / Auth Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Time Credit Wallet Badge */}
                <button
                  onClick={() => setCurrentView('wallet')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#F2ECFF] to-[#E9DEFF] border border-[#6C3FC5]/30 hover:border-[#6C3FC5] transition-all shadow-xs group"
                  title="View your Time Credit Wallet"
                >
                  <div className="w-5 h-5 rounded-full bg-[#6C3FC5] text-white flex items-center justify-center text-[11px] font-bold">
                    ★
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-[#452080] group-hover:text-[#6C3FC5]">
                      {(user.availableCredits ?? 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium ml-1">Credits</span>
                  </div>
                </button>

                {/* Messages Button */}
                <button
                  onClick={openChat}
                  className="relative p-2 rounded-xl text-gray-600 hover:text-[#6C3FC5] hover:bg-[#F2ECFF] transition-colors"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#6C3FC5] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {unreadMsgCount}
                    </span>
                  )}
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="relative p-2 rounded-xl text-gray-600 hover:text-[#6C3FC5] hover:bg-[#F2ECFF] transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadNotifCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#EAE7F6] py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-sm text-[#452080]">Notifications ({unreadNotifCount})</span>
                        {unreadNotifCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-[#6C3FC5] hover:underline font-semibold"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-gray-400 text-xs">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkNotifRead(n.id, n.link_url)}
                              className={`p-3 text-left cursor-pointer transition-colors hover:bg-gray-50 ${!n.is_read ? 'bg-[#F2ECFF]/40' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-[#6C3FC5]' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{n.title}</p>
                                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.content}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Switcher Button */}
                <button
                  onClick={() => setCurrentView(isAdmin ? 'admin' : 'dashboard')}
                  className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                    isAdmin
                      ? 'bg-[#452080] text-white hover:bg-[#341663]'
                      : 'bg-[#6C3FC5] text-white hover:bg-[#5A32AA]'
                  }`}
                >
                  {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isAdmin ? 'Admin Portal' : 'My Dashboard'}</span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setNotifDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={user.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                      alt={user.fullName}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#6C3FC5]/30"
                    />
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#EAE7F6] py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2ECFF] text-[#6C3FC5]">
                            {user.roleId}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            {user.accountType}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { setCurrentView(isAdmin ? 'admin' : 'dashboard'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-[#F2ECFF] hover:text-[#6C3FC5] flex items-center gap-2"
                        >
                          <User className="w-4 h-4" /> Dashboard Overview
                        </button>
                        <button
                          onClick={() => { setCurrentView('learning'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-[#F2ECFF] hover:text-[#6C3FC5] flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" /> My Learning Journey
                        </button>
                        <button
                          onClick={() => { setCurrentView('wallet'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-[#F2ECFF] hover:text-[#6C3FC5] flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" /> Time Credit Wallet
                        </button>
                        <button
                          onClick={() => { setShowChangePasswordModal(true); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-[#F2ECFF] hover:text-[#6C3FC5] flex items-center gap-2"
                        >
                          <Key className="w-4 h-4" /> Change Password
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => { setCurrentView('admin'); setUserDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#6C3FC5] hover:bg-[#F2ECFF] flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" /> Administrator Panel
                          </button>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => { logout(); setUserDropdownOpen(false); setCurrentView('home'); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" /> Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-sm font-bold text-[#6C3FC5] hover:bg-[#F2ECFF] rounded-xl transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#6C3FC5] hover:bg-[#5A32AA] rounded-xl transition-all shadow-md shadow-[#6C3FC5]/20"
                >
                  Join Time Bank
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 md:hidden hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            Home
          </button>
          <button
            onClick={() => { setCurrentView('skills'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            Explore Skills
          </button>
          <button
            onClick={() => { setCurrentView('nearby'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            Nearby Helpers
          </button>
          <button
            onClick={() => { setCurrentView('how-it-works'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            How It Works
          </button>
          <button
            onClick={() => { setCurrentView('communities'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            Communities
          </button>
          <button
            onClick={() => { setCurrentView('membership'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            Membership Plans
          </button>
          {user && (
            <button
              onClick={() => { setCurrentView(isAdmin ? 'admin' : 'dashboard'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 text-sm font-bold text-[#6C3FC5] rounded-lg bg-[#F2ECFF]"
            >
              {isAdmin ? 'Administrator Dashboard' : 'Member Dashboard'}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
