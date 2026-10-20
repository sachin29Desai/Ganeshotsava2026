# Implementation Plan: Standardized Common Event Architecture & Admin Event Management

This plan establishes a common component system for all community events (Current, Upcoming, Past), eliminating duplicate event displays on the Home Page, protecting financial privacy, and empowering admins to manage events and media dynamically.

## User Requirements & Decisions Summary
- **Automatic Event Status**: Events classified automatically as `Past`, `Current/Ongoing`, or `Upcoming` based on event start and end dates relative to today.
- **Zero Duplication**: Each event appears strictly in one widget on the Home Page (Current, Upcoming, or Past).
- **Public vs. Protected Views**:
  - **Unregistered / Public Visitors**: See public event details, theme, date/venue, photo gallery, and volunteer planner, with sensitive financials and receipt details hidden.
  - **Verified Members & Admins**: See full financial statements, itemized accounts, expense bills, and receipts.
- **Unified Event Architecture**: Replace obsolete hardcoded single-event views (e.g. legacy Ganeshotsava view) with a common, reusable `EventDetailView` template.
- **Admin Event Management**: Complete admin portal section to create new events, update existing event metadata, manage photo highlights, and update financial summaries.

---

## Architecture & Proposed Changes

### 1. Data Models & Event Classification (`src/types.ts` & `src/utils/eventUtils.ts`)
- Enhance `CommunityEvent` model to include status auto-calculation helper:
  - `endDate < currentDate` -> `past` / `archived`
  - `startDate <= currentDate <= endDate` -> `current`
  - `startDate > currentDate` -> `upcoming`
- Add Firestore structure for custom events and media highlights with default fallback to `COMMUNITY_EVENTS`.

### 2. Home Page Event Widgets (`src/components/CommunityHomeView.tsx`)
- Build distinct widget sections:
  - **Current / Ongoing Event Banner**: Highlighted widget if an event is currently active.
  - **Upcoming Event Card**: Countdown and planner teaser for the next upcoming event (e.g., Karnataka Rajyotsava 2026).
  - **Past Events Carousel / Grid**: Card overview for past celebrations with quick links to event highlights and photo galleries.
- Ensure strict filtering logic so no single `eventId` is rendered in more than one widget.

### 3. Common Event Detail Page Template (`src/components/balaga/BalagaEventDetailView.tsx`)
- Single unified component rendered when a user clicks on any event.
- **Sections**:
  1. **Header & Hero**: Poster image, Kannada title, theme, date badge, venue, and status tag.
  2. **Overview & Description**: Comprehensive event summary and schedule.
  3. **Photo Gallery & Highlights**: Responsive grid of photo cards with lightbox modal.
  4. **Volunteer & Cultural Planner**: Cultural act nomination button and volunteer sign-up modal.
  5. **Financial Overview (Access-Controlled)**:
     - Visible ONLY if `userProfile.role` is `admin` or `member` with `status === 'verified'`.
     - Displays Income vs Expense totals, net balance/FD, and receipt breakdown.
     - Public users see a friendly lock message: *"Financial statements and devotee receipts are accessible to verified Balaga members and admins."*

### 4. Admin Event Management Portal (`src/components/balaga/AdminEventHighlightsManager.tsx`)
- Create / Edit Event form in Admin Dashboard:
  - Title, Kannada Title, Festival type, Start/End dates, Venue, Theme, Description, Poster URL.
  - Photo upload & metadata entry (title, caption, image URL) for past event highlights gallery.
  - Financial overview inputs for archived events (Total Collections, Total Expenses, FD balance, Notes).
- Instant persistence to Firestore DB with fallback local state update.

### 5. Cleanup & Routing Synchronization (`src/App.tsx`)
- Replace legacy one-off Ganeshotsava route handlers with unified `/events/:id` state navigation.
- Ensure deep-linking to any event (`/events/rajyotsava-2026`, `/events/ganesh-chaturthi-2026`, etc.) loads the common `BalagaEventDetailView`.

---

## Verification Plan

### Automated & Compilation Verification
- Run `compile_applet` to ensure TypeScript compilation passes with zero type errors.
- Run `lint_applet` to confirm no ESLint rule violations.

### Manual Behavior Verification
1. **Home Page Duplication Check**: Verify each event appears exactly once across Current, Upcoming, and Past widgets.
2. **Public vs. Member Privacy Check**:
   - As an unauthenticated public visitor: Open an event, verify event details, gallery, and volunteer planner are visible, and financial summary shows the member-only lock prompt.
   - As a verified Member / Admin: Open the event, verify full financial breakdown and receipt links are visible.
3. **Admin Event Creation & Management**:
   - Access Admin Portal -> Events Management.
   - Create a new event or update photos/financials for a past event.
   - Verify the newly created event immediately renders on the Home Page and loads in the Common Event Template.
