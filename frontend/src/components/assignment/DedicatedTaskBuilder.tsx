import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Save,
  Send,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { api } from '../../api/client';
import { TaskType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { UniversalQuestionRunner } from './UniversalQuestionRunner';
import { TASK_TYPE_OPTIONS } from './TaskTypeSelector';

// Dedicated field components
import { PictureDescriptionFields, PictureDescriptionData } from './builders/PictureDescriptionFields';
import { WritingFields, WritingData } from './builders/WritingFields';
import { VocabularyFields, VocabularyData } from './builders/VocabularyFields';
import { TranslationFields, TranslationData } from './builders/TranslationFields';
import { MultipleChoiceFields, MultipleChoiceData } from './builders/MultipleChoiceFields';
import { TrueFalseFields, TrueFalseData } from './builders/TrueFalseFields';
import { FillBlankFields, FillBlankData } from './builders/FillBlankFields';
import { MatchingFields, MatchingData } from './builders/MatchingFields';
import { ReadingFields, ReadingData } from './builders/ReadingFields';
import { ListeningFields, ListeningData } from './builders/ListeningFields';
import { SpeakingFields, SpeakingData } from './builders/SpeakingFields';
import { PhotoHomeworkFields, PhotoHomeworkData } from './builders/PhotoHomeworkFields';
import { ShortAnswerFields, ShortAnswerData } from './builders/ShortAnswerFields';

interface DedicatedTaskBuilderProps {
  initialType: TaskType;
  assignmentId?: string;
  onBackToTypes: () => void;
}

export const DedicatedTaskBuilder: React.FC<DedicatedTaskBuilderProps> = ({
  initialType,
  assignmentId,
  onBackToTypes,
}) => {
  const navigate = useNavigate();
  const { t, tr, adminMode } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Groups and Students list for targeting
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Task type
  const [taskType, setTaskType] = useState<TaskType>(initialType);

  // Common Meta
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [estimatedTime, setEstimatedTime] = useState(20);

  // Common Targeting & Deadline
  const [targetType, setTargetType] = useState<'ALL' | 'GROUP' | 'INDIVIDUAL'>('ALL');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);

  // Dedicated States for each of the 13 types
  const [picData, setPicData] = useState<PictureDescriptionData>({
    imageUrl: '',
    prompt: '',
    minWords: 60,
    maxWords: 150,
    targetVocab: '',
    targetGrammar: '',
    points: 10,
  });

  const [writingData, setWritingData] = useState<WritingData>({
    topic: '',
    guidelines: '',
    minWords: 100,
    maxWords: 250,
    points: 15,
    enableAiAssist: true,
  });

  const [vocabData, setVocabData] = useState<VocabularyData>({
    instructions: 'Review vocabulary, definitions, and compose original example sentences.',
    words: [
      { id: '1', word: '', phonetic: '', translation: '', example: '', points: 2 },
      { id: '2', word: '', phonetic: '', translation: '', example: '', points: 2 },
      { id: '3', word: '', phonetic: '', translation: '', example: '', points: 2 },
    ],
  });

  const [translationData, setTranslationData] = useState<TranslationData>({
    direction: 'EN_TO_UZ',
    sentences: [
      { id: '1', sourceText: '', referenceTranslation: '', points: 5 },
      { id: '2', sourceText: '', referenceTranslation: '', points: 5 },
    ],
  });

  const [mcqData, setMcqData] = useState<MultipleChoiceData>({
    questions: [
      {
        id: '1',
        question: '',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 2,
      },
    ],
  });

  const [tfData, setTfData] = useState<TrueFalseData>({
    statements: [
      { id: '1', statement: '', isTrue: true, points: 2 },
      { id: '2', statement: '', isTrue: false, points: 2 },
    ],
  });

  const [fillBlankData, setFillBlankData] = useState<FillBlankData>({
    items: [
      { id: '1', sentence: '', acceptedAnswers: '', points: 2 },
      { id: '2', sentence: '', acceptedAnswers: '', points: 2 },
    ],
  });

  const [matchingData, setMatchingData] = useState<MatchingData>({
    instructions: 'Match each item on the left with the correct option on the right.',
    pairs: [
      { id: '1', left: '', right: '', points: 2 },
      { id: '2', left: '', right: '', points: 2 },
      { id: '3', left: '', right: '', points: 2 },
    ],
  });

  const [readingData, setReadingData] = useState<ReadingData>({
    passageTitle: '',
    passageText: '',
    questions: [
      {
        id: '1',
        question: '',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 2,
      },
    ],
  });

  const [listeningData, setListeningData] = useState<ListeningData>({
    audioUrl: '',
    playLimit: 0,
    showTranscript: false,
    transcript: '',
    questions: [
      {
        id: '1',
        question: '',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 2,
      },
    ],
  });

  const [speakingData, setSpeakingData] = useState<SpeakingData>({
    topic: '',
    instructions: '',
    durationLimit: 60,
    allowedRetakes: 0,
    points: 10,
  });

  const [photoData, setPhotoData] = useState<PhotoHomeworkData>({
    instructions: '',
    referenceImageUrl: '',
    points: 10,
  });

  const [shortAnswerData, setShortAnswerData] = useState<ShortAnswerData>({
    questions: [
      { id: '1', question: '', modelAnswer: '', points: 5 },
    ],
  });

  // Fetch groups and students
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const [gList, sList] = await Promise.all([
          api.getTeacherGroups(),
          api.getTeacherStudents(),
        ]);
        setGroups(gList);
        setStudents(sList);
        if (gList.length > 0) setTargetGroupId(gList[0].id);
      } catch (err) {
        console.error('Failed to load targeting data:', err);
      }
    };
    fetchTargets();
  }, []);

  // If editing an existing assignment, load data
  useEffect(() => {
    if (!assignmentId) return;

    const loadAssignment = async () => {
      setIsLoading(true);
      try {
        const a = await api.getTeacherAssignment(assignmentId);
        setTitle(a.title || '');
        setDescription(a.description || '');
        setTaskType(a.type);
        setDifficulty(a.difficulty || 'Intermediate');
        setEstimatedTime(a.estimated_time_minutes || 20);
        setTargetType(a.target_type || 'ALL');
        if (a.target_group_id) setTargetGroupId(a.target_group_id);
        if (a.selected_student_ids) setSelectedStudentIds(a.selected_student_ids);
        if (a.deadline) setDeadline(a.deadline.substring(0, 16));
        setAllowLateSubmission(a.allow_late_submission ?? true);

        // Populate dedicated fields based on type
        const qs = a.questions || [];
        if (a.type === 'PICTURE_DESCRIPTION' && qs.length > 0) {
          const q0 = qs[0];
          setPicData({
            imageUrl: q0.media_url || '',
            prompt: q0.question_text || '',
            minWords: q0.min_words || 60,
            maxWords: q0.max_words || 150,
            targetVocab: q0.description || '',
            targetGrammar: '',
            points: q0.points || 10,
          });
        } else if (a.type === 'WRITING' && qs.length > 0) {
          const q0 = qs[0];
          setWritingData({
            topic: q0.question_text || '',
            guidelines: q0.description || '',
            minWords: q0.min_words || 100,
            maxWords: q0.max_words || 250,
            points: q0.points || 15,
            enableAiAssist: true,
          });
        } else if (a.type === 'VOCABULARY') {
          if (qs.length > 0) {
            setVocabData({
              instructions: a.instructions || '',
              words: qs.map((q: any, i: number) => ({
                id: q.id || String(i),
                word: q.question_text || '',
                phonetic: '',
                translation: q.correct_answer || '',
                example: q.description || '',
                points: q.points || 2,
              })),
            });
          }
        } else if (a.type === 'TRANSLATION') {
          if (qs.length > 0) {
            setTranslationData({
              direction: qs[0].description?.includes('UZ_TO_EN') ? 'UZ_TO_EN' : 'EN_TO_UZ',
              sentences: qs.map((q: any, i: number) => ({
                id: q.id || String(i),
                sourceText: q.question_text || '',
                referenceTranslation: q.correct_answer || '',
                points: q.points || 5,
              })),
            });
          }
        } else if (a.type === 'MULTIPLE_CHOICE') {
          if (qs.length > 0) {
            setMcqData({
              questions: qs.map((q: any, i: number) => ({
                id: q.id || String(i),
                question: q.question_text || '',
                options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
                correctAnswer: q.correct_answer || '',
                explanation: q.description || '',
                points: q.points || 2,
              })),
            });
          }
        } else if (a.type === 'TRUE_FALSE') {
          if (qs.length > 0) {
            setTfData({
              statements: qs.map((q: any, i: number) => ({
                id: q.id || String(i),
                statement: q.question_text || '',
                isTrue: String(q.correct_answer).toLowerCase() === 'true',
                explanation: q.description || '',
                points: q.points || 2,
              })),
            });
          }
        } else if (a.type === 'FILL_BLANK') {
          if (qs.length > 0) {
            setFillBlankData({
              items: qs.map((q: any, i: number) => ({
                id: q.id || String(i),
                sentence: q.question_text || '',
                acceptedAnswers: q.correct_answer || '',
                points: q.points || 2,
              })),
            });
          }
        } else if (a.type === 'MATCHING') {
          if (qs.length > 0 && qs[0].options?.pairs) {
            setMatchingData({
              instructions: qs[0].question_text || '',
              pairs: qs[0].options.pairs.map((p: any, i: number) => ({
                id: String(i),
                left: p.left,
                right: p.right,
                points: 2,
              })),
            });
          }
        } else if (a.type === 'READING') {
          if (qs.length > 0) {
            const first = qs[0];
            setReadingData({
              passageTitle: a.title,
              passageText: first.passage || '',
              questions: qs.map((q: any, i: number) => ({
                id: q.id || String(i),
                question: q.question_text || '',
                options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
                correctAnswer: q.correct_answer || '',
                points: q.points || 2,
              })),
            });
          }
        } else if (a.type === 'LISTENING') {
          if (qs.length > 0) {
            const first = qs[0];
            setListeningData({
              audioUrl: first.media_url || '',
              playLimit: a.audio_play_limit || 0,
              showTranscript: a.show_transcript || false,
              transcript: first.transcript || '',
              questions: qs.map((q: any, i: number) => ({
                id: q.id || String(i),
                question: q.question_text || '',
                options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
                correctAnswer: q.correct_answer || '',
                points: q.points || 2,
              })),
            });
          }
        } else if (a.type === 'SPEAKING' && qs.length > 0) {
          const q0 = qs[0];
          setSpeakingData({
            topic: q0.question_text || '',
            instructions: q0.description || '',
            durationLimit: q0.media_duration || 60,
            allowedRetakes: 0,
            points: q0.points || 10,
          });
        } else if (a.type === 'PHOTO' && qs.length > 0) {
          const q0 = qs[0];
          setPhotoData({
            instructions: q0.question_text || '',
            referenceImageUrl: q0.media_url || '',
            points: q0.points || 10,
          });
        } else if (a.type === 'SHORT_ANSWER' && qs.length > 0) {
          setShortAnswerData({
            questions: qs.map((q: any, i: number) => ({
              id: q.id || String(i),
              question: q.question_text || '',
              modelAnswer: q.correct_answer || '',
              points: q.points || 5,
            })),
          });
        }
      } catch (err: any) {
        alert(t('errors.somethingWentWrong', true) + ': ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignment();
  }, [assignmentId]);

  // Find metadata for current type
  const typeOption = TASK_TYPE_OPTIONS.find((t) => t.type === taskType) || TASK_TYPE_OPTIONS[0];

  // Helper to compile backend payload
  const buildBackendPayload = (status: 'DRAFT' | 'PUBLISHED') => {
    let questionsPayload: any[] = [];
    let calculatedPoints = 10;
    let extraAudioLimit = 0;
    let extraShowTranscript = false;

    if (taskType === 'PICTURE_DESCRIPTION') {
      calculatedPoints = picData.points;
      questionsPayload = [
        {
          order: 1,
          type: 'PICTURE_DESCRIPTION',
          question_text: picData.prompt || 'Describe what you see in the photo',
          description: picData.targetVocab,
          media_url: picData.imageUrl,
          media_type: 'image',
          min_words: picData.minWords,
          max_words: picData.maxWords || undefined,
          points: picData.points,
          is_required: true,
        },
      ];
    } else if (taskType === 'WRITING') {
      calculatedPoints = writingData.points;
      questionsPayload = [
        {
          order: 1,
          type: 'WRITING',
          question_text: writingData.topic || 'Write your essay',
          description: writingData.guidelines,
          min_words: writingData.minWords,
          max_words: writingData.maxWords || undefined,
          points: writingData.points,
          is_required: true,
        },
      ];
    } else if (taskType === 'VOCABULARY') {
      calculatedPoints = vocabData.words.reduce((sum, w) => sum + (w.points || 0), 0);
      questionsPayload = vocabData.words.map((w, i) => ({
        order: i + 1,
        type: 'VOCABULARY',
        question_text: w.word,
        description: w.example,
        correct_answer: w.translation,
        points: w.points,
        is_required: true,
      }));
    } else if (taskType === 'TRANSLATION') {
      calculatedPoints = translationData.sentences.reduce((sum, s) => sum + (s.points || 0), 0);
      questionsPayload = translationData.sentences.map((s, i) => ({
        order: i + 1,
        type: 'TRANSLATION',
        question_text: s.sourceText,
        description: `DIRECTION:${translationData.direction}`,
        correct_answer: s.referenceTranslation,
        points: s.points,
        is_required: true,
      }));
    } else if (taskType === 'MULTIPLE_CHOICE') {
      calculatedPoints = mcqData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
      questionsPayload = mcqData.questions.map((q, i) => ({
        order: i + 1,
        type: 'MULTIPLE_CHOICE',
        question_text: q.question,
        description: q.explanation,
        options: q.options,
        correct_answer: q.correctAnswer,
        points: q.points,
        is_required: true,
      }));
    } else if (taskType === 'TRUE_FALSE') {
      calculatedPoints = tfData.statements.reduce((sum, s) => sum + (s.points || 0), 0);
      questionsPayload = tfData.statements.map((s, i) => ({
        order: i + 1,
        type: 'TRUE_FALSE',
        question_text: s.statement,
        description: s.explanation,
        correct_answer: s.isTrue ? 'true' : 'false',
        points: s.points,
        is_required: true,
      }));
    } else if (taskType === 'FILL_BLANK') {
      calculatedPoints = fillBlankData.items.reduce((sum, item) => sum + (item.points || 0), 0);
      questionsPayload = fillBlankData.items.map((item, i) => ({
        order: i + 1,
        type: 'FILL_BLANK',
        question_text: item.sentence,
        correct_answer: item.acceptedAnswers,
        points: item.points,
        is_required: true,
      }));
    } else if (taskType === 'MATCHING') {
      calculatedPoints = matchingData.pairs.reduce((sum, p) => sum + (p.points || 0), 0);
      questionsPayload = [
        {
          order: 1,
          type: 'MATCHING',
          question_text: matchingData.instructions || 'Match the items',
          options: {
            pairs: matchingData.pairs.map((p) => ({ left: p.left, right: p.right })),
            right_options: matchingData.pairs.map((p) => p.right),
          },
          points: calculatedPoints,
          is_required: true,
        },
      ];
    } else if (taskType === 'READING') {
      calculatedPoints = readingData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
      questionsPayload = readingData.questions.map((q, i) => {
        const isOpen = q.questionType === 'OPEN';
        return {
          order: i + 1,
          type: 'READING',
          question_text: q.question,
          passage: readingData.passageText,
          options: isOpen ? [] : q.options,
          correct_answer: isOpen ? (q.expectedKeywords || '') : q.correctAnswer,
          points: q.points,
          min_words: isOpen ? q.minWords : undefined,
          is_required: true,
        };
      });
    } else if (taskType === 'LISTENING') {
      calculatedPoints = listeningData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
      extraAudioLimit = listeningData.playLimit;
      extraShowTranscript = listeningData.showTranscript;
      questionsPayload = listeningData.questions.map((q, i) => ({
        order: i + 1,
        type: 'LISTENING',
        question_text: q.question,
        media_url: listeningData.audioUrl,
        media_type: 'audio',
        transcript: listeningData.transcript,
        options: q.options,
        correct_answer: q.correctAnswer,
        points: q.points,
        is_required: true,
      }));
    } else if (taskType === 'SPEAKING') {
      calculatedPoints = speakingData.points;
      questionsPayload = [
        {
          order: 1,
          type: 'SPEAKING',
          question_text: speakingData.topic || 'Record your answer',
          description: speakingData.instructions,
          media_duration: speakingData.durationLimit,
          points: speakingData.points,
          is_required: true,
        },
      ];
    } else if (taskType === 'PHOTO') {
      calculatedPoints = photoData.points;
      questionsPayload = [
        {
          order: 1,
          type: 'PHOTO',
          question_text: photoData.instructions || 'Upload photo of homework',
          media_url: photoData.referenceImageUrl || undefined,
          media_type: photoData.referenceImageUrl ? 'image' : undefined,
          points: photoData.points,
          is_required: true,
        },
      ];
    } else if (taskType === 'SHORT_ANSWER') {
      calculatedPoints = shortAnswerData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
      questionsPayload = shortAnswerData.questions.map((q, i) => ({
        order: i + 1,
        type: 'SHORT_ANSWER',
        question_text: q.question,
        correct_answer: q.modelAnswer,
        points: q.points,
        is_required: true,
      }));
    }

    const payload: any = {
      title: title.trim() || `${typeOption.nameEn} Homework`,
      description: description.trim() || undefined,
      instructions: description.trim() || undefined,
      type: taskType,
      difficulty,
      points: calculatedPoints,
      estimated_time_minutes: estimatedTime,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      allow_late_submission: allowLateSubmission,
      audio_play_limit: extraAudioLimit,
      show_transcript: extraShowTranscript,
      target_type: targetType,
      target_group_id: targetType === 'GROUP' ? targetGroupId : undefined,
      selected_student_ids: targetType === 'INDIVIDUAL' ? selectedStudentIds : undefined,
      status,
      questions: questionsPayload,
    };

    return payload;
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim()) {
      alert(t('admin.enterTitleAlert', true));
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildBackendPayload(status);
      if (assignmentId) {
        await api.updateAssignment(assignmentId, payload);
      } else {
        await api.createAssignment(payload);
      }
      alert(
        status === 'PUBLISHED'
          ? t('admin.assignmentPublishedToast', true)
          : t('admin.assignmentSavedToast', true)
      );
      navigate('/admin/assignments');
    } catch (err: any) {
      console.error(err);
      alert(t('admin.saveFailed', true) + ': ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Preview dummy question list
  const previewPayload = buildBackendPayload('DRAFT');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-3 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBackToTypes}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            {t('admin.changeType', true)}
          </Button>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={typeOption.nameEn}>
              {typeOption.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  {adminMode === 'uz'
                    ? typeOption.nameUz
                    : adminMode === 'en'
                    ? typeOption.nameEn
                    : `${typeOption.nameUz} / ${typeOption.nameEn}`}
                </h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeOption.colorClass.badgeBg} ${typeOption.colorClass.badgeText}`}>
                  {adminMode === 'uz' ? typeOption.badgeUz : typeOption.badgeEn}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewModal(true)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            {t('admin.studentPreview', true)}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isSaving}
            onClick={() => handleSave('DRAFT')}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t('admin.saveAsDraft', true)}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isSaving}
            onClick={() => handleSave('PUBLISHED')}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-brand-600 hover:bg-brand-700 shadow-sm"
          >
            {assignmentId
              ? t('admin.updateAssignment', true)
              : t('admin.publishAssignment', true)}
          </Button>
        </div>
      </div>

      {/* 2. Assignment Overview Metadata */}
      <Card className="p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {t('admin.stepBasicInfo', true)}
          </h3>
          <p className="text-xs text-slate-500">
            {adminMode === 'uz'
              ? 'Vazifa nomi va umumiy ko‘rsatmalari'
              : 'Title and general homework guidelines'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              {t('admin.assignmentTitleLabel', true)}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                adminMode === 'uz'
                  ? `Masalan: ${typeOption.nameUz}: Unit 4 Homework`
                  : `e.g. ${typeOption.nameEn}: Unit 4 Practice`
              }
              className="w-full text-base font-semibold rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              {t('admin.shortDescriptionLabel', true)}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                adminMode === 'uz'
                  ? 'O‘quvchilar ushbu vazifani qanday bajarishi kerakligi haqida qisqacha ma‘lumot...'
                  : 'Brief context or instructions for completing this homework...'
              }
              className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t('admin.difficultyLevel', true)}
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
              >
                <option value="Beginner">{t('admin.beginner', true)}</option>
                <option value="Elementary">{t('admin.elementary', true)}</option>
                <option value="Intermediate">{t('admin.intermediate', true)}</option>
                <option value="Upper-Intermediate">{t('admin.upperIntermediate', true)}</option>
                <option value="Advanced">{t('admin.advanced', true)}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t('admin.estimatedMinutes', true)}
              </label>
              <input
                type="number"
                min={5}
                max={180}
                step={5}
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value) || 15)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Dedicated Task Field Workspace */}
      <Card className="p-6 space-y-4">
        {taskType === 'PICTURE_DESCRIPTION' && (
          <PictureDescriptionFields data={picData} onChange={setPicData} />
        )}
        {taskType === 'WRITING' && (
          <WritingFields data={writingData} onChange={setWritingData} />
        )}
        {taskType === 'VOCABULARY' && (
          <VocabularyFields data={vocabData} onChange={setVocabData} />
        )}
        {taskType === 'TRANSLATION' && (
          <TranslationFields data={translationData} onChange={setTranslationData} />
        )}
        {taskType === 'MULTIPLE_CHOICE' && (
          <MultipleChoiceFields data={mcqData} onChange={setMcqData} />
        )}
        {taskType === 'TRUE_FALSE' && (
          <TrueFalseFields data={tfData} onChange={setTfData} />
        )}
        {taskType === 'FILL_BLANK' && (
          <FillBlankFields data={fillBlankData} onChange={setFillBlankData} />
        )}
        {taskType === 'MATCHING' && (
          <MatchingFields data={matchingData} onChange={setMatchingData} />
        )}
        {taskType === 'READING' && (
          <ReadingFields data={readingData} onChange={setReadingData} />
        )}
        {taskType === 'LISTENING' && (
          <ListeningFields data={listeningData} onChange={setListeningData} />
        )}
        {taskType === 'SPEAKING' && (
          <SpeakingFields data={speakingData} onChange={setSpeakingData} />
        )}
        {taskType === 'PHOTO' && (
          <PhotoHomeworkFields data={photoData} onChange={setPhotoData} />
        )}
        {taskType === 'SHORT_ANSWER' && (
          <ShortAnswerFields data={shortAnswerData} onChange={setShortAnswerData} />
        )}
      </Card>

      {/* 4. Targeting & Deadline Settings */}
      <Card className="p-6 space-y-5">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {t('admin.assignTarget', true)} & {t('admin.deadlineSettings', true)}
          </h3>
          <p className="text-xs text-slate-500">
            {adminMode === 'uz'
              ? 'Kimga biriktiriladi va topshirish muddati sozlamalari'
              : 'Target audience assignment and deadline schedule'}
          </p>
        </div>

        {/* Target Audience Tabs */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'ALL', label: t('admin.targetAllStudents', true) },
              { id: 'GROUP', label: t('admin.targetStudyGroup', true) },
              { id: 'INDIVIDUAL', label: t('admin.targetIndividualStudents', true) },
            ].map((tgt) => (
              <button
                key={tgt.id}
                type="button"
                onClick={() => setTargetType(tgt.id as any)}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  targetType === tgt.id
                    ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                {tgt.label}
              </button>
            ))}
          </div>

          {targetType === 'GROUP' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {t('admin.selectGroupLabel', true)}
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.students_count || 0} {t('admin.enrolledStudents', true)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'INDIVIDUAL' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                {t('admin.selectStudentsLabel', true)}
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-white">
                {students.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds([...selectedStudentIds, s.id]);
                          } else {
                            setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.id));
                          }
                        }}
                        className="rounded border-slate-300 text-brand-600"
                      />
                      <span className="font-semibold text-slate-800">
                        {s.full_name || s.username || 'Student'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Deadline & Late submission */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {t('admin.deadlineDateTime', true)}
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">
                {t('admin.allowLateSubmissions', true)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {t('admin.allowLateSubmissionsSub', true)}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowLateSubmission}
                onChange={(e) => setAllowLateSubmission(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* 5. Live Interactive Student Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={t('admin.studentPreview', true)}
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Simulation Header */}
          <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-brand-900 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <p>{t('admin.previewNotice', true)}</p>
          </div>

          {/* Render Questions through UniversalQuestionRunner */}
          <div className="space-y-4 pt-2">
            {previewPayload.questions.map((q: any, idx: number) => (
              <div
                key={idx}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-brand-700 uppercase">
                    {t('common.question', true)} #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {q.points} {t('common.pts', true)}
                  </span>
                </div>

                <UniversalQuestionRunner
                  question={q}
                  index={idx}
                  onChange={() => {}}
                  audioPlayLimitSetting={previewPayload.audio_play_limit}
                  showTranscriptSetting={previewPayload.show_transcript}
                />
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-end">
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              {t('admin.closePreview', true)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
