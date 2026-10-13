import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Clock,
  Users,
  BookOpen,
  AlertTriangle,
  Search,
  Filter,
  Copy,
  Edit,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { TASK_TYPE_OPTIONS } from '../../components/assignment/TaskTypeSelector';
import { UniversalQuestionRunner } from '../../components/assignment/UniversalQuestionRunner';

export const TeacherAssignmentsList: React.FC = () => {
  const { t, adminMode } = useLanguage();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [previewAssignment, setPreviewAssignment] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Load Groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const gList = await api.getTeacherGroups();
        setGroups(gList);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (typeFilter !== 'ALL') filters.type = typeFilter;
      if (groupFilter !== 'ALL') filters.group_id = groupFilter;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const data = await api.getTeacherAssignments(filters);
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter, typeFilter, groupFilter, searchQuery]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteAssignment(deleteId);
      setDeleteId(null);
      await fetchAssignments();
    } catch (err: any) {
      alert(t('errors.somethingWentWrong', true) + ': ' + err.message);
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      await api.duplicateAssignment(id);
      alert(t('admin.duplicatedSuccess', true));
      await fetchAssignments();
    } catch (err: any) {
      alert(t('errors.somethingWentWrong', true) + ': ' + err.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleOpenPreview = async (id: string) => {
    setIsLoadingPreview(true);
    try {
      const detail = await api.getTeacherAssignment(id);
      setPreviewAssignment(detail);
    } catch (err: any) {
      alert(t('errors.somethingWentWrong', true) + ': ' + err.message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const tabLabels: Record<'ALL' | 'ACTIVE' | 'DRAFT', string> = {
    ALL: t('admin.allTabs', true),
    ACTIVE: t('admin.activeTabs', true),
    DRAFT: t('admin.draftTabs', true),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('admin.assignmentsTitle', true)}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('admin.assignmentsSubtitle', true)}
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/assignments/new')}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-brand-600 hover:bg-brand-700 shadow-sm"
        >
          {t('admin.createAssignment', true)}
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            {(['ALL', 'ACTIVE', 'DRAFT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.searchAssignments', true)}
              className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Dropdown Filters (Type & Group) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold shrink-0">
              {t('common.type', true)}:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-slate-200 px-3 py-1.5 bg-white focus:outline-none focus:border-brand-500 text-slate-700"
            >
              <option value="ALL">{t('admin.allTypes', true)}</option>
              {TASK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.emoji} {adminMode === 'uz' ? opt.nameUz : opt.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold shrink-0">
              {t('admin.groupFilter', true)}
            </span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-slate-200 px-3 py-1.5 bg-white focus:outline-none focus:border-brand-500 text-slate-700"
            >
              <option value="ALL">{t('admin.allGroups', true)}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Assignments list */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : assignments.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">{t('admin.noAssignments', true)}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('admin.noAssignmentsSub', true)}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const typeOpt = TASK_TYPE_OPTIONS.find((opt) => opt.type === a.type);
            const statusKey = a.status ? a.status.toLowerCase() : 'draft';
            const isDuplicating = duplicatingId === a.id;

            return (
              <Card
                key={a.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="space-y-2 flex-1">
                  {/* Top tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold border border-brand-200/60">
                      <span>{typeOpt?.emoji || '📝'}</span>
                      <span>
                        {typeOpt
                          ? adminMode === 'uz'
                            ? typeOpt.nameUz
                            : typeOpt.nameEn
                          : a.type.replace('_', ' ')}
                      </span>
                    </span>

                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">{a.difficulty}</span>

                    {a.target_group_name && (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{a.target_group_name}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 hover:text-brand-600 transition-colors">
                    {a.title}
                  </h3>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {t('admin.due', true)}{' '}
                        {a.deadline ? new Date(a.deadline).toLocaleDateString() : t('common.none', true)}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      {a.questions_count} {t('admin.questionsCount', true)}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      {a.submissions_count} {t('admin.submissionsCount', true)}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-brand-700">
                      {a.points} {t('common.points', true)}
                    </span>
                  </div>
                </div>

                {/* Right Actions & Status */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Badge variant={a.status === 'PUBLISHED' ? 'graded' : 'neutral'}>
                    {t(`statuses.${statusKey}`, true) || a.status}
                  </Badge>

                  {/* Preview Button */}
                  <button
                    onClick={() => handleOpenPreview(a.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-all"
                    title={t('admin.studentPreview', true)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => navigate(`/admin/assignments/${a.id}/edit`)}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-all"
                    title={t('admin.editAssignment', true)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Duplicate Button */}
                  <button
                    disabled={isDuplicating}
                    onClick={() => handleDuplicate(a.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-all disabled:opacity-50"
                    title={t('admin.duplicate', true)}
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-all"
                    title={t('admin.deleteAssignmentBtn', true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('admin.deleteAssignmentTitle', true)}
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('admin.deleteAssignmentDesc', true)}
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              {t('common.cancel', true)}
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmDelete}>
              {t('common.delete', true)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Live Preview Modal */}
      <Modal
        isOpen={!!previewAssignment}
        onClose={() => setPreviewAssignment(null)}
        title={`${t('admin.studentPreview', true)}: ${previewAssignment?.title || ''}`}
      >
        {previewAssignment && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-brand-900 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <p>{t('admin.previewNotice', true)}</p>
            </div>

            <div className="space-y-4 pt-2">
              {(previewAssignment.questions || []).map((q: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-brand-700 uppercase">
                      {t('common.question', true)} #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {q.points} {t('common.pts', true)}
                    </span>
                  </div>

                  <UniversalQuestionRunner
                    question={q}
                    index={idx}
                    onChange={() => {}}
                    audioPlayLimitSetting={previewAssignment.audio_play_limit}
                    showTranscriptSetting={previewAssignment.show_transcript}
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-end">
              <Button variant="secondary" onClick={() => setPreviewAssignment(null)}>
                {t('admin.closePreview', true)}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherAssignmentsList;
