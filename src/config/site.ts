/**
 * Site-wide configuration for branding, default SEO titles, descriptions, and contacts.
 */
export const siteConfig = {
  name: 'Coffee Shop',
  shortName: 'Coffee Shop',
  description:
    'Freshly roasted specialty coffee, handcrafted espresso, and cold brews with fast, seamless Bakong KHQR checkout in Cambodia.',
  defaultTitle: 'Coffee Shop | Freshly Crafted Specialty Coffee & Bakery',
  titleTemplate: '%s | Coffee Shop',
  locale: 'en_US',
  currency: 'USD',
  themeColor: '#7c4a29', // roast-600
  backgroundColor: '#f7f6f3',
  links: {
    github: 'https://github.com',
  },
  contact: {
    city: 'Phnom Penh',
    country: 'Cambodia',
  },
};

export type SiteConfig = typeof siteConfig;
