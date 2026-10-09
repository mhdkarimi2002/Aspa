# Frontend guidance

This frontend uses React Native and Expo Router. Use core native components and
shared tokens/components in src/ui; HTML is limited to the web document adapter.
Keep API access in src/api and feature query/service modules. Keep Persian as the default, support English LTR and Persian RTL,
safe areas, readable contrast, keyboard focus and 48-point touch targets. Do not
store credentials in AsyncStorage. Run typecheck, lint, tests and platform exports
for substantive changes. Follow docs/frontend-rebuild.md for phased delivery.
