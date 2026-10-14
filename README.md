# Fade & Blade — Barbershop Landing Page

A fully responsive, single-page marketing site for a premium barbershop. Built with
plain HTML, CSS and vanilla JavaScript — no build step, no dependencies.

**Live sections:** hero, services, brand story, barbers, gallery, pricing, testimonials,
booking form, contact + map, FAQ and footer.

## Preview

Open `index.html` directly in a browser, or serve the folder over HTTP:

```bash
# Serve on http://localhost:8000
python3 -m http.server 8000
```

## Project structure

```
.
├── index.html    # Page markup and all sections
├── styles.css    # Design system, layout and responsive rules
├── script.js     # Menu, scroll reveal, counters, slider, forms
└── .gitignore
```

## Features

- Sticky navigation with an animated mobile drawer
- Full-viewport hero with rating and call-to-action
- Scroll-reveal animations and animated statistics counters
- Six service cards with hover effects
- Three-barber team section
- Masonry-style image gallery
- Three-tier pricing with a highlighted plan
- Auto-rotating, swipeable testimonials slider
- Booking form with inline validation, loading and success states
- FAQ accordion
- Contact details with an embedded OpenStreetMap
- Back-to-top button

## Design system

| Token | Value |
|-------|-------|
| Primary | `#0C0A09` (near black) |
| Accent / CTA | `#C9A227` (gold) |
| Background | `#FAF9F7` (warm off-white) |
| Display font | Bebas Neue |
| Body font | DM Sans |

All colors, spacing and radii are defined as CSS custom properties in `:root`
inside `styles.css`.

## Accessibility

- Semantic landmarks and a skip-to-content link
- ARIA labels on icon-only controls and the testimonial slider
- Visible keyboard focus states throughout
- Touch targets of at least 44px
- `prefers-reduced-motion` fully respected

## Responsive breakpoints

Tested at 375px, 600px, 900px, 1024px and 1440px. Layouts reflow from a single
column on mobile to multi-column grids on desktop.

## Customization

- **Brand colors and fonts:** edit the tokens in the `:root` block of `styles.css`.
- **Copy and images:** edit the markup in `index.html` (images are loaded from Unsplash).
- **Business details:** update the address, phone, hours and prices in `index.html`.

## Browser support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). Uses
`IntersectionObserver`, CSS custom properties and `backdrop-filter`.

## License

Released for demonstration purposes. Update the contents for production use.
