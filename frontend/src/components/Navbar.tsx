import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Bell, Settings, MessageSquareMore } from 'lucide-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import NotificationDropdown from './NotificationDropdown';
import FeedbackModal from './FeedbackModal';
import UserAvatar from './UserAvatar';
import proptimizerLogo from '../assets/proptimizer-logo.svg';
import { API_BASE_URL } from '../utils/api';

interface Notification {
  userId: string;
  createdAt: number;
  type: 'LIKE' | 'SAVE' | 'SYSTEM';
  actorId: string;
  actorUsername?: string;
  templateId?: string;
  templateTitle?: string;
  isRead: string;
  message: string;
}

interface Profile {
  userId: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}

interface NavbarProps {
  userEmail?: string;
  onSignOut: () => void;
}

export default function Navbar({ userEmail, onSignOut }: NavbarProps) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch profile and notifications on mount
  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(n => n.isRead === 'false').length;
    setUnreadCount(count);
  }, [notifications]);

  async function fetchProfile() {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }

  async function fetchNotifications() {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  async function handleBellClick() {
    const willOpen = !showNotifications;
    setShowNotifications(willOpen);
    setShowUserMenu(false);

    // Mark as read when opening
    if (willOpen && unreadCount > 0) {
      await markNotificationsAsRead();
    }
  }

  function handleNotificationClick(notification: any) {
    setShowNotifications(false);
    // Navigate to My Templates library so user can find their template
    if (notification.templateId) {
      navigate('/templates/my-library');
    }
  }

  function handleViewAllNotifications() {
    setShowNotifications(false);
    navigate('/templates/my-library');
  }

  async function markNotificationsAsRead() {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 'true' })));
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }

  function handleUserMenuToggle() {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  }

  // Use profile display name or fallback to email
  const displayName = profile?.displayName || userEmail || 'User';
  const avatarUrl = profile?.avatarUrl || null;

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Left — Logo */}
          <div className="flex items-center space-x-2.5 min-w-[180px]">
            <img src={proptimizerLogo} alt="Proptimizer Logo" className="w-9 h-9" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#64ffda] via-[#00bcd4] to-[#6366f1] bg-clip-text text-transparent animate-gradient-text bg-[length:300%_300%]">
                Proptimizer
              </h1>
              <p className="text-xs text-gray-500">AI Prompt Engineering</p>
            </div>
          </div>

          {/* Center — Navigation */}
          <nav className="flex-1 flex justify-center">
            <div className="flex space-x-1 bg-gray-100/80 rounded-xl p-1">
              <NavLink
                to="/optimizer"
                className={({ isActive }) => 
                  `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#00bcd4] shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                {/* <Sparkles className="w-4 h-4" /> */}
                <span>Optimizer</span>
              </NavLink>
              
              <NavLink
                to="/chat"
                className={({ isActive }) => 
                  `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#00bcd4] shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                {/* <MessageSquare className="w-4 h-4" /> */}
                <span>AI Chat</span>
              </NavLink>
              
              <NavLink
                to="/templates"
                className={({ isActive }) => 
                  `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#00bcd4] shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                {/* <BookOpen className="w-4 h-4" /> */}
                <span>Templates</span>
              </NavLink>
            </div>
          </nav>

          {/* Right — Actions */}
          <div className="flex items-center space-x-1.5 min-w-[180px] justify-end">
            {/* Feedback Button */}
            <button
              onClick={() => { setShowFeedback(true); setShowNotifications(false); setShowUserMenu(false); }}
              className="p-2 text-gray-600 hover:text-[#00bcd4] hover:bg-cyan-50 rounded-xl transition-all"
              title="Send feedback"
            >
              <MessageSquareMore className="w-5 h-5" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                ref={bellButtonRef}
                onClick={handleBellClick}
                className="relative p-2 text-gray-600 hover:text-[#00bcd4] hover:bg-cyan-50 rounded-xl transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAllRead={markNotificationsAsRead}
                  onNotificationClick={handleNotificationClick}
                  onViewAll={handleViewAllNotifications}
                  excludeRef={bellButtonRef}
                />
              )}
            </div>

            {/* User Avatar & Menu */}
            <div className="relative">
              <button
                onClick={handleUserMenuToggle}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <UserAvatar 
                  src={avatarUrl} 
                  alt={displayName}
                  size="md"
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {displayName}
                </span>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        src={avatarUrl} 
                        alt={displayName}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {profile?.email || userEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    <NavLink
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </NavLink>
                  </div>
                  
                  <div className="border-t border-gray-200 py-1">
                    <button
                      onClick={onSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </header>
  );
}
