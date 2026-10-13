import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface WordCounterProps {
  count: number;
  minWords?: number | null;
  maxWords?: number | null;
  isAdmin?: boolean;
}

export const WordCounter: React.FC<WordCounterProps> = ({ count, minWords, maxWords, isAdmin = false }) => {
  const { t, tr, mode } = useLanguage();
  const isUnderMin = minWords ? count < minWords : false;
  const isOverMax = maxWords ? count > maxWords : false;
  const isValid = !isUnderMin && !isOverMax;

  const wordsLabel = t('common.words', isAdmin);
  const minLabel = minWords
    ? tr({
        en: `min ${minWords}`,
        uz: `kamida ${minWords} ta`,
        bi: `kamida ${minWords} / min ${minWords}`,
      }, isAdmin)
    : '';

  const maxLabel = maxWords
    ? tr({
        en: `max ${maxWords}`,
        uz: `ko‘pi bilan ${maxWords} ta`,
        bi: `ko‘pi bilan ${maxWords} / max ${maxWords}`,
      }, isAdmin)
    : '';

  const limits = [minLabel, maxLabel].filter(Boolean).join(', ');

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs select-none">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium ${
          isUnderMin
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : isOverMax
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}
      >
        {isValid && (minWords || maxWords) ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" />
        )}
        <span>
          <span className="font-semibold">{count}</span> {wordsLabel}
          {limits ? ` (${limits})` : ''}
        </span>
      </div>

      {isUnderMin && minWords && (
        <span className="text-amber-700 font-medium text-[11px]">
          {tr({
            en: `Need ${minWords - count} more words`,
            uz: `Yana ${minWords - count} ta so‘z yozing`,
            bi: `Yana ${minWords - count} ta so‘z / Need ${minWords - count} more words`,
          }, isAdmin)}
        </span>
      )}
    </div>
  );
};
export default WordCounter;
