# ZenGarden App

Focus to harvest unique AI-generated Flower NFTs on Solana.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
npx expo start
```

## Build

### Development Build (with dev client)
```bash
eas build --profile development --platform android
```

### Preview Build (internal testing)
```bash
eas build --profile preview --platform android
```

### Production Build
```bash
eas build --profile production --platform android
```

## OTA Updates (EAS Update)

EAS Update allows you to push JavaScript/TypeScript code changes without rebuilding the app.

### When to use EAS Update vs EAS Build

| Scenario | Command |
|----------|---------|
| JS/TS code changes only | `eas update` |
| Native code changes (new packages, app.json config) | `eas build` |

### Publish an Update

```bash
# Production update
eas update --branch production --message "Fix bug / Add feature"

# Preview update (for testing)
eas update --branch preview --message "Testing new feature"
```

### How it works

1. User opens the app
2. App checks for updates in the background
3. If an update is available, it downloads automatically
4. User is prompted to restart to apply the update

## Environment Variables

Set these in `eas.json` under each build profile:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_REOWN_PROJECT_ID": "your-project-id",
        "EXPO_PUBLIC_API_URL": "https://your-api-url.com/"
      }
    }
  }
}
```

## Project Structure

```
app/
├── app/                 # Expo Router screens
│   ├── (tabs)/          # Tab navigation screens
│   ├── _layout.tsx      # Root layout with providers
│   ├── login.tsx        # Login screen
│   └── focus-timer.tsx  # Focus timer screen
├── components/          # Reusable components
├── contexts/            # React contexts
├── services/            # API services
├── constants/           # App constants
└── assets/              # Images, fonts
```
