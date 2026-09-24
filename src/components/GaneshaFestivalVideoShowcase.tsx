import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles,
  Upload,
  Video as VideoIcon,
  Flame,
  Bell,
  Heart,
  ExternalLink,
  X
} from 'lucide-react';

interface GaneshaFestivalVideoShowcaseProps {
  compact?: boolean;
  className?: string;
  onExploreEvents?: () => void;
}

export const GaneshaFestivalVideoShowcase: React.FC<GaneshaFestivalVideoShowcaseProps> = ({
  compact = false,
  className = '',
  onExploreEvents
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showFlowers, setShowFlowers] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    try {
      const custom = localStorage.getItem('ekb_custom_festival_video');
      if (custom) return custom;
    } catch {}
    return '/ganesha_festival_darshan.mp4';
  });
  const [videoError, setVideoError] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [bellRinging, setBellRinging] = useState(false);

  // Play Bell Sound using Web Audio API
  const playTempleBellSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Polyphonic bell harmonic frequencies
      const frequencies = [587.33, 880.0, 1174.66, 1760.0];
      const now = ctx.currentTime;

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.6);
      });

      setBellRinging(true);
      setShowFlowers(true);
      setTimeout(() => setBellRinging(false), 800);
      setTimeout(() => setShowFlowers(false), 4000);
    } catch (e) {
      console.warn('Audio synthesis notice:', e);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn(e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  // Handle Video File Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);
    setVideoError(false);
    setIsPlaying(true);

    // Save as data URL in local storage if reasonably sized, or keep objectUrl
    if (file.size < 15 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          localStorage.setItem('ekb_custom_festival_video', event.target.result);
        } catch {}
      };
      reader.readAsDataURL(file);
    }

    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.warn(e));
    }
  };

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    setVideoSrc(url);
    try {
      localStorage.setItem('ekb_custom_festival_video', url);
    } catch {}
    setShowVideoModal(false);
    setCustomUrlInput('');
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.warn(e));
    }
  };

  const handleResetDefaultVideo = () => {
    try {
      localStorage.removeItem('ekb_custom_festival_video');
    } catch {}
    setVideoSrc('/ganesha_festival_darshan.mp4');
    setShowVideoModal(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.warn(e));
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 border-amber-400 bg-stone-950 text-white shadow-xl flex flex-col ${className}`}
    >
      {/* Top Festive Header Bar */}
      <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] px-3.5 py-2.5 flex items-center justify-between border-b border-amber-400/80 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-amber-400 text-stone-950 shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-black text-xs sm:text-sm tracking-wide text-amber-200">
                ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ಮಹಾದರ್ಶನ
              </h3>
              <span className="text-[10px] font-bold uppercase bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/50 hidden xs:inline">
                Live Darshan
              </span>
            </div>
            <p className="text-[10px] text-amber-100/80 font-medium truncate max-w-[220px] sm:max-w-none">
              Eldorado Ganeshotsava 2026 • Royal Pandal Celebration
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Bell / Aarti Chime */}
          <button
            type="button"
            onClick={playTempleBellSound}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs ${
              bellRinging
                ? 'bg-amber-400 text-stone-950 border-amber-300 scale-105'
                : 'bg-white/10 hover:bg-white/20 text-amber-300 border-white/20'
            }`}
            title="Ring temple bell and shower sacred flowers!"
          >
            <Bell className={`w-3.5 h-3.5 ${bellRinging ? 'animate-bounce' : ''}`} />
            <span className="text-[10px] hidden sm:inline">Aarti Bell</span>
          </button>

          {/* Change / Upload Video Settings */}
          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 text-xs transition-colors cursor-pointer border border-white/20"
            title="Upload or change festival video"
          >
            <VideoIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Container Frame */}
      <div className="relative w-full aspect-video sm:aspect-16/10 bg-black overflow-hidden flex items-center justify-center group">
        {/* The Video Element */}
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="/Gemini_Generated_Image_jforcsjforcsjfor.png"
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover sm:object-contain transition-transform duration-700 group-hover:scale-[1.02]"
        />

        {/* Fallback Display if video cannot load */}
        {videoError && (
          <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
            <img
              src="/Gemini_Generated_Image_jforcsjforcsjfor.png"
              alt="Lord Sri Ganesha"
              className="w-24 h-24 object-contain rounded-xl border border-amber-400 shadow-md"
            />
            <p className="text-xs text-amber-200 font-bold">
              Lord Sri Ganesha Festival Darshan
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-[#991B1B] text-white text-xs font-bold rounded-lg border border-amber-400 cursor-pointer"
            >
              Upload Festival Video File
            </button>
          </div>
        )}

        {/* Flower Shower Animation Overlay */}
        {showFlowers && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-lg sm:text-2xl animate-fall"
                style={{
                  left: `${(i * 4.2) % 96}%`,
                  top: `-${(i * 12) % 40}px`,
                  animationDuration: `${1.8 + (i % 3) * 0.4}s`,
                  animationDelay: `${(i % 5) * 0.15}s`,
                  opacity: 0.9
                }}
              >
                {i % 3 === 0 ? '🌸' : i % 3 === 1 ? '🌼' : '🌺'}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Video Controls Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between z-10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-2">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
              title={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Restart */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
              title="Restart video"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Mute / Unmute */}
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Aarti Flower Shower Button */}
            <button
              type="button"
              onClick={() => {
                setShowFlowers(true);
                setTimeout(() => setShowFlowers(false), 3500);
              }}
              className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-stone-950" />
              <span>Offer Flowers</span>
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={handleFullscreen}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Caption Footnote */}
      <div className="bg-stone-900/90 px-3.5 py-2 flex items-center justify-between text-[11px] text-stone-300 border-t border-stone-800">
        <span className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Alankara: Royal Peacock &amp; Nandi Seva with Fresh Marigolds</span>
        </span>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-amber-400 hover:text-amber-300 font-bold text-[10px] uppercase tracking-wider underline cursor-pointer shrink-0 ml-2"
        >
          Change Video
        </button>
      </div>

      {/* Hidden File Input for Video Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={handleVideoUpload}
      />

      {/* Modal: Change / Upload Festival Video */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl max-w-md w-full p-5 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#991B1B] text-amber-300 rounded-lg">
                  <VideoIcon className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-sm text-amber-200">
                  Festival Darshan Video Options
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Upload your own festival celebration video (MP4/MOV from your phone or camera) or provide an external video link to display for all devotees.
            </p>

            <div className="space-y-3">
              {/* Option 1: File Upload */}
              <button
                type="button"
                onClick={() => {
                  setShowVideoModal(false);
                  fileInputRef.current?.click();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer border border-amber-400 shadow-md"
              >
                <Upload className="w-4 h-4 text-amber-300" />
                <span>Upload Video from Device (.mp4 / .mov)</span>
              </button>

              {/* Option 2: Custom URL */}
              <form onSubmit={handleSaveCustomUrl} className="space-y-2 pt-2 border-t border-stone-800">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Or Paste Direct Video URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/festival_video.mp4"
                    value={customUrlInput}
                    onChange={e => setCustomUrlInput(e.target.value)}
                    className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Save URL
                  </button>
                </div>
              </form>

              {/* Reset to Default Video */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResetDefaultVideo}
                  className="text-xs text-stone-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Reset to Official 2026 Festival Darshan Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
