import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  ArrowRight,
  UserPlus,
  Key,
  Copy,
  Check,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Phone,
  MessageSquare
} from 'lucide-react';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../../context/LanguageContext';

export const TeacherStudentsList: React.FC = () => {
  const { t, tr } = useLanguage();
  const navigate = useNavigate();

  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Student Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formGroupId, setFormGroupId] = useState('');
  const [formTelegramId, setFormTelegramId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formNotes, setFormNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Credentials Confirmation Modal State
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [createdStudentData, setCreatedStudentData] = useState<{
    full_name: string;
    login: string;
    plain_password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const [sList, gList] = await Promise.all([
        api.getTeacherStudents(search, groupId),
        api.getTeacherGroups(),
      ]);
      setStudents(sList);
      setGroups(gList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, groupId]);

  const handleExportCsv = () => {
    window.open('/api/v1/teacher/export-csv', '_blank');
  };

  const handleOpenCreateModal = async () => {
    setFormFirstName('');
    setFormLastName('');
    setFormGroupId(groupId || '');
    setFormTelegramId('');
    setFormPhone('');
    setFormStatus('ACTIVE');
    setFormNotes('');
    setCreateError(null);

    // Pre-generate credentials
    try {
      const creds = await api.getSuggestedCredentials();
      setFormLogin(creds.suggested_login);
      setFormPassword(creds.suggested_password);
    } catch {
      setFormLogin('student1');
      setFormPassword('Pass2026!');
    }

    setIsCreateModalOpen(true);
  };

  const handleAutoGenerateLogin = async () => {
    try {
      const creds = await api.getSuggestedCredentials(formFirstName, formLastName);
      setFormLogin(creds.suggested_login);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoGeneratePassword = async () => {
    try {
      const creds = await api.getSuggestedCredentials();
      setFormPassword(creds.suggested_password);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim()) {
      setCreateError(t('errors.requiredField', true));
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const res = await api.createStudent({
        first_name: formFirstName.trim(),
        last_name: formLastName.trim() || undefined,
        login: formLogin.trim() || undefined,
        password: formPassword.trim() || undefined,
        group_id: formGroupId || undefined,
        telegram_id: formTelegramId.trim() ? parseInt(formTelegramId.trim(), 10) : undefined,
        phone: formPhone.trim() || undefined,
        status: formStatus,
        notes: formNotes.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      setCreatedStudentData({
        full_name: res.student.full_name,
        login: res.student.login,
        plain_password: res.plain_password || formPassword,
      });
      setIsCredsModalOpen(true);
      fetchStudents();
    } catch (err: any) {
      setCreateError(err.message || t('errors.somethingWentWrong', true));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStudentData) return;
    const text = `🎓 English Hub O‘quvchi Hisobi:\n\n👤 Ism: ${createdStudentData.full_name}\n🆔 Login: ${createdStudentData.login}\n🔑 Parol: ${createdStudentData.plain_password}\n\nKirish: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('admin.studentsDirectory', true)}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('admin.studentsSubtitle', true)}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t('admin.exportCsv', true)}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            {t('admin.newStudent', true)}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-72 border border-slate-200 rounded-xl px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('admin.searchStudentsPlaceholder', true)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-slate-800 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">{t('admin.groupFilter', true)}</span>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800 focus:outline-none"
          >
            <option value="">{t('admin.allGroups', true)}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-16 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <div>{t('admin.noStudentsFound', true)}</div>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">{t('admin.studentColumn', true)}</th>
                <th className="py-3.5 px-4">{t('admin.statusColumn', true)}</th>
                <th className="py-3.5 px-4">{t('admin.telegramIdColumn', true)}</th>
                <th className="py-3.5 px-4">{t('admin.groupColumn', true)}</th>
                <th className="py-3.5 px-4">{t('admin.completedColumn', true)}</th>
                <th className="py-3.5 px-4">{t('admin.avgScoreColumn', true)}</th>
                <th className="py-3.5 px-4 text-right">{t('admin.profileColumn', true)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {students.map((stu) => {
                const isActive = stu.status !== 'DISABLED';
                return (
                  <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{stu.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                        <span className="text-brand-600 font-bold">@{stu.login || stu.username || 'no_login'}</span>
                        {stu.phone && <span className="text-slate-400">• {stu.phone}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
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
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {stu.telegram_id ? (
                        <span className="text-slate-700 font-semibold">{stu.telegram_id}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unlinked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {stu.groups?.join(', ') || t('admin.noGroup', true)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {stu.completed} {t('admin.tasksCount', true)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600">{stu.average_score || '-'} / 10</span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/admin/students/${stu.id}`)}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {t('common.view', true)}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE STUDENT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('admin.createStudentModalTitle', true)}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
          <p className="text-slate-500 -mt-2 mb-4 leading-relaxed">
            {t('admin.createStudentSubtitle', true)}
          </p>

          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.firstNameLabel', true)}
              </label>
              <input
                type="text"
                required
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value)}
                placeholder={t('admin.firstNamePlaceholder', true)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.lastNameLabel', true)}
              </label>
              <input
                type="text"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
                placeholder={t('admin.lastNamePlaceholder', true)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Login with Auto-Generate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 block">
                  {t('admin.loginLabel', true)}
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateLogin}
                  className="text-[10px] text-brand-600 font-bold hover:underline"
                >
                  ⚡ {t('admin.generateBtn', true)}
                </button>
              </div>
              <input
                type="text"
                required
                value={formLogin}
                onChange={(e) => setFormLogin(e.target.value)}
                placeholder={t('admin.loginPlaceholder', true)}
                className="w-full font-mono rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Initial Password with Auto-Generate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 block">
                  {t('admin.passwordLabel', true)}
                </label>
                <button
                  type="button"
                  onClick={handleAutoGeneratePassword}
                  className="text-[10px] text-brand-600 font-bold hover:underline"
                >
                  ⚡ {t('admin.generateBtn', true)}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={t('admin.passwordPlaceholder', true)}
                  className="w-full font-mono rounded-xl border border-slate-200 p-2.5 pr-9 text-slate-900 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Group Select */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.groupColumn', true)}
              </label>
              <select
                value={formGroupId}
                onChange={(e) => setFormGroupId(e.target.value)}
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

            {/* Telegram ID */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.telegramIdLabel', true)}
              </label>
              <input
                type="number"
                value={formTelegramId}
                onChange={(e) => setFormTelegramId(e.target.value)}
                placeholder={t('admin.telegramIdPlaceholder', true)}
                className="w-full font-mono rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.phoneLabel', true)}
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder={t('admin.phonePlaceholder', true)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                {t('admin.statusLabel', true)}
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 bg-white font-semibold"
              >
                <option value="ACTIVE">{t('admin.statusActive', true)}</option>
                <option value="DISABLED">{t('admin.statusDisabled', true)}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              {t('admin.notesLabel', true)}
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={t('admin.notesPlaceholder', true)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              {t('common.cancel', true)}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {t('admin.createStudentBtn', true)}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREDENTIALS CONFIRMATION MODAL */}
      <Modal
        isOpen={isCredsModalOpen}
        onClose={() => setIsCredsModalOpen(false)}
        title={t('admin.credentialsModalTitle', true)}
        maxWidth="md"
      >
        <div className="p-6 space-y-5 text-xs">
          <p className="text-slate-600 leading-relaxed -mt-2">
            {t('admin.credentialsModalSubtitle', true)}
          </p>

          {createdStudentData && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500 font-sans text-[11px] font-semibold">O‘quvchi:</span>
                <span className="text-slate-900 font-bold font-sans text-sm">{createdStudentData.full_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans text-[11px] font-semibold">Login:</span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-brand-700 font-bold">
                  {createdStudentData.login}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans text-[11px] font-semibold">Parol:</span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-indigo-700 font-bold">
                  {createdStudentData.plain_password}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={handleCopyCredentials}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t('admin.copied', true) : t('admin.copyCredentials', true)}</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCredsModalOpen(false)}
            >
              {t('common.continue', true)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
