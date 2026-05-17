# Settings Finalization Notes

This patch replaces the unstable Settings route with a self-contained screen that keeps the current visual design while avoiding the imported components that caused the Settings tab to close the app.

## Included behavior

- Loads Settings through `useAppSettings()` and `settingsService`.
- Keeps Sign In, Sign Up, and Log Out test flow.
- Keeps profile photo action lazy-loaded, so `expo-image-picker` is not initialized when the Settings tab first opens.
- Preference toggles save immediately.
- Profile/body/workout/AI changes use a confirmation modal before saving.
- Distance unit uses `m` and `in` in the mobile UI.
- Keeps only one AI slider, without a number inside the draggable circle.
- Keeps the Data Management section at the end.

## After applying

Run from `apps/mobile`:

```bash
node scripts/finalize-settings-fix.js
npx expo start --dev-client -c
```

If the app was previously built without `expo-image-picker`, rebuild the development app before testing profile photo picking.
