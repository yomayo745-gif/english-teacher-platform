import React from 'react';
import {
  Image as ImageIcon,
  PenTool,
  BookOpen,
  Languages,
  CheckSquare,
  CheckCircle2,
  Edit3,
  Shuffle,
  Volume2,
  Mic,
  Camera,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { TaskType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export interface TaskTypeOption {
  type: TaskType;
  emoji: string;
  icon: React.ElementType;
  nameUz: string;
  nameEn: string;
  descUz: string;
  descEn: string;
  badgeUz: string;
  badgeEn: string;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    button: string;
  };
}

export const TASK_TYPE_OPTIONS: TaskTypeOption[] = [
  {
    type: 'PICTURE_DESCRIPTION',
    emoji: '🖼',
    icon: ImageIcon,
    nameUz: 'Rasmni tasvirlash',
    nameEn: 'Picture Description',
    descUz: 'Rasm yuklang, savol va min/max so‘zlar belgilang. O‘quvchi rasmga qarab tasvirlaydi.',
    descEn: 'Upload an image, set prompt and word limits. Students describe what they see in English.',
    badgeUz: 'Yozma • O‘qituvchi tekshiradi',
    badgeEn: 'Writing • Manual Review',
    colorClass: {
      bg: 'hover:bg-blue-50/50',
      border: 'hover:border-blue-300',
      text: 'text-blue-600',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700 border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  },
  {
    type: 'WRITING',
    emoji: '✍️',
    icon: PenTool,
    nameUz: 'Insho va yozma ish',
    nameEn: 'Writing & Essay',
    descUz: 'Mavzu, ko‘rsatmalar va min/max so‘zlar soni. Erkin insho yoki maqola yozish topshirig‘i.',
    descEn: 'Topic, essay prompts and word requirements. Open-ended written production.',
    badgeUz: 'Insho • O‘qituvchi tekshiradi',
    badgeEn: 'Essay • Manual Review',
    colorClass: {
      bg: 'hover:bg-indigo-50/50',
      border: 'hover:border-indigo-300',
      text: 'text-indigo-600',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700 border-indigo-200',
      button: 'bg-indigo-600 hover:bg-indigo-700',
    },
  },
  {
    type: 'VOCABULARY',
    emoji: '📚',
    icon: BookOpen,
    nameUz: 'Lug‘at va so‘z boyligi',
    nameEn: 'Vocabulary Practice',
    descUz: 'Yangi so‘zlar ro‘yxati, ma‘nosi va namunaviy gaplar bo‘yicha bilimlarni tekshirish.',
    descEn: 'Word definitions, translations, and vocabulary mastery exercises.',
    badgeUz: 'Lug‘at • Avto-tekshirish',
    badgeEn: 'Vocabulary • Auto-graded',
    colorClass: {
      bg: 'hover:bg-emerald-50/50',
      border: 'hover:border-emerald-300',
      text: 'text-emerald-600',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700 border-emerald-200',
      button: 'bg-emerald-600 hover:bg-emerald-700',
    },
  },
  {
    type: 'TRANSLATION',
    emoji: '🔤',
    icon: Languages,
    nameUz: 'Tarjima mashqi',
    nameEn: 'Translation Exercise',
    descUz: 'EN→UZ yoki UZ→EN tarjima qilish uchun gaplar va namunaviy to‘g‘ri javoblar.',
    descEn: 'Translate sentences with reference answer keys for structured linguistic practice.',
    badgeUz: 'Tarjima • Qisman avto-baho',
    badgeEn: 'Translation • Semi-auto',
    colorClass: {
      bg: 'hover:bg-violet-50/50',
      border: 'hover:border-violet-300',
      text: 'text-violet-600',
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-700 border-violet-200',
      button: 'bg-violet-600 hover:bg-violet-700',
    },
  },
  {
    type: 'MULTIPLE_CHOICE',
    emoji: '🎯',
    icon: CheckSquare,
    nameUz: 'Test (Bir nechta variant)',
    nameEn: 'Multiple Choice Quiz',
    descUz: 'Savol va 4 ta variant. Bitta to‘g‘ri javob belgilanadi va darhol avtomatik baholanadi.',
    descEn: 'Single choice quiz with automatic instant scoring upon student submission.',
    badgeUz: 'Test • Avtomatik baho',
    badgeEn: 'Quiz • Instant Scoring',
    colorClass: {
      bg: 'hover:bg-amber-50/50',
      border: 'hover:border-amber-300',
      text: 'text-amber-600',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700 border-amber-200',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
  },
  {
    type: 'TRUE_FALSE',
    emoji: '✅',
    icon: CheckCircle2,
    nameUz: 'To‘g‘ri / Noto‘g‘ri',
    nameEn: 'True / False Statements',
    descUz: 'Fikr yoki jumla beriladi. O‘quvchi fikr to‘g‘ri yoki noto‘g‘riligini tanlaydi.',
    descEn: 'Factual statements where students select either True or False with instant feedback.',
    badgeUz: 'Tezkor test • Avto-baho',
    badgeEn: 'Fast Quiz • Auto-graded',
    colorClass: {
      bg: 'hover:bg-teal-50/50',
      border: 'hover:border-teal-300',
      text: 'text-teal-600',
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700 border-teal-200',
      button: 'bg-teal-600 hover:bg-teal-700',
    },
  },
  {
    type: 'FILL_BLANK',
    emoji: '📝',
    icon: Edit3,
    nameUz: 'Bo‘sh joylarni to‘ldirish',
    nameEn: 'Fill in the Blanks',
    descUz: 'Gapda tushirib qoldirilgan so‘z o‘rni [____] va qabul qilinadigan variantlar kaliti.',
    descEn: 'Sentence with missing blank word and accepted answer variations.',
    badgeUz: 'Grammatika • Avto-baho',
    badgeEn: 'Grammar • Auto-graded',
    colorClass: {
      bg: 'hover:bg-sky-50/50',
      border: 'hover:border-sky-300',
      text: 'text-sky-600',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-700 border-sky-200',
      button: 'bg-sky-600 hover:bg-sky-700',
    },
  },
  {
    type: 'MATCHING',
    emoji: '🔗',
    icon: Shuffle,
    nameUz: 'Moslashtirish',
    nameEn: 'Matching Pairs',
    descUz: 'Chap va o‘ng ustun juftliklari: so‘z va tarjima, atama va ta‘rif, savol va javob.',
    descEn: 'Match items from the left column with corresponding options on the right.',
    badgeUz: 'Juftliklar • Avto-baho',
    badgeEn: 'Pairs • Auto-graded',
    colorClass: {
      bg: 'hover:bg-purple-50/50',
      border: 'hover:border-purple-300',
      text: 'text-purple-600',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700 border-purple-200',
      button: 'bg-purple-600 hover:bg-purple-700',
    },
  },
  {
    type: 'READING',
    emoji: '📖',
    icon: BookOpen,
    nameUz: 'O‘qib tushunish',
    nameEn: 'Reading Comprehension',
    descUz: 'Katta o‘qish matni yoki maqola, unga tegishli savollar va tahliliy topshiriqlar.',
    descEn: 'Reading passage accompanied by multiple comprehension questions.',
    badgeUz: 'Matn • Tahliliy',
    badgeEn: 'Passage • Comprehension',
    colorClass: {
      bg: 'hover:bg-orange-50/50',
      border: 'hover:border-orange-300',
      text: 'text-orange-600',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700 border-orange-200',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
  },
  {
    type: 'LISTENING',
    emoji: '🎧',
    icon: Volume2,
    nameUz: 'Tinglab tushunish',
    nameEn: 'Listening Comprehension',
    descUz: 'Audio fayl yuklash, tinglashlar soni limiti (1-3 yoki cheklovsiz), matn va savollar.',
    descEn: 'Audio file playback with student play-count limit, script toggle and questions.',
    badgeUz: 'Audio • Eshitish',
    badgeEn: 'Audio • Listening',
    colorClass: {
      bg: 'hover:bg-cyan-50/50',
      border: 'hover:border-cyan-300',
      text: 'text-cyan-600',
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-700 border-cyan-200',
      button: 'bg-cyan-600 hover:bg-cyan-700',
    },
  },
  {
    type: 'SPEAKING',
    emoji: '🎙',
    icon: Mic,
    nameUz: 'So‘zlashuv va nutq',
    nameEn: 'Speaking & Voice Homework',
    descUz: 'Mavzu beriladi, o‘quvchi mikrofon orqali inglizcha gapirib yuboradi. Vaqt limiti.',
    descEn: 'Verbal response recorded through microphone with duration controls.',
    badgeUz: 'Ovoz • O‘qituvchi baholaydi',
    badgeEn: 'Speech • Manual Review',
    colorClass: {
      bg: 'hover:bg-rose-50/50',
      border: 'hover:border-rose-300',
      text: 'text-rose-600',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700 border-rose-200',
      button: 'bg-rose-600 hover:bg-rose-700',
    },
  },
  {
    type: 'PHOTO',
    emoji: '📷',
    icon: Camera,
    nameUz: 'Daftardagi vazifa rasmi',
    nameEn: 'Handwritten Photo Homework',
    descUz: 'Daftarga yoki ish daftarchasiga yozilgan mashqlarning fotosuratini topshirish.',
    descEn: 'Upload clear camera captures or PDF scans of handwritten workbook homework.',
    badgeUz: 'Daftar • O‘qituvchi tekshiradi',
    badgeEn: 'Workbook • Manual Review',
    colorClass: {
      bg: 'hover:bg-pink-50/50',
      border: 'hover:border-pink-300',
      text: 'text-pink-600',
      badgeBg: 'bg-pink-50',
      badgeText: 'text-pink-700 border-pink-200',
      button: 'bg-pink-600 hover:bg-pink-700',
    },
  },
  {
    type: 'SHORT_ANSWER',
    emoji: '💬',
    icon: MessageSquare,
    nameUz: 'Qisqa javobli savol',
    nameEn: 'Short Answer Question',
    descUz: '1-3 gapdan iborat aniq savol va namunaviy kalit bilan qisqa yozma javob.',
    descEn: 'Targeted prompt expecting a brief, precise English sentence response.',
    badgeUz: 'Savol-javob • Qisqa',
    badgeEn: 'Q&A • Short Answer',
    colorClass: {
      bg: 'hover:bg-slate-100/70',
      border: 'hover:border-slate-400',
      text: 'text-slate-700',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700 border-slate-200',
      button: 'bg-slate-800 hover:bg-slate-900',
    },
  },
];

interface TaskTypeSelectorProps {
  onSelectType: (type: TaskType) => void;
}

export const TaskTypeSelector: React.FC<TaskTypeSelectorProps> = ({ onSelectType }) => {
  const { adminMode, tr, t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 -translate-y-6 translate-x-6 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>
              {adminMode === 'uz'
                ? 'Ixtisoslashgan vazifalar tizimi'
                : adminMode === 'en'
                ? 'Dedicated Homework Panels'
                : 'Ixtisoslashgan panellar / Dedicated Homework Panels'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('admin.selectHomeworkType', true)}
          </h1>
          <p className="text-sm text-brand-100 leading-relaxed">
            {t('admin.selectHomeworkTypeSub', true)}
          </p>
        </div>
      </div>

      {/* Grid of 13 Dedicated Task Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TASK_TYPE_OPTIONS.map((item) => {
          const Icon = item.icon;
          const title =
            adminMode === 'uz'
              ? item.nameUz
              : adminMode === 'en'
              ? item.nameEn
              : `${item.nameUz} / ${item.nameEn}`;

          const desc =
            adminMode === 'uz'
              ? item.descUz
              : adminMode === 'en'
              ? item.descEn
              : `${item.descUz} · ${item.descEn}`;

          const badge =
            adminMode === 'uz'
              ? item.badgeUz
              : adminMode === 'en'
              ? item.badgeEn
              : `${item.badgeUz} / ${item.badgeEn}`;

          const btnText =
            adminMode === 'uz'
              ? 'Ushbu turda yaratish'
              : adminMode === 'en'
              ? 'Create with this type'
              : 'Yaratish / Create';

          return (
            <div
              key={item.type}
              onClick={() => onSelectType(item.type)}
              className={`group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer ${item.colorClass.border} ${item.colorClass.bg}`}
            >
              <div className="space-y-3">
                {/* Top: Icon + Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" role="img" aria-label={item.nameEn}>
                      {item.emoji}
                    </span>
                    <div className={`p-2 rounded-xl bg-slate-50 group-hover:bg-white transition-colors ${item.colorClass.text}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.colorClass.badgeBg} ${item.colorClass.badgeText}`}>
                    {badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>

              {/* Bottom: Action Button */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 group-hover:text-brand-600 transition-colors flex items-center gap-1">
                  {btnText}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {item.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
