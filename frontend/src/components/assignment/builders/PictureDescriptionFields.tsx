import React from 'react';
import { Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { FileUploader } from '../../ui/FileUploader';
import { useLanguage } from '../../../context/LanguageContext';

export interface PictureDescriptionData {
  imageUrl: string;
  prompt: string;
  minWords: number;
  maxWords: number;
  targetVocab: string;
  targetGrammar: string;
  points: number;
}

interface PictureDescriptionFieldsProps {
  data: PictureDescriptionData;
  onChange: (data: PictureDescriptionData) => void;
}

export const PictureDescriptionFields: React.FC<PictureDescriptionFieldsProps> = ({
  data,
  onChange,
}) => {
  const { t, adminMode } = useLanguage();

  const update = (patch: Partial<PictureDescriptionData>) => {
    onChange({ ...data, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs">
        <ImageIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Rasmni tasvirlash paneli'
              : adminMode === 'en'
              ? 'Picture Description Panel'
              : 'Rasmni tasvirlash / Picture Description'}
          </span>
          <p className="text-blue-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'O‘quvchi rasmga qarab ingliz tilida erkin matn yozadi. O‘qituvchi yozilgan matnni, so‘zlar sonini va grammatik aniqligini tekshiradi yoki AI tahlilidan foydalanadi.'
              : adminMode === 'en'
              ? 'Students observe the picture and write an English description meeting word criteria. Teachers grade responses with AI assistance.'
              : 'Rasmga qarab matn yozish / Students observe the picture and write in English.'}
          </p>
        </div>
      </div>

      {/* 1. Image Uploader */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz'
            ? 'Vazifa rasmi (Majburiy) *'
            : adminMode === 'en'
            ? 'Assignment Image (Required) *'
            : 'Vazifa rasmi / Assignment Image *'}
        </label>
        <FileUploader
          initialUrl={data.imageUrl}
          onFileUploaded={(url) => update({ imageUrl: url })}
        />
      </div>

      {/* 2. Prompt / Question */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t('admin.questionTextLabel', true)}
        </label>
        <textarea
          rows={3}
          value={data.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? 'Masalan: Rasmga diqqat bilan qarang. Odamlarning tashqi ko‘rinishi va qilayotgan ishlarini hozirgi davomli zamonda tasvirlang...'
              : adminMode === 'en'
              ? 'e.g. Look at the picture carefully. Describe what the people are wearing and what activities they are doing in Present Continuous...'
              : 'Masalan: Describe what you see in the photo in Present Continuous...'
          }
          className="w-full text-sm rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* 3. Word Limits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('admin.minWords', true)}
          </label>
          <input
            type="number"
            min={10}
            max={1000}
            step={5}
            value={data.minWords}
            onChange={(e) => update({ minWords: Number(e.target.value) || 0 })}
            className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
          />
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'O‘quvchi kamida shuncha so‘z yozishi shart' : 'Minimum words required'}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('admin.maxWords', true)}
          </label>
          <input
            type="number"
            min={0}
            max={2000}
            step={10}
            value={data.maxWords}
            onChange={(e) => update({ maxWords: Number(e.target.value) || 0 })}
            className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
          />
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'Ixtiyoriy yuqori chegara (0 = cheklovsiz)' : 'Optional upper limit (0 = none)'}
          </span>
        </div>
      </div>

      {/* 4. Target Vocabulary & Grammar hints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('admin.targetVocab', true)}
          </label>
          <input
            type="text"
            value={data.targetVocab}
            onChange={(e) => update({ targetVocab: e.target.value })}
            placeholder={t('admin.targetVocabPlaceholder', true)}
            className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
          />
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'O‘quvchi o‘z matnida ishlatishi kutilayotgan so‘zlar' : 'Keywords expected in description'}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {t('admin.targetGrammar', true)}
          </label>
          <input
            type="text"
            value={data.targetGrammar}
            onChange={(e) => update({ targetGrammar: e.target.value })}
            placeholder={t('admin.targetGrammarPlaceholder', true)}
            className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-500"
          />
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'Masalan: Present Continuous yoki Past Simple' : 'Grammar tense guideline'}
          </span>
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            {t('admin.pointsLabel', true)}
          </span>
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'Ushbu tasvirlash topshirig‘i uchun maksimal ball' : 'Max points for this task'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={100}
            value={data.points}
            onChange={(e) => update({ points: Number(e.target.value) || 10 })}
            className="w-20 text-sm font-bold text-center rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
          />
          <span className="text-xs text-slate-500 font-semibold">{t('common.points', true)}</span>
        </div>
      </div>
    </div>
  );
};
