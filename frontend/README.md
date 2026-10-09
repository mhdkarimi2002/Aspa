# Aspa frontend — React Native / Expo

Phases 0–4 implement the native foundation, authentication, exercise library, plan
builder and offline workout tracking. The same React Native screens run on Android,
iOS, and the web. Backend and admin are separate applications.

## Run

Use Node 24 and npm:

```bash
cd frontend
npm ci
cp .env.example .env
npm start
```

Press `w` for web, `a` for an Android emulator, or scan the QR code with a compatible
Expo Go installation. `npm run ios` needs macOS and Xcode. For reliable native RTL
verification, use a development build (`npx expo run:android` / `npx expo run:ios`);
Expo Go can impose its own language settings.

The API must be running (`docker compose up -d api`). Set `EXPO_PUBLIC_API_URL` before
starting Expo: `http://localhost:8000` for the browser/iOS simulator,
`http://10.0.2.2:8000` for the standard Android emulator, or your computer's LAN IP
for a phone. Compose binds the API to loopback by default; a phone requires an
explicit local override exposing port 8000 on your LAN. Restart Expo after editing
`.env`. Public Expo variables are embedded in the client; never put secrets there.

For the Docker web preview, from the repository root:

```bash
docker compose up --build -d frontend
```

Open http://localhost:3000. The web container proxies `/api` to the API container,
so browser sessions and mobile browser previews use the same origin. The native app uses Expo, not the Nginx web container.

## Language

Persian is the default, including on English-language devices. In Profile → Settings, select فارسی or English. The selection is saved locally and updates
all current screens, labels, validation messages, and RTL/LTR layout immediately.
Native locale plugin changes require rebuilding existing development binaries.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx expo-doctor
```

`build` exports Android/iOS JavaScript bundles and static web pages. It does not
compile or sign native binaries. Real-device QA remains a separate release gate.

## Structure

- `app/`: Expo Router route adapters and navigation.
- `src/ui/`: shared native components, Persian typography and Soft UI tokens.
- `src/api/`: validated public configuration, HTTP transport, query hooks.
- `src/state/`: persisted local appearance/language preferences; no session secrets.
- `src/auth/`: auth schemas, OTP/profile services, session lifecycle and SecureStore adapter.
- `tests/`: configuration/transport contract checks.

The mobile flow has three persistent tabs: Home, Workout and Profile. Home shows
personal workout activity; Workout contains quick start and routines; Profile
links to history, exercises and settings. The exercise
library includes search/filter/sort, paginated selection, instructions and reviewed
media. Plans support per-set targets, reordering, archive, duplicate and sharing.
Workouts support start/resume, actual sets, RPE/RIR, rest/elapsed timers,
previous performance, exercise replacement, minimize/resume, a finish review and
explicit save, repeated completed workouts, cancellation and history.
Routine and workout exercise pickers support multiple selections.
Login supports registration and sign-in with one OTP form. Profile now has a real workout-count/weekly chart, recent workout cards, statistics
and a Jalali/Gregorian training calendar. Edit Profile stores name, bio, link and
avatar; Settings → Account manages username/email and sign-out. Account screens
edit birthdate (Jalali in Persian, Gregorian in English), gender and a HTTPS photo reference, show
account level, and require typing DELETE before permanent account deletion. `/design-system` demonstrates form
validation, buttons, loading/error/empty states and an accessible modal. Both birthdate formats are stored together in the database. Bottom navigation stays
visible while pages scroll; language and theme controls live in Profile → Settings.

See [the phased rebuild](../docs/frontend-rebuild.md) for completed scope and release gates.

## Sessions

Native builds keep the refresh token in Expo SecureStore (device-only keychain
accessibility on iOS); access tokens stay in memory. Startup rotates the stored
refresh token to restore the session. Concurrent expired requests share one
refresh operation. Logout clears local credentials and account query caches, then
revokes the refresh token on the server. With a saved profile and refresh credential, offline relaunch restores the local
workout view without deleting credentials. Protected network requests refresh
authentication when connectivity returns. Invalid/expired refresh credentials return to sign-in.

Browser sessions use rotating HttpOnly, SameSite=Strict refresh cookies. Reloading
restores the same account, and changing language/theme preserves authentication.
A local signed-out flag prevents restoration after an offline sign-out; it contains
no credentials. Production cookies require HTTPS. Native credentials remain in
SecureStore. One phone + five-digit OTP flow signs in existing users or creates a
new account after verification; profile details are filled in afterwards. Local
OTPs are 11111; production delivery uses the backend SMS provider. Real-device secure storage/relaunch and keyboard/screen-reader QA
remain release checks. Rebuild native development binaries after adding SecureStore.

## Offline workout storage

Android/iOS use Expo SQLite; the browser preview persists its outbox through
AsyncStorage/localStorage. Only workout documents and the validated profile cache
use ordinary local storage; credentials remain in SecureStore/HttpOnly cookies.
Log changes are saved locally before acknowledgment, replayed with a stable
mutation ID and version, and retried on reconnect/foreground or manually. Conflicts
require an explicit choice. Keep this device's changes is available only while
the matching server workout is still open. Plan editing requires connectivity.
Rebuild existing native development binaries after adding SQLite.

For development catalog data, run `docker compose run --rm seed` from the root.
Review/approve real media in Admin and configure S3 to deliver demonstrations.
Video links open in the device/browser player. The API supplies Persian catalog
text; interface controls support both Persian and English.

## Profile settings follow-up

Settings groups account details, language/theme and support. Help and About open
bottom sheets; Contact Us and Google Play reviews are disabled pending their links.
Logout is the last Settings option. Subscription shows the existing account level.
Apply backend migration `20261009_0016` for stored display name, bio and profile link.
Docker Compose runs migrations on API startup. Profile photos currently use an
HTTPS URL reference. No social follower counts or screenshot sample data are used.
