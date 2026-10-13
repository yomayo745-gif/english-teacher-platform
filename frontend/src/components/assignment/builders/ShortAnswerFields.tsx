import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface ShortAnswerItem {
  id: string;
  question: string;
  modelAnswer: string;
  points: number;
}

export interface ShortAnswerData {
  questions: ShortAnswerItem[];
}

interface ShortAnswerFieldsProps {
  data: ShortAnswerData;
  onChange: (data: ShortAnswerData) => void;
}

export const ShortAnswerFields: React.FC<ShortAnswerFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const addQuestion = () => {
    const newItem: ShortAnswerItem = {
      id: Math.random().toString(36).substring(7),
      question: '',
      modelAnswer: '',
      points: 5,
    };
    onChange({
      ...data,
      questions: [...data.questions, newItem],
    });
  };

  const removeQuestion = (idx: number) => {
    if (data.questions.length <= 1) return;
    onChange({
      ...data,
      questions: data.questions.filter((_, i) => i !== idx),
    });
  };

  const updateQuestion = (idx: number, patch: Partial<ShortAnswerItem>) => {
    const updated = [...data.questions];
    updated[idx] = { ...updated[idx], ...patch };
    onChange({ ...data, questions: updated });
  };

  const totalPoints = data.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-900 text-xs">
        <MessageSquare className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Qisqa javobli savollar paneli'
              : adminMode === 'en'
              ? 'Short Answer Questions Panel'
              : 'Qisqa javoblar / Short Answer'}
          </span>
          <p className="text-slate-600 leading-relaxed">
            {adminMode === 'uz'
              ? 'O‘quvchilar 1-3 gapdan iborat ixcham yozma javob qaytaradilar. O‘qituvchi namunaviy kalit asosida javobni baholaydi.'
              : adminMode === 'en'
              ? 'Students formulate brief 1-3 sentence answers. Teachers grade submissions against reference model answers.'
              : 'Qisqa yozma javoblar / Brief written answers.'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Savollar ro‘yxati' : 'Questions'} ({data.questions.length})
        </span>
        <span className="text-xs font-semibold text-slate-800 bg-slate-200/70 px-2.5 py-1 rounded-lg border border-slate-300">
          {t('common.score', true)}: {totalPoints} {t('common.pts', true)}
        </span>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {data.questions.map((q, idx) => (
          <div
            key={q.id || idx}
            className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('common.question', true)} #{idx + 1}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">{t('common.points', true)}:</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={q.points}
                    onChange={(e) => updateQuestion(idx, { points: Number(e.target.value) || 1 })}
                    className="w-14 text-xs font-bold text-center rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                {data.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('admin.questionTextLabel', true)} *
              </label>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'Masalan: Why did the author decide to travel across Europe by train?'
                    : 'e.g. Why did the author decide to travel across Europe by train?'
                }
                className="w-full text-sm font-medium rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Model Answer */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('admin.modelAnswer', true)}
              </label>
              <textarea
                rows={2}
                value={q.modelAnswer}
                onChange={(e) => updateQuestion(idx, { modelAnswer: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'Namunaviy to‘g‘ri javob (O‘qituvchi tekshirishda qiyoslashi uchun)...'
                    : 'Model reference answer for teacher review reference...'
                }
                className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white focus:outline-none focus:border-brand-500 text-slate-700"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addQuestion}
        leftIcon={<Plus className="w-4 h-4" />}
        className="w-full border-dashed"
      >
        {t('admin.addQuestion', true)}
      </Button>
    </div>
  );
};
