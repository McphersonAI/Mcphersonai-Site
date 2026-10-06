// The launch contract is intentionally explicit: audits fail on unintended route or funnel changes.
export const canonicalRoutes = [
  '/', '/founding', '/how-it-works', '/observa', '/evidence', '/trust', '/about',
  '/getting-started', '/docs', '/contact', '/privacy', '/terms', '/observa/cli',
  '/observa/pairing', '/observa/troubleshooting', '/observa/support', '/qsr-systems'
];
export const historicalRoutes = ['/white-paper', '/when-the-agent-acts', '/observa-audit-mode-schema-v0.1'];
export const legacyRoutes = [
  ['/proof', '/evidence'], ['/resources', '/evidence'], ['/governance', '/observa'],
  ['/private-beta', '/getting-started'], ['/services', '/how-it-works'],
  ['/what-we-build', '/how-it-works'], ['/pilot', '/founding'], ['/walkthrough', '/qsr-systems'],
  ['/regulated-crm-proof', '/evidence'], ['/when-agent-acts', '/when-the-agent-acts'],
  ['/observa/getting-started', '/getting-started'], ['/observa/safety', '/trust']
];
export const primaryLinks = [
  ['/how-it-works', 'How It Works'], ['/observa', 'Observa'], ['/evidence', 'Evidence'],
  ['/trust', 'Trust'], ['/about', 'About'], ['/founding', 'Apply as a Founding Builder']
];
export const footerLinks = [
  ['/docs', 'Docs'], ['/getting-started', 'Getting Started'], ['/evidence', 'Evidence'],
  ['/observa/support', 'Support'], ['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms']
];
export const retiredMedia = [
  ['/assets/video/observa-product-demo.mp4', '/observa'],
  ['/assets/video/observa-private-beta-demo.mp4', '/observa'],
  ['/assets/video/observa-product-demo-poster.jpg', '/og-governance.png'],
  ['/assets/video/observa-private-beta-demo-poster.jpg', '/og-governance.png'],
  ['/thumbnail.jpg', '/thumbnail.png']
];
export const fileForRoute = (route) => route === '/' ? 'index.html' : `${route.slice(1)}.html`;
