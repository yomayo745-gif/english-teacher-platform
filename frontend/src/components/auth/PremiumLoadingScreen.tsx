import React from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PremiumLoadingScreenProps {
  error?: string | null;
  onRetry?: () => void;
  message?: string;
}

export const PremiumLoadingScreen: React.FC<PremiumLoadingScreenProps> = ({
  error,
  onRetry,
  message
}) => {
  const { t, tr } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] text-white flex flex-col items-center justify-between p-6 select-none font-sans overflow-hidden">
      {/* Background ambient glowing gradient orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Brand Bar */}
      <div className="w-full flex items-center justify-center pt-8">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-300 tracking-wide">English Hub Educational Platform</span>
        </div>
      </div>

      {/* Center Animated Logo & Status */}
      <div className="flex flex-col items-center justify-center text-center my-auto space-y-6 max-w-xs">
        {/* Glowing Logo Card */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl blur-md opacity-40 animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700 text-white font-extrabold text-3xl flex items-center justify-center shadow-2xl border border-white/20">
            E
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">English Hub</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {error
              ? (message || t('auth.connectionFailed', true))
              : (message || t('auth.loadingPlatform', true))}
          </p>
        </div>

        {error ? (
          <div className="w-full space-y-4 pt-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('auth.retryButton', true)}</span>
              </button>
            )}
          </div>
        ) : (
          /* Subtle Loading Spinner / Dots */
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="w-40 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-400 to-indigo-400 rounded-full w-1/2 animate-[shimmer_1.5s_infinite_linear]" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              {tr({ en: 'Securing Session...', uz: 'Sessiya tekshirilmoqda...', bi: 'Sessiya / Securing Session...' })}
            </span>
          </div>
        )}
      </div>

      {/* Footer Safe Area Notice */}
      <div className="w-full text-center pb-4 text-[10px] text-slate-500 font-medium">
        Telegram WebApp Protected • CEFR Standardized
      </div>
    </div>
  );
};
