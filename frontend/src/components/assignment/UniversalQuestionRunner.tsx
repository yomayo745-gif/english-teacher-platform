import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Check,
  RotateCcw,
  BookOpen,
  Image as ImageIcon,
  Volume2,
  FileText,
  PenTool
} from 'lucide-react';
import { WordCounter } from '../ui/WordCounter';
import { AudioPlayer } from '../ui/AudioPlayer';
import { AudioRecorder } from '../ui/AudioRecorder';
import { FileUploader } from '../ui/FileUploader';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../i18n/translations';
import { SavedAnswer } from '../../types';

interface UniversalQuestionRunnerProps {
  question: any;
  index: number;
  answer?: SavedAnswer;
  onChange: (answer: SavedAnswer) => void;
  audioPlayLimitSetting?: number;
  showTranscriptSetting?: boolean;
}

export const UniversalQuestionRunner: React.FC<UniversalQuestionRunnerProps> = ({
  question,
  index,
  answer,
  onChange,
  audioPlayLimitSetting = 0,
  showTranscriptSetting = false,
}) => {
  const { mode, t, tr } = useLanguage();
  const [text, setText] = useState<string>(answer?.text_answer || '');
  const [selectedOption, setSelectedOption] = useState<string | null>(
    answer?.selected_options ? String(answer.selected_options) : null
  );
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>(
    (answer?.selected_options as Record<string, string>) || {}
  );
  const [selectedWords, setSelectedWords] = useState<string[]>(() => {
    if (answer?.text_answer && question.type === 'SENTENCE_BUILDER') {
      return answer.text_answer.split(' ').filter(Boolean);
    }
    return [];
  });

  // Sync state when answer prop changes
  useEffect(() => {
    setText(answer?.text_answer || '');
    setSelectedOption(answer?.selected_options ? String(answer.selected_options) : null);
    setMatchedPairs((answer?.selected_options as Record<string, string>) || {});
    if (answer?.text_answer && question.type === 'SENTENCE_BUILDER') {
      setSelectedWords(answer.text_answer.split(' ').filter(Boolean));
    }
  }, [answer?.text_answer, answer?.selected_options, question.type]);

  const sentenceWords: string[] = React.useMemo(() => {
    if (question.type === 'SENTENCE_BUILDER' && question.options) {
      if (Array.isArray(question.options)) return question.options;
      if (Array.isArray(question.options.words)) return question.options.words;
    }
    return [];
  }, [question]);

  const countWords = (str: string): number => {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    const wc = countWords(val);
    onChange({
      ...answer,
      text_answer: val,
      word_count: wc,
    });
  };

  const handleSelectOption = (opt: string) => {
    setSelectedOption(opt);
    onChange({
      ...answer,
      selected_options: opt,
      text_answer: opt,
    });
  };

  const handleMatchingChange = (leftItem: string, chosenRight: string) => {
    const updated = { ...matchedPairs, [leftItem]: chosenRight };
    setMatchedPairs(updated);
    onChange({
      ...answer,
      selected_options: updated,
    });
  };

  const handleAddSentenceWord = (word: string, originalIndex: number) => {
    const nextSelected = [...selectedWords, word];
    setSelectedWords(nextSelected);
    const fullSentence = nextSelected.join(' ');
    onChange({
      ...answer,
      text_answer: fullSentence,
      word_count: nextSelected.length,
    });
  };

  const handleRemoveSentenceWord = (idx: number) => {
    const nextSelected = selectedWords.filter((_, i) => i !== idx);
    setSelectedWords(nextSelected);
    const fullSentence = nextSelected.join(' ');
    onChange({
      ...answer,
      text_answer: fullSentence,
      word_count: nextSelected.length,
    });
  };

  const currentWordCount = countWords(text);

  // Type metadata
  const typeMeta = (translations.taskTypes as any)[question.type] || {
    en: question.type?.replace(/_/g, ' ') || 'Task',
    uz: 'Topshiriq',
    bi: `${question.type?.replace(/_/g, ' ')} / Topshiriq`,
    guide: 'Complete the task as instructed.',
    guideUz: 'Topshiriqni ko‘rsatmalarga asosan bajaring.',
  };

  const typeName = tr(typeMeta);
  const typeGuide = mode === 'uz' ? typeMeta.guideUz : mode === 'en' ? typeMeta.guide : `${typeMeta.guideUz} / ${typeMeta.guide}`;

  const hasOptions = Array.isArray(question.options) && question.options.length > 0;
  const isOptionsType = hasOptions && (
    question.type === 'MULTIPLE_CHOICE' ||
    question.type === 'VOCABULARY' ||
    question.type === 'READING' ||
    question.type === 'LISTENING' ||
    question.type === 'QUIZ'
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center border border-brand-100">
            {index + 1}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-800 tracking-wide">
              {typeName}
            </span>
            {question.is_required && (
              <span className="text-[10px] text-rose-500 font-bold">*majburiy</span>
            )}
          </div>
        </div>
        <div className="text-xs font-medium text-slate-600 px-2.5 py-0.5 rounded-full bg-slate-100 flex items-center gap-1 shrink-0">
          <span>{question.points} {t('common.points')}</span>
        </div>
      </div>

      {/* Task guidance banner */}
      <div className="p-3 bg-slate-50/90 border border-slate-200/70 rounded-xl text-xs flex items-start gap-2.5 text-slate-600">
        <HelpCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <span className="font-semibold text-slate-700">{typeGuide}</span>
        </div>
      </div>

      {/* Question prompt */}
      <div>
        <h3 className="text-base font-bold text-slate-900 leading-snug">{question.question_text}</h3>
        {question.description && (
          <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {question.description}
          </p>
        )}
      </div>

      {/* Reading passage */}
      {question.passage && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed max-h-80 overflow-y-auto space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>{t('homework.readingPassage')}</span>
          </div>
          <p className="whitespace-pre-line text-slate-700 leading-relaxed">{question.passage}</p>
        </div>
      )}

      {/* Media: Image preview */}
      {question.media_url && question.media_type === 'image' && (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-80 flex items-center justify-center">
          <img
            src={question.media_url}
            alt="Task reference"
            className="w-full h-full object-contain max-h-80"
          />
        </div>
      )}

      {/* Media: Audio Player for Listening */}
      {question.media_url && question.media_type === 'audio' && (
        <AudioPlayer
          src={question.media_url}
          title={question.question_text || t('taskTypes.LISTENING.en')}
          maxPlays={audioPlayLimitSetting}
          currentPlays={answer?.audio_plays_count || 0}
          onPlayCountUpdate={(cnt) => {
            onChange({ ...answer, audio_plays_count: cnt });
          }}
          transcript={question.transcript}
          allowTranscript={showTranscriptSetting}
        />
      )}

      {/* ============================================================== */}
      {/* INPUT FIELD RENDERING (GUARANTEED INPUT FOR EVERY SINGLE TYPE) */}
      {/* ============================================================== */}

      {/* 1. MULTIPLE CHOICE (Options available) */}
      {isOptionsType && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {(question.options || []).map((opt: string, optIdx: number) => {
            const isSelected = selectedOption === opt;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm text-left transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold shadow-xs ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                }`}
              >
                <span>{opt}</span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all ${
                    isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. TRUE / FALSE */}
      {question.type === 'TRUE_FALSE' && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { en: 'True', uz: 'To‘g‘ri', bi: 'To‘g‘ri / True', val: 'true' },
            { en: 'False', uz: 'Noto‘g‘ri', bi: 'Noto‘g‘ri / False', val: 'false' },
          ].map((item) => {
            const isSelected = String(selectedOption).toLowerCase() === item.val;
            return (
              <button
                key={item.val}
                type="button"
                onClick={() => handleSelectOption(item.val)}
                className={`py-3.5 px-4 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm ring-1 ring-brand-500 font-bold'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm font-semibold">{tr(item)}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. FILL IN THE BLANK */}
      {question.type === 'FILL_BLANK' && (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-700">
            Javobingizni kiriting:
          </label>
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Javob so‘zni bu yerga yozing..."
            className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-slate-900 bg-white"
          />
        </div>
      )}

      {/* 4. MATCHING */}
      {question.type === 'MATCHING' && question.options && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-600 font-medium">
            {tr({
              en: 'Match each item on the left with the correct option:',
              uz: 'Chapdagi elementni o‘ngdagi to‘g‘ri variant bilan moslashtiring:',
              bi: 'Chapdagi elementni moslashtiring / Match each item:',
            })}
          </p>
          <div className="space-y-2">
            {(question.options?.pairs || question.options || []).map((pair: any, pIdx: number) => {
              const leftItem = typeof pair === 'object' ? pair.left || Object.keys(pair)[0] : pair;
              const rightOptions = (question.options?.right_options || question.options?.pairs?.map((p: any) => p.right) || []);
              return (
                <div key={pIdx} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-xs font-semibold text-slate-800 sm:w-1/2">{leftItem}</span>
                  <select
                    value={matchedPairs[leftItem] || ''}
                    onChange={(e) => handleMatchingChange(leftItem, e.target.value)}
                    className="w-full sm:w-1/2 text-xs rounded-lg border border-slate-200 bg-white p-2 text-slate-800 focus:outline-none focus:border-brand-500 font-medium"
                  >
                    <option value="">
                      {tr({
                        en: '-- Select match --',
                        uz: '-- Mos variantni tanlang --',
                        bi: '-- Mos variant / Select match --',
                      })}
                    </option>
                    {rightOptions.map((opt: string, optIdx: number) => (
                      <option key={optIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SENTENCE BUILDER */}
      {question.type === 'SENTENCE_BUILDER' && (
        <div className="space-y-4 pt-2">
          <div className="min-h-[52px] p-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/30 flex flex-wrap gap-1.5 items-center">
            {selectedWords.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                {tr({
                  en: 'Click words below in order to build the sentence...',
                  uz: 'Gap tuzish uchun quyidagi so‘zlarni ketma-ket bosing...',
                  bi: 'So‘zlarni ketma-ket bosing / Click words in order...',
                })}
              </span>
            ) : (
              selectedWords.map((word, wIdx) => (
                <button
                  key={wIdx}
                  type="button"
                  onClick={() => handleRemoveSentenceWord(wIdx)}
                  className="px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 active:scale-95 transition-all shadow-xs"
                >
                  {word} ×
                </button>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {sentenceWords.map((word, wIdx) => {
              return (
                <button
                  key={wIdx}
                  type="button"
                  onClick={() => handleAddSentenceWord(word, wIdx)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-brand-400 text-xs font-semibold text-slate-700 active:scale-95 transition-all shadow-xs"
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. SPEAKING */}
      {question.type === 'SPEAKING' && (
        <div className="pt-2">
          <AudioRecorder
            initialAudioUrl={answer?.audio_url}
            initialDuration={answer?.audio_duration}
            onAudioRecorded={(url, duration) => {
              onChange({
                ...answer,
                audio_url: url,
                audio_duration: duration,
              });
            }}
          />
        </div>
      )}

      {/* 7. PHOTO HOMEWORK */}
      {question.type === 'PHOTO' && (
        <div className="pt-2">
          <FileUploader
            initialUrl={answer?.file_url}
            onFileUploaded={(url) => {
              onChange({
                ...answer,
                file_url: url,
              });
            }}
          />
        </div>
      )}

      {/* 8. WRITING / ESSAY / PICTURE DESCRIPTION */}
      {(question.type === 'WRITING' || question.type === 'PICTURE_DESCRIPTION') && (
        <div className="space-y-3 pt-2">
          <textarea
            value={text}
            onChange={handleTextChange}
            rows={7}
            placeholder="Insho yoki fikringizni bu yerga yozing..."
            className="w-full text-sm rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all leading-relaxed placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <WordCounter
              count={currentWordCount}
              minWords={question.min_words}
              maxWords={question.max_words}
            />
            {text && (
              <span className="text-[11px] text-slate-400">
                {t('homework.autosaving')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 9. READING (Open-ended answer without multiple-choice options) */}
      {question.type === 'READING' && !hasOptions && (
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-amber-900">
            Matn yuzasidan javobingizni yozing:
          </label>
          <textarea
            value={text}
            onChange={handleTextChange}
            rows={4}
            placeholder="Matndan xulosa qilib yoki savolga o‘z so‘zlaringiz bilan javob yozing..."
            className="w-full text-sm rounded-xl border border-amber-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all leading-relaxed placeholder:text-slate-400 bg-white"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">{currentWordCount} ta so‘z yozildi</span>
            {text && (
              <span className="text-[11px] text-slate-400">
                {t('homework.autosaving')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 10. SHORT ANSWER / TRANSLATION */}
      {(question.type === 'SHORT_ANSWER' || question.type === 'TRANSLATION') && !isOptionsType && (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-700">
            Javobingiz:
          </label>
          <textarea
            value={text}
            onChange={handleTextChange}
            rows={3}
            placeholder="Javob yoki tarjimani bu yerga yozing..."
            className="w-full text-sm rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all leading-relaxed placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{currentWordCount} ta so‘z</span>
            {text && <span className="text-[11px] text-slate-400">{t('homework.autosaving')}</span>}
          </div>
        </div>
      )}

      {/* 11. UNIVERSAL FALLBACK (Ensures NO question ever lacks an input field) */}
      {!isOptionsType &&
        question.type !== 'TRUE_FALSE' &&
        question.type !== 'FILL_BLANK' &&
        question.type !== 'MATCHING' &&
        question.type !== 'SENTENCE_BUILDER' &&
        question.type !== 'SPEAKING' &&
        question.type !== 'PHOTO' &&
        question.type !== 'WRITING' &&
        question.type !== 'PICTURE_DESCRIPTION' &&
        question.type !== 'SHORT_ANSWER' &&
        question.type !== 'TRANSLATION' &&
        (question.type !== 'READING' || hasOptions) && (
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              Javobingizni yozing:
            </label>
            <textarea
              value={text}
              onChange={handleTextChange}
              rows={4}
              placeholder="Javobingizni bu yerga yozing..."
              className="w-full text-sm rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all leading-relaxed placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{currentWordCount} ta so‘z</span>
              {text && <span className="text-[11px] text-slate-400">{t('homework.autosaving')}</span>}
            </div>
          </div>
        )}
    </div>
  );
};
export default UniversalQuestionRunner;
