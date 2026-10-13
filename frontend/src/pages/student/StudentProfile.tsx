import React, { useState, useEffect } from 'react';
import { User, Award, CheckCircle2, Clock, Shield, LogOut, ArrowLeftRight, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const StudentProfile: React.FC = () => {
  const { user, loginAs, logout } = useAuth();
  const { mode, setMode, t, tr } = useLanguage();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const homeData = await api.getStudentHome();
        setProfileData(homeData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const skills = [
    { key: 'grammar', score: profileData?.skills?.grammar ?? 0.0 },
    { key: 'vocabulary', score: profileData?.skills?.vocabulary ?? 0.0 },
    { key: 'writing', score: profileData?.skills?.writing ?? 0.0 },
    { key: 'reading', score: profileData?.skills?.reading ?? 0.0 },
    { key: 'listening', score: profileData?.skills?.listening ?? 0.0 },
    { key: 'speaking', score: profileData?.skills?.speaking ?? 0.0 },
  ];

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {t('profile.myProfile')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Header Card */}
      <Card className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
          {user?.first_name ? user.first_name[0] : 'S'}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {user?.first_name} {user?.last_name || ''}
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">@{user?.username || 'no_username'}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-semibold text-[10px] border border-brand-200">
              {t('profile.studentBadge')}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">TG ID: {user?.telegram_id}</span>
          </div>
        </div>
      </Card>

      {/* Language Preference Card */}
      <Card>
        <div className="flex items-center gap-2 mb-2.5">
          <Globe className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('profile.languagePreference')}
          </h4>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          {t('profile.languageSub')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              id: 'bilingual',
              label: { en: 'Bilingual', uz: 'Ikki tilli', bi: 'Ikki tilli / Bilingual' },
              sub: '50% UZ + 50% EN',
            },
            {
              id: 'uz',
              label: { en: 'Uzbek', uz: 'O‘zbekcha', bi: 'O‘zbekcha' },
              sub: '100% O‘zbekcha',
            },
            {
              id: 'en',
              label: { en: 'English', uz: 'Inglizcha', bi: 'English Only' },
              sub: '100% English',
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as any)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                mode === item.id
                  ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold ring-1 ring-brand-500 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{tr(item.label)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Progress & Stats Card */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('profile.overallProgress')}
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-700 block">
              {t('profile.completedTasks')}
            </span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
              {profileData?.stats?.completed || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-700 block">
              {t('profile.pendingTasks')}
            </span>
            <span className="text-lg font-bold text-amber-600 mt-0.5 block">
              {profileData?.stats?.pending || 0}
            </span>
          </div>
        </div>
      </Card>

      {/* Skills Breakdown */}
      <Card>
        <div className="mb-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider inline-block">
            {t('profile.skillsProficiency')}
          </h4>
        </div>
        <div className="space-y-3">
          {skills.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-800">
                  {t(`profile.${s.key}`)}
                </span>
                <span className="text-brand-600 font-bold">{s.score} / 10</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all duration-300"
                  style={{ width: `${(s.score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          onClick={logout}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
};
export default StudentProfile;
