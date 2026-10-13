import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, CheckCircle2, Clock, PlayCircle, BookMarked, ArrowRight, FileText, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const StudentLessons: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const navigate = useNavigate();
  const { t, tr } = useLanguage();

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const data = await api.getStudentLessons();
        setLessons(data);
      } catch (err) {
        console.error('Failed to load lessons', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const filteredLessons = lessons.filter((lesson) => {
    const status = lesson.progress?.status?.toLowerCase() || 'not_started';
    if (filter === 'all') return true;
    return status === filter;
  });

  const getStatusBadge = (progress?: any) => {
    const status = progress?.status || 'NOT_STARTED';
    if (status === 'COMPLETED') {
      return <Badge variant="completed">{t('statuses.completed')}</Badge>;
    }
    if (status === 'IN_PROGRESS') {
      return <Badge variant="in_progress">{t('statuses.inProgress')}</Badge>;
    }
    return <Badge variant="draft">{t('lessons.notStarted')}</Badge>;
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 text-white shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-indigo-200" />
          <h2 className="text-lg font-bold tracking-tight">
            {t('lessons.title')}
          </h2>
        </div>
        <p className="text-xs text-indigo-100 leading-relaxed">
          {t('lessons.subtitle')}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: { en: 'All Lessons', uz: 'Barcha darslar', bi: 'Barchasi / All' } },
          { id: 'not_started', label: { en: 'Not Started', uz: 'Boshlanmagan', bi: 'Boshlanmagan / Not Started' } },
          { id: 'in_progress', label: { en: 'In Progress', uz: 'Jarayonda', bi: 'Jarayonda / In Progress' } },
          { id: 'completed', label: { en: 'Completed', uz: 'Tugatilgan', bi: 'Tugatilgan / Completed' } },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tr(tab.label)}
          </button>
        ))}
      </div>

      {/* Lessons List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          {t('common.loading')}
        </div>
      ) : filteredLessons.length === 0 ? (
        <Card className="text-center py-10">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">{t('lessons.noLessonsFound')}</p>
          <p className="text-xs text-slate-400 mt-1">
            {tr({
              en: 'Your teacher will assign new lessons soon.',
              uz: 'O‘qituvchingiz yaqinda yangi darslar biriktiradi.',
              bi: 'Yangi darslar tez orada yuklanadi / New lessons coming soon.'
            })}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((lesson, idx) => {
            const progress = lesson.progress;
            const percent = progress?.progress_percent || 0;
            const isCompleted = progress?.status === 'COMPLETED';

            return (
              <Card
                key={lesson.id}
                className="hover:shadow-md transition-all border-slate-200/90 relative overflow-hidden"
              >
                {/* Progress bar line along the top border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-brand-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-xs flex items-center justify-center border border-brand-200">
                        {lesson.order || idx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {lesson.title}
                      </h3>
                    </div>
                    <div>{getStatusBadge(progress)}</div>
                  </div>

                  {lesson.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {lesson.description}
                    </p>
                  )}

                  {/* Badges / Meta Info */}
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-slate-500">
                    {lesson.media_type === 'audio' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Audio Lecture</span>
                      </span>
                    )}

                    {lesson.vocabulary && lesson.vocabulary.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium">
                        <BookMarked className="w-3.5 h-3.5" />
                        <span>{lesson.vocabulary.length} {t('common.words')}</span>
                      </span>
                    )}

                    {lesson.estimated_time_minutes && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{lesson.estimated_time_minutes} {t('common.min')}</span>
                      </span>
                    )}

                    {lesson.attached_assignment && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-medium">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{tr({ en: 'Homework attached', uz: 'Uyga vazifa bor', bi: 'Uyga vazifa / Homework' })}</span>
                      </span>
                    )}
                  </div>

                  {/* Action Button & Progress */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      {percent}% {t('common.completed').toLowerCase()}
                    </span>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/app/lessons/${lesson.id}`)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {isCompleted
                        ? tr({ en: 'Review Lesson', uz: 'Darsni qayta ko‘rish', bi: 'Qayta ko‘rish / Review' })
                        : percent > 0
                        ? t('lessons.continueLesson')
                        : t('lessons.startLesson')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default StudentLessons;
