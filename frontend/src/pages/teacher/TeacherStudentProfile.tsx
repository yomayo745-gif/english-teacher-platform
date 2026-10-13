import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Key,
  Shield,
  ShieldAlert,
  Edit,
  Copy,
  Check,
  Phone,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherStudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, tr } = useLanguage();

  const [data, setData] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState<string | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [copiedReset, setCopiedReset] = useState(false);

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [editTelegramId, setEditTelegramId] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Status Action Loading
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchProfile = async () => {
    if (!id) return;
    try {
      const [res, grpList] = await Promise.all([
        api.getTeacherStudentProfile(id),
        api.getTeacherGroups(),
      ]);
      setData(res);
      setGroups(grpList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pt-4">
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-10 text-slate-500">{t('admin.studentNotFound', true)}</div>;

  const { student, stats, skills, history } = data;
  const isActive = student.status !== 'DISABLED';

  const handleOpenEdit = () => {
    setEditFirstName(student.first_name || '');
    setEditLastName(student.last_name || '');
    setEditLogin(student.login || student.username || '');
    setEditTelegramId(student.telegram_id ? String(student.telegram_id) : '');
    setEditGroupId(student.group_id || '');
    setEditPhone(student.phone || '');
    setEditNotes(student.notes || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFirstName.trim()) return;

    setEditingStudent(true);
    setEditError(null);

    try {
      await api.updateStudent(student.id, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim() || undefined,
        login: editLogin.trim() || undefined,
        telegram_id: editTelegramId.trim() ? parseInt(editTelegramId.trim(), 10) : undefined,
        group_id: editGroupId || undefined,
        phone: editPhone.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setIsEditModalOpen(false);
      fetchProfile();
    } catch (err: any) {
      setEditError(err.message || t('errors.somethingWentWrong', true));
    } finally {
      setEditingStudent(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = isActive ? 'DISABLED' : 'ACTIVE';
    const confirmMsg = isActive
      ? t('admin.confirmDisable', true)
      : t('admin.confirmEnable', true);

    if (!window.confirm(confirmMsg)) return;

    setStatusLoading(true);
    try {
      await api.updateStudentStatus(student.id, nextStatus as 'ACTIVE' | 'DISABLED');
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResettingPassword(true);
    try {
      const res = await api.resetStudentPassword(
        student.id,
        customPasswordInput.trim() ? customPasswordInput.trim() : undefined
      );
      setNewGeneratedPassword(res.new_password);
    } catch (err) {
      console.error(err);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCopyNewPassword = () => {
    if (!newGeneratedPassword) return;
    const text = `🎓 English Hub: Yangi Parol\n\n👤 Login: ${student.login || student.username}\n🔑 Parol: ${newGeneratedPassword}\n\nKirish: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedReset(true);
    setTimeout(() => setCopiedReset(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Navigation and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/students')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('admin.backToStudents', true)}</span>
        </button>

        {/* Profile Management Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenEdit}
            leftIcon={<Edit className="w-3.5 h-3.5" />}
          >
            {t('admin.editStudent', true)}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNewGeneratedPassword(null);
              setCustomPasswordInput('');
              setIsResetModalOpen(true);
            }}
            leftIcon={<Key className="w-3.5 h-3.5" />}
          >
            {t('admin.resetPassword', true)}
          </Button>

          <Button
            size="sm"
            variant={isActive ? 'danger' : 'primary'}
            onClick={handleToggleStatus}
            isLoading={statusLoading}
            leftIcon={isActive ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
          >
            {isActive ? t('admin.disableAccount', true) : t('admin.enableAccount', true)}
          </Button>
        </div>
      </div>

      {/* Header Info Card */}
      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {student.full_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{student.full_name}</h1>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t('admin.statusActive', true)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {t('admin.statusDisabled', true)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                <span className="font-mono text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                  @{student.login || student.username || 'no_login'}
                </span>
                {student.telegram_id && (
                  <span className="font-mono text-slate-500">ID: {student.telegram_id}</span>
                )}
                {student.phone && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {student.phone}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                  {student.groups?.join(', ') || t('admin.noGroup', true)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {t('admin.joinedDate', true)} {student.joined_date}
                </span>
                {student.last_login && (
                  <span className="text-xs text-slate-400 font-medium">
                    • {t('admin.lastLoginColumn', true)}: {student.last_login}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-[75px]">
              <span className="text-[11px] text-slate-500 block">{t('admin.completedColumn', true)}</span>
              <span className="text-lg font-bold text-emerald-600 block">{stats.completed}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-[75px]">
              <span className="text-[11px] text-slate-500 block">{t('admin.avgScore', true)}</span>
              <span className="text-lg font-bold text-brand-600 block">{stats.average_score} / 10</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-[75px]">
              <span className="text-[11px] text-slate-500 block">{t('admin.completion', true)}</span>
              <span className="text-lg font-bold text-indigo-600 block">{stats.completion_rate}%</span>
            </div>
          </div>
        </div>

        {/* Student Notes if any */}
        {student.notes && (
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
            <span className="font-bold block mb-0.5">{t('admin.notesLabel', true)}:</span>
            <span>{student.notes}</span>
          </div>
        )}
      </Card>

      {/* Skills Radar / Bars */}
      <Card>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">{t('admin.skillsProgress', true)}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {skills.map((s: any) => {
            const catKey = s.category ? s.category.toLowerCase() : '';
            const localizedCategory = t(`profile.${catKey}`, true);
            const displayCat = localizedCategory && !localizedCategory.startsWith('[MISSING') ? localizedCategory : s.category;
            return (
              <div key={s.category} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{displayCat}</span>
                  <span className="text-brand-600 font-bold">{s.score} / 10</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${(s.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Assignment History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.assignmentHistory', true)}</h3>

        {history.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 text-xs">{t('admin.noSubmittedAssignments', true)}</Card>
        ) : (
          <div className="space-y-2">
            {history.map((h: any) => (
              <Card
                key={h.submission_id}
                className="flex items-center justify-between p-3.5 hover:border-slate-300 transition-all cursor-pointer"
                onClick={() => navigate(`/admin/submissions/${h.submission_id}`)}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{h.assignment_title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{h.submitted_at} • {h.type.replace('_', ' ')}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-600">
                    {h.score !== null ? `${h.score} / ${h.max_score}` : h.status}
                  </span>
                  <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    {t('admin.reviewButton', true)}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={t('admin.resetPasswordTitle', true)}
        maxWidth="md"
      >
        <div className="p-6 space-y-4 text-xs">
          {!newGeneratedPassword ? (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <p className="text-slate-600 leading-relaxed -mt-2">
                {t('admin.newPasswordNotice', true)}
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  {t('admin.passwordLabel', true)} (Ixtiyoriy - bo‘sh qoldirilsa avtomatik generatsiya bo‘ladi)
                </label>
                <input
                  type="text"
                  value={customPasswordInput}
                  onChange={(e) => setCustomPasswordInput(e.target.value)}
                  placeholder={t('admin.passwordPlaceholder', true)}
                  className="w-full font-mono rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetModalOpen(false)}
                >
                  {t('common.cancel', true)}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={resettingPassword}
                >
                  {t('admin.confirmReset', true)}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 font-mono">
                <span className="text-[11px] font-sans font-semibold text-emerald-800 block">
                  Yangi parol tayyor:
                </span>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-base font-bold text-emerald-700">
                  {newGeneratedPassword}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleCopyNewPassword}
                  className={`px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    copiedReset
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md'
                  }`}
                >
                  {copiedReset ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedReset ? t('admin.copied', true) : t('admin.copyCredentials', true)}</span>
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetModalOpen(false)}
                >
                  {t('common.continue', true)}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* EDIT STUDENT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('admin.editStudentTitle', true)}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
          {editError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.firstNameLabel', true)}
              </label>
              <input
                type="text"
                required
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.lastNameLabel', true)}
              </label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.loginLabel', true)}
              </label>
              <input
                type="text"
                value={editLogin}
                onChange={(e) => setEditLogin(e.target.value)}
                className="w-full font-mono rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.telegramIdLabel', true)}
              </label>
              <input
                type="number"
                value={editTelegramId}
                onChange={(e) => setEditTelegramId(e.target.value)}
                className="w-full font-mono rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.groupColumn', true)}
              </label>
              <select
                value={editGroupId}
                onChange={(e) => setEditGroupId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 bg-white"
              >
                <option value="">{t('admin.noGroup', true)}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.phoneLabel', true)}
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              {t('admin.notesLabel', true)}
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              {t('common.cancel', true)}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={editingStudent}
            >
              {t('common.saveChanges', true)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
