# MySafe

Expo / React Native app for an elderly-user safety companion. Includes a chat surface, prescription scanner, scam check, symptom log, family/memory journal, and a hardcoded distress backstop layered on top of GPT-4o-mini.

## Prerequisites

- **Node.js 20 LTS or newer** (Expo SDK 54 requires Node 18+; 20 is the current LTS).
- **npm** (ships with Node) or yarn. The lockfile assumes npm.
- **Expo Go** on your phone for the fastest dev loop — install from the App Store / Google Play. No Xcode or Android Studio needed for testing.
- A free **OpenAI** account for an API key (paid usage; this app uses `gpt-4o-mini` + `whisper-1`).
- A free **ocr.space** account for an OCR API key.

## Install

```bash
git clone <repo-url> mysafe
cd mysafe
npm install
```

## Environment variables

Create a file named `.env` in the project root (it's already in `.gitignore` so it won't be committed). The app reads it at build time via `react-native-dotenv` and exposes it as the `@env` module — every `import { X } from "@env"` resolves against this file.

```
OPENAI_API_KEY=sk-...
OCR_API_KEY=K...
```

| Variable          | Where to get it                                                              | What it's for                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`  | [platform.openai.com → API Keys](https://platform.openai.com/api-keys)        | Every AI call: chat scopes, Whisper voice transcription, Vision photo analysis, translation, distress / scam / save-offer classifiers. |
| `OCR_API_KEY`     | [ocr.space → register for a free key](https://ocr.space/ocrapi/freekey)       | OCR fallback when GPT-4o Vision returns nothing usable from a photo (e.g. low-contrast prescription label).                |

Both keys are required — the app won't work without them. Restart `expo start` after editing `.env` so the new values are picked up (the cache key is the `.env` file's contents).

## Run

```bash
npm start              # opens Expo Dev Tools; scan the QR with Expo Go
npm run android        # opens directly on a connected Android device / emulator
npm run ios            # macOS only — opens the iOS simulator
```

First boot will install the JS bundle on the device; subsequent reloads are fast.

## Project layout

```
src/
├── backend/          AI pipeline (see src/backend/CLAUDE.md if added later)
│   ├── _AI/          shared engine: AI_Run, AI_Fetch, AI_RunChatTurn, AI_DistressGuard, AI_Debug
│   ├── 1_Input/      Camera/ + Speech/ — photo and voice capture
│   ├── 2_Checks/     pre-AI safety: translate, keyword scan, AI second-pass flag
│   ├── 3_Scopes/     per-feature prompt builders (Companion, Clarity, MedView, SafeHarbour, SenseGuard)
│   ├── 4_Post_Scope/ save-offer routing
│   ├── 5_Output/     raw text extraction
│   └── 6_Present/    markdown rendering
├── components/       reusable UI (ChatScreen, MessageReaderModal, BackButton, …)
├── config/           per-scope chat configs + global config (Config_General, Config_Keywords)
├── features/         per-feature screens (Companion, Clarity, Medview, Docs, SafeHarbour, SenseGuard)
├── hooks/            shared React hooks (useSaveFlow, useAISettings, usePulseLoop)
├── navigation/       AppNavigator
├── screens/          top-level non-feature screens (Splash, Home, Settings)
└── theme.ts          single colour palette for the whole app
```

## Permissions

`app.json` declares camera and photo-library permission strings. Expo Go will ask the user the first time a chat triggers a photo or recording.

## Notes / gotchas

- **Expo SDK 54 + React Native 0.81.** Keep the SDK pin (`expo: ~54.0.0`) and the matching Expo-managed packages (`expo-*`, `react-native-*`) on the versions the SDK ships with — running `npx expo install <pkg>` is safer than `npm install <pkg>` for any of those.
- **No OpenAI org / proxy required.** The fetch calls hit `https://api.openai.com` directly with the bearer token from `.env`.
- **Debug logging.** Toggle the `DEBUG` / `DEBUG_FULL` flags in `src/config/Config_General.ts` to see turn-by-turn pipeline events in the Metro console — handy when investigating a flagged message or a parse failure.
- **`.env` changes need a Metro restart.** `react-native-dotenv` resolves at build time. After editing `.env`, stop and re-run `npm start`.
- **TypeScript check.** `npx tsc --noEmit` runs the type checker over the whole project; should report zero errors.
