import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Camera,
  RotateCw,
  X,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  SwitchCamera
} from 'lucide-react';
import { UserProfile, UserRole, AppSettings } from '../types';
import { cloudSaveUserProfile } from '../lib/firebase';
import { cleanOrgName } from '../utils/helpers';

interface UserProfileOnboardingModalProps {
  email: string;
  initialName?: string;
  initialMobile?: string;
  settings: AppSettings;
  onComplete: (profile: UserProfile) => void;
  onCancel: () => void;
}

export const UserProfileOnboardingModal: React.FC<UserProfileOnboardingModalProps> = ({
  email,
  initialName = '',
  initialMobile = '',
  settings,
  onComplete,
  onCancel
}) => {
  const [name, setName] = useState(initialName);
  const [flat, setFlat] = useState('');
  const [mobile, setMobile] = useState(initialMobile);
  const [userEmail, setUserEmail] = useState(email || '');
  const [username, setUsername] = useState('');
  const [preferences, setPreferences] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera & Photo State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getAdminEmails = (): string[] => {
    try {
      const saved = localStorage.getItem('ekb_allowed_emails');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['desaisachin95@gmail.com', 'kannadigara.balaga.eldorado@gmail.com'];
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. You can upload a photo instead.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Switch between front and rear cameras
  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Capture Frame from Video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = 360;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Crop center square
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      const minDim = Math.min(videoWidth, videoHeight);
      const startX = (videoWidth - minDim) / 2;
      const startY = (videoHeight - minDim) / 2;

      // Flip horizontally if front-facing selfie
      if (facingMode === 'user') {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);

      // Export compressed JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setPhotoUrl(dataUrl);
      stopCamera();
    } catch (err) {
      console.error('Failed to capture photo frame:', err);
      setCameraError('Failed to capture picture. Please try again or select from gallery.');
    }
  };

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 360;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        setPhotoUrl(compressed);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedFlat = flat.trim().toUpperCase();
    const cleanedMobile = mobile.replace(/\D/g, '');
    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const trimmedPreferences = preferences.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedFlat) {
      setError('Please enter your flat or villa number.');
      return;
    }
    if (cleanedMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanEmail = (userEmail || email).toLowerCase().trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError('Please enter a valid email address.');
        setSubmitting(false);
        return;
      }

      const adminList = getAdminEmails().map(e => e.toLowerCase());
      // Admin is desaisachin95@gmail.com or authorized list. Other registered devotees start as 'viewer'
      const role: UserRole =
        cleanEmail === 'desaisachin95@gmail.com' || adminList.includes(cleanEmail)
          ? 'admin'
          : 'viewer';

      const newProfile: UserProfile = {
        email: cleanEmail,
        name: trimmedName,
        flat: trimmedFlat,
        mobile: cleanedMobile,
        role,
        photoUrl: photoUrl || undefined,
        ...(trimmedUsername ? { username: trimmedUsername } : {}),
        ...(trimmedPreferences ? { preferences: trimmedPreferences } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await cloudSaveUserProfile(newProfile);
      onComplete(newProfile);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please check your internet connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-amber-400 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-5 text-center border-b-2 border-amber-400 relative">
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-amber-400/40 mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Devotee Registration</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide leading-snug">
            Welcome to {cleanOrgName(settings.org, 'Ganeshotsava 2026')}
          </h2>
          <p className="text-xs text-amber-200/90 font-medium mt-1">
            Record your profile details &amp; picture for community celebrations
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* PICTURE RECORDING SECTION */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#991B1B]" />
                <span>Devotee Picture / Photo</span>
              </span>
              {photoUrl && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Picture Recorded</span>
                </span>
              )}
            </div>

            {/* If live camera is active */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-[280px] mx-auto border-2 border-amber-400 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {/* Framing circle guide */}
                <div className="absolute inset-0 border-2 border-dashed border-white/60 rounded-full m-6 pointer-events-none" />

                {/* Controls overlay */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-10">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition-colors cursor-pointer"
                    title="Switch camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2.5 rounded-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer ring-2 ring-white"
                  >
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>Take Picture</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition-colors cursor-pointer"
                    title="Cancel camera"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Photo Preview or Prompt */
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-stone-200 border-2 border-amber-400 shadow-md shrink-0 flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100">
                      <User className="w-10 h-10 text-stone-400" />
                      <span className="text-[9px] font-semibold text-stone-500">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-left">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-2 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-300" />
                      <span>{photoUrl ? 'Retake Picture' : 'Take Picture'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-stone-500" />
                      <span>{photoUrl ? 'Change Photo' : 'Upload Picture'}</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <p className="text-[11px] text-stone-500">
                    Snap a quick photo using your webcam/phone camera, or select a picture from your device.
                  </p>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {cameraError}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Sachin Desai"
                  autoFocus
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Flat Number */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Flat / Villa Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  required
                  value={flat}
                  onChange={e => {
                    setFlat(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. A-402 or Tower 2 - 804"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium uppercase"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="email"
                  required
                  disabled={!!email}
                  value={userEmail}
                  onChange={e => {
                    setUserEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. devotee@gmail.com"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none transition-all ${
                    email
                      ? 'bg-stone-100 border border-stone-200 text-stone-600 cursor-not-allowed'
                      : 'bg-stone-50 border border-stone-300 text-stone-900 focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20'
                  }`}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <div className="absolute left-10 top-3 text-xs font-bold text-stone-500">
                  +91
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMobile(val);
                    if (error) setError(null);
                  }}
                  placeholder="10-digit mobile number"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-18 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
                />
              </div>
              <p className="text-[10px] text-stone-500">
                You can use this mobile number or email ID to sign in anytime!
              </p>
            </div>

            {/* Preferences (Optional) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Interests &amp; Sevas <span className="text-stone-400 text-[10px] font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={preferences}
                onChange={e => setPreferences(e.target.value)}
                placeholder="e.g. Maha Pooja, Cultural Events, Prasada, Volunteering"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2 text-xs text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Saving Profile & Picture...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <button
              type="button"
              onClick={onCancel}
              className="text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Cancel &amp; Sign out
            </button>
            <div className="flex items-center gap-1 text-stone-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved to Firestore</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
