import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'new' | 'in_progress' | 'submitted' | 'reviewing' | 'graded' | 'late' | 'missed' | 'returned' | 'completed' | 'not_started' | 'published' | 'draft' | 'neutral' | string;
  size?: 'sm' | 'md';
  isAdmin?: boolean;
}

const statusBilingualLabels: Record<string, { en: string; uz: string; bi?: string }> = {
  new: { en: 'New', uz: 'Yangi', bi: 'Yangi / New' },
  in_progress: { en: 'In Progress', uz: 'Jarayonda', bi: 'Jarayonda / In Progress' },
  submitted: { en: 'Submitted', uz: 'Topshirildi', bi: 'Topshirildi / Submitted' },
  reviewing: { en: 'Reviewing', uz: 'Tekshirilmoqda', bi: 'Tekshirilmoqda / Reviewing' },
  graded: { en: 'Graded', uz: 'Baholandi', bi: 'Baholandi / Graded' },
  late: { en: 'Late', uz: 'Kech topshirilgan', bi: 'Kech / Late' },
  missed: { en: 'Missed', uz: 'Topshirilmagan', bi: 'Topshirilmagan / Missed' },
  returned: { en: 'Returned', uz: 'Qaytarilgan', bi: 'Qaytarilgan / Returned' },
  completed: { en: 'Completed', uz: 'Tugatildi', bi: 'Tugatilgan / Completed' },
  not_started: { en: 'Not Started', uz: 'Boshlanmagan', bi: 'Boshlanmagan / Not Started' },
  published: { en: 'Published', uz: 'Chiqarilgan', bi: 'Chiqarilgan / Published' },
  draft: { en: 'Draft', uz: 'Qoralama', bi: 'Qoralama / Draft' },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm', isAdmin = false }) => {
  const { tr } = useLanguage();

  const styles: Record<string, string> = {
    new: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200/60',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200/60',
    reviewing: 'bg-purple-50 text-purple-700 border-purple-200/60',
    graded: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    late: 'bg-orange-50 text-orange-700 border-orange-200/60',
    missed: 'bg-rose-50 text-rose-700 border-rose-200/60',
    returned: 'bg-amber-50 text-amber-800 border-amber-300',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const normalizedVariant = String(variant).toLowerCase().replace(/[\s-]/g, '_');
  const variantClass = styles[normalizedVariant] || styles.neutral;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const bilingual = statusBilingualLabels[normalizedVariant];

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full border ${sizeClass} ${variantClass}`}>
      {children ? children : bilingual ? tr(bilingual, isAdmin) : variant}
    </span>
  );
};
