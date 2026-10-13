import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Save,
  SkipForward,
  RotateCcw,
  Volume2,
  Image as ImageIcon,
  BookOpen,
  MessageSquare,
  AlertCircle,
  Clock,
  User,
  Check,
  ExternalLink,
  Maximize2,
  HelpCircle,
  Flame
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { AudioPlayer } from '../../components/ui/AudioPlayer';

export const TeacherReviewSubmission: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, tr, localizeError } = useLanguage();

  const [reviewData, setReviewData] = useState<any>(null);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [questionGrades, setQuestionGrades] = useState<Record<string, { score: number; feedback: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchReview = async () => {
      setIsLoading(true);
      try {
        const data = await api.getSubmissionReview(id);
        setReviewData(data);
        setTeacherFeedback(data.submission.teacher_feedback || '');

        // Populate question grades
        const qg: Record<string, { score: number; feedback: string }> = {};
        let calculatedTotal = 0;

        data.questions.forEach((q: any) => {
          const ans = q.student_answer;
          let initialScore = 0;

          if (ans?.manual_score !== null && ans?.manual_score !== undefined) {
            initialScore = ans.manual_score;
          } else if (ans?.auto_score !== null && ans?.auto_score !== undefined) {
            initialScore = ans.auto_score;
          } else {
            // Check if multiple choice and matching
            if (q.correct_answer && ans?.selected_options) {
              const studentChoice = typeof ans.selected_options === 'string'
                ? ans.selected_options.replace(/^"|"$/g, '')
                : ans.selected_options;
              if (String(studentChoice).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
                initialScore = q.points;
              }
            } else if (ans?.text_answer && ans.text_answer.trim().length > 0) {
              initialScore = q.points;
            } else if (ans?.audio_url || ans?.file_url) {
              initialScore = q.points;
            }
          }

          qg[q.question_id] = {
            score: initialScore,
            feedback: ans?.feedback || '',
          };
          calculatedTotal += initialScore;
        });

        setQuestionGrades(qg);
        setTotalScore(data.submission.total_score !== null ? data.submission.total_score : calculatedTotal);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReview();
  }, [id]);

  const updateQuestionScore = (questionId: string, newScore: number, maxScore: number) => {
    const clampedScore = Math.max(0, Math.min(newScore, maxScore));
    setQuestionGrades((prev) => {
      const updated = {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          score: clampedScore,
        },
      };

      // Recalculate total sum
      const newTotal = Object.values(updated).reduce((sum, item) => sum + (item.score || 0), 0);
      setTotalScore(Number(newTotal.toFixed(1)));
      return updated;
    });
  };

  const updateQuestionFeedback = (questionId: string, feedback: string) => {
    setQuestionGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        feedback,
      },
    }));
  };

  const handleSaveGrade = async (status: 'GRADED' | 'RETURNED' = 'GRADED', andNext: boolean = false) => {
    if (!id) return;
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const formattedQGrades = Object.entries(questionGrades).map(([qId, val]) => ({
        question_id: qId,
        score: val.score,
        feedback: val.feedback,
      }));

      const res = await api.gradeSubmission(id, {
        total_score: totalScore,
        teacher_feedback: teacherFeedback,
        status,
        question_grades: formattedQGrades,
      });

      setSuccessMsg('✓ Baholash muvaffaqiyatli saqlandi!');

      if (andNext && res.next_submission_id) {
        navigate(`/admin/submissions/${res.next_submission_id}`);
      } else if (andNext && !res.next_submission_id) {
        setTimeout(() => navigate('/admin/pending-reviews'), 1000);
      }
    } catch (err: any) {
      alert(localizeError(err, true));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchAiAssist = async (questionId?: string) => {
    if (!id) return;
    setIsLoadingAi(true);
    try {
      const res = await api.getAiAssist(id, questionId);
      setAiSuggestions(res.analysis);
      if (!teacherFeedback && res.analysis.suggestions) {
        setTeacherFeedback(res.analysis.suggestions.join('. '));
      }
    } catch (err: any) {
      alert(localizeError(err, true));
    } finally {
      setIsLoadingAi(false);
    }
  };

  const scrollToQuestion = (qId: string) => {
    const el = document.getElementById(`q-card-${qId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatSecs = (secs?: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pt-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!reviewData) {
    return <div className="text-center py-12 text-slate-500">Vazifa topilmadi</div>;
  }

  const { submission, student, assignment, questions, next_submission_id } = reviewData;

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Sticky Action Toolbar */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/pending-reviews')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Navbatga qaytish</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900">{student.full_name}</span>
              <Badge variant={submission.status.toLowerCase()} isAdmin>{submission.status}</Badge>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Vazifa: <span className="font-semibold text-slate-700">{assignment.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
          {successMsg && (
            <span className="text-xs font-bold text-emerald-600 animate-in fade-in mr-2">
              {successMsg}
            </span>
          )}

          {/* Current Score Display */}
          <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-xl text-xs font-bold">
            <span className="text-slate-500">Jami ball:</span>
            <span className="text-brand-900 font-extrabold font-mono text-sm">{totalScore}</span>
            <span className="text-slate-400">/ {assignment.points}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveGrade('RETURNED', false)}
            disabled={isSaving}
            className="text-xs"
          >
            Qayta topshirishga yuborish
          </Button>

          <Button
            size="sm"
            onClick={() => handleSaveGrade('GRADED', false)}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="bg-brand-600 hover:bg-brand-700 text-xs"
          >
            Bahoni saqlash ✓
          </Button>

          {next_submission_id && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSaveGrade('GRADED', true)}
              isLoading={isSaving}
              rightIcon={<SkipForward className="w-4 h-4" />}
              className="text-xs"
            >
              Saqlash va keyingisi →
            </Button>
          )}
        </div>
      </div>

      {/* 2. Student Info & Submission Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-base border border-indigo-100">
            {student.full_name ? student.full_name[0] : 'S'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{student.full_name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>@{student.username || 'user'}</span>
              <span>•</span>
              <span className="font-mono">TG ID: {student.telegram_id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-600 flex-wrap">
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Topshirilgan vaqt</span>
            <span className="font-bold text-slate-800">
              {new Date(submission.submitted_at).toLocaleDateString([], { day: 'numeric', month: 'short' })},{' '}
              {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Holat</span>
            <span className={`font-bold ${submission.is_late ? 'text-amber-600' : 'text-emerald-600'}`}>
              {submission.is_late ? `Kechikib topshirildi (${submission.late_by_minutes} daqiqa)` : '✓ O‘z vaqtida'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Yozilgan so‘zlar</span>
            <span className="font-bold text-slate-800 font-mono">{submission.total_word_count || 0} ta</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-semibold">Savollar soni</span>
            <span className="font-bold text-slate-800">{questions.length} ta savol</span>
          </div>
        </div>
      </div>

      {/* 3. Question Quick Navigator Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Savollar navigatsiyasi ({questions.length} ta):
          </span>
          <span className="text-slate-400 text-[11px]">Savolga tezkor o‘tish uchun bosing</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {questions.map((q: any, idx: number) => {
            const ans = q.student_answer;
            const currentQScore = questionGrades[q.question_id]?.score || 0;
            const isFullScore = currentQScore >= q.points && q.points > 0;
            const hasAnswer = (ans?.text_answer && ans.text_answer.trim().length > 0) ||
              ans?.selected_options !== null || ans?.audio_url || ans?.file_url;

            return (
              <button
                key={q.question_id}
                type="button"
                onClick={() => scrollToQuestion(q.question_id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                  isFullScore
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : hasAnswer
                    ? 'bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>#{idx + 1}</span>
                <span className="text-[10px] opacity-75">({currentQScore}/{q.points})</span>
                {isFullScore ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : !hasAnswer ? (
                  <span className="text-[10px] text-amber-500">⚠️</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Unified Sequential Question Review Cards */}
      <div className="space-y-6">
        {questions.map((q: any, idx: number) => {
          const ans = q.student_answer;
          const currentQG = questionGrades[q.question_id] || { score: q.points, feedback: '' };

          // Student answers extraction
          const textAns = ans?.text_answer?.trim() || '';
          const rawSelected = ans?.selected_options;
          const selectedOption = typeof rawSelected === 'string'
            ? rawSelected.replace(/^"|"$/g, '')
            : (rawSelected !== null && rawSelected !== undefined ? String(rawSelected) : '');

          const hasAudio = Boolean(ans?.audio_url);
          const isBlobAudio = hasAudio && ans.audio_url.startsWith('blob:');
          const hasFile = Boolean(ans?.file_url);

          const hasAnyAnswer = Boolean(textAns || selectedOption || hasAudio || hasFile);

          return (
            <div
              key={q.question_id}
              id={`q-card-${q.question_id}`}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
            >
              {/* Question Header */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-brand-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {q.type?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-lg">
                    {q.points} ball
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {ans?.auto_score !== null && ans?.auto_score !== undefined && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      Avtomatik baholandi: {ans.auto_score} ball
                    </span>
                  )}
                  {!hasAnyAnswer && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      ⚠️ O‘quvchi javob bermagan
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* 1. Prompt / Question Condition */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Topshiriq sharti:
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-relaxed">
                    {q.question_text}
                  </h3>
                  {q.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {q.description}
                    </p>
                  )}
                </div>

                {/* Reading Passage (if applicable) */}
                {q.passage && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <span>Matn (Reading Passage):</span>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-serif">
                      {q.passage}
                    </div>
                  </div>
                )}

                {/* Question Image/Audio Media (if any) */}
                {q.media_url && q.media_type === 'image' && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500">Topshiriq rasmi:</span>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-64 bg-slate-50 flex items-center justify-center p-2">
                      <img src={q.media_url} alt="Question Media" className="max-h-60 object-contain rounded-xl" />
                    </div>
                  </div>
                )}

                {q.media_url && q.media_type === 'audio' && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500">Topshiriq audiosi:</span>
                    <AudioPlayer
                      src={q.media_url}
                      title={q.question_text || 'Listening audio'}
                      transcript={q.transcript}
                      allowTranscript={true}
                      isAdmin
                    />
                  </div>
                )}

                {/* 2. Expected Correct Answer (O'qituvchi uchun to'g'ri javob) */}
                {q.correct_answer && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900 block">Kutilgan to‘g‘ri javob (Etalon):</span>
                      <span className="font-medium text-emerald-800 mt-0.5 block">
                        {typeof q.correct_answer === 'object'
                          ? JSON.stringify(q.correct_answer)
                          : String(q.correct_answer)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. STUDENT'S ACTUAL ANSWER (O'quvchi bajargan ish) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-600" />
                      <span>O‘quvchining bergan javobi:</span>
                    </span>

                    {textAns && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {ans?.word_count || textAns.split(/\s+/).filter(Boolean).length} ta so‘z
                      </span>
                    )}
                  </div>

                  {/* Multiple Choice Options Display */}
                  {Array.isArray(q.options) && q.options.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isStudentSelected = selectedOption === opt || textAns === opt;
                          const isCorrect = q.correct_answer === opt;

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                                isStudentSelected && isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200 text-emerald-900'
                                  : isStudentSelected && !isCorrect
                                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200 text-rose-900'
                                  : isCorrect
                                  ? 'bg-slate-50 border-emerald-300 text-slate-800'
                                  : 'bg-slate-50/50 border-slate-200 text-slate-600 opacity-70'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] shrink-0 bg-white">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="font-semibold">{opt}</span>
                              </div>

                              <div>
                                {isStudentSelected && isCorrect && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                                    ✓ O‘quvchi tanladi (To‘g‘ri)
                                  </span>
                                )}
                                {isStudentSelected && !isCorrect && (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold">
                                    ✕ O‘quvchi tanladi (Noto‘g‘ri)
                                  </span>
                                )}
                                {!isStudentSelected && isCorrect && (
                                  <span className="text-[10px] font-bold text-emerald-700">
                                    To‘g‘ri javob shu edi
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* If student selected something not in options */}
                      {selectedOption && !q.options.includes(selectedOption) && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                          <span className="font-bold text-slate-700">O‘quvchi tanlovi: </span>
                          <span className="font-semibold text-slate-900">{selectedOption}</span>
                        </div>
                      )}
                    </div>
                  ) : textAns ? (
                    /* Written Open Text / Essay Response */
                    <div className="space-y-1.5">
                      <div className="bg-slate-50 border-2 border-brand-100 p-4 rounded-2xl text-xs text-slate-900 whitespace-pre-wrap leading-relaxed font-sans shadow-2xs">
                        {textAns}
                      </div>

                      {q.min_words && (
                        <div className="flex items-center gap-2 text-xs">
                          {(ans?.word_count || 0) < q.min_words ? (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                              ⚠️ Talab qilingan {q.min_words} ta so‘zdan kam yozilgan ({ans?.word_count || 0} ta)
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                              ✓ Minimal so‘zlar talabi bajarilgan ({ans?.word_count || 0} ta)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Speaking Voice Message Audio Player */}
                  {hasAudio && (
                    <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                          <Volume2 className="w-4 h-4 text-indigo-600" />
                          <span>🎙️ O‘quvchi yozgan ovozli xabar (Golosovoy):</span>
                        </div>
                        {ans.audio_duration ? (
                          <span className="text-xs font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-lg font-mono">
                            {formatSecs(ans.audio_duration)}
                          </span>
                        ) : null}
                      </div>

                      {isBlobAudio ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                          <p className="font-bold">⚠️ Ushbu audio lokal brauzer xotirasida (blob) saqlanib qolgan</p>
                          <p className="text-[11px] text-amber-800">
                            Audio yozuvchi komponent serverga yuklash rejimi bilan yangilandi. Yangi yuborilgan ovozli xabarlar serverda to‘liq saqlanadi va bemalol eshitiladi.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <audio
                            controls
                            src={ans.audio_url}
                            className="w-full h-11 rounded-xl"
                            preload="metadata"
                          >
                            Brauzeringiz audioni qo‘llab-quvvatlamaydi.
                          </audio>
                          <div className="flex justify-end">
                            <a
                              href={ans.audio_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1"
                            >
                              <span>Audioni alohida oynada ochish / yuklab olish</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workbook Photo Display */}
                  {hasFile && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-brand-600" />
                          <span>📸 O‘quvchi yuklagan daftar rasmi:</span>
                        </div>
                        <a
                          href={ans.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <span>To‘liq hajmda ochish</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div
                        onClick={() => setSelectedImageModal(ans.file_url)}
                        className="cursor-pointer border border-slate-200 rounded-xl overflow-hidden bg-white max-h-80 flex items-center justify-center hover:opacity-95 transition-opacity"
                      >
                        <img
                          src={ans.file_url}
                          alt="Daftar rasmi"
                          className="max-h-80 w-auto object-contain rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* When student completely left question blank */}
                  {!hasAnyAnswer && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>O‘quvchi ushbu topshiriqqa javob kiritmagan (bo‘sh qoldirilgan).</span>
                    </div>
                  )}
                </div>

                {/* 4. Teacher Grading Controls for This Specific Question */}
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-800">
                      Ushbu savol uchun baho:
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Quick Score Buttons */}
                      <button
                        type="button"
                        onClick={() => updateQuestionScore(q.question_id, 0, q.points)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        0 ball
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestionScore(q.question_id, Number((q.points / 2).toFixed(1)), q.points)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        Yarmi ({q.points / 2})
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestionScore(q.question_id, q.points, q.points)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        To‘liq ({q.points})
                      </button>

                      {/* Precise Score Input */}
                      <div className="flex items-center gap-1.5 ml-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={q.points}
                          value={currentQG.score}
                          onChange={(e) => updateQuestionScore(q.question_id, Number(e.target.value) || 0, q.points)}
                          className="w-16 text-sm font-extrabold rounded-xl border border-slate-300 px-2 py-1.5 bg-white text-center text-slate-900 focus:outline-none focus:border-brand-500 shadow-2xs"
                        />
                        <span className="text-xs font-bold text-slate-500">/ {q.points} ball</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback text input */}
                  <div>
                    <input
                      type="text"
                      placeholder="O‘quvchiga ushbu savol bo‘yicha izoh yoki xatolarni ko‘rsating..."
                      value={currentQG.feedback}
                      onChange={(e) => updateQuestionFeedback(q.question_id, e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Master Overall Evaluation Card */}
      <Card className="bg-slate-900 text-white border-slate-800 space-y-5 p-6 rounded-3xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>📋 Yakuniy Baholash va Xulosa</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Barcha savollar bo‘yicha qo‘yilgan ballar avtomatik jamlanadi. O‘quvchiga umumiy fikr bildiring.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleFetchAiAssist()}
            disabled={isLoadingAi}
            className="text-xs font-bold text-brand-300 hover:text-brand-200 bg-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>{isLoadingAi ? 'AI tahlil qilmoqda...' : 'AI tavsiyasini olish'}</span>
          </button>
        </div>

        {/* AI Suggestions Box */}
        {aiSuggestions && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-brand-300 font-bold">
              <span>🤖 AI Writing & Grammar tahlili:</span>
              <span>Tavsiya ball: {aiSuggestions.overall_suggested_score} / 10</span>
            </div>
            {aiSuggestions.suggestions && (
              <p className="text-slate-300 leading-relaxed">
                {aiSuggestions.suggestions.join('. ')}
              </p>
            )}
          </div>
        )}

        {/* Total Score Adjustment */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-300 block">Jami yakuniy ball:</span>
            <span className="text-[11px] text-slate-400">Har bir savol ballari yig‘indisi</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              min="0"
              max={assignment.points}
              value={totalScore}
              onChange={(e) => setTotalScore(Number(e.target.value))}
              className="w-20 bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-center text-emerald-400 font-extrabold text-lg focus:outline-none focus:border-brand-500 font-mono"
            />
            <span className="text-sm font-bold text-slate-400">/ {assignment.points} ball</span>
          </div>
        </div>

        {/* Overall Feedback */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            O‘quvchiga umumiy fikr va tavsiyalar:
          </label>
          <textarea
            rows={3}
            value={teacherFeedback}
            onChange={(e) => setTeacherFeedback(e.target.value)}
            placeholder="O‘quvchiga umumiy yutuqlari va kelgusida e'tibor qaratishi kerak bo‘lgan tomonlarini yozing..."
            className="w-full text-xs rounded-2xl border border-slate-700 bg-slate-800 p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => handleSaveGrade('RETURNED', false)}
            disabled={isSaving}
          >
            Qayta ishlashga qaytarish
          </Button>

          <Button
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold"
            onClick={() => handleSaveGrade('GRADED', false)}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Bahoni tasdiqlash va yakunlash ✓
          </Button>

          {next_submission_id && (
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              onClick={() => handleSaveGrade('GRADED', true)}
              isLoading={isSaving}
              rightIcon={<SkipForward className="w-4 h-4" />}
            >
              Saqlash va keyingisiga o‘tish →
            </Button>
          )}
        </div>
      </Card>

      {/* 6. High-Res Image Modal (for Workbook photos) */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl relative">
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
            >
              ✕
            </button>
            <img
              src={selectedImageModal}
              alt="Kattalashtirilgan rasm"
              className="max-h-[85vh] w-auto object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherReviewSubmission;
