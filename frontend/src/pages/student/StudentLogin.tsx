import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight, Sparkles, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageMode } from '../../i18n/translations';

export const StudentLogin: React.FC = () => {
  const { studentLogin, loginAs } = useAuth();
  const { t, tr, mode, setMode } = useLanguage();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) {
      setErrorMessage(t('errors.requiredField', true));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await studentLogin(login.trim(), password);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('disabled')) {
        setErrorMessage(t('auth.accountDisabled', true));
      } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('not found')) {
        setErrorMessage(t('auth.loginError', true));
      } else {
        setErrorMessage(msg || t('errors.somethingWentWrong', true));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const languageOptions: { id: LanguageMode; label: string }[] = [
    { id: 'bilingual', label: '50/50' },
    { id: 'uz', label: 'UZ' },
    { id: 'en', label: 'EN' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* Top Header with Brand and Language Switcher */}
      <header className="w-full max-w-sm mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md border border-white/10">
            E
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-tight">English Hub</span>
        </div>

        {/* Language selector */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 shadow-2xs">
          {languageOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                mode === opt.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-sm mx-auto my-auto py-6">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          {/* Welcome Title */}
          <div className="space-y-1.5 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('auth.welcome', true)}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {tr({ en: 'Student Sign In', uz: 'O‘quvchi Kirishi', bi: 'O‘quvchi Kirishi / Student Sign In' })}
            </h1>
            <p className="text-xs text-slate-400 font-normal leading-relaxed">
              {t('auth.loginSubtitle', true)}
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                {t('auth.loginLabel', true)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder={t('auth.loginPlaceholder', true)}
                  disabled={isLoading}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                {t('auth.passwordLabel', true)}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder', true)}
                  disabled={isLoading}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('auth.signingIn', true)}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.signIn', true)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer prompt */}
          <div className="pt-2 text-center border-t border-slate-700/50">
            <p className="text-[11px] text-slate-400">
              {t('auth.noAccountPrompt', true)}
            </p>
          </div>
        </div>
      </main>

      {/* Telegram Footer */}
      <footer className="w-full text-center pb-2 text-[10px] text-slate-500">
        Telegram Bot & WebApp Auth v2.0 • Secured
      </footer>
    </div>
  );
};
