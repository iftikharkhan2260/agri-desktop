// theme.js — single source of truth for colors and typography.
// Color rule requested: ~70% Navy Blue, ~30% Green across the UI.
// Navy dominates large surfaces (headers, nav, backgrounds, primary buttons).
// Green is the accent (success states, +Add buttons, price tags, active filters).

export const colors = {
  navyDark: '#0B2545',   // headers, drawer, primary text on light bg
  navy: '#123C69',       // primary buttons, nav bar, cards' top accents
  navyLight: '#3A6EA5',  // secondary buttons, links
  green: '#1B7A43',      // accent: +Add, success, price, settled tags
  greenLight: '#2FA866', // hover/pressed accent states
  background: '#F4F6F9', // app background (neutral, not counted in the 70/30)
  card: '#FFFFFF',
  border: '#D6DEE8',
  textPrimary: '#101828',
  textSecondary: '#5B6B82',
  danger: '#B3261E',      // delete, non-settled tag
  dangerLight: '#FDECEA',
  warning: '#B7791F',     // non-collected tag
  cashWatermark: 'rgba(27,122,67,0.18)'
};

export const fonts = {
  // These map to font files you place in assets/fonts (see README for links).
  // Noto Sans supports Latin robustly; Noto Nastaliq Urdu is the standard
  // robust choice for Urdu script rendering on Android.
  en: {
    regular: 'NotoSans-Regular',
    medium: 'NotoSans-Medium',
    bold: 'NotoSans-Bold'
  },
  ur: {
    regular: 'NotoNastaliqUrdu-Regular',
    bold: 'NotoNastaliqUrdu-Bold'
  }
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 10, lg: 16 };

export function fontFamilyFor(langCode, weight = 'regular') {
  if (langCode === 'ur') return fonts.ur[weight] || fonts.ur.regular;
  return fonts.en[weight] || fonts.en.regular;
}
