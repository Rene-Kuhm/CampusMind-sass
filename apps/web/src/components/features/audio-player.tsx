'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Loader2,
  RotateCcw,
} from 'lucide-react';

interface AudioPlayerProps {
  src?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  onEnded?: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function AudioPlayer({
  src,
  title,
  subtitle,
  className,
  onEnded,
  isLoading = false,
  compact = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.currentTime + seconds, duration)
    );
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const cyclePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    audioRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${title || 'podcast'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onEnded, src]);

  // Reset when src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl p-6 border border-primary-100',
          className
        )}
      >
        <div className="flex items-center justify-center gap-3 text-primary-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">Generando audio...</span>
        </div>
        <p className="text-sm text-secondary-500 text-center mt-2">
          Esto puede tomar unos segundos
        </p>
      </div>
    );
  }

  if (!src) {
    return null;
  }

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 bg-secondary-50 rounded-xl p-3',
          className
        )}
      >
        <audio ref={audioRef} src={src} preload="metadata" />

        <Button
          variant="primary"
          size="sm"
          onClick={togglePlay}
          className="rounded-full w-10 h-10 p-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-medium text-secondary-900 truncate">
              {title}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary-500">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-secondary-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-secondary-500">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl p-6 border border-primary-100',
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h4 className="font-semibold text-secondary-900">{title}</h4>
          )}
          {subtitle && (
            <p className="text-sm text-secondary-500">{subtitle}</p>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-white/50 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, rgb(99, 102, 241) ${progress}%, rgba(255,255,255,0.5) ${progress}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-secondary-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={restart}
          className="text-secondary-600 hover:text-secondary-900"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSkip(-10)}
          className="text-secondary-600 hover:text-secondary-900"
        >
          <SkipBack className="w-5 h-5" />
        </Button>

        <Button
          variant="primary"
          onClick={togglePlay}
          className="rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSkip(10)}
          className="text-secondary-600 hover:text-secondary-900"
        >
          <SkipForward className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={cyclePlaybackRate}
          className="text-secondary-600 hover:text-secondary-900 font-mono text-xs min-w-[3rem]"
        >
          {playbackRate}x
        </Button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-100/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-secondary-600 hover:text-secondary-900 p-1"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-secondary-200 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-secondary-600
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="text-secondary-600 hover:text-secondary-900"
          leftIcon={<Download className="w-4 h-4" />}
        >
          Descargar
        </Button>
      </div>
    </div>
  );
}
