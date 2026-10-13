import React from 'react';
import { PenTool, Sparkles, CheckSquare } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export interface WritingData {
  topic: string;
  guidelines: string;
  minWords: number;
  maxWords: number;
  points: number;
  enableAiAssist: boolean;
}

interface WritingFieldsProps {
  data: WritingData;
  onChange: (data: WritingData) => void;
}

export const WritingFields: React.FC<WritingFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const update = (patch: Partial<WritingData>) => {
    onChange({ ...data, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-indigo-900 text-xs">
        <PenTool className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Insho va yozma ish paneli'
              : adminMode === 'en'
              ? 'Writing & Essay Panel'
              : 'Insho va yozish / Writing & Essay'}
          </span>
          <p className="text-indigo-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'O‘quvchilar berilgan mavzu bo‘yicha insho, xat yoki erkin matn yozadilar. O‘qituvchi qo‘lda yoki AI tahlili (Grammar & Vocabulary score) yordamida baholaydi.'
              : adminMode === 'en'
              ? 'Students compose an essay or written response meeting word criteria. Teachers can utilize AI assist to analyze grammar, style, and vocabulary.'
              : 'Yozma insho va tahlil / Essay and written response.'}
          </p>
        </div>
      </div>

      {/* 1. Essay Topic / Prompt */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz'
            ? 'Insho mavzusi / Asosiy topshiriq *'
            : adminMode === 'en'
            ? 'Writing Topic / Main Prompt *'
            : 'Insho mavzusi / Writing Topic *'}
        </label>
        <textarea
          rows={3}
          value={data.topic}
          onChange={(e) => update({ topic: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? 'Masalan: Write an essay about the advantages and disadvantages of online education. Give reasons and examples...'
              : adminMode === 'en'
              ? 'e.g. Write an essay about advantages and disadvantages of remote work. Support your ideas with examples...'
              : 'e.g. Write an essay about online education...'
          }
          className="w-full text-sm rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* 2. Guidelines for Students */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz'
            ? 'O‘quvchilar uchun qo‘shimcha talablar / Reja (Ixtiyoriy)'
            : adminMode === 'en'
            ? 'Student Guidelines / Essay Outline (Optional)'
            : 'Ko‘rsatmalar / Guidelines'}
        </label>
        <textarea
          rows={3}
          value={data.guidelines}
          onChange={(e) => update({ guidelines: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? '- Introduction: State your opinion\n- Body paragraph 1: Benefits\n- Body paragraph 2: Drawbacks\n- Conclusion: Summary'
              : '- Introduction: State thesis\n- Body 1: Arguments for\n- Body 2: Arguments against\n- Conclusion: Wrap up'
          }
          className="w-full text-sm rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-mono text-xs"
        />
      </div>

      {/* 3. Word Limits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('admin.minWords', true)}
          </label>
          <input
            type="number"
            min={10}
            max={2000}
            step={10}
            value={data.minWords}
            onChange={(e) => update({ minWords: Number(e.target.value) || 0 })}
            className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
          />
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'Minimal so‘zlar soni talabi' : 'Minimum word requirement'}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('admin.maxWords', true)}
          </label>
          <input
            type="number"
            min={0}
            max={5000}
            step={20}
            value={data.maxWords}
            onChange={(e) => update({ maxWords: Number(e.target.value) || 0 })}
            className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
          />
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'Maksimal so‘z chegarasi (0 = cheklovsiz)' : 'Maximum word cap (0 = unlimited)'}
          </span>
        </div>
      </div>

      {/* 4. Points & AI Assist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              {t('admin.pointsLabel', true)}
            </span>
            <span className="text-[11px] text-slate-400">
              {adminMode === 'uz' ? 'Insho uchun maksimal ball' : 'Max points for essay'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={data.points}
              onChange={(e) => update({ points: Number(e.target.value) || 10 })}
              className="w-20 text-sm font-bold text-center rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
            />
            <span className="text-xs text-slate-500 font-semibold">{t('common.points', true)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t('admin.aiAssist', true)}</span>
            </span>
            <span className="text-[11px] text-slate-400 block">
              {adminMode === 'uz' ? 'O‘qituvchi uchun sun‘iy intellekt tahlili' : 'Enable AI writing evaluator'}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.enableAiAssist}
              onChange={(e) => update({ enableAiAssist: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
