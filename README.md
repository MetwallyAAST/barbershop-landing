# Fade & Blade — Barbershop Landing Page

A fully responsive, single-page marketing site for a premium barbershop, plus a
secure, schema-driven **admin panel** that can edit every element on the page.

Built with plain HTML, CSS and vanilla JavaScript on the front end, and a small
Node.js/Express backend that serves the site and a protected content API. No
build step, no front-end framework.

## Features

**Public site**
- Sticky navigation with an animated mobile drawer
- Full-viewport hero with rating and call-to-action
- Scroll-reveal animations and animated statistics counters
- Six service cards, three-barber team section
- Masonry-style image gallery
- Three-tier pricing with a highlighted plan
- Auto-rotating, swipeable testimonials slider
- Booking form with inline validation, loading and success states
- FAQ accordion, contact details with an embedded map, back-to-top button

**Admin panel** (`/admin/`)
- Secure login (bcrypt-hashed password, server-side sessions)
- Edits **every** text, image, list and theme colour on the page
- Schema-driven UI — add, duplicate, reorder and delete list items
- Image upload (or paste an external URL)
- Live theme colour pickers that restyle the whole site
- Keyboard shortcut `Ctrl/Cmd + S` to save

## Quick start

```bash
# Install dependencies
npm install

# Configure the server
cp .env.example .env

# Start the server
npm start
```

Then open:

- Site: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin/`

On first run, if `ADMIN_PASSWORD` is not set in `.env`, a random admin password
is generated and printed once to the console (and stored bcrypt-hashed in
`server/data/auth.json`).

## Configuration

All configuration lives in `.env` (git-ignored). See `.env.example`.

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Port to listen on (the preview exposes this port) |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | Set to `production` to mark cookies `Secure` |
| `ADMIN_USERNAME` | `admin` | Admin login name |
| `ADMIN_PASSWORD` | _(generated)_ | Admin password; sets/overrides the stored hash |
| `SESSION_SECRET` | _(generated)_ | Session signing secret; set explicitly in production |

## Project structure

```
.
├── index.html            # Landing page markup with data-* content bindings
├── styles.css            # Design system, layout and responsive rules
├── content.js            # Renders content from the API into the page
├── script.js             # Menu, scroll reveal, counters, slider, forms
├── admin/
│   ├── index.html        # Admin shell (login + editor)
│   ├── admin.css         # Admin styling
│   ├── admin.js          # Admin application logic
│   └── schema.js         # Describes every editable field
├── server/
│   ├── server.js         # Express app: static hosting, auth, content API
│   └── data/
│       ├── content.json  # The site content (edited by the admin panel)
│       ├── auth.json     # Generated admin credentials (git-ignored)
│       └── uploads/      # Uploaded images (git-ignored)
├── package.json
└── .env.example
```

## How content works

The landing page is content-driven. Elements carry `data-field` / `data-list`
attributes, and `content.js` fetches `/api/content` and hydrates the DOM. If the
API is unavailable the static markup in `index.html` remains as a fallback.

`admin/schema.js` mirrors the shape of `server/data/content.json` and tells the
admin panel how to render an editor for each field.

## API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/content` | — | Read site content |
| `PUT` | `/api/content` | Yes + CSRF | Replace site content |
| `POST` | `/api/upload` | Yes + CSRF | Upload an image (max 6 MB) |
| `GET` | `/api/auth/me` | — | Session state + CSRF token |
| `POST` | `/api/auth/login` | CSRF | Sign in |
| `POST` | `/api/auth/logout` | CSRF | Sign out |

## Security

- Passwords hashed with **bcrypt** (cost 12); install-time override supported
- Server-side sessions via `express-session` (`httpOnly`, `sameSite=lax`,
  `Secure` in production, 4-hour rolling expiry)
- **CSRF** synchronizer tokens on all state-changing requests
- **Rate limiting** on login (10 / 15 min) and the API
- **Helmet** with a strict Content-Security-Policy and no sniffing/framing
- Session **regeneration** on login to prevent fixation
- Uploads restricted by MIME type and size, served with `nosniff`
- Backend source, `data/`, `node_modules/`, `.git/`, dotfiles and `package.json`
  are **not** reachable over HTTP; unknown API routes return JSON 404

> Deploy behind HTTPS and set `NODE_ENV=production` so session cookies are only
> sent over TLS. Set `SESSION_SECRET` to a strong random value.

## Accessibility & performance

- Semantic landmarks, skip link, ARIA labels on icon-only controls
- Visible keyboard focus states; touch targets of at least 44px
- `prefers-reduced-motion` fully respected
- Tested at 375px, 600px, 900px, 1024px and 1440px

## Customization

- **Brand colours & fonts:** edit the tokens in `:root` in `styles.css`, or use
  the admin panel's theme colour pickers.
- **Copy & images:** everything is editable from the admin panel.
- **New editable fields:** add them to `server/data/content.json`, bind them in
  `index.html` with `data-field`, and describe them in `admin/schema.js`.

## License

Released for demonstration purposes. Update the contents for production use.
