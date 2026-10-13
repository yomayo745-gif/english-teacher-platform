import React from 'react';
import { Languages, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface TranslationSentenceItem {
  id: string;
  sourceText: string;
  referenceTranslation: string;
  points: number;
}

export interface TranslationData {
  direction: 'EN_TO_UZ' | 'UZ_TO_EN';
  sentences: TranslationSentenceItem[];
}

interface TranslationFieldsProps {
  data: TranslationData;
  onChange: (data: TranslationData) => void;
}

export const TranslationFields: React.FC<TranslationFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const addSentence = () => {
    const newItem: TranslationSentenceItem = {
      id: Math.random().toString(36).substring(7),
      sourceText: '',
      referenceTranslation: '',
      points: 5,
    };
    onChange({
      ...data,
      sentences: [...data.sentences, newItem],
    });
  };

  const removeSentence = (idx: number) => {
    if (data.sentences.length <= 1) return;
    onChange({
      ...data,
      sentences: data.sentences.filter((_, i) => i !== idx),
    });
  };

  const updateSentence = (idx: number, patch: Partial<TranslationSentenceItem>) => {
    const updated = [...data.sentences];
    updated[idx] = { ...updated[idx], ...patch };
    onChange({ ...data, sentences: updated });
  };

  const totalPoints = data.sentences.reduce((sum, s) => sum + (s.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-50/70 border border-violet-200/80 text-violet-900 text-xs">
        <Languages className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Tarjima mashqlari paneli'
              : adminMode === 'en'
              ? 'Translation Practice Panel'
              : 'Tarjima paneli / Translation Panel'}
          </span>
          <p className="text-violet-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'O‘quvchilar berilgan gaplarni belgilangan tilga aniq tarjima qiladilar. Tizim kiritilgan namunaviy tarjima kaliti asosida tekshirish imkonini beradi.'
              : adminMode === 'en'
              ? 'Students translate source sentences into the target language. Teachers set gold-standard reference translations for grading.'
              : 'Gaplarni tarjima qilish / Sentence translation.'}
          </p>
        </div>
      </div>

      {/* Direction Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t('admin.translationDirection', true)}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...data, direction: 'EN_TO_UZ' })}
            className={`p-3.5 rounded-2xl border text-center transition-all font-semibold text-xs flex items-center justify-center gap-2 ${
              data.direction === 'EN_TO_UZ'
                ? 'border-violet-600 bg-violet-50 text-violet-950 shadow-xs ring-1 ring-violet-500'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <span>🇬🇧 {adminMode === 'uz' ? 'Inglizcha' : 'English'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-violet-500" />
            <span>🇺🇿 {adminMode === 'uz' ? 'O‘zbekcha' : 'Uzbek'}</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...data, direction: 'UZ_TO_EN' })}
            className={`p-3.5 rounded-2xl border text-center transition-all font-semibold text-xs flex items-center justify-center gap-2 ${
              data.direction === 'UZ_TO_EN'
                ? 'border-violet-600 bg-violet-50 text-violet-950 shadow-xs ring-1 ring-violet-500'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <span>🇺🇿 {adminMode === 'uz' ? 'O‘zbekcha' : 'Uzbek'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-violet-500" />
            <span>🇬🇧 {adminMode === 'uz' ? 'Inglizcha' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Sentences List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {adminMode === 'uz' ? 'Tarjima qilinadigan gaplar' : 'Sentences to Translate'} ({data.sentences.length})
          </span>
          <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200">
            {t('common.score', true)}: {totalPoints} {t('common.pts', true)}
          </span>
        </div>

        <div className="space-y-3">
          {data.sentences.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  #{idx + 1} {adminMode === 'uz' ? 'Gap' : 'Sentence'}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold">{t('common.points', true)}:</span>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={item.points}
                      onChange={(e) => updateSentence(idx, { points: Number(e.target.value) || 1 })}
                      className="w-14 text-xs font-bold text-center rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  {data.sentences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSentence(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Source Sentence */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  {data.direction === 'EN_TO_UZ'
                    ? (adminMode === 'uz' ? 'Asl gap (Inglizcha) *' : 'Source Sentence (English) *')
                    : (adminMode === 'uz' ? 'Asl gap (O‘zbekcha) *' : 'Source Sentence (Uzbek) *')}
                </label>
                <input
                  type="text"
                  value={item.sourceText}
                  onChange={(e) => updateSentence(idx, { sourceText: e.target.value })}
                  placeholder={
                    data.direction === 'EN_TO_UZ'
                      ? 'e.g. He has been studying English for five years.'
                      : 'Masalan: U besh yildan beri ingliz tilini o‘rganmoqda.'
                  }
                  className="w-full text-xs font-medium rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Reference Translation */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  {t('admin.modelAnswer', true)} *
                </label>
                <input
                  type="text"
                  value={item.referenceTranslation}
                  onChange={(e) => updateSentence(idx, { referenceTranslation: e.target.value })}
                  placeholder={
                    data.direction === 'EN_TO_UZ'
                      ? 'Masalan: U besh yildan buyon ingliz tilini o‘rganib kelmoqda.'
                      : 'e.g. He has been studying English for five years.'
                  }
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500 text-slate-700"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addSentence}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full border-dashed"
        >
          {adminMode === 'uz' ? '+ Yana bir gap qo‘shish' : '+ Add Sentence'}
        </Button>
      </div>
    </div>
  );
};
