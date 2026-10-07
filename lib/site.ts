/** Site-wide configuration. Contact details are owner-supplied; nothing here is invented. */
export const SITE = {
  name: 'CascadeGuard',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  nav: [
    { href: '/tools', label: 'Tools' },
    { href: '/research', label: 'Research' },
    { href: '/advisory', label: 'Advisory' },
  ],
  disclaimer:
    'CascadeGuard provides simulations and research for planning. It is not financial, investment or legal advice and does not predict that any bank will fail. It does not connect to bank accounts or move money.',
} as const;
