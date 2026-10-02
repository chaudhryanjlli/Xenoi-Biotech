# Xenoi Biotech Website

Official static website for **Xenoi Biotech Pvt. Ltd.** (Punjab, India), providing research-focused bioinformatics data analysis, next-generation sequencing (NGS) pipeline consulting, and computational biology education/training programmes.

## Local Preview

To preview the website locally without any build tools or dependencies, run:

```bash
python -m http.server 8000
```

Then open your web browser and navigate to:
[http://localhost:8000](http://localhost:8000)

## Folder Structure

```
├── .gitignore             # Git ignore rules for node_modules, logs, OS files, and QA artifacts
├── .nojekyll              # Disables Jekyll processing on GitHub Pages
├── .well-known/           # Security disclosures (security.txt)
├── 404.html               # Custom 404 error page
├── CNAME                  # Custom domain configuration (www.xenoibiotech.com)
├── README.md              # Project documentation and local preview instructions
├── apple-touch-icon.png   # Apple touch icon
├── career-navigator.html  # Career Navigator programme page
├── collaboration.html     # Institutional & college collaboration page
├── favicon-16x16.png      # 16x16 PNG favicon
├── favicon-32x32.png      # 32x32 PNG favicon
├── favicon.ico            # Main favicon
├── fonts/                 # Self-hosted typography files (Inter & Fira Code in .woff2 format)
├── form.js                # AJAX form handling and interactive state management
├── frames/                # Full-resolution canvas animation sequence frames
├── frames_compact/        # Optimized, compact canvas animation sequence frames
├── genomics.html          # Specialized NGS genomics services page
├── icon-192.png           # 192x192 PWA web app icon
├── icon-512.png           # 512x512 PWA web app icon
├── index.html             # Homepage with scroll-driven canvas frame animation
├── internships.html       # Hands-on student internship programmes page
├── llms.txt               # LLM documentation and site index
├── pages.css              # Typography, layout, and component styling for inner pages
├── privacy.html           # Privacy policy
├── quote.html             # Project quote and inquiry form page
├── robots.txt             # Search engine crawling rules and sitemap reference
├── script.js              # Canvas scroll animation engine and frame controller
├── services.html          # Bioinformatics workflows and consulting services page
├── site.webmanifest       # Web app manifest for PWA capabilities
├── sitemap.xml            # XML sitemap with all 11 published URLs
├── style.css              # Core global CSS tokens, typography @font-face, header & footer styles
├── team.html              # Team overview and leadership profile page
├── terms.html             # Terms of use
├── ui.js                  # Global UI interactions (mobile navigation drawer, scroll states)
├── workshops.html         # Bioinformatics workshops and training bootcamps page
└── xenoi-logo.png         # Main Xenoi Biotech brand logo
```

## Form Backend Configuration

The contact and quote request form in [`quote.html`](quote.html) uses **Web3Forms** for form submissions:
- The access key is configured in `quote.html` at:
  ```html
  <input type="hidden" name="access_key" value="e3034bcd-4e40-4c30-948a-4838bff10895">
  ```
- The form submits asynchronously to Web3Forms and displays inline confirmation without page reloads.

