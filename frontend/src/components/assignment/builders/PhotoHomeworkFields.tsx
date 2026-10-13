import React from 'react';
import { Camera, FileUp } from 'lucide-react';
import { FileUploader } from '../../ui/FileUploader';
import { useLanguage } from '../../../context/LanguageContext';

export interface PhotoHomeworkData {
  instructions: string;
  referenceImageUrl: string;
  points: number;
}

interface PhotoHomeworkFieldsProps {
  data: PhotoHomeworkData;
  onChange: (data: PhotoHomeworkData) => void;
}

export const PhotoHomeworkFields: React.FC<PhotoHomeworkFieldsProps> = ({
  data,
  onChange,
}) => {
  const { t, adminMode } = useLanguage();

  const update = (patch: Partial<PhotoHomeworkData>) => {
    onChange({ ...data, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-pink-50/70 border border-pink-200/80 text-pink-900 text-xs">
        <Camera className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">
            {adminMode === 'uz'
              ? 'Daftardagi vazifa rasmi paneli'
              : adminMode === 'en'
              ? 'Handwritten Photo Homework Panel'
              : 'Daftar rasmi / Photo Homework'}
          </span>
          <p className="text-pink-700 leading-relaxed">
            {adminMode === 'uz'
              ? 'O‘quvchilar daftarga yoki ish kitobiga qo‘lda yozilgan vazifasining fotosuratini topshiradilar. O‘qituvchi rasmni to‘liq ko‘rib chiqib baholaydi.'
              : adminMode === 'en'
              ? 'Students upload photographs of their handwritten workbook exercises or notebook assignments for manual evaluation.'
              : 'Qo‘lda yozilgan vazifa rasmi / Handwritten photo submission.'}
          </p>
        </div>
      </div>

      {/* 1. Prompt */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Vazifa sharti va sahifa raqami *' : 'Homework Task & Page Instructions *'}
        </label>
        <textarea
          rows={3}
          value={data.instructions}
          onChange={(e) => update({ instructions: e.target.value })}
          placeholder={
            adminMode === 'uz'
              ? 'Masalan: English File Workbook, 52-sahifa, 3 va 4-mashqlar. Daftarga to‘liq yozing va tiniq rasmga olib yuklang.'
              : 'e.g. English File Workbook, page 52, exercises 3 and 4. Complete in your notebook and upload clear photos.'
          }
          className="w-full text-sm font-medium rounded-xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* 2. Reference photo / document */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {adminMode === 'uz' ? 'Kitob sahifasi yoki namuna rasmi (Ixtiyoriy)' : 'Reference Image or Exercise Page (Optional)'}
        </label>
        <FileUploader
          initialUrl={data.referenceImageUrl}
          onFileUploaded={(url) => update({ referenceImageUrl: url })}
        />
      </div>

      {/* Points */}
      <div className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            {t('admin.pointsLabel', true)}
          </span>
          <span className="text-[11px] text-slate-400">
            {adminMode === 'uz' ? 'Daftar vazifasi uchun maksimal ball' : 'Max points for photo submission'}
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
