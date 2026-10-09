import { usePreferences } from "../state/preferences";
export const tokens = {
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { small: 12, card: 18, pill: 999 },
  touch: 48,
};
export const light = {
  background: "#EEF3F8",
  surface: "#EEF3F8",
  text: "#223047",
  muted: "#56677D",
  primary: "#245BCE",
  border: "#D7E1ED",
  highlight: "#FFFFFF",
  shadow: "#CBD5E2",
  blue: "#D9EDFC",
  pink: "#FCE1E8",
  green: "#DDF3E5",
  purple: "#EAE2FA",
  yellow: "#F7EFCB",
  success: "#20603C",
  danger: "#A62B3A",
};
export type Palette = typeof light;
export const dark: Palette = {
  background: "#1D2939",
  surface: "#1D2939",
  text: "#F1F5FA",
  muted: "#BCC9DB",
  primary: "#A7C7FF",
  border: "#41536C",
  highlight: "#2C3B50",
  shadow: "#111A26",
  blue: "#263F59",
  pink: "#4C3041",
  green: "#29483B",
  purple: "#3C3556",
  yellow: "#494332",
  success: "#A0DFB7",
  danger: "#FFAAB4",
};
export function usePalette() {
  return usePreferences((s) => s.theme) === "dark" ? dark : light;
}

// Dark surfaces stay flat; light mode retains the Soft UI depth.
export function componentShadows(c: Palette) {
  const flat = c === dark;
  return {
    surface: flat
      ? undefined
      : `7px 7px 16px ${c.shadow}, -7px -7px 16px ${c.highlight}`,
    inset: flat
      ? undefined
      : `inset 4px 4px 9px ${c.shadow}, inset -4px -4px 9px ${c.highlight}`,
    button: flat
      ? undefined
      : `3px 3px 7px ${c.shadow}, -3px -3px 7px ${c.highlight}`,
    field: flat
      ? undefined
      : `inset 3px 3px 7px ${c.shadow}, inset -3px -3px 7px ${c.highlight}`,
    sheet: flat ? undefined : `0px -4px 16px ${c.shadow}`,
  };
}
