import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StudentTasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t, tr, mode } = useLanguage();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const homeData = await api.getStudentHome();
        setTasks(homeData.all_homework || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return task.status !== 'GRADED';
    if (filter === 'completed') return task.status === 'GRADED';
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {t('homework.title')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('homework.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1">
        {[
          { key: 'active', label: { en: 'Active', uz: 'Faol', bi: 'Faol / Active' } },
          { key: 'completed', label: { en: 'Completed', uz: 'Bajarilgan', bi: 'Bajarilgan / Completed' } },
          { key: 'all', label: { en: 'All', uz: 'Barchasi', bi: 'Barchasi / All' } },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 py-1.5 px-1 text-xs font-semibold rounded-lg transition-all text-center ${
              filter === tab.key
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{tr(tab.label)}</span>
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center">
          <p className="text-xs text-slate-500">
            {t('homework.noAssignmentsFound')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              hoverable
              onClick={() => {
                if (task.status === 'GRADED' && task.submission_id) {
                  navigate(`/app/results/${task.submission_id}`);
                } else {
                  navigate(`/app/tasks/${task.id}`);
                }
              }}
              className="cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
                    {t(`taskTypes.${task.type}`) || task.type?.replace(/_/g, ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h4>
                </div>
                <Badge variant={task.status.toLowerCase()}>{task.status}</Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                <span className="font-semibold text-slate-700">
                  {task.score !== null && task.score !== undefined
                    ? `${t('common.score')}: ${task.score} / ${task.points}`
                    : `${task.points} ${t('common.pts')}`}
                </span>
                <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3 h-3" />}>
                  {task.status === 'GRADED' ? t('homework.viewResult') : t('common.open')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
export default StudentTasks;
