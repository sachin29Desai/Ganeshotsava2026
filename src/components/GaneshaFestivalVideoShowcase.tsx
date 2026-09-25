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
  ImageIcon
} from 'lucide-react';
import { AppSettings } from '../types';

interface GaneshaFestivalVideoShowcaseProps {
  compact?: boolean;
  className?: string;
  isAdmin?: boolean;
  settings?: AppSettings;
  onUpdateSettings?: (cfg: AppSettings) => void;
}

interface MediaItem {
  id: string;
  type: 'video' | 'photo';
  url: string;
  caption?: string;
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

  // Compile full media list: always ensure the video plays first, then the photo
  const getMediaList = (): MediaItem[] => {
    const list: MediaItem[] = [];

    // Ensure our primary video is first in the list
    list.push({
      id: 'default_video',
      type: 'video',
      url: '/ganesha_festival_darshan.mp4',
      caption: 'Sri Ganesha Festival Grand Darshan Video'
    });

    // Ensure our beautiful altar photo is second in the list
    list.push({
      id: 'default_photo',
      type: 'photo',
      url: '/Gemini_Generated_Image_jforcsjforcsjfor.png',
      caption: 'Sri Ganesha Divine Altar'
    });

    // Add any extra custom admin videos configured in settings
    if (settings?.adminVideos && Array.isArray(settings.adminVideos)) {
      settings.adminVideos.forEach((url, i) => {
        if (url && url !== '/ganesha_festival_darshan.mp4') {
          list.push({ id: `v_${i}`, type: 'video', url, caption: `Festival Video Showcase ${i + 1}` });
        }
      });
    }

    // Add any extra custom admin photos configured in settings
    if (settings?.adminPhotos && Array.isArray(settings.adminPhotos)) {
      settings.adminPhotos.forEach((url, i) => {
        if (url && url !== '/Gemini_Generated_Image_jforcsjforcsjfor.png') {
          list.push({ id: `p_${i}`, type: 'photo', url, caption: `Celebration Photo ${i + 1}` });
        }
      });
    }

    return list;
  };

  const mediaItems = getMediaList();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  
  // Admin Media Management Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const currentMedia = mediaItems[currentIndex] || mediaItems[0];

  // Auto-play / restart on media item switch
  useEffect(() => {
    setVideoError(false);
    setIsPlaying(true);
    if (currentMedia.type === 'video' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Handle browsers block of non-muted autoplay
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(err => console.warn('Autoplay failed:', err));
        }
      });
    }
  }, [currentIndex, currentMedia.url]);

  // Auto-advance photos after 6 seconds
  useEffect(() => {
    if (currentMedia.type === 'photo') {
      const timer = setTimeout(() => {
        handleNextMedia();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentMedia.type]);

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
    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const handlePrevMedia = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  // Admin database save trigger
  const saveMediaToDatabase = async (updatedVideos: string[], updatedPhotos: string[]) => {
    if (!onUpdateSettings || !settings) return;
    setSaveStatus('Saving...');
    try {
      const updatedSettings: AppSettings = {
        ...settings,
        adminVideos: updatedVideos,
        adminPhotos: updatedPhotos
      };
      await onUpdateSettings(updatedSettings);
      setSaveStatus('Media saved securely to devotee portal database!');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error(err);
      setSaveStatus('Failed to save to database. Check connection.');
    }
  };

  // Add custom links
  const handleAddVideoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;
    const currentVideos = settings?.adminVideos || [];
    const updated = [...currentVideos, newVideoUrl.trim()];
    const currentPhotos = settings?.adminPhotos || [];
    saveMediaToDatabase(updated, currentPhotos);
    setNewVideoUrl('');
  };

  const handleAddPhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    const currentPhotos = settings?.adminPhotos || [];
    const updated = [...currentPhotos, newPhotoUrl.trim()];
    const currentVideos = settings?.adminVideos || [];
    saveMediaToDatabase(currentVideos, updated);
    setNewPhotoUrl('');
  };

  // Base64 file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject extremely large files to respect local/session storage limits
    if (file.size > 8 * 1024 * 1024) {
      alert('Selected file is too large (> 8MB). Please choose a compressed file or use a direct URL link.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const dataUrl = event.target.result;
      if (type === 'video') {
        const currentVideos = settings?.adminVideos || [];
        saveMediaToDatabase([...currentVideos, dataUrl], settings?.adminPhotos || []);
      } else {
        const currentPhotos = settings?.adminPhotos || [];
        saveMediaToDatabase(settings?.adminVideos || [], [...currentPhotos, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove item
  const handleRemoveMedia = (indexToRemove: number, type: 'video' | 'photo') => {
    if (type === 'video') {
      const currentVideos = settings?.adminVideos || [];
      const updated = currentVideos.filter((_, i) => i !== indexToRemove);
      saveMediaToDatabase(updated, settings?.adminPhotos || []);
    } else {
      const currentPhotos = settings?.adminPhotos || [];
      const updated = currentPhotos.filter((_, i) => i !== indexToRemove);
      saveMediaToDatabase(settings?.adminVideos || [], updated);
    }
    setCurrentIndex(0);
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 border-amber-400 bg-stone-950 text-white shadow-xl flex flex-col ${className}`}
    >
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] px-3.5 py-2.5 flex items-center justify-between border-b border-amber-400/80 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-amber-400 text-stone-950 shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-black text-xs sm:text-sm tracking-wide text-amber-200">
                ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ಮಹಾದರ್ಶನ shree ganehotsava 2026
              </h3>
              <span className="text-[10px] font-bold uppercase bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/50 hidden xs:inline">
                Live Darshan
              </span>
            </div>
            <p className="text-[10px] text-amber-100/80 font-medium truncate max-w-[220px] sm:max-w-none">
              Eldorado Ganeshotsava 2026
            </p>
          </div>
        </div>

        {/* Change / Upload Video Settings (Admin Only or custom overlay) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition-all cursor-pointer border border-amber-300 flex items-center gap-1"
            title="Devotee Portal Media Manager"
          >
            <VideoIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Manage Media</span>
          </button>
        )}
      </div>

      {/* Main Showcase Container */}
      <div className="relative w-full aspect-video sm:aspect-16/10 bg-black overflow-hidden flex items-center justify-center group">
        {currentMedia.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentMedia.url}
            autoPlay
            muted={isMuted}
            playsInline
            onEnded={handleNextMedia}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover sm:object-contain transition-transform duration-700 group-hover:scale-[1.01]"
          />
        ) : (
          <img
            src={currentMedia.url}
            alt="Festival Celebration"
            className="w-full h-full object-cover sm:object-contain transition-transform duration-700 group-hover:scale-[1.01]"
          />
        )}

        {/* Navigation arrows if multiple items exist */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={handlePrevMedia}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
              title="Previous Media"
            >
              <ChevronLeft className="w-5 h-5 text-amber-300" />
            </button>
            <button
              onClick={handleNextMedia}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
              title="Next Media"
            >
              <ChevronRight className="w-5 h-5 text-amber-300" />
            </button>
          </>
        )}

        {/* Fallback Display if video cannot load */}
        {videoError && currentMedia.type === 'video' && (
          <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center p-4 text-center space-y-2">
            <VideoIcon className="w-12 h-12 text-amber-400" />
            <p className="text-xs text-amber-200 font-bold">
              Darshan Video URL Unreachable
            </p>
            <p className="text-[10px] text-stone-400 max-w-xs">
              This video stream may be offline. Admin can replace this with another direct URL or upload a compressed file.
            </p>
          </div>
        )}

        {/* Bottom Video Controls Overlay (Only for videos) */}
        {currentMedia.type === 'video' && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3 flex items-center justify-between z-10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
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
                {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4" />}
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

        {/* Media indicator counts */}
        <div className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 backdrop-blur-xs z-10">
          {currentIndex + 1} / {mediaItems.length}
        </div>
      </div>

      {/* Decorative Caption Footnote */}
      <div className="bg-stone-900/90 px-3.5 py-2 flex items-center justify-between text-[11px] text-stone-300 border-t border-stone-800">
        <span className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span>
            {currentMedia.type === 'video' ? '📺 Darshan Video' : '📸 Celebration Photo'}
            {currentMedia.caption ? ` - ${currentMedia.caption}` : ''}
          </span>
        </span>
      </div>

      {/* Modal: Admin Media Manager */}
      {showAdminModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-white space-y-4 shadow-2xl my-4">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#991B1B] text-amber-300 rounded-lg">
                  <VideoIcon className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-sm text-amber-200">
                  Devotee Portal Media Settings (Admin Only)
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
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-400 text-amber-200 text-xs">
                {saveStatus}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Form: Add Video */}
              <div className="space-y-3 bg-stone-950 p-3.5 rounded-xl border border-stone-800">
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <VideoIcon className="w-3.5 h-3.5" />
                  <span>Configure Videos</span>
                </h5>
                
                <form onSubmit={handleAddVideoUrl} className="space-y-2">
                  <label className="block text-[10px] text-stone-400 uppercase tracking-wider">
                    Add Video Direct URL
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="https://example.com/festival_video.mp4"
                      value={newVideoUrl}
                      onChange={e => setNewVideoUrl(e.target.value)}
                      className="flex-1 bg-stone-850 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>

                <div className="pt-1.5">
                  <span className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1">
                    Or Upload MP4 File
                  </span>
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="w-full py-1.5 px-3 bg-stone-850 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-semibold text-stone-200 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-300" />
                    <span>Upload Video (&lt; 8MB)</span>
                  </button>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'video')}
                  />
                </div>
              </div>

              {/* Right Form: Add Photo */}
              <div className="space-y-3 bg-stone-950 p-3.5 rounded-xl border border-stone-800">
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Configure Photos</span>
                </h5>
                
                <form onSubmit={handleAddPhotoUrl} className="space-y-2">
                  <label className="block text-[10px] text-stone-400 uppercase tracking-wider">
                    Add Photo Direct URL
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="https://example.com/celebration.jpg"
                      value={newPhotoUrl}
                      onChange={e => setNewPhotoUrl(e.target.value)}
                      className="flex-1 bg-stone-850 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>

                <div className="pt-1.5">
                  <span className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1">
                    Or Upload Photo File
                  </span>
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="w-full py-1.5 px-3 bg-stone-850 hover:bg-stone-800 border border-stone-700 rounded-lg text-xs font-semibold text-stone-200 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-300" />
                    <span>Upload Image (&lt; 8MB)</span>
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
            </div>

            {/* Current Media Items List with Delete */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Configure Active Showcase Media Items ({mediaItems.length})
              </h5>
              <div className="bg-stone-950 border border-stone-850 rounded-xl max-h-40 overflow-y-auto divide-y divide-stone-850 p-1">
                {mediaItems.map((item, i) => {
                  const isDefault = item.id === 'default_video';
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 text-xs">
                      <span className="truncate max-w-[400px] text-stone-300 flex items-center gap-2">
                        {item.type === 'video' ? '📺' : '📸'}
                        <span className="font-mono text-[10px] bg-stone-800 text-amber-400 px-1.5 py-0.5 rounded">
                          {item.type}
                        </span>
                        <span className="truncate">{item.url}</span>
                      </span>
                      {!isDefault ? (
                        <button
                          type="button"
                          onClick={() => {
                            const typePrefix = item.id.split('_')[0];
                            const idx = parseInt(item.id.split('_')[1], 10);
                            handleRemoveMedia(idx, typePrefix === 'v' ? 'video' : 'photo');
                          }}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                          title="Remove media item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                          Official Fallback
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
