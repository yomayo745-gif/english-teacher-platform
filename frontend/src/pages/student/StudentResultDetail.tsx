import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, MessageSquare, Volume2, Image as ImageIcon } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StudentResultDetail: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { t, tr, mode } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) return;
    const fetchDetail = async () => {
      try {
        const res = await api.getStudentResultDetail(submissionId);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [submissionId]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pt-4">
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-slate-500">{t('results.noResultsFound')}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/results')} className="mt-3">
          {t('homework.viewResults')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <button
        onClick={() => navigate('/app/results')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common.back')}</span>
      </button>

      {/* Overview Card */}
      <Card className="bg-gradient-to-br from-brand-900 to-slate-900 text-white border-0 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-brand-300 uppercase tracking-wider block mb-1">
              {data.assignment_type?.replace(/_/g, ' ')}
            </span>
            <h2 className="text-base font-bold text-white leading-snug">{data.assignment_title}</h2>
            <p className="text-xs text-slate-300 mt-1">
              {t('common.status')}: {t('statuses.graded')} ✓
            </p>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
            <span className="text-2xl font-black text-emerald-400 block leading-tight">
              {data.total_score}
            </span>
            <span className="text-[10px] text-slate-300 font-medium">
              / {data.max_score} {t('common.pts')}
            </span>
          </div>
        </div>

        {data.teacher_feedback && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-brand-200">
                {t('homework.teacherFeedback')}:
              </p>
              <p className="text-xs text-slate-200 italic mt-0.5 leading-relaxed">{data.teacher_feedback}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Question Breakdown */}
      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider inline-block">
            {t('homework.questionBreakdown')}
          </h3>
        </div>

        {data.answers.map((ans: any, idx: number) => (
          <div key={ans.question_id || idx} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-800">{ans.question_text}</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 shrink-0">
                {ans.score !== null ? `${ans.score} / ${ans.max_points} ${t('common.pts')}` : ''}
              </span>
            </div>

            {/* Answer Display */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <span className="font-semibold text-slate-600 block mb-1">
                {t('homework.yourAnswer')}:
              </span>
              {ans.text_answer && (
                <p className="text-slate-800 whitespace-pre-wrap">{ans.text_answer}</p>
              )}
              {ans.selected_options && (
                <p className="text-slate-800 font-medium">
                  {typeof ans.selected_options === 'object'
                    ? JSON.stringify(ans.selected_options)
                    : String(ans.selected_options)}
                </p>
              )}
              {ans.audio_url && (
                <audio controls src={ans.audio_url} className="w-full mt-2" />
              )}
              {ans.file_url && (
                <img src={ans.file_url} alt="Submitted file" className="max-h-48 rounded-lg mt-2 border" />
              )}
            </div>

            {/* Teacher Per-Question Feedback */}
            {ans.feedback && (
              <div className="p-2.5 bg-brand-50/50 rounded-xl border border-brand-100 text-xs text-brand-900">
                <span className="font-bold">{t('homework.feedback')}: </span>
                {ans.feedback}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default StudentResultDetail;
