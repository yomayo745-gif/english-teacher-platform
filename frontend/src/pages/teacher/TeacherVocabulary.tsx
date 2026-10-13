import React, { useState } from 'react';
import { BookMarked, Search, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherVocabulary: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState([
    { word: 'Diligent', translation: 'Tirishqoq, g\'ayratli', part_of_speech: 'Adjective', level: 'B2', example: 'She is a diligent student who practices English every evening.' },
    { word: 'Accomplish', translation: 'Bajarmoq, erishmoq', part_of_speech: 'Verb', level: 'B1', example: 'We accomplished all our project goals ahead of the deadline.' },
    { word: 'Comprehensive', translation: 'Har tomonlama, to\'liq', part_of_speech: 'Adjective', level: 'C1', example: 'The teacher provided a comprehensive guide for the exam.' },
    { word: 'Fluent', translation: 'Ravon, erkin gapiruvchi', part_of_speech: 'Adjective', level: 'B2', example: 'He speaks fluent English and conversational Spanish.' },
    { word: 'Vocabulary', translation: 'Lug\'at boyligi', part_of_speech: 'Noun', level: 'A2', example: 'Reading English books expands your active vocabulary.' },
  ]);
  const [search, setSearch] = useState('');

  const filtered = items.filter((i) =>
    i.word.toLowerCase().includes(search.toLowerCase()) ||
    i.translation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.vocabBankTitle', true)}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('admin.vocabBankSubtitle', true)}</p>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('admin.searchVocab', true)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((item, idx) => (
          <Card key={idx} className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{item.word}</h3>
                <p className="text-xs font-semibold text-brand-600 mt-0.5">{item.translation}</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                {item.level}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">{item.part_of_speech}: </span>
              <span className="italic">"{item.example}"</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
