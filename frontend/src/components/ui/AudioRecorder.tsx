import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';

interface AudioRecorderProps {
  onAudioRecorded: (audioUrl: string, durationSecs: number) => void;
  maxDurationSecs?: number;
  initialAudioUrl?: string | null;
  initialDuration?: number;
  isAdmin?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  maxDurationSecs = 180, // 3 minutes max
  initialAudioUrl,
  initialDuration = 0,
  isAdmin = false,
}) => {
  const { t, tr, localizeError } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationRef = useRef<number>(0);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    durationRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalDuration = durationRef.current || recordingDuration || 1;
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const localUrl = URL.createObjectURL(recordedBlob);
        setAudioBlob(recordedBlob);
        setAudioUrl(localUrl);
        setIsUploading(true);
        setErrorMsg(null);

        try {
          // Immediately upload to backend media storage so teacher can listen
          const ext = mimeType.includes('mp4') ? 'm4a' : (mimeType.includes('ogg') ? 'ogg' : 'webm');
          const file = new File([recordedBlob], `voice_${Date.now()}.${ext}`, { type: mimeType });
          const uploadRes = await api.uploadFile(file);
          const serverUrl = uploadRes.file_url;
          setAudioUrl(serverUrl);
          onAudioRecorded(serverUrl, finalDuration);
        } catch (uploadErr: any) {
          console.error('Audio server upload error:', uploadErr);
          // Keep local preview URL as temporary fallback
          onAudioRecorded(localUrl, finalDuration);
          setErrorMsg(isAdmin ? 'Audio serverga yuklanmadi' : 'Audio serverga yuklanishda muammo bo‘ldi, iltimos qayta yozing.');
        } finally {
          setIsUploading(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingDuration(durationRef.current);
        if (durationRef.current >= maxDurationSecs) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(t('audio.microphoneDenied', isAdmin));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsPlayingPreview(false);
    onAudioRecorded('', 0);
  };

  const togglePreview = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 mb-3">
        <Mic className={`w-6 h-6 ${isRecording ? 'animate-pulse text-rose-600' : ''}`} />
      </div>

      <h4 className="text-sm font-semibold text-slate-900 mb-0.5">
        {t('audio.speakingHomework', isAdmin)}
      </h4>
      <p className="text-xs text-slate-500 mb-4">
        {t('audio.speakingGuide', isAdmin)}
      </p>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Uploading to server */}
      {isUploading && (
        <div className="flex items-center justify-center gap-2 p-3.5 mb-3 bg-brand-50 border border-brand-200 text-brand-800 text-xs rounded-xl font-bold animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          <span>Ovoz serverga saqlanmoqda, kuting...</span>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <div className="space-y-4 mb-2">
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono text-xl font-bold text-slate-800">
              {formatDuration(recordingDuration)}
            </span>
          </div>

          <Button
            type="button"
            variant="danger"
            onClick={stopRecording}
            leftIcon={<Square className="w-4 h-4 fill-current" />}
          >
            {t('audio.stopRecording', isAdmin)}
          </Button>
        </div>
      )}

      {/* Idle / Ready to record */}
      {!isRecording && !audioUrl && !isUploading && (
        <Button
          type="button"
          onClick={startRecording}
          leftIcon={<Mic className="w-4 h-4" />}
          className="shadow-sm"
        >
          {t('audio.startRecording', isAdmin)}
        </Button>
      )}

      {/* Completed recording preview */}
      {!isRecording && audioUrl && (
        <div className="space-y-3">
          <audio
            ref={previewAudioRef}
            src={audioUrl}
            onEnded={() => setIsPlayingPreview(false)}
          />

          <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm max-w-sm mx-auto">
            <button
              type="button"
              onClick={togglePreview}
              className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all"
            >
              {isPlayingPreview ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div className="text-left flex-1">
              <p className="text-xs font-semibold text-slate-800">
                {t('audio.yourRecording', isAdmin)}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {t('audio.duration', isAdmin)}: {formatDuration(initialDuration || recordingDuration)}
              </p>
            </div>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {t('audio.recordedSuccess', isAdmin)}
            </div>
          </div>

          <div className="flex justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetRecording}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              {t('audio.recordAgain', isAdmin)}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetRecording}
              className="text-rose-600 hover:bg-rose-50"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {t('common.delete', isAdmin)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export default AudioRecorder;
