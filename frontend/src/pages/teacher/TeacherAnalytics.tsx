import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Users, BookOpen } from 'lucide-react';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.getTeacherAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div className="space-y-4 animate-pulse pt-4"><div className="h-64 bg-slate-200 rounded-2xl" /></div>;
  }

  const radar = data?.skills_radar || [];
  const weekly = data?.weekly_submissions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.analyticsHeading', true)}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('admin.analyticsSubtitle', true)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Radar / Bars */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t('admin.skillsBreakdownTitle', true)}</h3>
            <span className="text-xs font-semibold text-brand-600">{t('admin.classAverage', true)}</span>
          </div>

          <div className="space-y-3 pt-2">
            {radar.map((s: any) => {
              const catKey = s.category ? s.category.toLowerCase() : '';
              const localizedCat = t(`profile.${catKey}`, true);
              const displayCategory = localizedCat && !localizedCat.startsWith('[MISSING') ? localizedCat : s.category;
              return (
                <div key={s.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{displayCategory}</span>
                    <span className="font-bold text-slate-900">{s.score} / 10 ({s.total_tasks} {t('admin.tasksCount', true)})</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all"
                      style={{ width: `${(s.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Weekly Submissions Bar Chart */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t('admin.weeklyVolume', true)}</h3>
            <span className="text-xs font-semibold text-slate-500">
              {data?.total_this_week ? `+${data.total_this_week} ${t('admin.tasksCount', true)}` : `0 ${t('admin.tasksCount', true)}`}
            </span>
          </div>

          <div className="h-56 flex items-end gap-3 pt-6 px-2">
            {weekly.map((w: any) => {
              const max = Math.max(...weekly.map((item: any) => item.count || 0), 10);
              const heightPct = w.count > 0 ? Math.round((w.count / max) * 100) : 0;
              return (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600">{w.count}</span>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      w.count > 0 ? 'bg-brand-500 hover:bg-brand-600' : 'bg-slate-100'
                    }`}
                    style={{ height: w.count > 0 ? `${heightPct}%` : '4px' }}
                  />
                  <span className="text-[11px] font-semibold text-slate-500">{w.day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
