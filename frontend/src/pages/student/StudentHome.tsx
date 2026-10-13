import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, CheckCircle2, AlertCircle, Sparkles, FileCheck2, Target, Lightbulb, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const StudentHome: React.FC = () => {
  const { user } = useAuth();
  const { t, tr, mode } = useLanguage();
  const [homeData, setHomeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHome = async () => {
      try {
        const hData = await api.getStudentHome();
        setHomeData(hData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHome();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { en: 'Good morning', uz: 'Xayrli tong' };
    if (hour < 18) return { en: 'Good afternoon', uz: 'Xayrli kun' };
    return { en: 'Good evening', uz: 'Xayrli kech' };
  };

  const formatDeadline = (dateStr?: string | null) => {
    if (!dateStr) return 'Muddat belgilanmagan';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-14 bg-slate-200 rounded-2xl" />
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const activeHomework = homeData?.active_homework || [];
  const greeting = getGreeting();
  const greetingText = mode === 'uz' ? greeting.uz : mode === 'en' ? greeting.en : `${greeting.uz} / ${greeting.en}`;

  return (
    <div className="space-y-5">
      {/* 1. Personalized Greeting */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {greetingText}, {user?.first_name || 'O‘quvchi'} 👋
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Ingliz tili bo‘yicha bugungi uyga vazifalaringiz va o‘rganish rejangiz
        </p>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-xs">
          <p className="text-[11px] font-semibold text-slate-700">Kutilayotgan</p>
          <p className="text-lg font-bold text-brand-600 mt-0.5">{homeData?.stats?.pending || 0}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-xs">
          <p className="text-[11px] font-semibold text-slate-700">Topshirilgan</p>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">{homeData?.stats?.completed || 0}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-xs">
          <p className="text-[11px] font-semibold text-slate-700">O‘rtacha ball</p>
          <p className="text-lg font-bold text-indigo-600 mt-0.5">
            {homeData?.stats?.average_score_percent ? `${homeData.stats.average_score_percent}%` : '-'}
          </p>
        </div>
      </div>


      {/* 4. Active Homework Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Menga berilgan vazifalar
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {activeHomework.length} ta faol
          </span>
        </div>

        {activeHomework.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-xs space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Faol uyga vazifalar yo‘q 🎉
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Barcha topshiriqlar bajarilgan! O‘qituvchingiz yangi vazifa berganda bu yerda ko‘rinadi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeHomework.map((hw: any) => {
              const isMixed = hw.type === 'MIXED';

              return (
                <Card
                  key={hw.id}
                  hoverable
                  onClick={() => navigate(`/app/tasks/${hw.id}`)}
                  className="cursor-pointer transition-all active:scale-[0.99] border-slate-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1">
                        {isMixed ? '🌟 2-3 Soatlik Kompleks Paket' : hw.type?.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{hw.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        O‘qituvchi: {hw.teacher_name || 'English Teacher'}
                      </p>
                    </div>
                    <Badge variant={hw.status?.toLowerCase() || 'new'}>{hw.status || 'NEW'}</Badge>
                  </div>

                  {/* Deadline & Estimated time */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 mt-2.5 flex-wrap">
                    <div className="flex items-center gap-1 font-medium text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Muddat: {formatDeadline(hw.deadline)}</span>
                    </div>
                    <span>•</span>
                    <span className="font-semibold text-brand-700">~{hw.estimated_time_minutes || 120} daqiqa</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{hw.points} ball</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Bajarilish darajasi</span>
                      <span className="font-bold text-slate-700">{hw.progress_percent || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all duration-300"
                        style={{ width: `${hw.progress_percent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {hw.progress_percent > 0 ? 'Davom ettirish' : 'Boshlashga tayyor'}
                    </span>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/tasks/${hw.id}`);
                      }}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {hw.progress_percent > 0 ? 'Davom ettirish' : 'Vazifani Boshlash'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Daily English Pro Tips Card */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <span>Foydali Maslahat (Study Tip)</span>
        </div>
        <p className="text-xs text-amber-950/80 leading-relaxed">
          Vazifalarni bajarishda avval lug‘at va grammatikani to‘liq ishlab chiqing, so‘ng reading matnini o‘qib inshoga o‘ting. Diqqatingizni jamlash uchun vazifa ichidagi <strong>Focus Taymer</strong>dan foydalaning!
        </p>
      </div>
    </div>
  );
};

export default StudentHome;
