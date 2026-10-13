import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Play,
  Pause,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { UniversalQuestionRunner } from '../../components/assignment/UniversalQuestionRunner';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SavedAnswer } from '../../types';

interface SectionMeta {
  key: string;
  nameUz: string;
  nameEn: string;
  emoji: string;
  questionIds: string[];
}

export const StudentTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, tr, localizeError, mode } = useLanguage();

  const [data, setData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);

  // Focus Study Timer (2-3 hours tracking)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);

  // Multi-section Navigation
  const [activeSection, setActiveSection] = useState<string>('ALL');

  const debounceTimerRef = useRef<any>(null);

  // Initialize timer from localStorage
  useEffect(() => {
    if (!id) return;
    const savedTime = localStorage.getItem(`hw_study_timer_${id}`);
    if (savedTime) {
      setElapsedSeconds(parseInt(savedTime, 10) || 0);
    }
  }, [id]);

  // Run timer interval
  useEffect(() => {
    if (!isTimerActive || submissionSuccess) return;
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (id && next % 5 === 0) {
          localStorage.setItem(`hw_study_timer_${id}`, String(next));
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isTimerActive, submissionSuccess, id]);

  // Format timer
  const formatTimer = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!id) return;
    const fetchAssignment = async () => {
      try {
        const res = await api.getStudentAssignment(id);
        setData(res);

        // Load existing answers into state (and check localStorage fallback)
        const localAnswersRaw = localStorage.getItem(`hw_draft_answers_${id}`);
        const localAnswers = localAnswersRaw ? JSON.parse(localAnswersRaw) : {};

        const initialAnswers: Record<string, SavedAnswer> = {};
        res.questions.forEach((q: any) => {
          if (q.saved_answer) {
            initialAnswers[q.id] = q.saved_answer;
          } else if (localAnswers[q.id]) {
            initialAnswers[q.id] = localAnswers[q.id];
          } else {
            initialAnswers[q.id] = {
              text_answer: '',
              selected_options: null,
              audio_url: null,
              file_url: null,
              word_count: 0,
            };
          }
        });
        setAnswers(initialAnswers);

        // If already submitted
        if (res.submission && res.submission.status !== 'DRAFT') {
          setSubmissionSuccess({
            status: res.submission.status,
            submitted_at: res.submission.submitted_at,
            total_score: res.submission.total_score,
            message: 'Homework has been submitted',
          });
        }
      } catch (err: any) {
        setErrorMsg(localizeError(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignment();
  }, [id]);

  // Debounced autosave
  const triggerAutosave = (newAnswers: Record<string, SavedAnswer>) => {
    if (id) {
      localStorage.setItem(`hw_draft_answers_${id}`, JSON.stringify(newAnswers));
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      if (!id || submissionSuccess) return;
      try {
        const payload = Object.entries(newAnswers).map(([qId, ans]) => ({
          question_id: qId,
          ...ans,
        }));
        await api.saveDraft(id, payload);
        setSaveStatusMsg('Qoralama saqlandi ✓');
        setTimeout(() => setSaveStatusMsg(null), 3000);
      } catch {}
    }, 1500);
  };

  const handleAnswerChange = (questionId: string, updatedAnswer: SavedAnswer) => {
    const updated = {
      ...answers,
      [questionId]: updatedAnswer,
    };
    setAnswers(updated);
    triggerAutosave(updated);
  };

  const handleManualSaveDraft = async () => {
    if (!id) return;
    setIsSavingDraft(true);
    setErrorMsg(null);
    try {
      const payload = Object.entries(answers).map(([qId, ans]) => ({
        question_id: qId,
        ...ans,
      }));
      await api.saveDraft(id, payload);
      setSaveStatusMsg('Barcha javoblar saqlandi ✓');
      setTimeout(() => setSaveStatusMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(localizeError(err));
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Classify questions into sections
  const getSections = (questions: any[]): SectionMeta[] => {
    const map: Record<string, SectionMeta> = {};

    questions.forEach((q) => {
      let key = 'GRAMMAR';
      let nameUz = 'Grammatika & Mashqlar';
      let nameEn = 'Grammar & Exercises';
      let emoji = '🧩';

      if (q.type === 'VOCABULARY') {
        key = 'VOCABULARY';
        nameUz = 'Lug‘at boyligi';
        nameEn = 'Vocabulary Drill';
        emoji = '📚';
      } else if (q.type === 'READING') {
        key = 'READING';
        nameUz = 'O‘qish va Tushunish';
        nameEn = 'Reading Comprehension';
        emoji = '📖';
      } else if (q.type === 'LISTENING') {
        key = 'LISTENING';
        nameUz = 'Tinglab tushunish';
        nameEn = 'Listening Practice';
        emoji = '🎧';
      } else if (q.type === 'WRITING' || q.type === 'PICTURE_DESCRIPTION') {
        key = 'WRITING';
        nameUz = 'Insho va Yozma ish';
        nameEn = 'Writing & Essay';
        emoji = '✍️';
      } else if (q.type === 'SPEAKING') {
        key = 'SPEAKING';
        nameUz = 'Og‘zaki nutq';
        nameEn = 'Speaking Voice Note';
        emoji = '🎙️';
      } else if (q.type === 'PHOTO') {
        key = 'PHOTO';
        nameUz = 'Daftardagi mashqlar';
        nameEn = 'Workbook Photo';
        emoji = '📸';
      }

      if (!map[key]) {
        map[key] = { key, nameUz, nameEn, emoji, questionIds: [] };
      }
      map[key].questionIds.push(q.id);
    });

    return Object.values(map);
  };

  const isQuestionAnswered = (qId: string, q: any): boolean => {
    const ans = answers[qId];
    if (!ans) return false;
    if (ans.text_answer && ans.text_answer.trim().length > 0) return true;
    if (ans.selected_options !== null && ans.selected_options !== undefined) return true;
    if (ans.audio_url) return true;
    if (ans.file_url) return true;
    return false;
  };

  const isSectionComplete = (sec: SectionMeta): boolean => {
    return sec.questionIds.every((qId) => {
      const q = data?.questions.find((item: any) => item.id === qId);
      return isQuestionAnswered(qId, q);
    });
  };

  const getValidationIssues = (): string[] => {
    if (!data?.questions) return [];
    const issues: string[] = [];
    for (const q of data.questions) {
      const ans = answers[q.id];
      const wordCount = ans?.word_count || 0;

      // Check min words requirement
      if (q.min_words && wordCount < q.min_words) {
        issues.push(
          `${q.order}-savol (${q.type}): kamida ${q.min_words} ta so‘z talab qilinadi (hozir: ${wordCount} ta).`
        );
      }

      // Check required question completion
      if (q.is_required && !isQuestionAnswered(q.id, q)) {
        issues.push(`${q.order}-savol: majburiy savolga javob yozilmagan.`);
      }
    }
    return issues;
  };

  const validateAnswers = (): boolean => {
    const issues = getValidationIssues();
    if (issues.length > 0) {
      setErrorMsg(issues[0]);
      return false;
    }
    return true;
  };

  const handleConfirmSubmit = async () => {
    if (!id) return;
    const issues = getValidationIssues();
    if (issues.length > 0) {
      setSubmitError(issues[0]);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = Object.entries(answers).map(([qId, ans]) => ({
        question_id: qId,
        ...ans,
      }));
      const res = await api.submitHomework(id, payload);
      setShowConfirmModal(false);
      setSubmissionSuccess(res);
      // Clean up localStorage timer
      localStorage.removeItem(`hw_study_timer_${id}`);
      localStorage.removeItem(`hw_draft_answers_${id}`);
    } catch (err: any) {
      setSubmitError(localizeError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pt-4">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-20 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">{errorMsg || t('homework.assignmentNotFound')}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/tasks')} className="mt-4">
          Vazifalar ro‘yxatiga qaytish
        </Button>
      </div>
    );
  }

  const { assignment, questions } = data;
  const sections = getSections(questions);
  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q: any) => isQuestionAnswered(q.id, q)).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Render Submission Success Screen
  if (submissionSuccess) {
    const formattedSubmitTime = submissionSuccess.submitted_at
      ? new Date(submissionSuccess.submitted_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : t('common.justNow');

    return (
      <div className="py-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ✓ Uyga vazifa muvaffaqiyatli topshirildi!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Barcha javoblaringiz qabul qilindi va o‘qituvchingizga tekshirish uchun yuborildi.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm mx-auto text-left space-y-3 shadow-xs">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Vazifa nomi:</span>
            <span className="font-semibold text-slate-800">{assignment.title}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Sarflangan dars vaqti:</span>
            <span className="font-bold text-brand-700">{formatTimer(elapsedSeconds)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Topshirilgan vaqt:</span>
            <span className="font-medium text-slate-800">{formattedSubmitTime}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Holat:</span>
            <span className="font-semibold text-indigo-600">
              {submissionSuccess.status === 'GRADED'
                ? 'Baholandi ✓'
                : 'O‘qituvchi tekshirmoqda ⏳'}
            </span>
          </div>
          {submissionSuccess.total_score !== undefined && submissionSuccess.total_score !== null && (
            <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700">To‘plangan ball:</span>
              <span className="font-bold text-emerald-600">
                {submissionSuccess.total_score} / {assignment.points} ball
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
          <Button onClick={() => navigate('/app/results')}>
            Natijalar bo‘limiga o‘tish
          </Button>
          <Button variant="outline" onClick={() => navigate('/app')}>
            Bosh sahifaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  // Active section filtering
  const visibleQuestions = questions.filter((q: any) => {
    if (activeSection === 'ALL') return true;
    const sec = sections.find((s) => s.key === activeSection);
    return sec ? sec.questionIds.includes(q.id) : true;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Header Toolbar with Focus Timer & Progress */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between gap-3 sticky top-14 z-30 backdrop-blur-md">
        <button
          onClick={() => navigate('/app/tasks')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vazifalar</span>
        </button>

        {/* Live Study Session Timer */}
        <div className="flex items-center gap-2 bg-brand-50/80 border border-brand-200/70 px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-brand-700 font-bold uppercase tracking-wider">Dars vaqti:</span>
            <span className="text-xs font-extrabold text-brand-900 font-mono tracking-tight">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsTimerActive(!isTimerActive)}
            className="text-brand-600 hover:text-brand-800 ml-1 p-0.5 rounded-md hover:bg-brand-100 transition-all"
            title={isTimerActive ? "Taymerni to'xtatish" : "Davom ettirish"}
          >
            {isTimerActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
        </div>

        {/* Save Status / Badge */}
        <div className="flex items-center gap-2">
          {saveStatusMsg && (
            <span className="text-[11px] font-bold text-emerald-600 animate-in fade-in hidden sm:inline">
              {saveStatusMsg}
            </span>
          )}
          <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
            {answeredCount} / {totalQuestions}
          </span>
        </div>
      </div>

      {/* 2. Assignment Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold text-[10px] uppercase tracking-wider">
              {assignment.type === 'MIXED' ? '🌟 Kompleks Vazifa Paketi' : assignment.type?.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">{assignment.difficulty}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Muddat: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'Belgilanmagan'}</span>
          </div>
        </div>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {assignment.title}
          </h1>
          {assignment.instructions && (
            <p className="text-xs text-slate-600 leading-relaxed mt-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {assignment.instructions}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Bajarilish darajasi</span>
            <span className="font-bold text-brand-600">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Section Stepper Tabs (for multi-section packs) */}
      {sections.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setActiveSection('ALL')}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeSection === 'ALL'
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>📋 Barchasi ({totalQuestions})</span>
            </button>

            {sections.map((sec) => {
              const complete = isSectionComplete(sec);
              const isActive = activeSection === sec.key;

              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-2xs'
                      : complete
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{sec.emoji}</span>
                  <span>{mode === 'en' ? sec.nameEn : sec.nameUz}</span>
                  <span className="text-[10px] opacity-80">({sec.questionIds.length})</span>
                  {complete && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Questions List */}
      <div className="space-y-4">
        {visibleQuestions.map((q: any) => {
          const originalIndex = questions.findIndex((item: any) => item.id === q.id);

          return (
            <UniversalQuestionRunner
              key={q.id}
              question={q}
              index={originalIndex}
              answer={answers[q.id]}
              onChange={(upd) => handleAnswerChange(q.id, upd)}
              showTranscriptSetting={assignment.show_transcript}
              audioPlayLimitSetting={assignment.audio_play_limit}
            />
          );
        })}
      </div>

      {/* Section Navigation Footer (if in filtered view) */}
      {sections.length > 1 && activeSection !== 'ALL' && (
        <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
          {(() => {
            const currentIndex = sections.findIndex((s) => s.key === activeSection);
            const prevSec = currentIndex > 0 ? sections[currentIndex - 1] : null;
            const nextSec = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

            return (
              <>
                {prevSec ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection(prevSec.key)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{prevSec.nameUz}</span>
                  </button>
                ) : (
                  <div />
                )}

                {nextSec ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection(nextSec.key)}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3.5 py-1.5 rounded-xl shadow-xs"
                  >
                    <span>Keyingi bo‘lim: {nextSec.nameUz}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveSection('ALL')}
                    className="flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-3.5 py-1.5 rounded-xl"
                  >
                    <span>Barcha bo‘limlarni ko‘rish</span>
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* 5. Sticky Bottom Actions: Save Draft & Submit */}
      <div className="sticky bottom-16 z-30 pt-3 pb-2 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 shadow-sm flex items-center justify-center py-2.5 px-3 bg-white"
          isLoading={isSavingDraft}
          onClick={handleManualSaveDraft}
          leftIcon={<Save className="w-4 h-4 shrink-0" />}
        >
          {t('homework.saveDraft')}
        </Button>

        <Button
          type="button"
          className="flex-1 shadow-sm flex items-center justify-center py-2.5 px-3 bg-brand-600 hover:bg-brand-700"
          isLoading={isSubmitting}
          onClick={() => {
            setSubmitError(null);
            setShowConfirmModal(true);
          }}
          rightIcon={<Send className="w-4 h-4 shrink-0" />}
        >
          Vazifani topshirish ✓
        </Button>
      </div>

      {/* 6. Comprehensive Pre-Submission Review Checklist Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="📋 Vazifani Topshirishdan Oldin Tekshiruv"
      >
        <div className="space-y-4">
          <div className="bg-brand-50/70 border border-brand-100 p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Jami sarflangan vaqt:</span>
            <span className="font-extrabold text-brand-900 font-mono text-sm">{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Error messages if any */}
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Validation issues warning */}
          {getValidationIssues().length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>E'tibor bering, ba'zi talablar to'liq emas:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800/90">
                {getValidationIssues().map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bo‘limlar bajarilish holati ({answeredCount}/{totalQuestions}):
            </h4>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {sections.map((sec) => {
                const complete = isSectionComplete(sec);
                const count = sec.questionIds.filter((id) => isQuestionAnswered(id, questions.find((q: any) => q.id === id))).length;

                return (
                  <div
                    key={sec.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      complete
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{sec.emoji}</span>
                      <span className="font-bold">{sec.nameUz}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[11px]">
                        {count} / {sec.questionIds.length} bajarildi
                      </span>
                      {complete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed text-center pt-1">
            Topshirish tugmasi bosilgandan so‘ng barcha javoblaringiz o‘qituvchiga yuboriladi va tekshirishga o‘tadi.
          </p>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
            >
              Qayta ko‘rib chiqish
            </Button>
            <Button
              className="flex-1 bg-brand-600 hover:bg-brand-700"
              isLoading={isSubmitting}
              onClick={handleConfirmSubmit}
              disabled={getValidationIssues().length > 0}
            >
              Ha, topshirish ✓
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentTaskDetail;
