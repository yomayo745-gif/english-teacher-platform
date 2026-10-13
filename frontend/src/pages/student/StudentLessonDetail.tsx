import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Volume2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Share2
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AudioPlayer } from '../../components/ui/AudioPlayer';

export const StudentLessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, tr } = useLanguage();

  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'theory' | 'vocabulary' | 'exercises'>('theory');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [exerciseResults, setExerciseResults] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [revealedTranslations, setRevealedTranslations] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) return;
    const fetchLesson = async () => {
      try {
        const data = await api.getStudentLesson(id);
        setLesson(data);
        if (data.progress?.status === 'COMPLETED') {
          setIsCompleted(true);
        } else if (data.progress?.status === 'NOT_STARTED') {
          // Mark as in-progress automatically on first open
          api.updateStudentLessonProgress(id, { status: 'IN_PROGRESS', progress_percent: 30 }).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load lesson detail', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectAnswer = (qIndex: number, option: string, correctAnswer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: option }));
    const isCorrect = option.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setExerciseResults((prev) => ({ ...prev, [qIndex]: isCorrect }));
  };

  const handleMarkCompleted = async () => {
    if (!id) return;
    setIsUpdatingProgress(true);
    try {
      await api.updateStudentLessonProgress(id, {
        status: 'COMPLETED',
        progress_percent: 100,
      });
      setIsCompleted(true);
    } catch (err) {
      console.error('Failed to update lesson progress', err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        {t('common.loading')}
      </div>
    );
  }

  if (!lesson) {
    return (
      <Card className="text-center py-10">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800">
          {tr({ en: 'Lesson not found', uz: 'Dars topilmadi', bi: 'Dars topilmadi / Lesson not found' })}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/app/lessons')}>
          {t('common.back')}
        </Button>
      </Card>
    );
  }

  const vocabularyList = lesson.vocabulary || [];
  const exercisesList = lesson.exercises || [];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/lessons')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('common.back')}</span>
        </button>

        {isCompleted ? (
          <Badge variant="completed">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />
            {t('lessons.lessonCompleted')}
          </Badge>
        ) : (
          <Badge variant="in_progress">{t('statuses.inProgress')}</Badge>
        )}
      </div>

      {/* Lesson Banner */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200/80">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-extrabold text-[11px] border border-brand-200">
            {tr({ en: `Lesson #${lesson.order || 1}`, uz: `${lesson.order || 1}-Dars`, bi: `${lesson.order || 1}-Dars / Lesson #${lesson.order || 1}` })}
          </span>
          {lesson.estimated_time_minutes && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Clock className="w-3 h-3" />
              <span>{lesson.estimated_time_minutes} {t('common.min')}</span>
            </span>
          )}
        </div>

        <h1 className="text-lg font-extrabold text-slate-900 leading-snug">
          {lesson.title}
        </h1>

        {lesson.description && (
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {lesson.description}
          </p>
        )}

        {/* Audio Lecture Player */}
        {lesson.media_url && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-brand-600" />
              <span>{t('lessons.lectureAudio')}</span>
            </p>
            <AudioPlayer src={lesson.media_url} title={lesson.title} />
          </div>
        )}
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('theory')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'theory'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t('lessons.theoryTab')}</span>
        </button>

        {vocabularyList.length > 0 && (
          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'vocabulary'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {t('lessons.vocabularyTab')} ({vocabularyList.length})
            </span>
          </button>
        )}

        {exercisesList.length > 0 && (
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'exercises'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              {t('lessons.exercisesTab')} ({exercisesList.length})
            </span>
          </button>
        )}
      </div>

      {/* Tab 1: Theory Content */}
      {activeTab === 'theory' && (
        <Card className="prose prose-sm max-w-none text-slate-800">
          <div className="space-y-4 leading-relaxed text-xs sm:text-sm">
            {lesson.content ? (
              <div className="whitespace-pre-wrap font-sans text-slate-700 space-y-2">
                {lesson.content.split('\n\n').map((paragraph: string, pIdx: number) => {
                  if (paragraph.startsWith('### ') || paragraph.startsWith('## ')) {
                    return (
                      <h3 key={pIdx} className="text-sm font-bold text-slate-900 mt-3 mb-1 border-b border-slate-100 pb-1">
                        {paragraph.replace(/^[#]+\s/, '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={pIdx} className="list-disc pl-5 space-y-1 text-slate-700">
                        {paragraph.split('\n').map((item, itemIdx) => (
                          <li key={itemIdx}>{item.replace(/^-\s/, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={pIdx} className="leading-relaxed">{paragraph}</p>;
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No notes provided for this lesson.</p>
            )}
          </div>
        </Card>
      )}

      {/* Tab 2: Vocabulary Bank */}
      {activeTab === 'vocabulary' && (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-500 px-1">
            {tr({
              en: 'Tap on a word to hear native pronunciation or reveal the translation.',
              uz: 'Talaffuzni eshitish uchun karnay tugmasini bosing.',
              bi: 'Talaffuz va tarjima / Audio pronunciation & translation'
            })}
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {vocabularyList.map((item: any, idx: number) => {
              const isRevealed = revealedTranslations[idx];

              return (
                <Card key={idx} className="p-3.5 border-slate-200/80 hover:border-brand-300 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 tracking-tight">
                          {item.word}
                        </span>
                        {item.phonetic && (
                          <span className="text-xs font-mono text-slate-400 font-normal">
                            [{item.phonetic}]
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-brand-700">
                        {item.translation}
                      </div>

                      {item.example && (
                        <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          “{item.example}”
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => speakWord(item.word)}
                      className="p-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 active:scale-95 transition-all shrink-0"
                      title="Listen pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Practice Exercises */}
      {activeTab === 'exercises' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 px-1">
            {tr({
              en: 'Test your understanding before submitting your homework.',
              uz: 'Uyga vazifadan oldin dars tushunchangizni tekshirib oling.',
              bi: 'Mashqlarni bajaring / Complete practice exercises'
            })}
          </p>

          {exercisesList.map((ex: any, qIdx: number) => {
            const selected = selectedAnswers[qIdx];
            const isCorrect = exerciseResults[qIdx];
            const hasAnswered = selected !== undefined;

            return (
              <Card key={qIdx} className="space-y-3 border-slate-200/90">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {qIdx + 1}. {ex.question}
                  </span>
                  {hasAnswered && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {(ex.options || []).map((opt: string, optIdx: number) => {
                    const isSelectedOpt = selected === opt;
                    let optStyle = 'border-slate-200 hover:border-slate-300 bg-white text-slate-700';

                    if (hasAnswered) {
                      if (opt.trim().toLowerCase() === String(ex.correct_answer).trim().toLowerCase()) {
                        optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                      } else if (isSelectedOpt && !isCorrect) {
                        optStyle = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                      }
                    } else if (isSelectedOpt) {
                      optStyle = 'border-brand-500 bg-brand-50 text-brand-900 font-semibold';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(qIdx, opt, ex.correct_answer)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${optStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && ex.explanation && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    💡 {ex.explanation}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Attached Homework Section */}
      {lesson.attached_assignment && (
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-brand-50/40 to-white">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider inline-block">
                {t('lessons.attachedHomework')}
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                {lesson.attached_assignment.title}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2">
                {lesson.attached_assignment.description}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span>⭐ {lesson.attached_assignment.max_points} {t('common.points')}</span>
                {lesson.attached_assignment.deadline && (
                  <span>📅 {new Date(lesson.attached_assignment.deadline).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => navigate(`/app/tasks/${lesson.attached_assignment.id}`)}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              {t('lessons.startHomework')}
            </Button>
          </div>
        </Card>
      )}

      {/* Complete Button Action */}
      <div className="pt-2">
        <Button
          variant={isCompleted ? 'outline' : 'primary'}
          className="w-full justify-center py-3 text-xs sm:text-sm font-bold"
          onClick={handleMarkCompleted}
          isLoading={isUpdatingProgress}
          leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        >
          {isCompleted
            ? t('lessons.lessonCompleted')
            : t('lessons.markCompleted')}
        </Button>
      </div>
    </div>
  );
};
export default StudentLessonDetail;
