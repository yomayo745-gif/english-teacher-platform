import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AudioPlayerProps {
  src: string;
  title?: string;
  maxPlays?: number; // 0 = unlimited
  currentPlays?: number;
  onPlayCountUpdate?: (newCount: number) => void;
  transcript?: string | null;
  allowTranscript?: boolean;
  isAdmin?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  maxPlays = 0,
  currentPlays = 0,
  onPlayCountUpdate,
  transcript,
  allowTranscript = false,
  isAdmin = false,
}) => {
  const { t, tr } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playsCount, setPlaysCount] = useState(currentPlays);
  const [hasStartedPlay, setHasStartedPlay] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const isPlayLimitReached = maxPlays > 0 && playsCount >= maxPlays;

  useEffect(() => {
    setPlaysCount(currentPlays);
  }, [currentPlays]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (isPlayLimitReached && !hasStartedPlay) {
        return;
      }
      audioRef.current.play();
      setIsPlaying(true);
      if (!hasStartedPlay) {
        setHasStartedPlay(true);
        const newCount = playsCount + 1;
        setPlaysCount(newCount);
        if (onPlayCountUpdate) onPlayCountUpdate(newCount);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasStartedPlay(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayTitle = title || t('audio.play', isAdmin);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            🎧
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide">{displayTitle}</h4>
            <p className="text-xs text-slate-400">
              {tr({
                en: 'Listen to the audio carefully',
                uz: 'Audioni diqqat bilan tinglang',
                bi: 'Audioni diqqat bilan tinglang / Listen carefully'
              }, isAdmin)}
            </p>
          </div>
        </div>

        {maxPlays > 0 && (
          <div className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span>{t('audio.plays', isAdmin)}: </span>
            <span className="font-semibold text-white">{playsCount}</span> / {maxPlays}
          </div>
        )}
      </div>

      {isPlayLimitReached && (
        <div className="mb-3 p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-200">
          {t('audio.playLimitReached', isAdmin)}
        </div>
      )}

      {/* Progress slider */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          disabled={isPlayLimitReached && !isPlaying}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 disabled:opacity-40"
        />
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={isPlayLimitReached && !isPlaying}
            className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 text-white shadow-md transition-all text-xs font-semibold"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>{t('audio.pause', isAdmin)}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>{t('audio.play', isAdmin)}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
              }
            }}
            disabled={isPlayLimitReached && !isPlaying}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 active:scale-95 transition-all text-xs flex items-center gap-1"
            title="-10s"
          >
            <RotateCcw className="w-4 h-4" />
            <span>-10s</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {allowTranscript && transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>{showTranscript ? t('audio.hideTranscript', isAdmin) : t('audio.showTranscript', isAdmin)}</span>
              {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 active:scale-95 transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Transcript collapsible section */}
      {allowTranscript && transcript && showTranscript && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('audio.transcript', isAdmin)}</p>
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
};
export default AudioPlayer;
