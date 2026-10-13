import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  FileCheck2,
  BarChart2,
  User as UserIcon,
  Bell,
  ArrowLeftRight,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { LanguageMode } from '../../i18n/translations';

export const StudentLayout: React.FC = () => {
  const { user, loginAs } = useAuth();
  const { mode, setMode, tr, t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await api.getStudentNotifications();
        const unread = notifs.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch {}
    };
    fetchNotifs();
  }, []);

  const navItems = [
    { en: 'Home', uz: 'Asosiy', bi: 'Asosiy', path: '/app', icon: Home, end: true },
    { en: 'Homework', uz: 'Uyga vazifalar', bi: 'Vazifalar', path: '/app/tasks', icon: FileCheck2 },
    { en: 'Results', uz: 'Natijalar', bi: 'Natijalar', path: '/app/results', icon: BarChart2 },
    { en: 'Profile', uz: 'Profil', bi: 'Profil', path: '/app/profile', icon: UserIcon },
  ];

  const languageOptions: { id: LanguageMode; label: string }[] = [
    { id: 'bilingual', label: '50/50' },
    { id: 'uz', label: 'UZ' },
    { id: 'en', label: 'EN' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between pb-20 select-none">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            E
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">English Hub</span>
            <span className="text-[10px] text-slate-500 font-medium">
              {tr({ en: 'Student', uz: 'O‘quvchi', bi: 'O‘quvchi / Student' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Language Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            {languageOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  mode === opt.id
                    ? 'bg-white text-brand-700 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={`Switch language mode to ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <NavLink
            to="/app/notifications"
            className="relative p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-white ring-1 ring-rose-300" />
            )}
          </NavLink>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4">
        <Outlet />
      </main>

      {/* Bottom Sticky Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-1.5 py-1 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'text-brand-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              <item.icon className="w-4 h-4 stroke-[2.2]" />
              <span className="text-[10px] leading-tight font-medium mt-0.5">
                {mode === 'uz' ? item.uz : mode === 'en' ? item.en : (
                  <span>
                    <span className="font-bold">{item.uz}</span>
                    <span className="text-[8px] opacity-70 block font-normal">{item.en}</span>
                  </span>
                )}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
export default StudentLayout;
