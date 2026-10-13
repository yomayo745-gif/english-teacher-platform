import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Filter, Search, ArrowUpDown } from 'lucide-react';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherSubmissionsList: React.FC = () => {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeacherSubmissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        task_type: taskTypeFilter || undefined,
      });
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, taskTypeFilter]);

  const tabLabels: Record<string, string> = {
    ALL: t('admin.allTabs', true),
    SUBMITTED: t('admin.submittedTabs', true),
    GRADED: t('admin.gradedTabs', true),
    RETURNED: t('admin.returnedTabs', true),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.allSubmissionsTitle', true)}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('admin.allSubmissionsSubtitle', true)}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['ALL', 'SUBMITTED', 'GRADED', 'RETURNED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                statusFilter === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tabLabels[tab] || tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">{t('common.type', true)}:</span>
          <select
            value={taskTypeFilter}
            onChange={(e) => setTaskTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800 focus:outline-none"
          >
            <option value="">{t('admin.allTypes', true)}</option>
            <option value="PICTURE_DESCRIPTION">{t('taskTypes.PICTURE_DESCRIPTION', true)}</option>
            <option value="WRITING">{t('taskTypes.WRITING', true)}</option>
            <option value="LISTENING">{t('taskTypes.LISTENING', true)}</option>
            <option value="SPEAKING">{t('taskTypes.SPEAKING', true)}</option>
            <option value="READING">{t('taskTypes.READING', true)}</option>
            <option value="PHOTO">{t('taskTypes.PHOTO', true)}</option>
          </select>
        </div>
      </div>

      {/* Submissions table */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 text-xs">{t('admin.noSubmissionsMatching', true)}</Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">{t('admin.studentColumn', true)}</th>
                <th className="py-3.5 px-4">{t('admin.assignmentColumn', true)}</th>
                <th className="py-3.5 px-4">{t('admin.taskTypeColumn', true)}</th>
                <th className="py-3.5 px-4">{t('admin.submittedColumn', true)}</th>
                <th className="py-3.5 px-4">{t('common.score', true)}</th>
                <th className="py-3.5 px-4">{t('admin.statusColumn', true)}</th>
                <th className="py-3.5 px-4 text-right">{t('admin.actionColumn', true)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {submissions.map((sub: any) => {
                const statusKey = sub.status ? sub.status.toLowerCase() : 'submitted';
                const taskTypeTr = t(`taskTypes.${sub.task_type}`, true);
                const displayType = taskTypeTr && !taskTypeTr.startsWith('[MISSING') ? taskTypeTr : sub.task_type.replace('_', ' ');

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{sub.student_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">@{sub.student_username || 'no_user'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{sub.assignment_title}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {displayType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(sub.submitted_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {sub.is_late && <span className="ml-1 text-[10px] text-orange-600 font-bold">{t('admin.lateFlag', true)}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {sub.total_score !== null ? `${sub.total_score} / ${sub.max_score}` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={sub.status.toLowerCase()}>{t(`statuses.${statusKey}`, true) || sub.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button size="sm" onClick={() => navigate(`/admin/submissions/${sub.id}`)}>
                        {t('admin.reviewButton', true)}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
