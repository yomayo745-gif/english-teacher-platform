import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageMode, translations } from '../i18n/translations';

interface LanguageContextType {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
  adminMode: LanguageMode;
  setAdminMode: (mode: LanguageMode) => void;
  t: (path: string, isAdmin?: boolean) => string;
  tr: (item: { en: string; uz: string; bi?: string }, isAdmin?: boolean) => string;
  localizeError: (err: any, isAdmin?: boolean) => string;
  translations: typeof translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<LanguageMode>(() => {
    return (localStorage.getItem('app_lang_mode') as LanguageMode) || 'bilingual';
  });

  const [adminMode, setAdminModeState] = useState<LanguageMode>(() => {
    return (localStorage.getItem('admin_lang_mode') as LanguageMode) || 'bilingual';
  });

  const setMode = (newMode: LanguageMode) => {
    setModeState(newMode);
    localStorage.setItem('app_lang_mode', newMode);
  };

  const setAdminMode = (newMode: LanguageMode) => {
    setAdminModeState(newMode);
    localStorage.setItem('admin_lang_mode', newMode);
  };

  const tr = (item: { en: string; uz: string; bi?: string }, isAdmin = false): string => {
    if (!item) return '';
    const activeMode = isAdmin ? adminMode : mode;

    if (activeMode === 'uz') {
      return item.uz ?? item.en ?? '';
    }
    if (activeMode === 'en') {
      return item.en ?? item.uz ?? '';
    }
    // 50/50 bilingual
    if (item.bi) return item.bi;
    if (item.uz && item.en && item.uz !== item.en) {
      return `${item.uz} / ${item.en}`;
    }
    return item.en || item.uz || '';
  };

  const t = (path: string, isAdmin = false): string => {
    const keys = path.split('.');
    let current: any = translations;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        if (import.meta.env.DEV) {
          console.warn(`[MISSING TRANSLATION: ${path}]`);
        }
        return `[MISSING: ${path}]`;
      }
    }

    if (current && typeof current === 'object' && ('en' in current || 'uz' in current)) {
      return tr(current, isAdmin);
    }

    if (typeof current === 'string') {
      return current;
    }

    return path;
  };

  const localizeError = (err: any, isAdmin = false): string => {
    if (!err) return t('errors.somethingWentWrong', isAdmin);

    const message = typeof err === 'string' ? err : err.message || err.detail || '';
    const lower = message.toLowerCase();

    if (lower.includes('network') || lower.includes('fetch')) {
      return t('errors.networkError', isAdmin);
    }
    if (lower.includes('not found') || lower.includes('404')) {
      if (lower.includes('lesson')) return t('errors.lessonNotFound', isAdmin);
      return t('errors.assignmentNotFound', isAdmin);
    }
    if (lower.includes('microphone') || lower.includes('permission') || lower.includes('audio')) {
      return t('errors.microphoneDenied', isAdmin);
    }
    if (lower.includes('file') && (lower.includes('large') || lower.includes('size'))) {
      return t('errors.fileTooLarge', isAdmin);
    }
    if (lower.includes('format') || lower.includes('type')) {
      return t('errors.unsupportedFile', isAdmin);
    }
    if (lower.includes('unauthorized') || lower.includes('401') || lower.includes('token')) {
      return t('errors.unauthorized', isAdmin);
    }
    if (lower.includes('submit')) {
      return t('errors.submissionFailed', isAdmin);
    }

    // Default error
    return message || t('errors.somethingWentWrong', isAdmin);
  };

  return (
    <LanguageContext.Provider
      value={{
        mode,
        setMode,
        adminMode,
        setAdminMode,
        t,
        tr,
        localizeError,
        translations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
export default useLanguage;
