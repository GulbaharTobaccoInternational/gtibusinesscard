import { z } from 'zod';
/** Administrator-maintained configuration; request bodies can select an ID only. */
export const companyIdSchema = z.enum(['gti', 'doubleLeaf']);
export type CompanyId = z.infer<typeof companyIdSchema>;
export const COMPANY_IDS: CompanyId[] = ['gti', 'doubleLeaf'];
export const COMPANIES = {
  gti: {
    id: 'gti', label: 'GTI — Gulbahar Tobacco International', shortName: 'GTI', exportPrefix: 'GTI',
    organization: 'Gulbahar Tobacco International FZE', telephone: '+971 4 881 4800',
    website: 'www.gulbahartobacco.com', street: 'MO 0448, R/A No. 13, Jebel Ali Free Zone',
    poBox: '61401', city: 'Dubai', state: 'إمارة دبيّ', country: 'United Arab Emirates',
    printedAddress: ['MO 0448, R/A NO. 13, Jebel Ali Free Zone', 'P.O. Box 61401, Dubai, UAE'],
    accent: '#df002a', accentDark: '#bd0024', accentSoft: '#fcebf0',
  },
  doubleLeaf: {
    id: 'doubleLeaf', label: 'Double Leaf — Double Leaf FZE', shortName: 'Double Leaf', exportPrefix: 'DoubleLeaf',
    organization: 'DOUBLE LEAF FZE', telephone: '', website: 'www.doubleleaf.ae',
    street: 'Plot No. B054R03, JAFZA North, Jebel Ali Free Zone',
    poBox: '', city: 'Dubai', state: 'Dubai', country: 'United Arab Emirates',
    printedAddress: ['DOUBLE LEAF FZE,', 'Plot No. B054R03, JAFZA North,', 'Jebel Ali Free Zone, Dubai, UAE'],
    accent: '#65391b', accentDark: '#4d2a14', accentSoft: '#f7f0e5',
  },
} as const;
export function getCompany(id: CompanyId = 'gti') { return COMPANIES[id]; }
/** Backwards-compatible GTI default for existing integrations. */
export const COMPANY = COMPANIES.gti;
export const PRINT_CONFIG = Object.freeze({
  artwork: { widthMm: 92, heightMm: 57 }, additionalBleedMm: 0,
  finalTrim: { widthMm: 92, heightMm: 57 }, page: { widthMm: 92, heightMm: 57 }, bleedEnabled: false,
});
