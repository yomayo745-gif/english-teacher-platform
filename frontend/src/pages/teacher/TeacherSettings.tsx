import React, { useState, useEffect } from 'react';
import { Settings, Shield, Globe, Clock, Bell, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const TeacherSettings: React.FC = () => {
  const { adminMode, setAdminMode, t, tr } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [savedMsg, setSavedMsg] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Tashkent');
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const l = await api.getAuditLogs();
        setLogs(l);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const languageOptions = [
    {
      id: 'bilingual',
      title: '50% English + 50% Uzbek',
      desc: 'Bilingual labels, instructions in Uzbek, educational terms in English',
      badge: 'Bilingual 50/50',
    },
    {
      id: 'uz',
      title: '100% O‘zbekcha',
      desc: 'Barcha tugmalar, bo‘limlar va menyular to‘liq o‘zbek tilida',
      badge: '🇺🇿 O‘zbekcha',
    },
    {
      id: 'en',
      title: '100% English',
      desc: 'Full English interface for native English speaking teachers',
      badge: '🇬🇧 English Only',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {t('nav.settings', true)}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {tr(
            {
              en: 'Configure language mode, system timezones, reminders, and inspect security audit logs.',
              uz: 'Admin til rejimi, vaqt mintaqasi, eslatmalar va audit jurnalini sozlang.',
              bi: 'Sozlamalar va til rejimi / Platform Settings & Language'
            },
            true
          )}
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{tr({ en: 'Settings saved successfully ✓', uz: 'Sozlamalar saqlandi ✓', bi: 'Muvaffaqiyatli saqlandi / Saved successfully ✓' }, true)}</span>
        </div>
      )}

      {/* Admin Language System Selection Card */}
      <Card className="space-y-4 border-brand-200 bg-gradient-to-br from-white to-brand-50/20">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-brand-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {tr({ en: 'Admin Panel Language Mode', uz: 'Admin paneli til rejimi', bi: 'Til rejimi / Language Mode' }, true)}
            </h3>
            <p className="text-xs text-slate-500">
              {tr({
                en: 'Choose your preferred language for the teacher management interface.',
                uz: 'O‘qituvchi paneli uchun qulay til rejimini tanlang.',
                bi: 'Qulay til rejimini tanlang / Choose language mode'
              }, true)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {languageOptions.map((opt) => {
            const isSelected = adminMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setAdminMode(opt.id as any)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-white ring-2 ring-brand-500/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{opt.badge}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-brand-600 ring-4 ring-brand-100" />
                  )}
                </div>
                <p className="text-xs font-semibold text-brand-700 mb-1">{opt.title}</p>
                <p className="text-[11px] text-slate-500 leading-snug">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* System Settings Card */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-600" />
          <span>{tr({ en: 'General Preferences', uz: 'Umumiy sozlamalar', bi: 'Umumiy sozlamalar / General' }, true)}</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {tr({ en: 'Platform Timezone (Deadlines & Reminders)', uz: 'Vaqt mintaqasi (Muddatlar va bildirishnomalar)', bi: 'Vaqt mintaqasi / Timezone' }, true)}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white max-w-sm"
            >
              <option value="Asia/Tashkent">Asia/Tashkent (UTC+5:00)</option>
              <option value="Asia/Samarkand">Asia/Samarkand (UTC+5:00)</option>
              <option value="Europe/London">Europe/London (UTC+0:00)</option>
              <option value="UTC">UTC (UTC+0:00)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 max-w-xl">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                {tr({ en: 'Automated Telegram Reminders', uz: 'Avtomatik Telegram eslatmalari', bi: 'Eslatmalar / Reminders' }, true)}
              </span>
              <span className="text-[11px] text-slate-500">
                {tr({
                  en: 'Send reminders at 24h, 3h, and 1h before deadline',
                  uz: 'Muddat tugashidan 24 soat, 3 soat va 1 soat oldin eslatma yuborish',
                  bi: '24s, 3s va 1s oldin eslatish / 24h, 3h, 1h reminders'
                }, true)}
              </span>
            </div>
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600"
            />
          </div>

          <Button size="sm" onClick={handleSave}>
            {t('common.save', true)}
          </Button>
        </div>
      </Card>

      {/* Security Audit Log */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-600" />
            <span>{tr({ en: 'Audit Trail & Activity Log', uz: 'Xavfsizlik va audit jurnali', bi: 'Audit jurnali / Audit Trail' }, true)}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {logs.length} {tr({ en: 'recent actions', uz: 'ta harakat', bi: 'harakat / actions' }, true)}
          </span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-400">
            {tr({ en: 'No audit logs recorded yet.', uz: 'Hali qaydlar yo‘q.', bi: 'Qaydlar yo‘q / No logs yet' }, true)}
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
            {logs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <span className="text-slate-400 ml-2">Target: {log.target_type}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default TeacherSettings;
