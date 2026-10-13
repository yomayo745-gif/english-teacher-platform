import React from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface TFItem {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation?: string;
  points: number;
}

export interface TrueFalseData {
  statements: TFItem[];
}

interface TrueFalseFieldsProps {
  data: TrueFalseData;
  onChange: (data: TrueFalseData) => void;
}

export const TrueFalseFields: React.FC<TrueFalseFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const addStatement = () => {
    const newItem: TFItem = {
      id: Math.random().toString(36).substring(7),
      statement: '',
      isTrue: true,
      points: 2,
    };
    onChange({
      ...data,
      statements: [...data.statements, newItem],
    });
  };

  const removeStatement = (idx: number) => {
    if (data.statements.length <= 1) return;
    onChange({
      ...data,
      statements: data.statements.filter((_, i) => i !== idx),
    });
  };

  const updateStatement = (idx: number, patch: Partial<TFItem>) => {
    const updated = [...data.statements];
    updated[idx] = { ...updated[idx], ...patch };
    onChange({ ...data, statements: updated });
  };

  const totalPoints = data.statements.reduce((sum, s) => sum + (s.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-900 text-xs">
        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'To‘g‘ri / Noto‘g‘ri paneli'
              : adminMode === 'en'
              ? 'True / False Statements Panel'
              : 'To‘g‘ri / Noto‘g‘ri paneli (True / False)'}
          </span>
          <p className="text-teal-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'Har bir jumla to‘g‘ri (True) yoki noto‘g‘ri (False) ekanligini belgilang. Tizim o‘quvchining tanlovini avtomatik solishtirib baholaydi.'
              : adminMode === 'en'
              ? 'Set factual statements with True/False keys. Responses are scored automatically upon submission.'
              : 'To‘g‘ri / Noto‘g‘ri testlari / True or False statements.'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Jumlalar ro‘yxati' : 'Statements'} ({data.statements.length})
        </span>
        <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
          {t('common.score', true)}: {totalPoints} {t('common.pts', true)}
        </span>
      </div>

      {/* Statements List */}
      <div className="space-y-4">
        {data.statements.map((s, idx) => (
          <div
            key={s.id || idx}
            className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                #{idx + 1} {adminMode === 'uz' ? 'Jumla / Fikr' : 'Statement'}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">{t('common.points', true)}:</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={s.points}
                    onChange={(e) => updateStatement(idx, { points: Number(e.target.value) || 1 })}
                    className="w-14 text-xs font-bold text-center rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                {data.statements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStatement(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Statement text */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {adminMode === 'uz' ? 'Matn / Fikr *' : 'Statement Sentence *'}
              </label>
              <input
                type="text"
                value={s.statement}
                onChange={(e) => updateStatement(idx, { statement: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'Masalan: The capital of the United Kingdom is Manchester.'
                    : 'e.g. The capital of the United Kingdom is Manchester.'
                }
                className="w-full text-sm font-medium rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* True or False radio buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('admin.trueFalseSelect', true)}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateStatement(idx, { isTrue: true })}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    s.isTrue
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>✓</span>
                  <span>{t('admin.trueOption', true)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateStatement(idx, { isTrue: false })}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    !s.isTrue
                      ? 'border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-500 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>✗</span>
                  <span>{t('admin.falseOption', true)}</span>
                </button>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 block">
                {t('results.explanation', true)} ({adminMode === 'uz' ? 'Ixtiyoriy izoh' : 'Optional'})
              </label>
              <input
                type="text"
                value={s.explanation || ''}
                onChange={(e) => updateStatement(idx, { explanation: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'Masalan: The capital is London, not Manchester.'
                    : 'e.g. The capital is London, not Manchester.'
                }
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white focus:outline-none focus:border-brand-500 text-slate-600"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addStatement}
        leftIcon={<Plus className="w-4 h-4" />}
        className="w-full border-dashed"
      >
        {adminMode === 'uz' ? '+ Yangi fikr qo‘shish' : '+ Add Statement'}
      </Button>
    </div>
  );
};
