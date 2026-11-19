/** Administrator-maintained configuration. Never accepted from employee requests. */
export const COMPANY = Object.freeze({
  organization: 'Gulbahar Tobacco International FZE',
  telephone: '+971 4 881 4800',
  website: 'www.gulbahartobacco.com',
  street: 'MO 0448, R/A No. 13, Jebel Ali Free Zone',
  poBox: '61401', city: 'Dubai', state: 'إمارة دبيّ', country: 'United Arab Emirates',
  printedAddress: ['MO 0448, R/A NO. 13, Jebel Ali Free Zone', 'P.O. Box 61401, Dubai, UAE'],
});
export const PRINT_CONFIG = Object.freeze({
  artwork: { widthMm: 92, heightMm: 57 },
  additionalBleedMm: 0,
  finalTrim: { widthMm: 92, heightMm: 57 },
  page: { widthMm: 92, heightMm: 57 },
  bleedEnabled: false,
});
