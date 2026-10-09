# Frontend rebuild

The frontend is now React Native with Expo and TypeScript. Backend/admin retain
their existing implementations. The old frontend was absent from the working
tree at the start of implementation; its committed history remains in Git.

## Phase 0 — foundation

Implemented: Expo Router navigation and deep links; Android/iOS/web targets;
Persian/English UI with Persian as the default, a persisted in-app language
selector, bundled Vazirmatn fonts, and app-controlled RTL/LTR content and navigation; safe areas; light/dark Soft UI palette; reusable surfaces, buttons,
fields, modal, empty/error/loading states; TanStack Query; Zustand persisted
appearance preference; React Hook Form/Zod validation; public environment config;
HTTP cancellation/timeout/error handling; live API health check; static web Docker
image and run instructions.

The visual reference is [Soft UI Evolution](https://www.uistyleguide.com/style/soft-ui-evolution):
soft gray surfaces, paired highlight/shadow depth, blue/pink/green/lavender/yellow
accents, and high contrast text. Pastels are backgrounds, not low contrast body
text. No animated shadows; navigation and controls have at least 48-point touch
areas. Tokens live in `frontend/src/ui/theme.ts`, components in
`frontend/src/ui/components.tsx`. Persian typography uses packaged Vazirmatn,
licensed under the SIL Open Font License (font package includes the license).

Verification covers strict TypeScript, lint, transport/config contracts, exports
for all three platforms and responsive browser interactions. Native bundle export
is not physical-device testing: safe areas, large system fonts, keyboard behavior,
TalkBack/VoiceOver, and native RTL must still be checked on Android/iOS devices.

The initial dependency audit also reports upstream Expo/Metro tooling advisories
(braces, node-forge, uuid) and a router decoding advisory. Automatic audit repair
proposes incompatible framework versions, so no forced downgrade is applied.
Review compatible upstream fixes before a production release.

## Phase 1 — identity and profile

Implemented: one phone/five-digit OTP flow that signs in existing users or creates new accounts, Persian/Arabic digit
normalization, resend countdown, expiry and rate-limit states, native SecureStore
refresh credentials, startup restoration, shared refresh/retry on 401, protected
account routes, logout and cache clearing, validated profile editing, read-only
phone/account level, and permanent account deletion with explicit confirmation.
Persian remains the default and all new copy supports English. Keyboard-safe
scrolling and appropriate phone/OTP/email input modes are included.

Verified against the real local API: registration, invalid OTP, profile saving,
logout, login in English, automatic refresh, and deletion of a temporary account.
Contract tests cover restoration, refresh rotation/concurrency, invalid credentials,
offline failure, logout races, phone/date/code validation and HTTP metadata.
Browser checks cover expiry and rate-limit feedback as well as protected routes.

Native device/relaunch, secure-storage behavior, keyboard and accessibility QA
remain acceptance gates. Browser sessions now restore through rotating HttpOnly cookies; changing language
or theme keeps the current account. Profile → Settings contains both preferences.
Birthdates use Jalali input in Persian and Gregorian input in English, with both
formats stored and existing dates backfilled. Bottom navigation stays visible while
mobile pages scroll. Profile photo editing currently accepts a HTTPS image reference; a
user photo-upload API is not present.


Phase 1 verification: 14 frontend tests, 115 backend tests, and 7 admin tests pass.
Android, iOS and web exports pass. Real-browser checks verify unified new/existing
login, five-digit OTP restrictions, both saved calendar dates, language/theme
changes without sign-out, page-refresh restoration, cookie logout and account
deletion. At 320/375/390-pixel portrait widths and phone landscape, Home has no
horizontal overflow and its bottom navigation remains visible while scrolling.


## Phase 2 — exercise library

Implemented: debounced search; muscle, equipment and difficulty filters; sorting;
20-item API pagination; common and owner-visible private exercises; detail screens
with coach-authored Persian content, muscles, equipment and ordered instructions;
reviewed GIF/image display and signed MP4 links opened with the device player.
Media uses signed API URLs, not raw object-storage keys. Both modern media records
and legacy image/video assets are supported. Empty/loading/error/retry states and
anonymous browsing are included. Catalog content remains Persian when interface
language is English because the backend has no English catalog fields.

## Phase 3 — plans

Implemented: owned plan list, create/name/description editing, reusable paginated
exercise selection, add/remove/reorder via accessible buttons, per-set repetitions
and optional weight targets, rest and notes, muscle coverage, activate/deactivate,
duplicate, archive/restore, and confirmed deletion. Plans are one ordered list,
without weekday assignment. Reducing targets requires confirmation. Sharing
creates seven-day fixed versions, with revocation, recipient preview and explicit
import into an independent owned plan. Common-library/private restrictions and
ownership are enforced by the existing API. Plan management needs connectivity;
workout tracking has a separate durable local document.

## Phase 4 — workout tracking

Implemented: start a plan or an empty workout; resume the original run; log actual
reps/weight and optional RPE/RIR separately from targets; correct/add sets;
add/remove/replace exercises; inspect previous performance; elapsed/rest timers;
review and explicit save before completion; confirmed cancellation; paginated history and exercise history; actual
set summaries and logged volume. Timers derive from persisted timestamps, so
backgrounding/navigation/relaunch does not reset them. Cancellation is excluded
from completed history, and logging does not modify plan targets.

Native workout snapshots and immutable queued mutations use `expo-sqlite` with
WAL, full synchronous writes, parameter binding and one atomic snapshot per owner.
The web preview uses AsyncStorage/localStorage for the same document/outbox;
credential storage remains SecureStore or HttpOnly cookies. A validated profile
cache permits offline relaunch when the refresh credential is still available;
protected API access still requires server authentication. Old native AsyncStorage
workout snapshots migrate to SQLite on first read. Account deletion removes that
owner's local workout storage.

Every local change is saved before the UI acknowledges it. `PUT /api/workouts/sync`
uses stable client IDs, expected versions and a persisted mutation ID. An uncertain
HTTP result replays the identical payload. Edits made during that request are
queued afterwards using the acknowledged version. Retry runs on foreground/online
events, every 15 seconds while the app is running, and manually. It does not claim
OS background-task synchronization. Version conflicts retain the local document
and offer explicit server/local choices; finished remote runs cannot be replaced.
Account changes stop the old owner's sender. Protected mutations also check the
expected owner after token recovery/rotation, so another account cannot receive
the previous owner's queued writes. Storage errors remain visible.


## Mobile flow alignment

The core flow follows Hevy's mobile app guides while keeping Aspa's existing Soft UI
palette, surfaces, Vazirmatn typography, Persian-first RTL and Profile → Settings:

- Three persistent destinations: Home, Workout and Profile. Home shows the owner's
  recent workout activity. Social/community feeds are excluded by the user's scope.
- Workout is the hub: Start Empty Workout, New Routine, saved routine previews and
  Start Routine directly on each card. Existing `/plans` URLs remain compatible.
- Routine preview separates exercise content from editing/management actions.
  Multi-select exercise picking adds three editable sets per exercise. The picker
  keeps successful routine additions if a subsequent API request fails; retry only
  adds the remaining selections. Routine editing/sharing uses the existing APIs.
- Live workouts use compact set/previous/kg/reps/completion rows, optional RPE/RIR
  under the set-number control, an automatic compact rest timer and a fixed Finish
  action. Exercise options contain instructions, prior performance, replace/remove.
- Minimize returns to the hub and a persistent resume control follows the owner
  across tabs. Finish opens an editable workout-name/results review. Back returns
  to the active session; Save durably completes it before network synchronization.
  The API now applies the workout name on existing-run sync as well as creation.
- Completed workout details offer Repeat Workout with fresh client IDs, prior
  logged values as targets and cleared actuals. Deleted exercises and unchecked
  sets are omitted. Actual reps outside the target range remain visible in history
  but are not copied as invalid target values.
- Profile links to history, exercises and routines; appearance/language stay in its
  Settings tab. Existing offline identity, SQLite/outbox, conflict resolution,
  localized birthdates, OTP and owner isolation continue to apply.

References: [Hevy's mobile logging guide](https://help.hevyapp.com/hc/en-us/articles/35361530647959-How-to-Log-a-Workout-in-the-Hevy-App-Step-by-Step-Guide),
[routine building](https://help.hevyapp.com/hc/en-us/articles/34953606698903-Build-a-Workout-Program-Create-Organize-Routines),
and [tracking interactions](https://www.hevyapp.com/features/track-workouts/).
This implements the selected core flow, not every Hevy feature. Routine folders,
supersets, set types, timer pause/time edits, custom exercise creation, advanced
analytics and social/media posting remain outside this change; several require
new persisted backend contracts.

## Verification and release acceptance

31 frontend tests pass, including an actual SQLite adapter test, uncertain response
replay after restart, concurrent edits, invalid-input correction, conflict handling,
owner isolation, offline credential recovery and numeric bounds. TypeScript, ESLint
and Android/iOS/web exports pass.

Real API mobile-browser tests cover three-tab navigation, quick start, multi-select
exercise picking, compact set rows, minimize/resume, finish review/back/save,
repeating completed workouts, search/filter/detail, plan creation, Persian
numeric targets, reorder/edit, sharing/import, actual sets and timers, reload
resume, offline relaunch and completion, reconnect/replay, saved history, a second
writer's version conflict and explicit reconciliation, cancellation, archive/restore,
duplicate/delete, and English/dark mode. Temporary accounts/catalog records are
removed after checks. Phone-width/landscape checks verify that navigation stays
visible during scrolling and content has no horizontal overflow.

Implementation through Phase 4 is complete. Native binary/device acceptance is
still a release gate: SQLite/SecureStore on real Android/iOS, airplane-mode relaunch,
large fonts, keyboard/safe areas, TalkBack/VoiceOver and foreground/background timer
behavior. Rebuild development binaries after adding SQLite. Approved licensed
catalog media, S3 credentials and production SMS/staging configuration are external
release requirements. Personal exercise authoring/upload and advanced analytics are
outside this frontend rebuild's Phase 2–4 scope. The screenshot-driven profile
follow-up below adds basic training statistics and a calendar.

## Profile and Settings screenshot follow-up

The three supplied mobile screenshots are the structural reference; Aspa retains
its Soft UI tokens rather than adopting Hevy's black surfaces. Profile now has an
avatar/display name, edit/settings actions, an actual completed-workout count,
compact duration/volume/reps pills, a Last 3 months / Year / All time bottom sheet
and dashboard shortcuts. Profile details and chart sit directly on the page;
only Statistics, Exercises, Measures and Calendar retain dashboard cards.
Profile no longer contains a workout feed; workouts remain
in History. Statistics uses the same ranges and displays all-time totals. The All
time chart includes the owner’s earliest completed workout, including records older
than a year.
Counts/totals are calculated in PostgreSQL for the authenticated owner, not from
a paginated preview. Cancelled/in-progress sessions and unchecked sets are excluded;
workout duration is not multiplied by the number of exercise sets.

The calendar uses Jalali months/Saturday-first weeks in Persian and Gregorian
months/Monday-first weeks in English. A Jalali month can fetch two Gregorian API
months; only its own dates are displayed. Calendar/history day boundaries and
weekly aggregation use Asia/Tehran. The chart summary shows this week’s
minutes, kilograms or reps according to the selected metric, with the range
selector on its physical right in both languages. Empty periods have no extra
workout-status message. The summary uses the current
weekly bucket rather than last week or all-time totals. Date-selected history
retains API pagination.
Charts have no previous/next week controls. Shared typography, cards, forms,
settings rows and navigation use compact mobile spacing while retaining 48-point
touch areas. Metric pills have a smaller visible shape within those touch areas.


Edit Profile provides name, profile photo, province, sex and localized birthday.
Province is optional and opens a scrolling bottom-sheet list of Iran’s 31 provinces.
The API catalogue supplies Persian and English labels; the account stores a stable
identifier, so the selected province follows the app language. Known older Persian
or English names normalize to that identifier, and arbitrary new values are rejected.
The row retains the same thin divider as the other private fields. Change Picture
opens a bottom sheet for camera, gallery and deletion. Photos are uploaded to
owner-scoped storage in PostgreSQL, normalized to a 512px JPEG, and saved with Done.
Gender opens a bottom sheet with Male, Female and Prefer not to say. Birthday opens
a bottom sheet with snapping year/month/day wheels, Jalali in Persian and Gregorian
in English; saving stores both calendars. Month lengths, leap years and future-date
bounds are enforced. Dismissing the birthday sheet leaves the saved draft unchanged. Edit Profile uses an inline name label/input and thin dividers between fields,
with borderless groups and inputs; focus and validation
use an underline rather than a box around the field. Biography and profile-link
fields are excluded from this form and its
update payload. Name/bio/link are persisted by additive
migration `20261009_0016`; existing profiles remain compatible. Blank birthdays on
new accounts remain unset. Username, email, sign-out and account deletion are in
Settings → Account. Profile fields and phone/birthday data are owner-only API data;
this change does not introduce public social profiles or copy screenshot user data.

Settings has Account, Preferences and Support groups. Account retains Profile,
Account and Subscription; Preferences retains language and theme. Support includes
Help and About bottom sheets, plus Contact Us and Google Play review rows disabled
until their destinations are supplied. Logout is the final Settings option and has
been removed from Account settings. Logout clears credentials and cached queries,
while saved workout drafts stay scoped to their owner. Notification, workout
preferences, privacy/social, units, integrations, export/import and workout-guide
rows have been removed. Existing rest preferences still apply to workouts.

Verification: profile persistence/link validation, old identity-cache compatibility,
Jalali leap/year/month boundaries, owner isolation, aggregation correctness and
Tehran midnight boundaries have tests. Real-API browser acceptance covers the
profile/chart/calendar/account/settings flow, reload, English/Persian birthdays,
dark mode and persistent footer at phone widths/landscape. Real native-device
acceptance remains a release gate.

Button labels compensate for Vazirmatn font metrics so Persian and English text
appears vertically centered, including plain buttons and metric pills. Plain
button focus indicators do not change layout. Dark mode removes component shadows
and highlights, including cards, fields, buttons and bottom sheets; light mode
retains its Soft UI depth.
