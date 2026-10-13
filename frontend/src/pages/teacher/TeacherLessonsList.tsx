import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PlusCircle,
  FileEdit,
  Trash2,
  Users,
  CheckCircle2,
  Headphones,
  BookMarked,
  ArrowRight,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const TeacherLessonsList: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [lessonToDelete, setLessonToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal for viewing student progress
  const [selectedLessonForProgress, setSelectedLessonForProgress] = useState<any | null>(null);
  const [progressList, setProgressList] = useState<any[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  const navigate = useNavigate();
  const { t, tr, adminMode } = useLanguage();

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeacherLessons();
      setLessons(data);
    } catch (err) {
      console.error('Failed to load lessons', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleDelete = async () => {
    if (!lessonToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteLesson(lessonToDelete.id);
      setLessons((prev) => prev.filter((l) => l.id !== lessonToDelete.id));
      setLessonToDelete(null);
    } catch (err) {
      console.error('Failed to delete lesson', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenProgress = async (lesson: any) => {
    setSelectedLessonForProgress(lesson);
    setIsLoadingProgress(true);
    try {
      const prog = await api.getLessonProgress(lesson.id);
      setProgressList(prog);
    } catch (err) {
      console.error('Failed to load progress', err);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(search.toLowerCase()) ||
      (lesson.description && lesson.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || lesson.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <span>{t('lessons.title', true)}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {tr(
              {
                en: 'Create, organize, and publish curriculum lessons, theory, audio, and exercises for students.',
                uz: 'O‘quvchilar uchun darslar, nazariy qoidalar, audio va mashqlarni boshqaring.',
                bi: 'Darslar va materiallar boshqaruvi / Manage curriculum & lessons'
              },
              true
            )}
          </p>
        </div>

        <Button
          onClick={() => navigate('/admin/lessons/new')}
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="shadow-sm"
        >
          {t('lessons.createLesson', true)}
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {tr({ en: 'Total Lessons', uz: 'Jami darslar', bi: 'Jami / Total' }, true)}
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{lessons.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {tr({ en: 'Published Lessons', uz: 'Chiqarilgan darslar', bi: 'Chiqarilgan / Published' }, true)}
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                {lessons.filter((l) => l.status === 'PUBLISHED').length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {tr({ en: 'Linked Homeworks', uz: 'Biriktirilgan vazifalar', bi: 'Vazifalar / Homework' }, true)}
              </p>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">
                {lessons.filter((l) => l.attached_assignment_id).length}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('common.search', true) + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: { en: 'All', uz: 'Barchasi', bi: 'Barchasi / All' } },
            { id: 'PUBLISHED', label: { en: 'Published', uz: 'Chiqarilgan', bi: 'Chiqarilgan / Published' } },
            { id: 'DRAFT', label: { en: 'Drafts', uz: 'Qoralamalar', bi: 'Qoralamalar / Drafts' } },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tr(tab.label, true)}
            </button>
          ))}
        </div>
      </Card>

      {/* Lessons List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          {t('common.loading', true)}
        </div>
      ) : filteredLessons.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {tr({ en: 'No lessons found', uz: 'Darslar topilmadi', bi: 'Darslar yo‘q / No lessons' }, true)}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {tr(
              {
                en: 'Get started by creating your first lecture, adding audio explanations and vocabulary.',
                uz: 'Yangi dars qo‘shish orqali boshlang.',
                bi: 'Yangi dars yarating / Create your first lesson'
              },
              true
            )}
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => navigate('/admin/lessons/new')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            {t('lessons.createLesson', true)}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="p-5 border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-extrabold text-xs flex items-center justify-center border border-brand-200">
                    {lesson.order || 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {lesson.title}
                  </h3>
                  <Badge variant={lesson.status === 'PUBLISHED' ? 'published' : 'draft'} isAdmin>
                    {lesson.status === 'PUBLISHED' ? t('statuses.published', true) : t('statuses.draft', true)}
                  </Badge>
                </div>

                {lesson.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl">
                    {lesson.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-slate-500">
                  {lesson.media_type === 'audio' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200/60">
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Audio Lecture</span>
                    </span>
                  )}

                  {lesson.vocabulary && lesson.vocabulary.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-200/60">
                      <BookMarked className="w-3.5 h-3.5" />
                      <span>{lesson.vocabulary.length} {t('common.words', true)}</span>
                    </span>
                  )}

                  {lesson.attached_assignment && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-200/60">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>HW: {lesson.attached_assignment.title}</span>
                    </span>
                  )}

                  <button
                    onClick={() => handleOpenProgress(lesson)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60 hover:bg-emerald-100 transition-all"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{lesson.completed_students_count || 0} {t('common.completed', true)}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenProgress(lesson)}
                  leftIcon={<Users className="w-3.5 h-3.5" />}
                >
                  {tr({ en: 'Progress', uz: 'Statistika', bi: 'Natijalar / Progress' }, true)}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                  leftIcon={<FileEdit className="w-3.5 h-3.5" />}
                >
                  {t('common.edit', true)}
                </Button>

                <button
                  onClick={() => setLessonToDelete(lesson)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title={t('common.delete', true)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {lessonToDelete && (
        <Modal
          isOpen={!!lessonToDelete}
          onClose={() => setLessonToDelete(null)}
          title={tr({ en: 'Delete Lesson?', uz: 'Darsni o‘chirish?', bi: 'O‘chirish / Delete Lesson' }, true)}
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600">
              {tr(
                {
                  en: `Are you sure you want to delete "${lessonToDelete.title}"? Students will no longer see this lesson.`,
                  uz: `"${lessonToDelete.title}" darsini o‘chirmoqchimisiz? O‘quvchilar bu darsni ko‘ra olmaydi.`,
                  bi: `Haqiqatan ham o‘chirmoqchimisiz? / Are you sure you want to delete this lesson?`
                },
                true
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setLessonToDelete(null)}>
                {t('common.cancel', true)}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                {t('common.delete', true)}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Student Progress Modal */}
      {selectedLessonForProgress && (
        <Modal
          isOpen={!!selectedLessonForProgress}
          onClose={() => setSelectedLessonForProgress(null)}
          title={`${selectedLessonForProgress.title} — ${tr({ en: 'Student Progress', uz: 'O‘quvchilar natijasi', bi: 'Natijalar / Student Progress' }, true)}`}
        >
          <div className="space-y-4">
            {isLoadingProgress ? (
              <p className="text-center py-6 text-xs text-slate-400">{t('common.loading', true)}</p>
            ) : progressList.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">
                {tr({ en: 'No student progress records yet.', uz: 'Hali o‘quvchilar darsni boshlamagan.', bi: 'Hali natijalar yo‘q / No records yet' }, true)}
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {progressList.map((prog, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {prog.student?.name || `Student #${prog.student_id?.slice(0, 6)}`}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {prog.last_accessed_at ? new Date(prog.last_accessed_at).toLocaleString() : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <Badge variant={prog.status === 'COMPLETED' ? 'completed' : 'in_progress'} isAdmin>
                        {prog.status === 'COMPLETED' ? t('statuses.completed', true) : t('statuses.inProgress', true)}
                      </Badge>
                      <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">
                        {prog.progress_percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedLessonForProgress(null)}>
                {t('common.close', true)}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default TeacherLessonsList;
