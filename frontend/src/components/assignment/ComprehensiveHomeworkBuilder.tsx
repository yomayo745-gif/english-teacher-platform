import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  Clock,
  Users,
  BookOpen,
  Sparkles,
  Layers,
  HelpCircle,
  CheckCircle2,
  FileText,
  Volume2,
  Mic,
  Camera,
  PenTool,
  Upload,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Edit3,
  AlignLeft,
  CheckSquare,
  Shuffle
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

export interface QuestionDraft {
  id: string;
  order: number;
  type: string; // VOCABULARY, FILL_BLANK, SENTENCE_BUILDER, TRUE_FALSE, MULTIPLE_CHOICE, READING, WRITING, SPEAKING, PHOTO, LISTENING, SHORT_ANSWER
  section: string; // 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING' | 'PHOTO'
  question_text: string;
  description?: string;
  passage?: string;
  media_url?: string;
  media_type?: string;
  media_duration?: number;
  transcript?: string;
  options?: any;
  correct_answer?: any;
  min_words?: number;
  max_words?: number;
  points: number;
  is_required: boolean;
}

interface ComprehensiveHomeworkBuilderProps {
  assignmentId?: string;
  onBackToTypes?: () => void;
}

export const ComprehensiveHomeworkBuilder: React.FC<ComprehensiveHomeworkBuilderProps> = ({
  assignmentId,
  onBackToTypes,
}) => {
  const navigate = useNavigate();
  const { t, tr, mode } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Metadata
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [estimatedMinutes, setEstimatedMinutes] = useState(120); // 2 hours default
  const [deadline, setDeadline] = useState('');
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);
  const [targetType, setTargetType] = useState<'ALL' | 'GROUP' | 'INDIVIDUAL'>('ALL');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Questions List
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  // Active Category Workbench & View
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Modals
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBulkVocabModal, setShowBulkVocabModal] = useState(false);
  const [bulkVocabText, setBulkVocabText] = useState('');

  // Load groups & students
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gList, sList] = await Promise.all([
          api.getTeacherGroups().catch(() => []),
          api.getTeacherStudents().catch(() => []),
        ]);
        setGroups(gList);
        setStudents(sList);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // Load existing assignment if editing
  useEffect(() => {
    if (!assignmentId) return;
    const loadAssignment = async () => {
      setIsLoading(true);
      try {
        const data = await api.getTeacherAssignment(assignmentId);
        setTitle(data.title || '');
        setInstructions(data.instructions || data.description || '');
        setDifficulty(data.difficulty || 'Intermediate');
        setEstimatedMinutes(data.estimated_time_minutes || 120);
        setTargetType(data.target_type || 'ALL');
        setTargetGroupId(data.target_group_id || '');
        setSelectedStudentIds(data.selected_student_ids || []);
        if (data.deadline) {
          const dl = new Date(data.deadline);
          setDeadline(dl.toISOString().slice(0, 16));
        }

        if (data.questions && data.questions.length > 0) {
          const mapped: QuestionDraft[] = data.questions.map((q: any, idx: number) => {
            let section = 'GRAMMAR';
            if (q.type === 'VOCABULARY') section = 'VOCABULARY';
            else if (q.type === 'READING') section = 'READING';
            else if (q.type === 'LISTENING') section = 'LISTENING';
            else if (q.type === 'WRITING' || q.type === 'PICTURE_DESCRIPTION') section = 'WRITING';
            else if (q.type === 'SPEAKING') section = 'SPEAKING';
            else if (q.type === 'PHOTO') section = 'PHOTO';

            return {
              id: q.id || Math.random().toString(36).substring(7),
              order: q.order || idx + 1,
              type: q.type,
              section,
              question_text: q.question_text || '',
              description: q.description || '',
              passage: q.passage || '',
              media_url: q.media_url || '',
              media_type: q.media_type || '',
              media_duration: q.media_duration || 120,
              transcript: q.transcript || '',
              options: q.options || null,
              correct_answer: q.correct_answer || null,
              min_words: q.min_words,
              max_words: q.max_words,
              points: q.points || 2,
              is_required: q.is_required !== false,
            };
          });
          setQuestions(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAssignment();
  }, [assignmentId]);

  // Pre-built 2-3 hour comprehensive templates
  const loadTemplate = (templateKey: 'general_2h' | 'ielts_2h' | 'grammar_vocab_2h' | 'active_immersion_2h') => {
    setShowTemplateModal(false);

    if (templateKey === 'general_2h') {
      setTitle('General English (B1): 2-3 Soatlik Kompleks Uyga Vazifa');
      setInstructions('Ushbu vazifani diqqat bilan bajaring. Barcha bo‘limlarni ketma-ketlikda ishlab chiqing: lug‘at, grammatika, o‘qish, insho va audio nutq.');
      setDifficulty('Intermediate');
      setEstimatedMinutes(140);

      const qs: QuestionDraft[] = [
        // 1. Vocabulary
        {
          id: Math.random().toString(36).substring(7),
          order: 1,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "Choose the correct Uzbek translation for 'Accomplish'",
          description: "Part of speech: Verb. Ma'nosi: Muvaffaqiyatli yakunlamoq / erishmoq",
          options: ['Erishmoq / Bajarmoq', 'Tashlab ketmoq', 'Qo‘rqitmoq', 'Sotib olmoq'],
          correct_answer: 'Erishmoq / Bajarmoq',
          points: 2,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 2,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "Choose the correct meaning of 'Diligent'",
          description: 'Part of speech: Adjective. Synonym / English Definition',
          options: ['Hardworking and careful', 'Lazy and slow', 'Angry and rude', 'Funny and cheerful'],
          correct_answer: 'Hardworking and careful',
          points: 2,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 3,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "Fill in the blank: 'Fresh drinking water is ______ in mountainous areas.'",
          description: 'Context sentence practice',
          options: ['abundant', 'reluctant', 'furious', 'exhausted'],
          correct_answer: 'abundant',
          points: 2,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 4,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "Match the word 'Reluctant' with its meaning",
          description: 'Part of speech: Adjective',
          options: ['Unwilling / Ikkilanuvchi', 'Tezkor', 'Aqlli', 'Mehribon'],
          correct_answer: 'Unwilling / Ikkilanuvchi',
          points: 2,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 5,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "What is the synonym of 'Crucial'?",
          description: 'Part of speech: Adjective',
          options: ['Extremely important / Vital', 'Minor / Unimportant', 'Cheap', 'Dangerous'],
          correct_answer: 'Extremely important / Vital',
          points: 2,
          is_required: true,
        },
        // 2. Grammar
        {
          id: Math.random().toString(36).substring(7),
          order: 6,
          type: 'FILL_BLANK',
          section: 'GRAMMAR',
          question_text: "Complete the sentence: 'She ______ (live) in London since 2018.'",
          description: 'Topic: Present Perfect vs Past Simple',
          correct_answer: ['has lived', 'has been living'],
          points: 3,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 7,
          type: 'FILL_BLANK',
          section: 'GRAMMAR',
          question_text: "Complete the sentence: 'If it rains tomorrow, we ______ (stay) at home.'",
          description: 'Topic: First Conditional (if + present, will + infinitive)',
          correct_answer: ['will stay'],
          points: 3,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 8,
          type: 'SENTENCE_BUILDER',
          section: 'GRAMMAR',
          question_text: 'Arrange the words into a grammatically correct sentence:',
          description: 'Topic: Sentence Mechanics & Word Order',
          options: ['English', 'every', 'improves', 'practicing', 'day', 'fluency'],
          correct_answer: 'Practicing English every day improves fluency',
          points: 4,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 9,
          type: 'FILL_BLANK',
          section: 'GRAMMAR',
          question_text: "Complete with the correct preposition: 'I am interested ______ learning new languages.'",
          description: 'Topic: Dependent Prepositions',
          correct_answer: ['in'],
          points: 2,
          is_required: true,
        },
        // 3. Reading Comprehension (Multiple choice + Open Answer!)
        {
          id: Math.random().toString(36).substring(7),
          order: 10,
          type: 'READING',
          section: 'READING',
          question_text: 'Reading Question 1: According to the passage, why is consistent sleep important for language learners?',
          passage: `The Science of Learning Languages: Why Consistency Matters\n\nLearning a foreign language is not merely an intellectual exercise; it fundamentally alters the neural pathways within the human brain. Neuroscientists have discovered that consistent, daily exposure to target vocabulary and grammatical structures leads to synaptic plasticity, reinforcing long-term memory far more effectively than sporadic, marathon cramming sessions.\n\nFurthermore, recent studies in cognitive psychology highlight the critical role of restorative sleep. During deep REM sleep cycles, the brain consolidates newly acquired vocabulary from short-term hippocampus storage into the neocortex, making recall automatic during real-time speech. Learners who engage in 2 to 3 hours of focused daily practice coupled with quality rest develop native-like reflexes within months.\n\nIn conclusion, mastering English requires two non-negotiable elements: disciplined daily practice and adequate neurological rest.`,
          options: [
            'It consolidates vocabulary from short-term memory into long-term storage',
            'It replaces the need to practice grammar rules',
            'It only benefits advanced academic students',
            'It makes reading passages shorter'
          ],
          correct_answer: 'It consolidates vocabulary from short-term memory into long-term storage',
          points: 5,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 11,
          type: 'READING',
          section: 'READING',
          question_text: 'Reading Question 2 (Ochiq savol): Matnni diqqat bilan o‘qib, ingliz tilini o‘rganishda 2 ta eng muhim omil nima ekanligini o‘z so‘zlaringiz bilan yozing.',
          passage: `The Science of Learning Languages: Why Consistency Matters\n\nLearning a foreign language is not merely an intellectual exercise; it fundamentally alters the neural pathways within the human brain. Neuroscientists have discovered that consistent, daily exposure to target vocabulary and grammatical structures leads to synaptic plasticity, reinforcing long-term memory far more effectively than sporadic, marathon cramming sessions.\n\nFurthermore, recent studies in cognitive psychology highlight the critical role of restorative sleep. During deep REM sleep cycles, the brain consolidates newly acquired vocabulary from short-term hippocampus storage into the neocortex, making recall automatic during real-time speech. Learners who engage in 2 to 3 hours of focused daily practice coupled with quality rest develop native-like reflexes within months.\n\nIn conclusion, mastering English requires two non-negotiable elements: disciplined daily practice and adequate neurological rest.`,
          description: "Write in English using your own words. Mention both factors discussed in the text.",
          options: null, // Open-ended answer!
          min_words: 15,
          points: 5,
          is_required: true,
        },
        // 4. Writing Essay
        {
          id: Math.random().toString(36).substring(7),
          order: 12,
          type: 'WRITING',
          section: 'WRITING',
          question_text: 'Writing Task: How has technology changed the way students learn today?',
          description: 'Reja:\n1. Kirish (Introduction) - texnologiyaning zamonaviy ta\'limdagi o‘rni.\n2. Ijobiy tomonlari (Advantages) - onlayn resurslar, tezkor ma\'lumot.\n3. Salbiy tomonlari (Disadvantages) - diqqat bo‘linishi, mustaqil fikrlashning pasayishi.\n4. Xulosa (Conclusion) - shaxsiy fikringiz.\nKamida 100 ta so‘z yozing.',
          min_words: 100,
          max_words: 250,
          points: 20,
          is_required: true,
        },
        // 5. Speaking Voice Note
        {
          id: Math.random().toString(36).substring(7),
          order: 13,
          type: 'SPEAKING',
          section: 'SPEAKING',
          question_text: 'Speaking Practice: Describe an important goal you accomplished recently.',
          description: 'Og‘zaki nutq ko‘rsatmalari:\n1. What was the goal?\n2. Why was it important to you?\n3. What difficulties did you overcome?\n1-2 daqiqa davomida ingliz tilida gapirib ovozingizni yozing.',
          media_duration: 180,
          points: 15,
          is_required: true,
        },
        // 6. Workbook Photo
        {
          id: Math.random().toString(36).substring(7),
          order: 14,
          type: 'PHOTO',
          section: 'PHOTO',
          question_text: 'Workbook & Handwritten Homework Submission',
          description: 'Daftaringizdagi 14-betdagi mashqlarni to‘liq qo‘lda yozib bajaring va aniq, sifatli rasmga olib bu yerga yuklang.',
          points: 10,
          is_required: true,
        },
      ];
      setQuestions(qs);
    } else if (templateKey === 'ielts_2h') {
      setTitle('IELTS Academic Intensive 2.5-Hour Practice Pack');
      setInstructions('Full academic simulation: Advanced vocabulary, IELTS reading passage with True/False/Not Given, Task 2 essay, and Speaking Part 2 monologue.');
      setDifficulty('Upper-Intermediate');
      setEstimatedMinutes(150);

      const qs: QuestionDraft[] = [
        {
          id: Math.random().toString(36).substring(7),
          order: 1,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "Select the Band 7+ synonym for 'important / necessary':",
          description: 'Part of speech: Adjective',
          options: ['Imperative', 'Ordinary', 'Casual', 'Fragile'],
          correct_answer: 'Imperative',
          points: 3,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 2,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "What does 'Mitigate' mean in an academic context?",
          description: 'Part of speech: Verb',
          options: ['To lessen or reduce the severity of something', 'To make something louder', 'To copy an author', 'To travel abroad'],
          correct_answer: 'To lessen or reduce the severity of something',
          points: 3,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 3,
          type: 'READING',
          section: 'READING',
          question_text: 'Reading Question 1: What is the primary cause of urban heat islands mentioned in the text?',
          passage: `Urban Heat Islands: Causes and Ecological Consequences\n\nUrban heat islands (UHIs) represent one of the most visible manifestations of human environmental modification. In metropolitan centers worldwide, temperatures regularly exceed those of surrounding rural peripheries by 3 to 7 degrees Celsius. This divergence is attributed predominantly to the thermal properties of conventional construction materials such as asphalt, concrete, and brick, which absorb and retain solar radiation rather than reflecting it.\n\nMoreover, the scarcity of vegetative canopy severely impedes evapotranspiration—the natural cooling process through which plants release moisture into the atmosphere. The combination of anthropogenic heat emissions from transportation and industrial refrigeration creates localized thermal domes, exacerbating energy consumption and elevating respiratory health risks among vulnerable populations.`,
          options: [
            'Construction materials absorbing and retaining solar radiation',
            'Excessive rainfall in city parks',
            'Complete lack of transportation in metropolitan areas',
            'Wind patterns shifting away from the equator'
          ],
          correct_answer: 'Construction materials absorbing and retaining solar radiation',
          points: 6,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 4,
          type: 'READING',
          section: 'READING',
          question_text: "Reading Question 2 (Ochiq tahlil): Matnga asoslanib, o‘simliklar shaharlardagi haroratni pasaytirishga qanday hissa qo‘shishini ingliz tilida tushuntiring.",
          passage: `Urban Heat Islands: Causes and Ecological Consequences\n\nUrban heat islands (UHIs) represent one of the most visible manifestations of human environmental modification. In metropolitan centers worldwide, temperatures regularly exceed those of surrounding rural peripheries by 3 to 7 degrees Celsius. This divergence is attributed predominantly to the thermal properties of conventional construction materials such as asphalt, concrete, and brick, which absorb and retain solar radiation rather than reflecting it.\n\nMoreover, the scarcity of vegetative canopy severely impedes evapotranspiration—the natural cooling process through which plants release moisture into the atmosphere. The combination of anthropogenic heat emissions from transportation and industrial refrigeration creates localized thermal domes, exacerbating energy consumption and elevating respiratory health risks among vulnerable populations.`,
          description: "Explain the process of evapotranspiration mentioned in the text (min 20 words).",
          options: null, // Open-ended answer!
          min_words: 20,
          points: 8,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 5,
          type: 'WRITING',
          section: 'WRITING',
          question_text: 'IELTS Writing Task 2: Compulsory Community Service',
          description: 'Prompt: Some people believe that unpaid community service should be a compulsory part of high school education. To what extent do you agree or disagree?\nInclude reasons and relevant examples from your knowledge or experience. Minimum 180 words.',
          min_words: 180,
          max_words: 320,
          points: 30,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 6,
          type: 'SPEAKING',
          section: 'SPEAKING',
          question_text: 'IELTS Speaking Part 2: Describe an influential teacher or mentor',
          description: 'You should say:\n- Who this person was\n- What subject or skill they taught you\n- How their teaching method was unique\n- And explain why they had such an impact on your life.\nSpeak for 2 minutes.',
          media_duration: 180,
          points: 20,
          is_required: true,
        },
      ];
      setQuestions(qs);
    } else {
      // Grammar & Vocab
      setTitle('Grammar & Vocabulary Mastery Drill (2 Soatlik Mashqlar)');
      setInstructions('Ushbu vazifada 20 dan ortiq grammatik va leksik mashqlar jamlangan. Har bir savolga chuqur o‘ylab javob bering.');
      setDifficulty('Intermediate');
      setEstimatedMinutes(120);

      const qs: QuestionDraft[] = [
        {
          id: Math.random().toString(36).substring(7),
          order: 1,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "What does 'Persevere' mean?",
          options: ['To continue despite difficulty', 'To give up quickly', 'To sleep deeply', 'To run fast'],
          correct_answer: 'To continue despite difficulty',
          points: 2,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 2,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: "Choose the correct antonym for 'Obsolete':",
          options: ['Modern / Current', 'Outdated', 'Ancient', 'Broken'],
          correct_answer: 'Modern / Current',
          points: 2,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 3,
          type: 'FILL_BLANK',
          section: 'GRAMMAR',
          question_text: "Fill in: 'Neither of the students ______ (be) aware of the exam schedule yesterday.'",
          description: 'Subject-Verb Agreement with Neither',
          correct_answer: ['was'],
          points: 3,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 4,
          type: 'FILL_BLANK',
          section: 'GRAMMAR',
          question_text: "Fill in: 'By next December, we ______ (graduate) from university.'",
          description: 'Future Perfect Tense',
          correct_answer: ['will have graduated'],
          points: 4,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 5,
          type: 'SENTENCE_BUILDER',
          section: 'GRAMMAR',
          question_text: 'Assemble the sentence correctly with negative inversion:',
          options: ['scarcely', 'had', 'arrived', 'we', 'when', 'started', 'it', 'raining'],
          correct_answer: 'Scarcely had we arrived when it started raining',
          points: 5,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 6,
          type: 'TRUE_FALSE',
          section: 'GRAMMAR',
          question_text: "True or False: In formal English, 'none' can take a singular verb when referring to 'not one'.",
          options: ['True', 'False'],
          correct_answer: 'True',
          points: 3,
          is_required: true,
        },
        {
          id: Math.random().toString(36).substring(7),
          order: 7,
          type: 'PHOTO',
          section: 'PHOTO',
          question_text: 'Daftardagi barcha grammatik qoidalar va yechilgan misollar rasmi',
          description: 'Mavzu bo‘yicha konspekt va uyga berilgan mashqlarni daftarga yozib rasmga oling.',
          points: 15,
          is_required: true,
        },
      ];
      setQuestions(qs);
    }
  };

  // Bulk Vocab Import
  const handleBulkVocabImport = () => {
    if (!bulkVocabText.trim()) return;

    const lines = bulkVocabText.split('\n').filter((l) => l.trim().length > 0);
    const newItems: QuestionDraft[] = [];

    lines.forEach((line) => {
      const parts = line.split(/[-:=]/);
      const word = parts[0]?.trim();
      const translation = parts[1]?.trim() || '';

      if (word) {
        newItems.push({
          id: Math.random().toString(36).substring(7),
          order: questions.length + newItems.length + 1,
          type: 'VOCABULARY',
          section: 'VOCABULARY',
          question_text: `Choose the correct meaning of "${word}"`,
          description: translation ? `O‘zbekcha tarjimasi: ${translation}` : undefined,
          options: [
            translation || 'To‘g‘ri ma‘no',
            'Noto‘g‘ri variant 1',
            'Noto‘g‘ri variant 2',
            'Noto‘g‘ri variant 3',
          ],
          correct_answer: translation || 'To‘g‘ri ma‘no',
          points: 2,
          is_required: true,
        });
      }
    });

    setQuestions([...questions, ...newItems]);
    setBulkVocabText('');
    setShowBulkVocabModal(false);
  };

  // Add individual questions with rich defaults
  const addQuestion = (category: string, subType: string = '') => {
    const nextOrder = questions.length + 1;
    let newQ: QuestionDraft;

    if (category === 'READING') {
      if (subType === 'OPEN') {
        newQ = {
          id: Math.random().toString(36).substring(7),
          order: nextOrder,
          type: 'READING',
          section: 'READING',
          question_text: 'Matnni diqqat bilan o‘qib javob yozing:',
          description: 'O‘z so‘zlaringiz bilan matndan xulosa qilib yozing (minimal talab: 15 so‘z).',
          passage: questions.find((q) => q.section === 'READING')?.passage || 'Matnni bu yerga joylashtiring...',
          options: null, // Open-ended answer!
          min_words: 15,
          points: 5,
          is_required: true,
        };
      } else {
        newQ = {
          id: Math.random().toString(36).substring(7),
          order: nextOrder,
          type: 'READING',
          section: 'READING',
          question_text: 'Reading Comprehension Test Savoli:',
          passage: questions.find((q) => q.section === 'READING')?.passage || 'Matnni bu yerga joylashtiring...',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: 'Option A',
          points: 5,
          is_required: true,
        };
      }
    } else if (category === 'VOCABULARY') {
      newQ = {
        id: Math.random().toString(36).substring(7),
        order: nextOrder,
        type: 'VOCABULARY',
        section: 'VOCABULARY',
        question_text: 'So‘z ma‘nosini yoki tarjimasini tanlang:',
        description: 'Part of speech: Adjective / Noun',
        options: ['To‘g‘ri javob', 'Noto‘g‘ri variant B', 'Noto‘g‘ri variant C', 'Noto‘g‘ri variant D'],
        correct_answer: 'To‘g‘ri javob',
        points: 2,
        is_required: true,
      };
    } else if (category === 'GRAMMAR') {
      if (subType === 'SENTENCE') {
        newQ = {
          id: Math.random().toString(36).substring(7),
          order: nextOrder,
          type: 'SENTENCE_BUILDER',
          section: 'GRAMMAR',
          question_text: 'So‘zlarni to‘g‘ri tartibda joylashtiring:',
          description: 'Gap tuzish mashqi',
          options: ['word1', 'word2', 'word3', 'word4'],
          correct_answer: 'word1 word2 word3 word4',
          points: 4,
          is_required: true,
        };
      } else {
        newQ = {
          id: Math.random().toString(36).substring(7),
          order: nextOrder,
          type: 'FILL_BLANK',
          section: 'GRAMMAR',
          question_text: 'Bo‘sh joyni qavs ichidagi fe‘l bilan to‘ldiring:',
          description: 'Mavzu: Zamonlar / Predloglar',
          correct_answer: ['correct answer'],
          points: 3,
          is_required: true,
        };
      }
    } else if (category === 'WRITING') {
      newQ = {
        id: Math.random().toString(36).substring(7),
        order: nextOrder,
        type: 'WRITING',
        section: 'WRITING',
        question_text: 'Insho mavzusi:',
        description: 'Reja va ko‘rsatmalar:\n1. Kirish\n2. Asosiy qism\n3. Xulosa',
        min_words: 100,
        max_words: 250,
        points: 20,
        is_required: true,
      };
    } else if (category === 'SPEAKING') {
      newQ = {
        id: Math.random().toString(36).substring(7),
        order: nextOrder,
        type: 'SPEAKING',
        section: 'SPEAKING',
        question_text: 'Speaking mavzusi:',
        description: '1-2 daqiqa davomida quyidagi savollarga javob berib ovozingizni yozing:\n- ...',
        media_duration: 180,
        points: 15,
        is_required: true,
      };
    } else if (category === 'PHOTO') {
      newQ = {
        id: Math.random().toString(36).substring(7),
        order: nextOrder,
        type: 'PHOTO',
        section: 'PHOTO',
        question_text: 'Daftardagi mashqlar rasmi:',
        description: 'Workbook 24-betdagi 1, 2-mashqlarni daftarga yozib sifatli rasmga oling.',
        points: 10,
        is_required: true,
      };
    } else {
      // LISTENING
      newQ = {
        id: Math.random().toString(36).substring(7),
        order: nextOrder,
        type: 'LISTENING',
        section: 'LISTENING',
        question_text: 'Audioni tinglab to‘g‘ri javobni tanlang:',
        media_url: '',
        media_type: 'audio',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A',
        points: 5,
        is_required: true,
      };
    }

    setQuestions([...questions, newQ]);
    setActiveTab(category);
  };

  const removeQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(updated);
  };

  const updateQuestion = (idx: number, patch: Partial<QuestionDraft>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...patch };
    setQuestions(updated);
  };

  // Calculations
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const questionsCount = questions.length;

  const sectionCounts = {
    VOCABULARY: questions.filter((q) => q.section === 'VOCABULARY').length,
    GRAMMAR: questions.filter((q) => q.section === 'GRAMMAR').length,
    READING: questions.filter((q) => q.section === 'READING').length,
    WRITING: questions.filter((q) => q.section === 'WRITING').length,
    SPEAKING: questions.filter((q) => q.section === 'SPEAKING').length,
    PHOTO: questions.filter((q) => q.section === 'PHOTO').length,
    LISTENING: questions.filter((q) => q.section === 'LISTENING').length,
  };

  // Save or Publish
  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim()) {
      alert('Iltimos, vazifa sarlavhasini kiriting!');
      return;
    }

    if (questions.length === 0) {
      alert('Iltimos, kamida bitta bo‘lim yoki savol qo‘shing!');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: instructions.trim() || undefined,
        instructions: instructions.trim() || undefined,
        type: 'MIXED',
        difficulty,
        points: totalPoints > 0 ? totalPoints : 100,
        estimated_time_minutes: estimatedMinutes,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        allow_late_submission: allowLateSubmission,
        target_type: targetType,
        target_group_id: targetType === 'GROUP' ? targetGroupId : undefined,
        selected_student_ids: targetType === 'INDIVIDUAL' ? selectedStudentIds : undefined,
        status,
        questions: questions.map((q, idx) => ({
          order: idx + 1,
          type: q.type,
          question_text: q.question_text || `Question #${idx + 1}`,
          description: q.description || undefined,
          passage: q.passage || undefined,
          media_url: q.media_url || undefined,
          media_type: q.media_type || undefined,
          media_duration: q.media_duration || undefined,
          transcript: q.transcript || undefined,
          options: q.options || undefined,
          correct_answer: q.correct_answer || undefined,
          min_words: q.min_words || undefined,
          max_words: q.max_words || undefined,
          points: q.points || 1,
          is_required: q.is_required,
        })),
      };

      if (assignmentId) {
        await api.updateAssignment(assignmentId, payload);
      } else {
        await api.createAssignment(payload);
      }

      alert(
        status === 'PUBLISHED'
          ? '✓ Uyga vazifa e\'lon qilindi va o‘quvchilarga yuborildi!'
          : '✓ Qoralama muvaffaqiyatli saqlandi!'
      );
      navigate('/admin/assignments');
    } catch (err: any) {
      console.error(err);
      alert('Xatolik yuz berdi: ' + (err.message || 'Saqlab bo‘lmadi'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (activeTab === 'ALL') return true;
    return q.section === activeTab;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* 1. Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-3 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBackToTypes && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBackToTypes}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {t('common.back')}
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-extrabold text-[11px] uppercase tracking-wider">
                🌟 2-3 Soatlik Kompleks Vazifa
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">{questionsCount} ta savol / {totalPoints} ball</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5">
              {title.trim() || 'Yangi Mukammal Uyga Vazifa Paketi'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateModal(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            className="border-amber-200 bg-amber-50/40 text-amber-900 hover:bg-amber-100/60"
          >
            ⚡ Tayyor Shablon
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowBulkVocabModal(true)}
            leftIcon={<Copy className="w-3.5 h-3.5 text-indigo-500" />}
          >
            📋 Ommaviy So‘zlar
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleSave('DRAFT')}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            {t('common.saveDraft')}
          </Button>

          <Button
            type="button"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleSave('PUBLISHED')}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="shadow-sm"
          >
            E'lon qilish ✓
          </Button>
        </div>
      </div>

      {/* 2. Metadata Settings Card */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <FileText className="w-4 h-4 text-brand-600" />
          <span>Vazifa Parametrlari va Mo‘ljallangan Auditoriya</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vazifa Sarlavhasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Unit 4: Vocabulary, Grammar & Essay Intensive Review"
              className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              O‘quvchilar uchun Ko‘rsatma / Tavsif
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Masalan: Vazifani 2-3 soat davomida to‘liq ishlab chiqing. Barcha bo‘limlarni ketma-ketlikda bajaring."
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kimga beriladi?
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
            >
              <option value="ALL">Barcha o‘quvchilarga (All Students)</option>
              <option value="GROUP">Aniq bitta guruhga (Specific Group)</option>
              <option value="INDIVIDUAL">Tanlangan o‘quvchilarga (Individual)</option>
            </select>
          </div>

          {targetType === 'GROUP' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Guruhni tanlang <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              >
                <option value="">Guruhni tanlang...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.level} - {g.student_count || 0} o‘quvchi)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Topshirish muddati (Deadline)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Qiyinlik darajasi
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              >
                <option value="Beginner">Beginner (A1)</option>
                <option value="Elementary">Elementary (A2)</option>
                <option value="Intermediate">Intermediate (B1)</option>
                <option value="Upper-Intermediate">Upper-Intermediate (B2)</option>
                <option value="Advanced">Advanced (C1)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Taxminiy vaqt (daqiqa)
              </label>
              <input
                type="number"
                min={15}
                max={300}
                step={15}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-bold"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Deep Category Workbenches Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-600" />
            <span>Vazifa Yo‘nalishlari & Bo‘limlar ({questionsCount} ta savol / {totalPoints} ball)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Har bir bo‘limga alohida chuqur e'tibor bilan vazifalar qo‘shing
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 Barchasi ({questionsCount})
          </button>
          <button
            onClick={() => setActiveTab('READING')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'READING'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            📖 Reading ({sectionCounts.READING})
          </button>
          <button
            onClick={() => setActiveTab('VOCABULARY')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'VOCABULARY'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            📚 Lug‘at ({sectionCounts.VOCABULARY})
          </button>
          <button
            onClick={() => setActiveTab('GRAMMAR')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'GRAMMAR'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            🧩 Grammatika ({sectionCounts.GRAMMAR})
          </button>
          <button
            onClick={() => setActiveTab('WRITING')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'WRITING'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            ✍️ Insho ({sectionCounts.WRITING})
          </button>
          <button
            onClick={() => setActiveTab('SPEAKING')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'SPEAKING'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            🎙️ Nutq ({sectionCounts.SPEAKING})
          </button>
          <button
            onClick={() => setActiveTab('PHOTO')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'PHOTO'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            📸 Daftar ({sectionCounts.PHOTO})
          </button>
        </div>

        {/* Specialized Adder Buttons for Selected Category */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500">Kengaytirilgan qo‘shish:</span>

          {/* Reading Adders */}
          <button
            type="button"
            onClick={() => addQuestion('READING', 'CHOICE')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>📖 Reading Test (A, B, C, D)</span>
          </button>
          <button
            type="button"
            onClick={() => addQuestion('READING', 'OPEN')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-100/70 text-amber-900 text-xs font-bold hover:bg-amber-200/70 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>✍️ Reading Ochiq Savol (Yozma javob)</span>
          </button>

          {/* Vocab Adders */}
          <button
            type="button"
            onClick={() => addQuestion('VOCABULARY')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>📚 Yangi So‘z Mashqi</span>
          </button>

          {/* Grammar Adders */}
          <button
            type="button"
            onClick={() => addQuestion('GRAMMAR', 'BLANK')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-900 text-xs font-bold hover:bg-indigo-100 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>🧩 Grammatika (Fill-in)</span>
          </button>
          <button
            type="button"
            onClick={() => addQuestion('GRAMMAR', 'SENTENCE')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-100/70 text-indigo-900 text-xs font-bold hover:bg-indigo-200/70 transition-all"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>🔀 Gap Tuzish (Sentence Builder)</span>
          </button>

          {/* Writing Adder */}
          <button
            type="button"
            onClick={() => addQuestion('WRITING')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-900 text-xs font-bold hover:bg-blue-100 transition-all"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>✍️ Insho / Yozma Ish</span>
          </button>

          {/* Speaking Adder */}
          <button
            type="button"
            onClick={() => addQuestion('SPEAKING')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 text-purple-900 text-xs font-bold hover:bg-purple-100 transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>🎙️ Speaking Nutq</span>
          </button>

          {/* Photo Adder */}
          <button
            type="button"
            onClick={() => addQuestion('PHOTO')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 text-teal-900 text-xs font-bold hover:bg-teal-100 transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📸 Daftardagi Mashq</span>
          </button>
        </div>
      </div>

      {/* 4. Questions Editor List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Ushbu bo‘limda savollar yo‘q</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Yuqoridagi tugmalar orqali ushbu yo‘nalish bo‘yicha vazifa qo‘shing yoki <strong>"⚡ Tayyor Shablon"</strong> tugmasidan foydalaning.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const realIndex = questions.findIndex((item) => item.id === q.id);

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-brand-50 text-brand-700 font-extrabold text-xs flex items-center justify-center border border-brand-100">
                      {realIndex + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
                      {q.section}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {q.type.replace(/_/g, ' ')}
                    </span>
                    {q.type === 'READING' && !q.options && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        Ochiq Yozma Javob
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Ball:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points}
                        onChange={(e) => updateQuestion(realIndex, { points: Number(e.target.value) })}
                        className="w-14 p-1 rounded-lg border border-slate-200 text-center font-bold text-slate-800"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestion(realIndex)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Savolni o‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Common Question Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Savol matni yoki Vazifa buyrug‘i <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={q.question_text}
                    onChange={(e) => updateQuestion(realIndex, { question_text: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="Masalan: Choose the correct meaning / Matnni diqqat bilan o‘qib javob yozing..."
                  />
                </div>

                {/* 1. READING SECTION */}
                {q.type === 'READING' && (
                  <div className="space-y-3 bg-amber-50/40 p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-amber-900">
                        📖 O‘qish matni (Reading Passage)
                      </label>
                      <span className="text-[10px] text-amber-700 font-medium">
                        {q.passage ? q.passage.trim().split(/\s+/).length : 0} ta so‘z
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={q.passage || ''}
                      onChange={(e) => updateQuestion(realIndex, { passage: e.target.value })}
                      placeholder="Katta matnni bu yerga joylashtiring..."
                      className="w-full text-xs rounded-xl border border-amber-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 leading-relaxed font-sans"
                    />

                    {/* Mode: Choice OR Open Answer */}
                    {Array.isArray(q.options) && q.options.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-amber-900">
                            Variantlar (To‘g‘ri javobni belgilang)
                          </label>
                          <button
                            type="button"
                            onClick={() => updateQuestion(realIndex, { options: null, min_words: 15 })}
                            className="text-[10px] font-bold text-amber-800 underline hover:text-amber-950"
                          >
                            Ochiq yozma savolga aylantirish ↗
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                              <input
                                type="radio"
                                name={`correct_${q.id}`}
                                checked={q.correct_answer === opt}
                                onChange={() => updateQuestion(realIndex, { correct_answer: opt })}
                                className="accent-brand-600"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[optIdx] = e.target.value;
                                  updateQuestion(realIndex, { options: newOpts });
                                }}
                                className="flex-1 text-xs outline-none bg-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 bg-white p-3 rounded-xl border border-amber-200/80">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-amber-900">
                            ✍️ Ochiq Yozma Savol Sozlamalari (O‘quvchi matnga qarab javob yozadi)
                          </label>
                          <button
                            type="button"
                            onClick={() => updateQuestion(realIndex, { options: ['Option A', 'Option B', 'Option C', 'Option D'], min_words: undefined })}
                            className="text-[10px] font-bold text-amber-800 underline hover:text-amber-950"
                          >
                            Testga aylantirish (A, B, C, D) ↗
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          O‘quvchi ushbu savolga matn asosida o‘z so‘zlari bilan matn yozadi. O‘qituvchi tomonidan tekshiriladi.
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-700">Minimal so‘zlar talabi:</span>
                          <input
                            type="number"
                            value={q.min_words || 15}
                            onChange={(e) => updateQuestion(realIndex, { min_words: Number(e.target.value) })}
                            className="w-16 p-1 border border-slate-200 rounded-lg text-center font-bold"
                          />
                          <span className="text-slate-500">ta so‘z</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. VOCABULARY SECTION */}
                {q.type === 'VOCABULARY' && (
                  <div className="space-y-3 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                    <div>
                      <label className="block text-xs font-bold text-emerald-900 mb-1">
                        So‘z tavsifi / Ma'nosi / Namunaviy gap
                      </label>
                      <input
                        type="text"
                        value={q.description || ''}
                        onChange={(e) => updateQuestion(realIndex, { description: e.target.value })}
                        placeholder="Masalan: Part of speech: Adjective. Meaning: Hardworking"
                        className="w-full text-xs rounded-xl border border-emerald-200 p-2 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-emerald-900">
                        Test Variantlari (To‘g‘ri javobni belgilang)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(q.options || ['Option A', 'Option B', 'Option C', 'Option D']).map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={q.correct_answer === opt}
                              onChange={() => updateQuestion(realIndex, { correct_answer: opt })}
                              className="accent-brand-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(q.options || [])];
                                newOpts[optIdx] = e.target.value;
                                updateQuestion(realIndex, { options: newOpts });
                              }}
                              className="flex-1 text-xs outline-none bg-transparent font-medium"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GRAMMAR SECTION */}
                {q.section === 'GRAMMAR' && (
                  <div className="space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
                    <div>
                      <label className="block text-xs font-bold text-indigo-900 mb-1">
                        Grammatik qoida / Mavzu izohi
                      </label>
                      <input
                        type="text"
                        value={q.description || ''}
                        onChange={(e) => updateQuestion(realIndex, { description: e.target.value })}
                        placeholder="Masalan: Topic: Second Conditional / Dependent Preposition"
                        className="w-full text-xs rounded-xl border border-indigo-200 p-2 bg-white"
                      />
                    </div>

                    {q.type === 'FILL_BLANK' && (
                      <div>
                        <label className="block text-xs font-bold text-indigo-900 mb-1">
                          Qabul qilinadigan to‘g‘ri javob(lar)
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : (q.correct_answer || '')}
                          onChange={(e) => {
                            const vals = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            updateQuestion(realIndex, { correct_answer: vals });
                          }}
                          placeholder="Masalan: has lived (yoki bir nechta variant vergul bilan)"
                          className="w-full text-xs rounded-xl border border-indigo-200 p-2.5 bg-white font-bold"
                        />
                      </div>
                    )}

                    {q.type === 'SENTENCE_BUILDER' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-indigo-900">
                          To‘g‘ri tuzilgan to‘liq gap
                        </label>
                        <input
                          type="text"
                          value={q.correct_answer || ''}
                          onChange={(e) => {
                            const sentence = e.target.value;
                            const words = sentence.split(/\s+/).filter(Boolean);
                            updateQuestion(realIndex, { correct_answer: sentence, options: words });
                          }}
                          placeholder="Masalan: Practicing English every day improves fluency"
                          className="w-full text-xs rounded-xl border border-indigo-200 p-2.5 bg-white font-bold"
                        />
                        <p className="text-[11px] text-slate-500">
                          Gapdagi so‘zlar avtomatik tarzda aralashtirilib o‘quvchiga taqdim etiladi.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. WRITING SECTION */}
                {q.type === 'WRITING' && (
                  <div className="space-y-3 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1">
                        Insho Ko‘rsatmasi, Rejasi va Baholash mezonlari
                      </label>
                      <textarea
                        rows={3}
                        value={q.description || ''}
                        onChange={(e) => updateQuestion(realIndex, { description: e.target.value })}
                        placeholder="Reja: 1. Kirish, 2. Asosiy fikrlar, 3. Xulosa. Talab qilinadigan iboralar..."
                        className="w-full text-xs rounded-xl border border-blue-200 p-2.5 bg-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1">
                          Minimal so‘zlar soni
                        </label>
                        <input
                          type="number"
                          value={q.min_words || 100}
                          onChange={(e) => updateQuestion(realIndex, { min_words: Number(e.target.value) })}
                          className="w-full text-xs rounded-xl border border-blue-200 p-2 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1">
                          Maksimal so‘zlar soni
                        </label>
                        <input
                          type="number"
                          value={q.max_words || 250}
                          onChange={(e) => updateQuestion(realIndex, { max_words: Number(e.target.value) })}
                          className="w-full text-xs rounded-xl border border-blue-200 p-2 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SPEAKING SECTION */}
                {q.type === 'SPEAKING' && (
                  <div className="space-y-3 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1">
                        Nutq mavzusi va Cue Card ko‘rsatmalari
                      </label>
                      <textarea
                        rows={3}
                        value={q.description || ''}
                        onChange={(e) => updateQuestion(realIndex, { description: e.target.value })}
                        placeholder="Quyidagi savollar bo‘yicha 1-2 daqiqa gapiring: 1)... 2)... 3)..."
                        className="w-full text-xs rounded-xl border border-purple-200 p-2.5 bg-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-purple-900">Maksimal davomiyligi:</span>
                      <input
                        type="number"
                        min={30}
                        max={300}
                        step={30}
                        value={q.media_duration || 180}
                        onChange={(e) => updateQuestion(realIndex, { media_duration: Number(e.target.value) })}
                        className="w-16 p-1 rounded-lg border border-purple-200 text-center font-bold"
                      />
                      <span className="text-slate-500">soniya (masalan: 120 = 2 daqiqa)</span>
                    </div>
                  </div>
                )}

                {/* 6. PHOTO / WORKBOOK SECTION */}
                {q.type === 'PHOTO' && (
                  <div className="space-y-3 bg-teal-50/40 p-4 rounded-xl border border-teal-100">
                    <div>
                      <label className="block text-xs font-bold text-teal-900 mb-1">
                        Daftardagi mashq ko‘rsatmalari
                      </label>
                      <textarea
                        rows={2}
                        value={q.description || ''}
                        onChange={(e) => updateQuestion(realIndex, { description: e.target.value })}
                        placeholder="Masalan: Workbook 24-betdagi 1, 2, 3-mashqlarni qo‘lda daftarga yozib, to‘liq sahifani sifatli rasmga oling."
                        className="w-full text-xs rounded-xl border border-teal-200 p-2.5 bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="⚡ 2-3 Soatlik Tayyor Kompleks Shablonni Yuklash"
      >
        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-500 leading-relaxed">
            Quyidagi professional shablonlardan birini tanlang. Barcha bo‘limlar avtomatik to‘ldiriladi va istalgan qismini o‘zgartirishingiz mumkin:
          </p>

          <div
            onClick={() => loadTemplate('general_2h')}
            className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/50 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-950">📘 General English Intensive (2-3 Soat)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">B1 • 14 ta topshiriq</span>
            </div>
            <p className="text-xs text-emerald-800/80">
              Lug‘at (5 so‘z) + Grammatika (4 gap fill) + Reading matni (2 savol, shu jumladan ochiq yozma savol) + Insho (100 so‘z) + Speaking nutq + Daftardan rasm.
            </p>
          </div>

          <div
            onClick={() => loadTemplate('ielts_2h')}
            className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/50 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-indigo-950">🏆 IELTS Academic Intensive (2.5 Soat)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">B2-C1 • 6 ta katta bo‘lim</span>
            </div>
            <p className="text-xs text-indigo-800/80">
              Band 7+ Lug‘at + Ilmiy Reading matni (Test + Ochiq tahlil) + IELTS Task 2 Insho (min 180 so‘z) + Speaking Part 2 nutq yozish.
            </p>
          </div>

          <div
            onClick={() => loadTemplate('grammar_vocab_2h')}
            className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100/50 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-amber-950">⚡ Grammatika va Lug‘at Bo‘roni (2 Soat)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Chuqur drill • 7 ta bo‘lim</span>
            </div>
            <p className="text-xs text-amber-800/80">
              So‘zlar sinovi + Zamonlar va predloglar bo‘sh o‘rin to‘ldirish + Gap tuzish + Qoidalar daftari rasmi.
            </p>
          </div>
        </div>
      </Modal>

      {/* Bulk Vocab Modal */}
      <Modal
        isOpen={showBulkVocabModal}
        onClose={() => setShowBulkVocabModal(false)}
        title="📋 Ommaviy So‘zlarni Kiritish (Bulk Paste)"
      >
        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-500">
            So‘zlarni va ularning ma'nolarini qatorlab tashlang (masalan: <code>word - tarjimasi</code>):
          </p>

          <textarea
            rows={8}
            value={bulkVocabText}
            onChange={(e) => setBulkVocabText(e.target.value)}
            placeholder={`accomplish - erishmoq, muvaffaqiyatga erishmoq\ndiligent - tirishqoq, g'ayratli\ncrucial - juda muhim, hal qiluvchi\nreluctant - istaksiz, ikkilanuvchi\nabundant - ko'p, mo'l-ko'l`}
            className="w-full text-xs font-mono rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkVocabModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={handleBulkVocabImport}>
              Savollarni yaratish ✓
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComprehensiveHomeworkBuilder;
