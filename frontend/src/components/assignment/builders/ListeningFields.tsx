import React from 'react';
import { Volume2, Plus, Trash2, CheckCircle2, FileText, Headphones } from 'lucide-react';
import { FileUploader } from '../../ui/FileUploader';
import { AudioPlayer } from '../../ui/AudioPlayer';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../context/LanguageContext';

export interface ListeningQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

export interface ListeningData {
  audioUrl: string;
  playLimit: number;
  showTranscript: boolean;
  transcript: string;
  questions: ListeningQuestionItem[];
}

interface ListeningFieldsProps {
  data: ListeningData;
  onChange: (data: ListeningData) => void;
}

export const ListeningFields: React.FC<ListeningFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const update = (patch: Partial<ListeningData>) => {
    onChange({ ...data, ...patch });
  };

  const addQuestion = () => {
    const newItem: ListeningQuestionItem = {
      id: Math.random().toString(36).substring(7),
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      points: 2,
    };
    update({ questions: [...data.questions, newItem] });
  };

  const removeQuestion = (idx: number) => {
    if (data.questions.length <= 1) return;
    update({ questions: data.questions.filter((_, i) => i !== idx) });
  };

  const updateQuestion = (idx: number, patch: Partial<ListeningQuestionItem>) => {
    const updated = [...data.questions];
    updated[idx] = { ...updated[idx], ...patch };
    update({ questions: updated });
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
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 text-cyan-900 text-xs">
        <Headphones className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Tinglab tushunish (Audio) paneli'
              : adminMode === 'en'
              ? 'Listening Comprehension Panel'
              : 'Tinglab tushunish / Listening Comprehension'}
          </span>
          <p className="text-cyan-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'Audio yozuv yuklang, o‘quvchiga audioni necha marta eshitishga ruxsat berilishini belgilang va savollar tuzing.'
              : adminMode === 'en'
              ? 'Upload audio lecture or dialogue, configure play restrictions, transcript visibility and comprehension questions.'
              : 'Audio tinglash va savollar / Audio playback and comprehension.'}
          </p>
        </div>
      </div>

      {/* 1. Audio Upload */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Audio fayl (Majburiy) *' : 'Audio File (Required) *'}
        </label>
        <FileUploader
          initialUrl={data.audioUrl}
          accept="audio/*"
          onFileUploaded={(url) => update({ audioUrl: url })}
        />
        {data.audioUrl && (
          <div className="pt-2">
            <AudioPlayer src={data.audioUrl} title="Uploaded Audio Preview" />
          </div>
        )}
      </div>

      {/* 2. Play Limits & Transcript Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
        {/* Play Limit */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('admin.audioPlayLimitLabel', true)}
          </label>
          <select
            value={data.playLimit}
            onChange={(e) => update({ playLimit: Number(e.target.value) })}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
          >
            <option value={0}>{t('admin.unlimitedPlays', true)}</option>
            <option value={1}>{t('admin.playOnly1', true)}</option>
            <option value={2}>{t('admin.plays2', true)}</option>
            <option value={3}>{t('admin.plays3', true)}</option>
          </select>
          <span className="text-[11px] text-slate-400 block">
            {adminMode === 'uz' ? 'Imtihon yoki mashq uchun eshitish cheklovi' : 'Audio playback constraint for students'}
          </span>
        </div>

        {/* Transcript Toggle */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('admin.showAudioTranscript', true)}
          </label>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              {data.showTranscript
                ? (adminMode === 'uz' ? 'O‘quvchiga ko‘rinadi' : 'Visible to students')
                : (adminMode === 'uz' ? 'O‘quvchidan yashirin' : 'Hidden from students')}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.showTranscript}
                onChange={(e) => update({ showTranscript: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Transcript Editor */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-cyan-600" />
          <span>{t('admin.audioTranscriptLabel', true)}</span>
        </label>
        <textarea
          rows={3}
          value={data.transcript}
          onChange={(e) => update({ transcript: e.target.value })}
          placeholder={t('admin.audioTranscriptPlaceholder', true)}
          className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white focus:outline-none focus:border-brand-500 leading-relaxed font-mono"
        />
      </div>

      {/* 4. Comprehension Questions */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {adminMode === 'uz' ? 'Audio savollari' : 'Listening Questions'} ({data.questions.length})
          </span>
          <span className="text-xs font-semibold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
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

              {/* Question text */}
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                placeholder={
                  adminMode === 'uz'
                    ? 'Masalan: What time did the train arrive according to the speaker?'
                    : 'e.g. What time did the train arrive according to the speaker?'
                }
                className="w-full text-sm font-medium rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
              />

              {/* Options */}
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
    </div>
  );
};
