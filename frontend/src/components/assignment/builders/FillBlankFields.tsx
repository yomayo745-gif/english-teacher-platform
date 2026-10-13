import React from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface FillBlankItem {
  id: string;
  sentence: string;
  acceptedAnswers: string;
  points: number;
}

export interface FillBlankData {
  items: FillBlankItem[];
}

interface FillBlankFieldsProps {
  data: FillBlankData;
  onChange: (data: FillBlankData) => void;
}

export const FillBlankFields: React.FC<FillBlankFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const addItem = () => {
    const newItem: FillBlankItem = {
      id: Math.random().toString(36).substring(7),
      sentence: '',
      acceptedAnswers: '',
      points: 2,
    };
    onChange({
      ...data,
      items: [...data.items, newItem],
    });
  };

  const removeItem = (idx: number) => {
    if (data.items.length <= 1) return;
    onChange({
      ...data,
      items: data.items.filter((_, i) => i !== idx),
    });
  };

  const updateItem = (idx: number, patch: Partial<FillBlankItem>) => {
    const updated = [...data.items];
    updated[idx] = { ...updated[idx], ...patch };
    onChange({ ...data, items: updated });
  };

  const totalPoints = data.items.reduce((sum, item) => sum + (item.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 text-sky-900 text-xs">
        <Edit3 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Bo‘sh joylarni to‘ldirish paneli'
              : adminMode === 'en'
              ? 'Fill in the Blanks Panel'
              : 'Bo‘sh joylarni to‘ldirish / Fill in the Blanks'}
          </span>
          <p className="text-sky-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'Gap ichida tushirib qoldirilgan so‘z o‘rniga [____] yozing. Qabul qilinadigan to‘g‘ri javoblarni vergul bilan kiriting.'
              : adminMode === 'en'
              ? 'Insert [____] where students should fill in missing words. Provide comma-separated accepted variations.'
              : 'Bo‘sh joylarni to‘ldirish / Fill in blanks.'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Mashq gaplari' : 'Sentences'} ({data.items.length})
        </span>
        <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
          {t('common.score', true)}: {totalPoints} {t('common.pts', true)}
        </span>
      </div>

      {/* Items list */}
      <div className="space-y-4">
        {data.items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                #{idx + 1} {adminMode === 'uz' ? 'Gap' : 'Sentence'}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">{t('common.points', true)}:</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={item.points}
                    onChange={(e) => updateItem(idx, { points: Number(e.target.value) || 1 })}
                    className="w-14 text-xs font-bold text-center rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                {data.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sentence input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('admin.fillBlankEditor', true)} *
              </label>
              <input
                type="text"
                value={item.sentence}
                onChange={(e) => updateItem(idx, { sentence: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'Masalan: She [____] to the market every Saturday morning.'
                    : 'e.g. She [____] to the market every Saturday morning.'
                }
                className="w-full text-sm font-medium rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Accepted answers */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('admin.acceptedAnswers', true)} *
              </label>
              <input
                type="text"
                value={item.acceptedAnswers}
                onChange={(e) => updateItem(idx, { acceptedAnswers: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'Masalan: goes, walks'
                    : 'e.g. goes, walks'
                }
                className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500 text-brand-700"
              />
              <span className="text-[11px] text-slate-400 block">
                {adminMode === 'uz'
                  ? 'Katta-kichik harflar e‘tiborga olinmaydi. Bir nechta to‘g‘ri variant bo‘lsa vergul bilan ajrating.'
                  : 'Case-insensitive matching. Separate multiple accepted answers with commas.'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        leftIcon={<Plus className="w-4 h-4" />}
        className="w-full border-dashed"
      >
        {adminMode === 'uz' ? '+ Yana bir gap qo‘shish' : '+ Add Blank Sentence'}
      </Button>
    </div>
  );
};
