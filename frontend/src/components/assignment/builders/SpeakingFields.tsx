import React from 'react';
import { Mic, Clock, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export interface SpeakingData {
  topic: string;
  instructions: string;
  durationLimit: number;
  allowedRetakes: number;
  points: number;
}

interface SpeakingFieldsProps {
  data: SpeakingData;
  onChange: (data: SpeakingData) => void;
}

export const SpeakingFields: React.FC<SpeakingFieldsProps> = ({ data, onChange }) => {
  const { t, adminMode } = useLanguage();

  const update = (patch: Partial<SpeakingData>) => {
    onChange({ ...data, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-xs">
        <Mic className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'So‘zlashuv va nutq (Speaking) paneli'
              : adminMode === 'en'
              ? 'Speaking & Voice Task Panel'
              : 'Nutq va so‘zlashuv / Speaking Panel'}
          </span>
          <p className="text-rose-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'O‘quvchilar mikrofon orqali inglizcha nutqini yozib topshiradilar. O‘qituvchi o‘quvchining audiosini eshitib, talaffuz va ravonlikka qarab baholaydi.'
              : adminMode === 'en'
              ? 'Students record their verbal response in English directly through their microphone. Teachers evaluate pronunciation, fluency, and content.'
              : 'Ovoz yozish topshirig‘i / Voice recording homework.'}
          </p>
        </div>
      </div>

      {/* 1. Topic */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'So‘zlashuv mavzusi *' : 'Speaking Topic *'}
        </label>
        <textarea
          rows={3}
          value={data.topic}
          onChange={(e) => update({ topic: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? 'Masalan: Describe your favorite city. What are the best places to visit and why?'
              : 'e.g. Describe your favorite city. What makes it special and what can visitors do there?'
          }
          className="w-full text-sm font-medium rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* 2. Instructions */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Ko‘rsatmalar / Savol yo‘nalishlari' : 'Speaking Guidelines / Prompts'}
        </label>
        <textarea
          rows={3}
          value={data.instructions}
          onChange={(e) => update({ instructions: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? '- Speak clearly for at least 45 seconds\n- Mention climate, culture, and architecture\n- Use adjectives like bustling, scenic, vibrant'
              : '- Speak continuously for at least 45 seconds\n- Address climate, culture, and key attractions\n- Use rich descriptive adjectives'
          }
          className="w-full text-xs rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-mono text-slate-600"
        />
      </div>

      {/* 3. Duration & Retakes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
        {/* Duration Limit */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('admin.speakingTimeLimit', true)}</span>
          </label>
          <select
            value={data.durationLimit}
            onChange={(e) => update({ durationLimit: Number(e.target.value) })}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
          >
            <option value={30}>30 {adminMode === 'uz' ? 'soniya' : 'seconds'}</option>
            <option value={60}>60 {adminMode === 'uz' ? 'soniya (1 daqiqa)' : 'seconds (1 min)'}</option>
            <option value={90}>90 {adminMode === 'uz' ? 'soniya (1.5 daqiqa)' : 'seconds (1.5 min)'}</option>
            <option value={120}>120 {adminMode === 'uz' ? 'soniya (2 daqiqa)' : 'seconds (2 min)'}</option>
            <option value={180}>180 {adminMode === 'uz' ? 'soniya (3 daqiqa)' : 'seconds (3 min)'}</option>
          </select>
        </div>

        {/* Retakes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('admin.speakingRetakes', true)}</span>
          </label>
          <select
            value={data.allowedRetakes}
            onChange={(e) => update({ allowedRetakes: Number(e.target.value) })}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-brand-500"
          >
            <option value={0}>{t('admin.unlimitedRetakes', true)}</option>
            <option value={1}>1 {adminMode === 'uz' ? 'marta' : 'time'}</option>
            <option value={2}>2 {adminMode === 'uz' ? 'marta' : 'times'}</option>
            <option value={3}>3 {adminMode === 'uz' ? 'marta' : 'times'}</option>
          </select>
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            {t('admin.pointsLabel', true)}
          </span>
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'So‘zlashuv topshirig‘i uchun maksimal ball' : 'Max points for spoken response'}
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
