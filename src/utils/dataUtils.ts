import {
  CommitteeMember,
  COMMITTEE_MEMBERS,
  GalleryPhoto,
  GALLERY_PHOTOS,
  AnnouncementItem,
  ANNOUNCEMENTS
} from '../data/communityData';
import {
  cloudSaveCommunityTeam,
  cloudSaveCommunityPhotos,
  cloudSaveCommunityAnnouncements,
  cloudSaveCommunityFormLinks
} from '../lib/firebase';

const TEAM_MEMBERS_KEY = 'ekb_custom_team_members';
const GALLERY_PHOTOS_KEY = 'ekb_custom_gallery_photos';
const ANNOUNCEMENTS_KEY = 'ekb_custom_announcements';

export function getStoredTeamMembers(): CommitteeMember[] {
  try {
    const raw = localStorage.getItem(TEAM_MEMBERS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse team members from storage:', err);
  }
  return COMMITTEE_MEMBERS;
}

export function saveStoredTeamMembers(members: CommitteeMember[]): void {
  try {
    localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(members));
  } catch (err) {
    console.warn('Failed to save team members to storage:', err);
  }
  cloudSaveCommunityTeam(members).catch((e) => console.warn('Cloud save team warning:', e));
}

export function getStoredPhotos(): GalleryPhoto[] {
  try {
    const raw = localStorage.getItem(GALLERY_PHOTOS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse gallery photos from storage:', err);
  }
  return [];
}

export function saveStoredPhotos(photos: GalleryPhoto[]): void {
  try {
    localStorage.setItem(GALLERY_PHOTOS_KEY, JSON.stringify(photos));
  } catch (err) {
    console.warn('Failed to save gallery photos to storage:', err);
  }
  cloudSaveCommunityPhotos(photos).catch((e) => console.warn('Cloud save photos warning:', e));
}

export function getStoredAnnouncements(): AnnouncementItem[] {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse announcements from storage:', err);
  }
  return [];
}

export function saveStoredAnnouncements(announcements: AnnouncementItem[]): void {
  try {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  } catch (err) {
    console.warn('Failed to save announcements to storage:', err);
  }
  cloudSaveCommunityAnnouncements(announcements).catch((e) => console.warn('Cloud save announcements warning:', e));
}

export interface FormLinksConfig {
  membershipFormUrl: string;
  volunteerFormUrl: string;
  nominationFormUrl: string;
  homeYoutubeUrl?: string;
  defaultTheme?: 'light' | 'dark';
}

const FORM_LINKS_KEY = 'ekb_custom_form_links';

export const DEFAULT_FORM_LINKS: FormLinksConfig = {
  membershipFormUrl: 'https://forms.gle/dBvhab2hFVuzM3xS9',
  volunteerFormUrl: 'https://forms.gle/dBvhab2hFVuzM3xS9',
  nominationFormUrl: 'https://forms.gle/dBvhab2hFVuzM3xS9',
  homeYoutubeUrl: 'https://www.youtube-nocookie.com/embed/YUhBamMUk8c?si=-xXlf5w6VEU1GFFn',
  defaultTheme: 'light'
};

export function getStoredFormLinks(): FormLinksConfig {
  try {
    const raw = localStorage.getItem(FORM_LINKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_FORM_LINKS,
        ...parsed
      };
    }
  } catch (err) {
    console.warn('Failed to parse form links from storage:', err);
  }
  return DEFAULT_FORM_LINKS;
}

export function saveStoredFormLinks(links: FormLinksConfig): void {
  try {
    localStorage.setItem(FORM_LINKS_KEY, JSON.stringify(links));
  } catch (err) {
    console.warn('Failed to save form links to storage:', err);
  }
  cloudSaveCommunityFormLinks(links).catch((e) => console.warn('Cloud save form links warning:', e));
}

/**
 * Extracts or constructs a clean YouTube embed URL with autoplay parameters
 * from plain links, YouTube share URLs, or pasted raw <iframe ...> HTML snippets.
 */
export function extractYouTubeEmbedUrl(url?: string): string {
  const fallbackBase = 'https://www.youtube-nocookie.com/embed/YUhBamMUk8c?si=-xXlf5w6VEU1GFFn';
  if (!url || !url.trim()) {
    return `${fallbackBase}?autoplay=1&mute=1&enablejsapi=1`;
  }

  let target = url.trim();

  // If user pasted src="..." or src='...' or full <iframe ... src="..."> snippet in Admin Portal
  const iframeSrcMatch = target.match(/(?:src=["']?)([^"'\s>]+)(?:["']?)/i);
  if (iframeSrcMatch && iframeSrcMatch[1] && (iframeSrcMatch[1].startsWith('http') || iframeSrcMatch[1].startsWith('//'))) {
    target = iframeSrcMatch[1].trim();
  }

  let baseUrl = '';
  const params = new URLSearchParams();

  try {
    if (target.includes('youtube.com/embed/') || target.includes('youtube-nocookie.com/embed/')) {
      const parts = target.split('?');
      baseUrl = parts[0];
      if (parts[1]) {
        const parsedParams = new URLSearchParams(parts[1]);
        parsedParams.forEach((val, key) => params.set(key, val));
      }
    } else if (target.includes('youtu.be/')) {
      const pathAndQuery = target.split('youtu.be/')[1] || '';
      const parts = pathAndQuery.split('?');
      const id = parts[0];
      baseUrl = `https://www.youtube-nocookie.com/embed/${id}`;
      if (parts[1]) {
        const parsedParams = new URLSearchParams(parts[1]);
        parsedParams.forEach((val, key) => params.set(key, val));
      }
    } else if (target.includes('youtube.com/watch')) {
      const urlObj = new URL(target);
      const v = urlObj.searchParams.get('v');
      if (v) {
        baseUrl = `https://www.youtube-nocookie.com/embed/${v}`;
        urlObj.searchParams.forEach((val, key) => {
          if (key !== 'v') params.set(key, val);
        });
      }
    } else {
      const cleanId = target.replace(/[^a-zA-Z0-9_\-]/g, '');
      if (cleanId) {
        baseUrl = `https://www.youtube-nocookie.com/embed/${cleanId}`;
      }
    }
  } catch (err) {
    console.warn('Error parsing YouTube URL:', err);
  }

  if (!baseUrl) {
    baseUrl = fallbackBase;
  }

  params.set('autoplay', '1');
  params.set('mute', '1');

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Compresses a local File object into a compact base64 data URL string for database storage.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}


