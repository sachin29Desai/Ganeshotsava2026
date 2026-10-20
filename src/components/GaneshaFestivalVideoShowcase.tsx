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
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Youtube,
  Tv,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AppSettings } from '../types';

interface GaneshaFestivalVideoShowcaseProps {
  compact?: boolean;
  className?: string;
  isAdmin?: boolean;
  settings?: AppSettings;
  onUpdateSettings?: (cfg: AppSettings) => void;
}

export interface MediaItem {
  id: string;
  type: 'video' | 'photo' | 'youtube';
  url: string;
  embedUrl?: string;
  caption?: string;
  thumbnail?: string;
}

export function getYouTubeEmbedUrl(url: string): { embedUrl: string; videoId?: string } | null {
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) {
    const parts = url.split('embed/');
    const id = parts[1]?.split('?')[0];
    return { embedUrl: url, videoId: id };
  }

  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&mute=1&rel=0&enablejsapi=1`,
      videoId: watchMatch[1]
    };
  }

  const playlistMatch = url.match(/list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && playlistMatch[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}&autoplay=1&mute=1`
    };
  }

  return null;
}

export const GaneshaFestivalVideoShowcase: React.FC<GaneshaFestivalVideoShowcaseProps> = ({
  compact = false,
  className = '',
  isAdmin = false,
  settings,
  onUpdateSettings
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-play slideshow timer state
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  // Compile full media list from Settings database & defaults
  const getMediaList = (): MediaItem[] => {
    const list: MediaItem[] = [];

    // 1. Add YouTube videos or channel links configured in settings
    if (settings?.adminYoutubeLinks && Array.isArray(settings.adminYoutubeLinks)) {
      settings.adminYoutubeLinks.forEach((ytUrl, i) => {
        if (ytUrl) {
          const ytInfo = getYouTubeEmbedUrl(ytUrl);
          if (ytInfo) {
            list.push({
              id: `yt_${i}`,
              type: 'youtube',
              url: ytUrl,
              embedUrl: ytInfo.embedUrl,
              caption: `Festival Video Broadcast ${i + 1}`,
              thumbnail: ytInfo.videoId
                ? `https://img.youtube.com/vi/${ytInfo.videoId}/hqdefault.jpg`
                : undefined
            });
          }
        }
      });
    }

    // 2. Add custom admin videos configured in settings
    if (settings?.adminVideos && Array.isArray(settings.adminVideos)) {
      settings.adminVideos.forEach((url, i) => {
        if (url && url !== '/ganesha_festival_darshan.mp4') {
          // Check if YouTube link put into videos array
          const ytInfo = getYouTubeEmbedUrl(url);
          if (ytInfo) {
            list.push({
              id: `yt_v_${i}`,
              type: 'youtube',
              url,
              embedUrl: ytInfo.embedUrl,
              caption: `YouTube Live Broadcast ${i + 1}`,
              thumbnail: ytInfo.videoId
                ? `https://img.youtube.com/vi/${ytInfo.videoId}/hqdefault.jpg`
                : undefined
            });
          } else {
            list.push({
              id: `v_${i}`,
              type: 'video',
              url,
              caption: `Festival Video Showcase ${i + 1}`
            });
          }
        }
      });
    }

    // 3. Add custom admin photos configured in settings
    if (settings?.adminPhotos && Array.isArray(settings.adminPhotos)) {
      settings.adminPhotos.forEach((url, i) => {
        if (url) {
          list.push({
            id: `p_${i}`,
            type: 'photo',
            url,
            caption: `Celebration Photo ${i + 1}`
          });
        }
      });
    }

    // 4. Fallback defaults featuring user's Goddess Bhuvaneshwari & Karnataka Flag photo
    if (list.length === 0) {
      list.push(
        {
          id: 'def_bhuvaneshwari',
          type: 'photo',
          url: '/bhuvaneshwari_kannada_flag.jpg',
          caption: 'ಶ್ರೀ ತಾಯಿ ಭುವನೇಶ್ವರಿ ದೇವಿ - Goddess Bhuvaneshwari Devi & Karnataka Flag'
        },
        {
          id: 'def_altar',
          type: 'photo',
          url: '/Gemini_Generated_Image_jforcsjforcsjfor.png',
          caption: 'Sri Ganesha Divine Altar Alankara'
        },
        {
          id: 'def_dollu',
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1609137144820-21151ef34a02?auto=format&fit=crop&w=1200&q=80',
          caption: 'Folk Cultural Procession & Dollu Kunitha'
        },
        {
          id: 'def_cultural',
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
          caption: 'Grand Cultural Stage Performance & Dance Recital'
        }
      );
    }

    return list;
  };

  const mediaItems = getMediaList();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Admin Media Management Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const currentMedia = mediaItems[currentIndex] || mediaItems[0];

  // Auto-play / restart on media item switch
  useEffect(() => {
    setVideoError(false);
    setIsPlayingVideo(true);
    if (currentMedia.type === 'video' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch((err) => console.warn('Autoplay failed:', err));
        }
      });
    }
  }, [currentIndex, currentMedia.url]);

  // Auto-advance photos / slideshow every 5 seconds if enabled
  useEffect(() => {
    if (isAutoSliding && currentMedia.type === 'photo' && mediaItems.length > 1) {
      const timer = setTimeout(() => {
        handleNextMedia();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isAutoSliding, currentMedia.type, mediaItems.length]);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlayingVideo(true))
        .catch((e) => console.warn(e));
    } else {
      videoRef.current.pause();
      setIsPlayingVideo(false);
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
    videoRef.current.play().then(() => setIsPlayingVideo(true)).catch(() => {});
  };

  const handlePrevMedia = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  // Admin database save trigger
  const saveMediaToDatabase = async (
    updatedVideos: string[],
    updatedPhotos: string[],
    updatedYtLinks?: string[]
  ) => {
    if (!onUpdateSettings || !settings) return;
    setSaveStatus('Saving to settings...');
    try {
      const updatedSettings: AppSettings = {
        ...settings,
        adminVideos: updatedVideos,
        adminPhotos: updatedPhotos,
        adminYoutubeLinks: updatedYtLinks !== undefined ? updatedYtLinks : settings.adminYoutubeLinks || []
      };
      await onUpdateSettings(updatedSettings);
      setSaveStatus('Media saved securely to devotee portal!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('Failed to save to database. Check connection.');
    }
  };

  // Add custom video links
  const handleAddVideoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;
    const currentVideos = settings?.adminVideos || [];
    const updated = [...currentVideos, newVideoUrl.trim()];
    saveMediaToDatabase(updated, settings?.adminPhotos || [], settings?.adminYoutubeLinks || []);
    setNewVideoUrl('');
  };

  // Add custom photo links
  const handleAddPhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    const currentPhotos = settings?.adminPhotos || [];
    const updated = [...currentPhotos, newPhotoUrl.trim()];
    saveMediaToDatabase(settings?.adminVideos || [], updated, settings?.adminYoutubeLinks || []);
    setNewPhotoUrl('');
  };

  // Add YouTube video or channel link
  const handleAddYoutubeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYoutubeUrl.trim()) return;
    const currentYt = settings?.adminYoutubeLinks || [];
    const updated = [...currentYt, newYoutubeUrl.trim()];
    saveMediaToDatabase(settings?.adminVideos || [], settings?.adminPhotos || [], updated);
    setNewYoutubeUrl('');
  };

  // Base64 file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert(
        'Selected file is larger than 8MB. Please choose a smaller compressed file or enter a direct URL link.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const dataUrl = event.target.result;
      if (type === 'video') {
        const currentVideos = settings?.adminVideos || [];
        saveMediaToDatabase(
          [...currentVideos, dataUrl],
          settings?.adminPhotos || [],
          settings?.adminYoutubeLinks || []
        );
      } else {
        const currentPhotos = settings?.adminPhotos || [];
        saveMediaToDatabase(
          settings?.adminVideos || [],
          [...currentPhotos, dataUrl],
          settings?.adminYoutubeLinks || []
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove media item
  const handleRemoveMedia = (
    indexToRemove: number,
    type: 'video' | 'photo' | 'youtube'
  ) => {
    if (type === 'youtube') {
      const currentYt = settings?.adminYoutubeLinks || [];
      const updated = currentYt.filter((_, i) => i !== indexToRemove);
      saveMediaToDatabase(settings?.adminVideos || [], settings?.adminPhotos || [], updated);
    } else if (type === 'video') {
      const currentVideos = settings?.adminVideos || [];
      const updated = currentVideos.filter((_, i) => i !== indexToRemove);
      saveMediaToDatabase(updated, settings?.adminPhotos || [], settings?.adminYoutubeLinks || []);
    } else {
      const currentPhotos = settings?.adminPhotos || [];
      const updated = currentPhotos.filter((_, i) => i !== indexToRemove);
      saveMediaToDatabase(settings?.adminVideos || [], updated, settings?.adminYoutubeLinks || []);
    }
    setCurrentIndex(0);
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border-2 border-amber-400 bg-stone-950 text-white shadow-xl flex flex-col ${className}`}
    >
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] px-4 py-3 flex items-center justify-between border-b border-amber-400/80 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-amber-400 text-stone-950 shadow-xs">
            <Flame className="w-4 h-4 fill-current" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-black text-xs sm:text-sm tracking-wide text-amber-200">
                ಶ್ರೀ ಉತ್ಸವ ವೈಭವ • Festival Media Showcase
              </h3>
              <span className="text-[10px] font-bold uppercase bg-amber-400/30 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/50 hidden xs:inline flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Auto Slideshow</span>
              </span>
            </div>
            <p className="text-[10px] text-amber-100/80 font-medium truncate max-w-[220px] sm:max-w-none">
              Kannadigara Balaga Celebrations • Photo Gallery &amp; Video Streams
            </p>
          </div>
        </div>

        {/* Right Action buttons: Slideshow Pause/Play & Admin Manage */}
        <div className="flex items-center gap-2">
          {mediaItems.length > 1 && (
            <button
              type="button"
              onClick={() => setIsAutoSliding((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isAutoSliding
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
              title={isAutoSliding ? 'Pause Auto Slideshow' : 'Resume Auto Slideshow'}
            >
              {isAutoSliding ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline text-[11px]">Sliding</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline text-[11px]">Paused</span>
                </>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition-all cursor-pointer rounded-lg border border-amber-300 flex items-center gap-1.5 shadow-xs"
              title="Manage Showcase Media"
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Admin Media</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Showcase Player Frame */}
      <div className="relative w-full aspect-video sm:aspect-16/9 bg-black overflow-hidden flex items-center justify-center group">
        {currentMedia.type === 'youtube' && currentMedia.embedUrl ? (
          <iframe
            src={currentMedia.embedUrl}
            title={currentMedia.caption || 'YouTube Festival Broadcast'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : currentMedia.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentMedia.url}
            autoPlay
            loop={mediaItems.length === 1}
            muted={isMuted}
            playsInline
            onEnded={mediaItems.length > 1 ? handleNextMedia : undefined}
            onError={() => setVideoError(true)}
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-stone-950">
            <img
              key={currentMedia.id}
              src={currentMedia.url}
              alt={currentMedia.caption || 'Festival Celebration'}
              className="w-full h-full object-contain animate-in fade-in duration-500"
            />
          </div>
        )}

        {/* Navigation Arrows for Media Carousel */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={handlePrevMedia}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-amber-500 text-white flex items-center justify-center transition-colors cursor-pointer z-20 border border-amber-400/40 shadow-lg"
              title="Previous Item"
            >
              <ChevronLeft className="w-6 h-6 text-yellow-300" />
            </button>
            <button
              onClick={handleNextMedia}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-amber-500 text-white flex items-center justify-center transition-colors cursor-pointer z-20 border border-amber-400/40 shadow-lg"
              title="Next Item"
            >
              <ChevronRight className="w-6 h-6 text-yellow-300" />
            </button>
          </>
        )}

        {/* Video Controls Overlay for Direct HTML5 MP4 Video */}
        {currentMedia.type === 'video' && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3 flex items-center justify-between z-10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVideoPlay}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
                title={isPlayingVideo ? 'Pause' : 'Play'}
              >
                {isPlayingVideo ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-amber-300" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
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
        )}

        {/* Media Type & Counter Indicator Badge */}
        <div className="absolute top-3 right-3 bg-black/80 px-3 py-1 rounded-full text-xs font-bold text-amber-300 backdrop-blur-xs z-10 border border-amber-400/40 flex items-center gap-1.5 shadow-md">
          {currentMedia.type === 'youtube' && <Youtube className="w-3.5 h-3.5 text-red-500" />}
          {currentMedia.type === 'video' && <VideoIcon className="w-3.5 h-3.5 text-amber-400" />}
          {currentMedia.type === 'photo' && <ImageIcon className="w-3.5 h-3.5 text-yellow-300" />}
          <span>
            {currentIndex + 1} / {mediaItems.length}
          </span>
        </div>
      </div>

      {/* Sliding Thumbnail Widget Strip (Interactive Horizontal Slider) */}
      <div className="bg-stone-900 px-4 py-3 border-t border-stone-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-300">
          <span className="font-bold flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {currentMedia.type === 'youtube'
                ? '📺 YouTube Video'
                : currentMedia.type === 'video'
                ? '🎥 Video Stream'
                : '📸 Festival Photo'}
              {currentMedia.caption ? ` - ${currentMedia.caption}` : ''}
            </span>
          </span>
          <span className="text-[10px] text-stone-400 shrink-0 hidden sm:inline">
            Click thumbnail to jump slide
          </span>
        </div>

        {/* Thumbnail Widgets Slider */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-amber-500/40">
          {mediaItems.map((item, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentIndex(idx);
                }}
                className={`relative shrink-0 w-20 sm:w-24 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-amber-400 scale-105 shadow-md ring-2 ring-amber-400/50'
                    : 'border-stone-700 opacity-60 hover:opacity-100 hover:border-amber-300'
                }`}
              >
                {item.type === 'youtube' ? (
                  <div className="w-full h-full bg-stone-950 flex flex-col items-center justify-center p-1 text-center relative">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="YouTube" className="w-full h-full object-cover" />
                    ) : (
                      <Youtube className="w-6 h-6 text-red-500" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-red-500 fill-current" />
                    </div>
                  </div>
                ) : item.type === 'video' ? (
                  <div className="w-full h-full bg-stone-950 flex items-center justify-center relative">
                    <VideoIcon className="w-5 h-5 text-amber-400" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-4 h-4 text-amber-300 fill-current" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || 'Thumbnail'}
                    className="w-full h-full object-cover"
                  />
                )}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-amber-400 rounded-xl pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Media Settings Modal */}
      {showAdminModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-white space-y-4 shadow-2xl my-4">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#991B1B] text-amber-300 rounded-lg">
                  <VideoIcon className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-sm text-amber-200">
                  Manage Festival Showcase Media &amp; YouTube Channels
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdminModal(false);
                  setSaveStatus(null);
                }}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveStatus && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-400 text-amber-200 text-xs font-semibold">
                {saveStatus}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Form 1: Add YouTube Video / Channel */}
              <div className="space-y-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
                <h5 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>YouTube Video</span>
                </h5>
                <form onSubmit={handleAddYoutubeUrl} className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={newYoutubeUrl}
                    onChange={(e) => setNewYoutubeUrl(e.target.value)}
                    className="w-full bg-stone-850 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-yellow-300 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Add YouTube Link
                  </button>
                </form>
              </div>

              {/* Form 2: Add MP4 Video */}
              <div className="space-y-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <VideoIcon className="w-4 h-4" />
                  <span>MP4 Video Stream</span>
                </h5>
                <form onSubmit={handleAddVideoUrl} className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="w-full bg-stone-850 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Add Direct Video
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => videoFileInputRef.current?.click()}
                  className="w-full py-1 px-2.5 bg-stone-850 hover:bg-stone-800 border border-stone-700 rounded-lg text-[11px] font-semibold text-stone-200 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-amber-300" />
                  <span>Upload File</span>
                </button>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'video')}
                />
              </div>

              {/* Form 3: Add Photo */}
              <div className="space-y-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
                <h5 className="text-xs font-bold uppercase tracking-wider text-yellow-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Celebration Photo</span>
                </h5>
                <form onSubmit={handleAddPhotoUrl} className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="w-full bg-stone-850 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Add Photo Link
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  className="w-full py-1 px-2.5 bg-stone-850 hover:bg-stone-800 border border-stone-700 rounded-lg text-[11px] font-semibold text-stone-200 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-amber-300" />
                  <span>Upload Image</span>
                </button>
                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'photo')}
                />
              </div>
            </div>

            {/* Configured Media List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Configured Active Showcase Media Items ({mediaItems.length})
              </h5>
              <div className="bg-stone-950 border border-stone-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-stone-850 p-1">
                {mediaItems.map((item) => {
                  const isDefault = item.id.startsWith('def_');
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 text-xs">
                      <span className="truncate max-w-[400px] text-stone-300 flex items-center gap-2">
                        {item.type === 'youtube' ? '📺' : item.type === 'video' ? '🎥' : '📸'}
                        <span className="font-mono text-[10px] bg-stone-800 text-amber-400 px-1.5 py-0.5 rounded uppercase">
                          {item.type}
                        </span>
                        <span className="truncate">{item.caption || item.url}</span>
                      </span>
                      {!isDefault ? (
                        <button
                          type="button"
                          onClick={() => {
                            const parts = item.id.split('_');
                            const prefix = parts[0];
                            const idx = parseInt(parts[1] || parts[2] || '0', 10);
                            handleRemoveMedia(
                              idx,
                              prefix === 'yt' ? 'youtube' : prefix === 'v' ? 'video' : 'photo'
                            );
                          }}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                          Default Preset
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setShowAdminModal(false);
                  setSaveStatus(null);
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Close Settings Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
