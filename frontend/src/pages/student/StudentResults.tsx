import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight, Calendar, MessageSquare } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StudentResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t, tr, mode } = useLanguage();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await api.getStudentResults();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {t('results.title')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('results.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {t('results.noResultsFound')}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {t('results.noResultsSub')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((res) => {
            const dateStr = res.graded_at
              ? new Date(res.graded_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })
              : t('statuses.graded');

            return (
              <Card
                key={res.submission_id}
                hoverable
                onClick={() => navigate(`/app/results/${res.submission_id}`)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-0.5">
                      {res.type?.replace(/_/g, ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{res.title}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-600 block">
                      {res.score} / {res.max_score} <span className="text-xs font-normal text-slate-400">{t('common.pts')}</span>
                    </span>
                    {res.percentage !== undefined && (
                      <span className="text-[10px] text-slate-400 font-semibold">{res.percentage}%</span>
                    )}
                  </div>
                </div>

                {res.teacher_feedback && (
                  <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/70 text-xs text-slate-700 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-brand-900">
                        {t('homework.teacherFeedback')}:
                      </p>
                      <p className="italic mt-0.5">{res.teacher_feedback}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>
                  <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3 h-3" />}>
                    {t('common.details')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default StudentResults;
