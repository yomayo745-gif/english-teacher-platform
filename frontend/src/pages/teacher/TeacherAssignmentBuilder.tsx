import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TaskType } from '../../types';
import { TaskTypeSelector } from '../../components/assignment/TaskTypeSelector';
import { DedicatedTaskBuilder } from '../../components/assignment/DedicatedTaskBuilder';
import { ComprehensiveHomeworkBuilder } from '../../components/assignment/ComprehensiveHomeworkBuilder';
import { Layers, Sparkles, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherAssignmentBuilder: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlType = searchParams.get('type') as TaskType | null;
  const urlMode = searchParams.get('mode') as 'comprehensive' | 'single' | null;

  const [builderMode, setBuilderMode] = useState<'comprehensive' | 'single'>(
    urlMode === 'single' || urlType ? 'single' : 'comprehensive'
  );
  const [selectedType, setSelectedType] = useState<TaskType | null>(urlType);

  useEffect(() => {
    if (urlType) {
      setSelectedType(urlType);
      setBuilderMode('single');
    }
  }, [urlType]);

  const handleSelectType = (type: TaskType) => {
    setSelectedType(type);
    setSearchParams({ mode: 'single', type });
  };

  const handleBackToComprehensive = () => {
    setBuilderMode('comprehensive');
    setSelectedType(null);
    setSearchParams({});
  };

  // 1. If in comprehensive mode (default & recommended)
  if (builderMode === 'comprehensive' && !selectedType) {
    return (
      <div className="space-y-4">
        {/* Mode Switcher Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-brand-50 via-white to-indigo-50/50 p-4 rounded-2xl border border-brand-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  🌟 Mukammal Kompleks Vazifa Rejimi (2-3 Soatlik)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Tavsiya etiladi
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Lug‘at, grammatika, o‘qish, insho, audio va daftardan rasmni bitta yaxlit vazifada bering.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setBuilderMode('single');
              setSearchParams({ mode: 'single' });
            }}
            className="text-xs font-bold text-brand-700 hover:text-brand-900 bg-white border border-brand-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-brand-50 transition-all shrink-0"
          >
            Alohida bitta tur tanlash →
          </button>
        </div>

        <ComprehensiveHomeworkBuilder
          assignmentId={id}
          onBackToTypes={() => {
            setBuilderMode('single');
            setSearchParams({ mode: 'single' });
          }}
        />
      </div>
    );
  }

  // 2. If single type selected (editing or creating single type)
  if (selectedType) {
    return (
      <DedicatedTaskBuilder
        initialType={selectedType}
        assignmentId={id}
        onBackToTypes={() => {
          setSelectedType(null);
          setSearchParams({ mode: 'single' });
        }}
      />
    );
  }

  // 3. Otherwise show single task types selector with button to switch back to comprehensive
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Alohida bitta topshiriq turini tanlash
          </h2>
          <p className="text-xs text-slate-500">
            Agar faqat bitta turdagi vazifa (masalan, faqat insho yoki faqat rasm) bermoqchi bo‘lsangiz:
          </p>
        </div>
        <button
          type="button"
          onClick={handleBackToComprehensive}
          className="text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3.5 py-2 rounded-xl shadow-sm transition-all"
        >
          🌟 2-3 Soatlik Kompleks Vazifaga qaytish
        </button>
      </div>

      <TaskTypeSelector onSelectType={handleSelectType} />
    </div>
  );
};

export default TeacherAssignmentBuilder;
