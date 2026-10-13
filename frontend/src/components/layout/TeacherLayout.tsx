import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileEdit,
  Inbox,
  Users,
  FolderKanban,
  BarChart3,
  BookMarked,
  ShieldAlert,
  Settings,
  PlusCircle,
  Menu,
  X,
  ArrowLeftRight,
  LogOut,
  BookOpen,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageMode } from '../../i18n/translations';

export const TeacherLayout: React.FC = () => {
  const { user, loginAs, logout } = useAuth();
  const { t, tr, adminMode, setAdminMode } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { en: 'Dashboard', uz: 'Boshqaruv', bi: 'Boshqaruv / Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { en: 'Assignments', uz: 'Uyga Vazifalar', bi: 'Vazifalar / Assignments', path: '/admin/assignments', icon: FileEdit },
    { en: 'Pending Reviews', uz: 'Tekshirish', bi: 'Tekshirish / Pending Reviews', path: '/admin/pending-reviews', icon: Inbox },
    { en: 'Submissions', uz: 'Javoblar', bi: 'Javoblar / Submissions', path: '/admin/submissions', icon: FileEdit },
    { en: 'Groups', uz: 'Guruhlar', bi: 'Guruhlar / Groups', path: '/admin/groups', icon: FolderKanban },
    { en: 'Students', uz: 'O‘quvchilar', bi: 'O‘quvchilar / Students', path: '/admin/students', icon: Users },
    { en: 'Analytics', uz: 'Statistika', bi: 'Statistika / Analytics', path: '/admin/analytics', icon: BarChart3 },
    { en: 'Vocabulary Bank', uz: 'Lug‘at bazasi', bi: 'Lug‘at / Vocabulary Bank', path: '/admin/vocabulary', icon: BookMarked },
    { en: 'Settings', uz: 'Sozlamalar', bi: 'Sozlamalar / Settings', path: '/admin/settings', icon: Settings },
  ];

  const languageOptions: { id: LanguageMode; label: string }[] = [
    { id: 'bilingual', label: '50/50' },
    { id: 'uz', label: '🇺🇿 UZ' },
    { id: 'en', label: '🇬🇧 EN' },
  ];

  // Protect teacher layout from unauthorized students
  if (user && user.role === 'STUDENT') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-sm space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center font-bold text-lg">
            ⛔
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {tr({ en: 'Access Denied', uz: 'Ruxsat etilmadi', bi: 'Ruxsat yo‘q / Access Denied' }, true)}
          </h2>
          <p className="text-xs text-slate-500">
            {tr({
              en: 'This area is restricted to teachers and administrators.',
              uz: 'Ushbu bo‘lim faqat o‘qituvchi va administratorlar uchun mo‘ljallangan.',
              bi: 'Faqat o‘qituvchilar uchun / Teachers only'
            }, true)}
          </p>
          <button
            onClick={() => navigate('/app')}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
          >
            {tr({ en: 'Go to Student App', uz: 'O‘quvchi sahifasiga qaytish', bi: 'Qaytish / Go to App' }, true)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Top Navbar */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            E
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 tracking-tight block leading-tight">
              {tr({ en: 'Teacher Panel', uz: 'O‘qituvchi paneli', bi: 'O‘qituvchi / Teacher' }, true)}
            </span>
            <span className="text-[10px] text-slate-400">English Studio</span>
          </div>
        </div>

        {/* Mobile Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {languageOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setAdminMode(opt.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                adminMode === opt.id
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo / Workspace */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                EP
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">English Studio</h1>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {tr({ en: 'Teacher Panel', uz: 'O‘qituvchi paneli', bi: 'O‘qituvchi / Teacher' }, true)}
                </p>
              </div>
            </div>

            {/* Admin Language Selector in Sidebar */}
            <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3 text-brand-600" />
                  <span>{tr({ en: 'Language', uz: 'Til rejimi', bi: 'Til / Language' }, true)}</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {languageOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAdminMode(opt.id)}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-bold text-center transition-all ${
                      adminMode === opt.id
                        ? 'bg-brand-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="p-3 space-y-1.5">
            <NavLink
              to="/admin/lessons/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-semibold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('lessons.createLesson', true)}</span>
            </NavLink>
            <NavLink
              to="/admin/assignments/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{tr({ en: 'Create Task', uz: 'Yangi topshiriq', bi: 'Vazifa / Create Task' }, true)}</span>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-320px)]">
            {navLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0 text-slate-500" />
                <div className="leading-tight">
                  <span className="block font-medium">{tr(item, true)}</span>
                </div>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer: User profile and Role switcher */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.first_name ? user.first_name[0] : 'T'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.first_name || 'Teacher'}</p>
                <p className="text-[10px] text-slate-400 font-mono">ID: {user?.telegram_id}</p>
              </div>
            </div>

            <button
              onClick={() => {
                loginAs('STUDENT');
                navigate('/app');
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-brand-600 transition-all text-xs"
              title={tr({ en: 'Switch to Student View', uz: 'O‘quvchi rejimiga o‘tish', bi: 'O‘quvchi rejimi / Student View' }, true)}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Admin Access
            </span>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav.logout', true)}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default TeacherLayout;
