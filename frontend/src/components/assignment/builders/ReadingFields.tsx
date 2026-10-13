import React from 'react';
import { BookOpen, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface ReadingQuestionItem {
  id: string;
  question: string;
  questionType?: 'CHOICE' | 'OPEN';
  options: string[];
  correctAnswer: string;
  minWords?: number;
  expectedKeywords?: string;
  points: number;
}

export interface ReadingData {
  passageTitle: string;
  passageText: string;
  questions: ReadingQuestionItem[];
}

interface ReadingFieldsProps {
  data: ReadingData;
  onChange: (data: ReadingData) => void;
}

export const ReadingFields: React.FC<ReadingFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const wordCount = data.passageText.trim()
    ? data.passageText.trim().split(/\s+/).length
    : 0;

  const addQuestion = (type: 'CHOICE' | 'OPEN' = 'CHOICE') => {
    const newItem: ReadingQuestionItem = {
      id: Math.random().toString(36).substring(7),
      question: '',
      questionType: type,
      options: type === 'CHOICE' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
      correctAnswer: type === 'CHOICE' ? 'Option A' : '',
      minWords: type === 'OPEN' ? 20 : undefined,
      expectedKeywords: '',
      points: type === 'OPEN' ? 5 : 2,
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

  const updateQuestion = (idx: number, patch: Partial<ReadingQuestionItem>) => {
    const updated = [...data.questions];
    updated[idx] = { ...updated[idx], ...patch };
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
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 text-orange-900 text-xs">
        <BookOpen className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'O‘qib tushunish paneli'
              : adminMode === 'en'
              ? 'Reading Comprehension Panel'
              : 'O‘qib tushunish / Reading Comprehension'}
          </span>
          <p className="text-orange-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'Matn kiriting va unga oid tushunish savollarini tuzing. O‘quvchi matnni o‘qib savollarga javob beradi.'
              : adminMode === 'en'
              ? 'Provide a reading article or story and formulate comprehension questions based on the text.'
              : 'Matn va savollar / Passage & questions.'}
          </p>
        </div>
      </div>

      {/* 1. Passage Title */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Matn sarlavhasi (Ixtiyoriy)' : 'Passage Title (Optional)'}
        </label>
        <input
          type="text"
          value={data.passageTitle}
          onChange={(e) => onChange({ ...data, passageTitle: e.target.value })}
          placeholder="e.g. The History of the Silk Road"
          className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* 2. Reading Passage Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t('admin.readingPassageEditor', true)} *
          </label>
          <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
            {wordCount} {t('common.words', true)}
          </span>
        </div>
        <textarea
          rows={8}
          value={data.passageText}
          onChange={(e) => onChange({ ...data, passageText: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? 'O‘qish matnini bu yerga joylang yoki yozing...'
              : 'Paste or write the reading passage here...'
          }
          className="w-full text-sm rounded-2xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-serif leading-relaxed"
        />
      </div>

      {/* 3. Comprehension Questions */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {adminMode === 'uz' ? 'Matn yuzasidan savollar' : 'Comprehension Questions'} ({data.questions.length})
          </span>
          <span className="text-xs font-semibold text-orange-800 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
            {t('common.score', true)}: {totalPoints} {t('common.pts', true)}
          </span>
        </div>

        <div className="space-y-4">
          {data.questions.map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4"
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

              {/* Question type switch */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Savol turi:</span>
                <button
                  type="button"
                  onClick={() => {
                    updateQuestion(qIdx, {
                      questionType: 'CHOICE',
                      options: q.options && q.options.length ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
                      correctAnswer: q.correctAnswer || 'Option A',
                    });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    (q.questionType || 'CHOICE') === 'CHOICE'
                      ? 'bg-brand-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🔘 Variantli test (Choice)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateQuestion(qIdx, {
                      questionType: 'OPEN',
                      minWords: q.minWords || 20,
                    });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    q.questionType === 'OPEN'
                      ? 'bg-brand-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ✍️ Erkin yozma javob (Open Answer)
                </button>
              </div>

              {/* Question text */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                  placeholder={
                    q.questionType === 'OPEN'
                      ? 'Masalan: Matnni diqqat bilan o‘qib, bosh qahramonning qarorini tahlil qiling va fikringizni yozing...'
                      : 'Masalan: What is the main idea of paragraph 2?'
                  }
                  className="w-full text-sm font-medium rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Multiple Choice Options */}
              {(q.questionType || 'CHOICE') === 'CHOICE' && (
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
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-slate-400 text-transparent'
                          }`}
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
              )}

              {/* Open-Ended Question Settings */}
              {q.questionType === 'OPEN' && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-700">Minimal so‘zlar soni:</span>
                      <p className="text-[11px] text-slate-400">O‘quvchi javob yozayotganda kiritishi shart bo‘lgan minimal so‘zlar</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={q.minWords || 20}
                        onChange={(e) => updateQuestion(qIdx, { minWords: Math.max(1, Number(e.target.value) || 10) })}
                        className="w-20 text-xs font-bold text-center rounded-lg border border-slate-200 px-2 py-1.5 bg-slate-50 focus:outline-none focus:border-brand-500"
                      />
                      <span className="text-xs font-bold text-slate-600">ta so‘z</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700">O‘qituvchi eslatmasi / Kutilgan kalit fikrlar (Ixtiyoriy):</span>
                    <input
                      type="text"
                      value={q.expectedKeywords || ''}
                      onChange={(e) => updateQuestion(qIdx, { expectedKeywords: e.target.value })}
                      placeholder="e.g. sabab-oqibat, asosiy dalil, xulosa..."
                      className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 mt-1 bg-slate-50 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => addQuestion('CHOICE')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 border-dashed"
          >
            + Test savoli qo‘shish
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => addQuestion('OPEN')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 border-dashed bg-brand-50/50 border-brand-200 text-brand-700 hover:bg-brand-50"
          >
            + Ochiq yozma savol qo‘shish
          </Button>
        </div>
      </div>
    </div>
  );
};
