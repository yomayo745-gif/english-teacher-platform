import React from 'react';
import { CheckSquare, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface MCQItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface MultipleChoiceData {
  questions: MCQItem[];
}

interface MultipleChoiceFieldsProps {
  data: MultipleChoiceData;
  onChange: (data: MultipleChoiceData) => void;
}

export const MultipleChoiceFields: React.FC<MultipleChoiceFieldsProps> = ({
  data,
  onChange,
}) => {
  const { t, adminMode } = useLanguage();

  const addQuestion = () => {
    const newItem: MCQItem = {
      id: Math.random().toString(36).substring(7),
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      points: 2,
    };
    onChange({
      ...data,
      questions: [...data.questions, newItem],
    });
  };

  const removeQuestion = (qIdx: number) => {
    if (data.questions.length <= 1) return;
    onChange({
      ...data,
      questions: data.questions.filter((_, i) => i !== qIdx),
    });
  };

  const updateQuestion = (qIdx: number, patch: Partial<MCQItem>) => {
    const updated = [...data.questions];
    updated[qIdx] = { ...updated[qIdx], ...patch };
    onChange({ ...data, questions: updated });
  };

  const updateOptionText = (qIdx: number, optIdx: number, val: string) => {
    const item = data.questions[qIdx];
    const oldVal = item.options[optIdx];
    const newOptions = [...item.options];
    newOptions[optIdx] = val;

    let newCorrect = item.correctAnswer;
    if (newCorrect === oldVal) {
      newCorrect = val;
    }

    updateQuestion(qIdx, { options: newOptions, correctAnswer: newCorrect });
  };

  const totalPoints = data.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs">
        <CheckSquare className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Test (Variantlar) paneli'
              : adminMode === 'en'
              ? 'Multiple Choice Quiz Panel'
              : 'Test paneli / Multiple Choice Panel'}
          </span>
          <p className="text-amber-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'Bitta to‘g‘ri javobli test savollari. O‘quvchi topshirishi bilan tizim avtomatik baholaydi va natijani ko‘rsatadi.'
              : adminMode === 'en'
              ? 'Single correct answer quiz items. Instantly auto-graded upon student submission with question breakdown.'
              : 'Test savollari va avto-baho / Multiple choice quiz with instant scoring.'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Savollar ro‘yxati' : 'Question Cards'} ({data.questions.length})
        </span>
        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
          {t('common.score', true)}: {totalPoints} {t('common.pts', true)}
        </span>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {data.questions.map((q, qIdx) => (
          <div
            key={q.id || qIdx}
            className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('common.question', true)} #{qIdx + 1}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">{t('common.points', true)}:</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={q.points}
                    onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) || 1 })}
                    className="w-14 text-xs font-bold text-center rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                {data.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
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
                {t('admin.questionTextLabel', true)}
              </label>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'Masalan: Which sentence is grammatically correct?'
                    : 'e.g. Which sentence is grammatically correct?'
                }
                className="w-full text-sm font-medium rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                {t('admin.multipleChoiceOptions', true)}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = q.correctAnswer === opt;
                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-400'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIdx, { correctAnswer: opt })}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'border-slate-300 hover:border-slate-400 text-transparent'
                        }`}
                        title={isCorrect ? 'Correct Answer ✓' : 'Mark as correct'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="w-full text-xs font-medium bg-transparent focus:outline-none text-slate-800"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation note */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 block">
                {t('results.explanation', true)} ({adminMode === 'uz' ? 'Ixtiyoriy izoh' : 'Optional'})
              </label>
              <input
                type="text"
                value={q.explanation || ''}
                onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'To‘g‘ri javob sababi (o‘quvchi javob berganidan keyin ko‘rinadi)...'
                    : 'Explanation shown to students after answering...'
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
        onClick={addQuestion}
        leftIcon={<Plus className="w-4 h-4" />}
        className="w-full border-dashed"
      >
        {t('admin.addQuestion', true)}
      </Button>
    </div>
  );
};
