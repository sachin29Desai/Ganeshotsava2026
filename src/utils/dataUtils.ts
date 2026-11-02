import {
  CommitteeMember,
  COMMITTEE_MEMBERS,
  GalleryPhoto,
  GALLERY_PHOTOS,
  AnnouncementItem,
  ANNOUNCEMENTS
} from '../data/communityData';

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
  return GALLERY_PHOTOS;
}

export function saveStoredPhotos(photos: GalleryPhoto[]): void {
  try {
    localStorage.setItem(GALLERY_PHOTOS_KEY, JSON.stringify(photos));
  } catch (err) {
    console.warn('Failed to save gallery photos to storage:', err);
  }
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
  return ANNOUNCEMENTS;
}

export function saveStoredAnnouncements(announcements: AnnouncementItem[]): void {
  try {
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  } catch (err) {
    console.warn('Failed to save announcements to storage:', err);
  }
}

export interface FormLinksConfig {
  membershipFormUrl: string;
  volunteerFormUrl: string;
  nominationFormUrl: string;
}

const FORM_LINKS_KEY = 'ekb_custom_form_links';

export const DEFAULT_FORM_LINKS: FormLinksConfig = {
  membershipFormUrl: 'https://forms.gle/dBvhab2hFVuzM3xS9',
  volunteerFormUrl: 'https://forms.gle/dBvhab2hFVuzM3xS9',
  nominationFormUrl: 'https://forms.gle/dBvhab2hFVuzM3xS9'
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
}
