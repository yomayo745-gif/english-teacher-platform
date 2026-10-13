import React from 'react';
import { BookOpen, Plus, Trash2, HelpCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface VocabWordItem {
  id: string;
  word: string;
  phonetic?: string;
  translation: string;
  example?: string;
  points: number;
}

export interface VocabularyData {
  words: VocabWordItem[];
  instructions: string;
}

interface VocabularyFieldsProps {
  data: VocabularyData;
  onChange: (data: VocabularyData) => void;
}

export const VocabularyFields: React.FC<VocabularyFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const addWord = () => {
    const newItem: VocabWordItem = {
      id: Math.random().toString(36).substring(7),
      word: '',
      phonetic: '',
      translation: '',
      example: '',
      points: 2,
    };
    onChange({
      ...data,
      words: [...data.words, newItem],
    });
  };

  const removeWord = (idx: number) => {
    if (data.words.length <= 1) return;
    onChange({
      ...data,
      words: data.words.filter((_, i) => i !== idx),
    });
  };

  const updateWord = (idx: number, patch: Partial<VocabWordItem>) => {
    const updated = [...data.words];
    updated[idx] = { ...updated[idx], ...patch };
    onChange({ ...data, words: updated });
  };

  const totalPoints = data.words.reduce((sum, w) => sum + (w.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs">
        <BookOpen className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Lug‘at va so‘z boyligi paneli'
              : adminMode === 'en'
              ? 'Vocabulary Practice Panel'
              : 'Lug‘at paneli / Vocabulary Panel'}
          </span>
          <p className="text-emerald-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'O‘quvchilar ushbu so‘zlarning ma‘nosi, tarjimasi va ishlatilishini o‘rganib topshiriqni bajaradilar. Avtomatik baholash qo‘llab-quvvatlanadi.'
              : adminMode === 'en'
              ? 'Students review targeted vocabulary, definitions and sample sentences. Instant auto-scoring verifies student recall.'
              : 'Lug‘at mashqi / Vocabulary check.'}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz'
            ? 'Vazifa ko‘rsatmasi'
            : adminMode === 'en'
            ? 'Task Instructions'
            : 'Ko‘rsatma / Instructions'}
        </label>
        <input
          type="text"
          value={data.instructions}
          onChange={(e) => onChange({ ...data, instructions: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? 'Masalan: Quyidagi so‘zlarning ma‘nosini o‘rganing va namunaviy gap tuzing'
              : 'e.g. Study these vocabulary words and write sentences using each word'
          }
          className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Word List Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t('admin.wordListEditor', true)} ({data.words.length})
          </span>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {t('common.score', true)}: {totalPoints} {t('common.pts', true)}
          </span>
        </div>

        <div className="space-y-3">
          {data.words.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3 relative group"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-700">
                  #{idx + 1} {t('lessons.wordPlaceholder', true)}
                </span>
                {data.words.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWord(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                    title={t('common.remove', true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    {adminMode === 'uz' ? 'Inglizcha so‘z *' : 'English Word *'}
                  </label>
                  <input
                    type="text"
                    value={item.word}
                    onChange={(e) => updateWord(idx, { word: e.target.value })}
                    placeholder="e.g. Resilience"
                    className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    {adminMode === 'uz' ? 'Transkripsiya (Ixtiyoriy)' : 'Phonetic (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={item.phonetic || ''}
                    onChange={(e) => updateWord(idx, { phonetic: e.target.value })}
                    placeholder="/rɪˈzɪl.jəns/"
                    className="w-full text-xs font-mono rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    {adminMode === 'uz' ? 'O‘zbekcha tarjimasi *' : 'Uzbek Translation *'}
                  </label>
                  <input
                    type="text"
                    value={item.translation}
                    onChange={(e) => updateWord(idx, { translation: e.target.value })}
                    placeholder="Chidamlilik, bardoshlilik"
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    {adminMode === 'uz' ? 'Namunaviy gap (Example)' : 'Sample Sentence'}
                  </label>
                  <input
                    type="text"
                    value={item.example || ''}
                    onChange={(e) => updateWord(idx, { example: e.target.value })}
                    placeholder="e.g. Her courage and resilience inspired everyone."
                    className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    {t('common.points', true)}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={item.points}
                    onChange={(e) => updateWord(idx, { points: Number(e.target.value) || 1 })}
                    className="w-full text-xs font-bold text-center rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addWord}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full border-dashed"
        >
          {t('admin.addWordRow', true)}
        </Button>
      </div>
    </div>
  );
};
