import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Filter, Search, ArrowUpDown, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const TeacherPendingReviews: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t, tr } = useLanguage();

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeacherSubmissions({
        status: 'SUBMITTED',
        task_type: taskTypeFilter || undefined,
        sort_by: sortBy,
      });
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [taskTypeFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('admin.pendingReviewsTitle', true)}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('admin.reviewQueueDesc', true)}
          </p>
        </div>
      </div>

      {/* Filter and Sorting Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>{t('common.type', true)}:</span>
          </span>
          <select
            value={taskTypeFilter}
            onChange={(e) => setTaskTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800 focus:outline-none focus:border-brand-500"
          >
            <option value="">{t('common.all', true)}</option>
            <option value="PICTURE_DESCRIPTION">{t('taskTypes.PICTURE_DESCRIPTION.en', true)}</option>
            <option value="WRITING">{t('taskTypes.WRITING.en', true)}</option>
            <option value="LISTENING">{t('taskTypes.LISTENING.en', true)}</option>
            <option value="SPEAKING">{t('taskTypes.SPEAKING.en', true)}</option>
            <option value="READING">{t('taskTypes.READING.en', true)}</option>
            <option value="PHOTO">{t('taskTypes.PHOTO.en', true)}</option>
            <option value="MIXED">{t('taskTypes.MIXED.en', true)}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{t('common.filter', true)}:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800 focus:outline-none focus:border-brand-500"
          >
            <option value="newest">{tr({ en: 'Newest First', uz: 'Avval yangilari', bi: 'Avval yangilari / Newest' }, true)}</option>
            <option value="oldest">{tr({ en: 'Oldest First', uz: 'Avval eskilar', bi: 'Avval eskilar / Oldest' }, true)}</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{t('admin.noPendingReviews', true)}</h3>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
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
              {submissions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{sub.student_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">@{sub.student_username || 'no_user'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{sub.assignment_title}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {sub.task_type?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(sub.submitted_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {sub.is_late && (
                      <span className="ml-1 text-[10px] text-orange-600 font-bold">({t('statuses.late', true)})</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={sub.status.toLowerCase()} isAdmin>{sub.status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button size="sm" onClick={() => navigate(`/admin/submissions/${sub.id}`)}>
                      {t('admin.reviewButton', true)}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default TeacherPendingReviews;
