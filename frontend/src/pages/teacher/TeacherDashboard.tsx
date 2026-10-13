import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Inbox,
  CheckCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const TeacherDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t, tr } = useLanguage();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getTeacherDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentSubmissions = dashboardData?.recent_submissions || [];

  const kpis = [
    { label: t('admin.totalStudents', true), value: stats.total_students, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: t('admin.activeTasks', true), value: stats.active_assignments, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('admin.pendingReviewsTitle', true), value: stats.pending_reviews, icon: Inbox, color: 'text-amber-600', bg: 'bg-amber-50', highlight: stats.pending_reviews > 0 },
    { label: t('admin.completedToday', true), value: stats.completed_today, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('admin.avgScore', true), value: `${stats.average_score} / 10`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: t('admin.completionRate', true), value: `${stats.completion_rate}%`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('admin.lateSubmissions', true), value: stats.late_submissions, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('nav.dashboard', true)}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {tr({
              en: 'Overview of student submissions, active tasks, and grading queue',
              uz: 'O‘quvchilar javoblari, faol topshiriqlar va baholash navbati tahlili',
              bi: 'O‘quvchilar topshiriqlari va baholash / Submissions & grading queue'
            }, true)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/pending-reviews')}
            leftIcon={<Inbox className="w-4 h-4" />}
          >
            {t('admin.pendingReviewsTitle', true)} ({stats.pending_reviews || 0})
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/admin/assignments/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('admin.createTask', true)}
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className={`border transition-all ${
              kpi.highlight
                ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Submissions Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t('admin.recentActivity', true)}
            </h2>
            <p className="text-xs text-slate-500">
              {tr({
                en: 'Student homework waiting for your review',
                uz: 'Tekshirish kutilayotgan o‘quvchilar ishlari',
                bi: 'Tekshirish kutilayotgan ishlar / Waiting for review'
              }, true)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/submissions')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {t('common.all', true)}
          </Button>
        </div>

        {recentSubmissions.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">
              {t('admin.noPendingReviews', true)}
            </h4>
          </Card>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">{t('admin.studentColumn', true)}</th>
                    <th className="py-3.5 px-4">{t('admin.assignmentColumn', true)}</th>
                    <th className="py-3.5 px-4">{t('admin.typeColumn', true)}</th>
                    <th className="py-3.5 px-4">{t('admin.submittedColumn', true)}</th>
                    <th className="py-3.5 px-4">{t('admin.statusColumn', true)}</th>
                    <th className="py-3.5 px-4 text-right">{t('admin.actionColumn', true)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentSubmissions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{sub.student_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{sub.student_username || 'user'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{sub.assignment_title}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {sub.assignment_type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {sub.is_late && (
                          <span className="ml-1 text-[10px] text-orange-600 font-bold">({t('statuses.late', true)})</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={sub.status.toLowerCase()} isAdmin>{sub.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/submissions/${sub.id}`)}
                        >
                          {t('admin.reviewButton', true)}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default TeacherDashboard;
