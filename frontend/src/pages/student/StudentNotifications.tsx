import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, BookOpen, Award } from 'lucide-react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, tr, mode } = useLanguage();

  const fetchNotifs = async () => {
    try {
      const data = await api.getStudentNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead([]);
      await fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'NEW_HOMEWORK') return <BookOpen className="w-4 h-4 text-brand-600" />;
    if (type === 'DEADLINE_REMINDER') return <Clock className="w-4 h-4 text-amber-600" />;
    if (type === 'HOMEWORK_REVIEWED') return <Award className="w-4 h-4 text-emerald-600" />;
    return <Bell className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('notifications.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('notifications.subtitle')}
          </p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-16 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-16 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            {t('notifications.noNotifications')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                n.is_read
                  ? 'bg-white border-slate-200/70 text-slate-600'
                  : 'bg-indigo-50/40 border-indigo-100 text-slate-900 font-medium'
              }`}
            >
              <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-100 shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default StudentNotifications;
