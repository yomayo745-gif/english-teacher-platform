import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Headphones,
  Upload,
  Sparkles,
  HelpCircle,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface VocabItem {
  word: string;
  phonetic: string;
  translation: string;
  example: string;
}

interface ExerciseItem {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export const TeacherLessonBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { t, tr } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(20);
  const [mediaType, setMediaType] = useState<'audio' | 'video' | 'image' | 'none'>('audio');
  const [mediaUrl, setMediaUrl] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [targetType, setTargetType] = useState<'ALL' | 'GROUP'>('ALL');
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [attachedAssignmentId, setAttachedAssignmentId] = useState<string>('');

  const [vocabulary, setVocabulary] = useState<VocabItem[]>([
    { word: '', phonetic: '', translation: '', example: '' },
  ]);

  const [exercises, setExercises] = useState<ExerciseItem[]>([
    {
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
    },
  ]);

  const [groups, setGroups] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [groupsData, assignmentsData] = await Promise.all([
          api.getTeacherGroups().catch(() => []),
          api.getTeacherAssignments().catch(() => []),
        ]);
        setGroups(groupsData);
        setAssignments(assignmentsData);

        if (isEdit && id) {
          const lessonData = await api.getTeacherLesson(id);
          setTitle(lessonData.title || '');
          setDescription(lessonData.description || '');
          setContent(lessonData.content || '');
          setOrder(lessonData.order || 1);
          setEstimatedMinutes(lessonData.estimated_time_minutes || 20);
          setMediaType(lessonData.media_type || 'audio');
          setMediaUrl(lessonData.media_url || '');
          setStatus(lessonData.status || 'PUBLISHED');
          setTargetType(lessonData.target_type || 'ALL');
          setTargetGroupId(lessonData.target_group_id || '');
          setAttachedAssignmentId(lessonData.attached_assignment_id || '');
          if (lessonData.vocabulary && lessonData.vocabulary.length > 0) {
            setVocabulary(lessonData.vocabulary);
          }
          if (lessonData.exercises && lessonData.exercises.length > 0) {
            setExercises(lessonData.exercises);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load lesson details');
      }
    };
    loadDependencies();
  }, [id, isEdit]);

  // Audio / Media file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadFile(file);
      setMediaUrl(res.file_url);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  // Vocabulary list handlers
  const handleAddVocab = () => {
    setVocabulary([...vocabulary, { word: '', phonetic: '', translation: '', example: '' }]);
  };

  const handleUpdateVocab = (index: number, field: keyof VocabItem, value: string) => {
    const updated = [...vocabulary];
    updated[index][field] = value;
    setVocabulary(updated);
  };

  const handleRemoveVocab = (index: number) => {
    setVocabulary(vocabulary.filter((_, i) => i !== index));
  };

  // Exercise list handlers
  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { question: '', options: ['', '', '', ''], correct_answer: '', explanation: '' },
    ]);
  };

  const handleUpdateExercise = (index: number, field: keyof ExerciseItem, value: any) => {
    const updated = [...exercises];
    (updated[index] as any)[field] = value;
    setExercises(updated);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...exercises];
    updated[qIdx].options[optIdx] = value;
    setExercises(updated);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = async (targetStatus = status) => {
    if (!title.trim()) {
      setErrorMessage(tr({ en: 'Lesson title is required.', uz: 'Dars sarlavhasi kiritilishi shart.', bi: 'Dars nomi talab qilinadi / Title is required' }, true));
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    // Clean empty vocabulary and exercises
    const cleanVocab = vocabulary.filter((v) => v.word.trim());
    const cleanExercises = exercises
      .filter((e) => e.question.trim())
      .map((e) => ({
        ...e,
        options: e.options.filter((o) => o.trim()),
      }));

    const payload = {
      title,
      description,
      content,
      order: Number(order) || 1,
      estimated_time_minutes: Number(estimatedMinutes) || 20,
      media_type: mediaType,
      media_url: mediaUrl,
      status: targetStatus,
      target_type: targetType,
      target_group_id: targetType === 'GROUP' ? targetGroupId : null,
      attached_assignment_id: attachedAssignmentId || null,
      vocabulary: cleanVocab,
      exercises: cleanExercises,
    };

    try {
      if (isEdit && id) {
        await api.updateLesson(id, payload);
      } else {
        await api.createLesson(payload);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/admin/lessons');
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save lesson');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/lessons')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isEdit ? t('lessons.editLesson', true) : t('lessons.createLesson', true)}
            </h1>
            <p className="text-xs text-slate-500">
              {tr(
                {
                  en: 'Set up interactive theory, audio lectures, vocabulary, and homework.',
                  uz: 'Dars nazariyasi, audio darslik, lug‘at va topshiriqlarni sozlang.',
                  bi: 'Dars yaratish va sozlash / Lesson setup & configuration'
                },
                true
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('DRAFT')}
            isLoading={isSaving}
          >
            {tr({ en: 'Save as Draft', uz: 'Qoralama saqlash', bi: 'Qoralama / Draft' }, true)}
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave('PUBLISHED')}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t('lessons.publish', true)}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{tr({ en: 'Lesson saved successfully! Redirecting...', uz: 'Dars muvaffaqiyatli saqlandi! Qaytmoqda...', bi: 'Muvaffaqiyatli saqlandi / Saved successfully' }, true)}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Details Card */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-600" />
          <span>{tr({ en: 'Basic Lesson Information', uz: 'Asosiy dars ma‘lumotlari', bi: 'Asosiy ma‘lumotlar / Basic Information' }, true)}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {tr({ en: 'Lesson Title', uz: 'Dars mavzusi', bi: 'Dars nomi / Lesson Title' }, true)} *
            </label>
            <input
              type="text"
              placeholder="e.g. Present Perfect vs Past Simple Masterclass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {tr({ en: 'Order / Sequence', uz: 'Tartib raqami', bi: 'Tartib / Order' }, true)}
            </label>
            <input
              type="number"
              min="1"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono font-bold"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            {tr({ en: 'Short Description', uz: 'Qisqacha tavsif', bi: 'Tavsif / Description' }, true)}
          </label>
          <textarea
            rows={2}
            placeholder="Brief overview of what students will learn in this lesson..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {tr({ en: 'Target Audience', uz: 'Qamrov', bi: 'O‘quvchilar / Target' }, true)}
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">{t('admin.allStudents', true)}</option>
              <option value="GROUP">{t('admin.selectGroup', true)}</option>
            </select>
          </div>

          {targetType === 'GROUP' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {tr({ en: 'Select Group', uz: 'Guruhni tanlang', bi: 'Guruh / Group' }, true)}
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">{tr({ en: '-- Select Group --', uz: '-- Guruhni tanlang --', bi: 'Tanlang / Select' }, true)}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {tr({ en: 'Estimated Duration (minutes)', uz: 'Taxminiy vaqt (daqiqa)', bi: 'Dars vaqti / Duration (min)' }, true)}
            </label>
            <input
              type="number"
              min="5"
              step="5"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {tr({ en: 'Attached Homework', uz: 'Bog‘langan uyga vazifa', bi: 'Uyga vazifa / Attached Homework' }, true)}
            </label>
            <select
              value={attachedAssignmentId}
              onChange={(e) => setAttachedAssignmentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">{tr({ en: '-- None (No Homework) --', uz: '-- Biriktirilmagan --', bi: 'Yo‘q / None' }, true)}</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.max_points} pts)
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Media & Audio Card */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Headphones className="w-4 h-4 text-amber-600" />
          <span>{tr({ en: 'Lecture Media & Audio', uz: 'Dars audio va media materiallari', bi: 'Media & Audio / Lecture Audio' }, true)}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {tr({ en: 'Media Type', uz: 'Media turi', bi: 'Turi / Type' }, true)}
            </label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="audio">Audio Lecture (MP3)</option>
              <option value="video">Video URL (YouTube/MP4)</option>
              <option value="image">Diagram / Image</option>
              <option value="none">None</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {tr({ en: 'Media URL or Upload', uz: 'Media manzili yoki yuklash', bi: 'Manzil / Media URL' }, true)}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://... or /media/audio.mp3"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="audio/*,video/*,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Theory & Markdown Content */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>{t('lessons.lessonTheory', true)}</span>
          </h3>
          <span className="text-[11px] text-slate-400">Supports Markdown headers (##, ###) & lists</span>
        </div>

        <textarea
          rows={8}
          placeholder="## Rules & Formulas&#10;&#10;- Present Perfect: Subject + have/has + V3&#10;- Used for experiences, unspecified times, and ongoing states.&#10;&#10;### Examples&#10;- I have lived in London for 3 years."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
        />
      </Card>

      {/* Vocabulary Bank Builder */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{t('lessons.vocabularyBank', true)} ({vocabulary.length})</span>
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddVocab}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {tr({ en: 'Add Word', uz: 'So‘z qo‘shish', bi: 'So‘z qo‘shish / Add Word' }, true)}
          </Button>
        </div>

        <div className="space-y-3">
          {vocabulary.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">#{idx + 1} Word</span>
                {vocabulary.length > 1 && (
                  <button
                    onClick={() => handleRemoveVocab(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Word (e.g. Accomplish)"
                  value={item.word}
                  onChange={(e) => handleUpdateVocab(idx, 'word', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Phonetic (e.g. /əˈkʌm.plɪʃ/)"
                  value={item.phonetic}
                  onChange={(e) => handleUpdateVocab(idx, 'phonetic', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Uzbek Translation (e.g. erishmoq, bajarmoq)"
                  value={item.translation}
                  onChange={(e) => handleUpdateVocab(idx, 'translation', e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-brand-700"
                />
              </div>

              <input
                type="text"
                placeholder="Example sentence: If we work together, we can accomplish anything."
                value={item.example}
                onChange={(e) => handleUpdateVocab(idx, 'example', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Comprehension Exercises Builder */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>{t('lessons.exercises', true)} ({exercises.length})</span>
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExercise}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {tr({ en: 'Add Question', uz: 'Savol qo‘shish', bi: 'Savol qo‘shish / Add Question' }, true)}
          </Button>
        </div>

        <div className="space-y-4">
          {exercises.map((q, qIdx) => (
            <div
              key={qIdx}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Question #{qIdx + 1}</span>
                {exercises.length > 1 && (
                  <button
                    onClick={() => handleRemoveExercise(qIdx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Question text: Which tense is used for finished actions in the past?"
                value={q.question}
                onChange={(e) => handleUpdateExercise(qIdx, 'question', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 w-4">
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      value={opt}
                      onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Correct Answer (exact text):
                  </label>
                  <input
                    type="text"
                    placeholder="Matches one of the options above"
                    value={q.correct_answer}
                    onChange={(e) => handleUpdateExercise(qIdx, 'correct_answer', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Explanation note:
                  </label>
                  <input
                    type="text"
                    placeholder="Short rule explanation for students"
                    value={q.explanation}
                    onChange={(e) => handleUpdateExercise(qIdx, 'explanation', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/lessons')}
        >
          {t('common.cancel', true)}
        </Button>
        <Button
          onClick={() => handleSave('PUBLISHED')}
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEdit ? t('common.save', true) : t('lessons.publish', true)}
        </Button>
      </div>
    </div>
  );
};
export default TeacherLessonBuilder;
