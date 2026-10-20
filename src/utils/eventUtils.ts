import { CommunityEvent, COMMUNITY_EVENTS } from '../data/communityData';

/**
 * Calculates the status of an event based on current date relative to start and end dates.
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 * @param referenceDate Optional YYYY-MM-DD string, defaults to today
 */
export function getCalculatedEventStatus(
  startDate: string,
  endDate: string,
  referenceDate?: string
): 'past' | 'ongoing' | 'upcoming' {
  const ref = referenceDate || new Date().toISOString().split('T')[0];

  // If end date is before reference date, event is past
  if (endDate < ref) {
    return 'past';
  }
  // If start date is in the future, event is upcoming
  if (startDate > ref) {
    return 'upcoming';
  }
  // Otherwise, start <= ref <= end
  return 'ongoing';
}

export interface ClassifiedEvents {
  currentEvents: CommunityEvent[];
  upcomingEvents: CommunityEvent[];
  pastEvents: CommunityEvent[];
}

/**
 * Classifies community events into Current (Ongoing), Upcoming, and Past with strict zero duplication.
 */
export function classifyEvents(events: CommunityEvent[], referenceDate?: string): ClassifiedEvents {
  const currentEvents: CommunityEvent[] = [];
  const upcomingEvents: CommunityEvent[] = [];
  const pastEvents: CommunityEvent[] = [];

  const seenIds = new Set<string>();

  // Process all events
  for (const event of events) {
    if (seenIds.has(event.id)) continue;
    seenIds.add(event.id);

    const calculatedStatus = getCalculatedEventStatus(event.startDate, event.endDate, referenceDate);
    const updatedEvent: CommunityEvent = {
      ...event,
      status: calculatedStatus === 'past' ? 'archived' : calculatedStatus
    };

    if (calculatedStatus === 'ongoing') {
      currentEvents.push(updatedEvent);
    } else if (calculatedStatus === 'upcoming') {
      upcomingEvents.push(updatedEvent);
    } else {
      pastEvents.push(updatedEvent);
    }
  }

  // Sort upcoming events by startDate ascending (closest upcoming first)
  upcomingEvents.sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Sort past events by endDate descending (most recent past event first)
  pastEvents.sort((a, b) => b.endDate.localeCompare(a.endDate));

  return { currentEvents, upcomingEvents, pastEvents };
}

/**
 * Local storage key for custom event records
 */
const CUSTOM_EVENTS_STORAGE_KEY = 'ekb_custom_community_events';

export function getStoredEvents(): CommunityEvent[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EVENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with default COMMUNITY_EVENTS if missing
        const combinedMap = new Map<string, CommunityEvent>();
        COMMUNITY_EVENTS.forEach(e => combinedMap.set(e.id, e));
        parsed.forEach((e: CommunityEvent) => combinedMap.set(e.id, e));
        return Array.from(combinedMap.values());
      }
    }
  } catch (err) {
    console.warn('Failed to parse custom events from storage:', err);
  }
  return COMMUNITY_EVENTS;
}

export function saveStoredEvents(events: CommunityEvent[]): void {
  try {
    localStorage.setItem(CUSTOM_EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn('Failed to save custom events to storage:', err);
  }
}
