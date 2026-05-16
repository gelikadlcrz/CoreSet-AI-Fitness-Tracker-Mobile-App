# Photo Picker and Exercise Preview Update

This update keeps the existing Settings and workout UI but improves two flows:

1. Profile photo selection now has iOS photo usage text in `app.json` and a safer picker handler.
2. Long pressing an exercise inside the Add Exercise list opens a preview card with API-sourced details and local history summary.

After applying this patch, run:

```bash
cd apps/mobile
node scripts/apply-photo-picker-config.js
npx expo install expo-image-picker
npx expo run:ios --device
npx expo start --dev-client -c
```

The native rebuild is required because iOS permission strings and config plugins are embedded into the app binary.
