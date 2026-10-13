import React from 'react';
import { Shuffle, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface MatchingPairItem {
  id: string;
  left: string;
  right: string;
  points: number;
}

export interface MatchingData {
  instructions: string;
  pairs: MatchingPairItem[];
}

interface MatchingFieldsProps {
  data: MatchingData;
  onChange: (data: MatchingData) => void;
}

export const MatchingFields: React.FC<MatchingFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const addPair = () => {
    const newPair: MatchingPairItem = {
      id: Math.random().toString(36).substring(7),
      left: '',
      right: '',
      points: 2,
    };
    onChange({
      ...data,
      pairs: [...data.pairs, newPair],
    });
  };

  const removePair = (idx: number) => {
    if (data.pairs.length <= 1) return;
    onChange({
      ...data,
      pairs: data.pairs.filter((_, i) => i !== idx),
    });
  };

  const updatePair = (idx: number, patch: Partial<MatchingPairItem>) => {
    const updated = [...data.pairs];
    updated[idx] = { ...updated[idx], ...patch };
    onChange({ ...data, pairs: updated });
  };

  const totalPoints = data.pairs.reduce((sum, p) => sum + (p.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-purple-900 text-xs">
        <Shuffle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Moslashtirish topshiriqlari paneli'
              : adminMode === 'en'
              ? 'Matching Pairs Panel'
              : 'Moslashtirish paneli / Matching Panel'}
          </span>
          <p className="text-purple-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'Chap va o‘ng ustundagi elementlarni kiriting. O‘quvchiga o‘ng tomon variantlari avtomatik aralashtirib taqdim etiladi va tizim avto-baholaydi.'
              : adminMode === 'en'
              ? 'Define left items and their corresponding right matches. Options are randomized for students and automatically graded.'
              : 'Moslashtirish / Match items.'}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Ko‘rsatma' : 'Instructions'}
        </label>
        <input
          type="text"
          value={data.instructions}
          onChange={(e) => onChange({ ...data, instructions: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? 'Masalan: Chapdagi so‘zlarni ularning sinonimlari bilan moslashtiring'
              : 'e.g. Match each phrasal verb on the left with its correct meaning on the right'
          }
          className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Pairs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t('admin.matchingPairsEditor', true)} ({data.pairs.length})
          </span>
          <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            {t('common.score', true)}: {totalPoints} {t('common.pts', true)}
          </span>
        </div>

        <div className="space-y-3">
          {data.pairs.map((p, idx) => (
            <div
              key={p.id || idx}
              className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <span className="text-xs font-bold text-slate-500 w-6 shrink-0">
                #{idx + 1}
              </span>

              {/* Left Item */}
              <div className="w-full sm:w-5/12 space-y-1">
                <input
                  type="text"
                  value={p.left}
                  onChange={(e) => updatePair(idx, { left: e.target.value })}
                  placeholder={
                    adminMode === 'uz'
                      ? 'Chap tomon: Masalan: Give up'
                      : 'Left: e.g. Give up'
                  }
                  className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="hidden sm:flex text-slate-400 shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Right Match */}
              <div className="w-full sm:w-5/12 space-y-1">
                <input
                  type="text"
                  value={p.right}
                  onChange={(e) => updatePair(idx, { right: e.target.value })}
                  placeholder={
                    adminMode === 'uz'
                      ? 'O‘ng tomon: Masalan: Stop doing something'
                      : 'Right: e.g. Stop doing something'
                  }
                  className="w-full text-xs font-medium rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500 text-brand-800"
                />
              </div>

              {/* Points & Delete */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={p.points}
                  onChange={(e) => updatePair(idx, { points: Number(e.target.value) || 1 })}
                  className="w-12 text-xs font-bold text-center rounded-lg border border-slate-200 px-2 py-2 bg-white focus:outline-none focus:border-brand-500"
                />
                {data.pairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePair(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addPair}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full border-dashed"
        >
          {t('admin.addPair', true)}
        </Button>
      </div>
    </div>
  );
};
