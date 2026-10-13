import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Users, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherGroups: React.FC = () => {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('A2 Elementary');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLevel, setEditLevel] = useState('A2 Elementary');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingGroup, setDeletingGroup] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeacherGroups();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await api.createTeacherGroup({ name: name.trim(), description: description.trim(), level });
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      setLevel('A2 Elementary');
      await fetchGroups();
    } catch (err: any) {
      alert(t('errors.somethingWentWrong', true) + ': ' + (err.message || 'Error'));
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (group: any) => {
    setEditingGroup(group);
    setEditName(group.name || '');
    setEditDescription(group.description || '');
    setEditLevel(group.level || 'A2 Elementary');
  };

  const handleUpdate = async () => {
    if (!editingGroup || !editName.trim()) return;
    setIsUpdating(true);
    try {
      await api.updateTeacherGroup(editingGroup.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        level: editLevel
      });
      setEditingGroup(null);
      await fetchGroups();
    } catch (err: any) {
      alert(t('errors.somethingWentWrong', true) + ': ' + (err.message || 'Error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);
    try {
      await api.deleteTeacherGroup(deletingGroup.id);
      setDeletingGroup(null);
      await fetchGroups();
    } catch (err: any) {
      alert(t('errors.somethingWentWrong', true) + ': ' + (err.message || 'Error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.studyGroups', true)}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('admin.studyGroupsSubtitle', true)}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          {t('admin.newGroup', true)}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-36 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-36 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 text-xs">
          <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          {t('admin.noGroupsYet', true)}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Card key={g.id} className="space-y-3 relative group hover:border-slate-300 transition-all shadow-xs">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center font-bold">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                    {g.level}
                  </span>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(g)}
                      title={t('admin.editGroupBtn', true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingGroup(g)}
                      title={t('admin.deleteGroupBtn', true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {g.name}
                </h3>
                {g.description ? (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{g.description}</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1 italic">—</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{g.member_count} {t('admin.enrolledStudents', true)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(g)}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                  >
                    {t('admin.editGroupBtn', true)}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => setDeletingGroup(g)}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                  >
                    {t('admin.deleteGroupBtn', true)}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={t('admin.createGroupModalTitle', true)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t('admin.groupNameLabel', true)}</label>
            <input
              type="text"
              placeholder={t('admin.groupNamePlaceholder', true)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t('admin.level', true)}</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
            >
              <option value="A1 Beginner">{t('admin.beginner', true)}</option>
              <option value="A2 Elementary">{t('admin.elementary', true)}</option>
              <option value="B1 Intermediate">{t('admin.intermediate', true)}</option>
              <option value="B2 Upper Intermediate">{t('admin.upperIntermediate', true)}</option>
              <option value="C1 Advanced">{t('admin.advanced', true)}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t('admin.groupDescLabel', true)}</label>
            <textarea
              rows={3}
              placeholder={t('admin.groupDescPlaceholder', true)}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
              {t('common.cancel', true)}
            </Button>
            <Button className="flex-1" isLoading={isCreating} onClick={handleCreate}>
              {t('admin.saveGroup', true)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingGroup} onClose={() => setEditingGroup(null)} title={t('admin.editGroupModalTitle', true)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t('admin.groupNameLabel', true)}</label>
            <input
              type="text"
              placeholder={t('admin.groupNamePlaceholder', true)}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t('admin.level', true)}</label>
            <select
              value={editLevel}
              onChange={(e) => setEditLevel(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
            >
              <option value="A1 Beginner">{t('admin.beginner', true)}</option>
              <option value="A2 Elementary">{t('admin.elementary', true)}</option>
              <option value="B1 Intermediate">{t('admin.intermediate', true)}</option>
              <option value="B2 Upper Intermediate">{t('admin.upperIntermediate', true)}</option>
              <option value="C1 Advanced">{t('admin.advanced', true)}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">{t('admin.groupDescLabel', true)}</label>
            <textarea
              rows={3}
              placeholder={t('admin.groupDescPlaceholder', true)}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditingGroup(null)}>
              {t('common.cancel', true)}
            </Button>
            <Button className="flex-1" isLoading={isUpdating} onClick={handleUpdate}>
              {t('admin.saveChanges', true)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingGroup} onClose={() => setDeletingGroup(null)} title={t('admin.deleteGroupModalTitle', true)}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">
                {t('admin.deleteGroupConfirm', true)}
              </p>
              <p className="text-rose-600">
                "{deletingGroup?.name}" — {t('admin.deleteGroupWarning', true)}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeletingGroup(null)}>
              {t('common.cancel', true)}
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              {t('admin.deleteGroupBtn', true)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
