// Rigsmith design-system tokens as used by the Rigsmith prototype.
// Values mirror _ds/.../tokens/*.css one-to-one.
export const color = {
  gray0: "#FFFFFF", gray50: "#FAFAFA", gray100: "#F4F4F4", gray200: "#EBEBEB",
  gray300: "#E0E0E0", gray400: "#C7C7C7", gray500: "#9E9E9E", gray600: "#5D5D5D", gray900: "#292929",
  blue50: "#EEF3FE", blue100: "#D7E4FD", blue500: "#2C6EF5", blue600: "#1F5AD8", blue700: "#1A4CB8",
  green50: "#E9F6EE", green500: "#2E9E5B", green600: "#248049",
  amber50: "#FBF2E1", amber400: "#F4C430", amber500: "#C9820A", amber600: "#A66A07",
  red50: "#FCECEC", red500: "#DC3B3B", red600: "#BE2E2E",
} as const;

export const text = {
  primary: color.gray900, secondary: color.gray600, tertiary: color.gray500,
  inverse: color.gray0, accent: color.blue600, disabled: color.gray400,
} as const;

export const surface = {
  page: color.gray0, card: color.gray0, sunken: color.gray100,
  hover: color.gray100, active: color.gray200, inverse: color.gray900,
} as const;

export const border = {
  subtle: color.gray200, default: color.gray300, strong: color.gray400, focus: color.blue500,
} as const;

/** The type ramp is deliberately tiny: 12 / 13 / 14 / 24. Nothing else. */
export const size = { xs: 12, sm: 13, base: 14, display: 24 } as const;
export const weight = { regular: 400, medium: 500 } as const;
export const tracking = "-0.15px";
export const font = "Inter, system-ui, sans-serif";

export const radius = { nav: 8, card: 16, chip: 4, pill: 99 } as const;
export const space = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48] as const;

export const shadow = {
  card: "0 1px 3px rgba(41,41,41,.06)",
  raised: "0 2px 8px rgba(41,41,41,.08)",
  popover: "0 8px 24px rgba(41,41,41,.12)",
  modal: "0 8px 24px rgba(41,41,41,.24)",
} as const;

/** transitions.dev motion tokens, as tuned in the prototype. */
export const motion = {
  pageSlideDur: "250ms", pageFadeDur: "250ms", pageSlideDistance: "8px", pageBlur: "3px",
  slideEase: "cubic-bezier(0.22, 1, 0.36, 1)",
  digitDur: "500ms", digitStagger: "70ms", digitBlur: "2px",
  digitEase: "cubic-bezier(0.34, 1.45, 0.64, 1)",
  toastOpen: "350ms", toastClose: "250ms",
  panelOpenDur: "400ms", panelCloseDur: "350ms",
} as const;
