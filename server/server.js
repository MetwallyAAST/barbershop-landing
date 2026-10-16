"use strict";

/*
 * Fade & Blade — application server.
 * Serves the public landing page, the admin panel and a protected content API.
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const multer = require("multer");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const AUTH_FILE = path.join(DATA_DIR, "auth.json");
const SECRET_FILE = path.join(DATA_DIR, ".session-secret");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const IS_PROD = process.env.NODE_ENV === "production";

/* ---------------------------------------------------------------- storage */

function ensureDirs() {
  for (const dir of [DATA_DIR, UPLOAD_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    return fallback;
  }
}

function writeJsonAtomic(file, value) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, file);
}

function readContent() {
  const content = readJson(CONTENT_FILE, null);
  if (!content || typeof content !== "object") {
    throw new Error("content.json is missing or invalid");
  }
  return content;
}

function writeContent(content) {
  writeJsonAtomic(CONTENT_FILE, content);
}

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try {
    const existing = fs.readFileSync(SECRET_FILE, "utf8").trim();
    if (existing) return existing;
  } catch (err) {
    /* generate below */
  }
  const secret = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
  return secret;
}

/* ------------------------------------------------------------------- auth */

function initAuth() {
  const username = (process.env.ADMIN_USERNAME || "admin").trim();

  if (process.env.ADMIN_PASSWORD) {
    const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
    writeJsonAtomic(AUTH_FILE, { username, passwordHash });
    return { username };
  }

  const existing = readJson(AUTH_FILE, null);
  if (existing && existing.username && existing.passwordHash) {
    return { username: existing.username };
  }

  const generated = crypto.randomBytes(12).toString("base64url");
  const passwordHash = bcrypt.hashSync(generated, 12);
  writeJsonAtomic(AUTH_FILE, { username, passwordHash });
  // eslint-disable-next-line no-console
  console.log(
    "\n  ===============================================================\n" +
      "   Admin credentials generated (shown once)\n" +
      `   username: ${username}\n` +
      `   password: ${generated}\n` +
      "   Set ADMIN_USERNAME / ADMIN_PASSWORD to override.\n" +
      "  ===============================================================\n"
  );
  return { username };
}

/* -------------------------------------------------------------- express app */

ensureDirs();
const authRecord = initAuth();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

/* security headers */
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://images.unsplash.com",
          "https://*.unsplash.com",
        ],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", "https://www.openstreetmap.org"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: IS_PROD ? [] : null,
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

/* sessions */
app.use(
  session({
    name: "fb.sid",
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
    },
  })
);

/* CSRF token (synchronizer pattern) */
function ensureCsrf(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(32).toString("hex");
  return req.session.csrf;
}

function requireCsrf(req, res, next) {
  const sent = req.get("x-csrf-token") || (req.body && req.body._csrf);
  if (!sent || !req.session.csrf || sent.length !== req.session.csrf.length) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  const a = Buffer.from(sent);
  const b = Buffer.from(req.session.csrf);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next();
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: "Authentication required" });
}

/* rate limiting */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

/* ------------------------------------------------------------ auth routes */

app.get("/api/auth/me", (req, res) => {
  res.set("Cache-Control", "no-store");
  const csrf = ensureCsrf(req);
  res.json({
    authenticated: Boolean(req.session.user),
    username: req.session.user ? req.session.user.username : null,
    csrfToken: csrf,
  });
});

app.post("/api/auth/login", loginLimiter, requireCsrf, (req, res) => {
  const username = String((req.body && req.body.username) || "").trim();
  const password = String((req.body && req.body.password) || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const usernameOk = username.toLowerCase() === authRecord.username.toLowerCase();
  const current = readJson(AUTH_FILE, null);
  const hash = current && current.passwordHash ? current.passwordHash : "";
  const passwordOk = hash ? bcrypt.compareSync(password, hash) : false;

  if (!usernameOk || !passwordOk) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // prevent session fixation
  const csrf = req.session.csrf;
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Session error" });
    req.session.user = { username: authRecord.username, at: Date.now() };
    req.session.csrf = csrf || crypto.randomBytes(32).toString("hex");
    res.json({ authenticated: true, username: authRecord.username, csrfToken: req.session.csrf });
  });
});

app.post("/api/auth/logout", requireCsrf, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("fb.sid");
    res.json({ authenticated: false });
  });
});

/* --------------------------------------------------------- content routes */

app.get("/api/content", apiLimiter, (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    res.json(readContent());
  } catch (err) {
    res.status(500).json({ error: "Unable to read content" });
  }
});

app.put("/api/content", apiLimiter, requireAuth, requireCsrf, (req, res) => {
  const content = req.body;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return res.status(400).json({ error: "Invalid content payload" });
  }
  if (JSON.stringify(content).length > 900000) {
    return res.status(413).json({ error: "Content too large" });
  }
  try {
    writeContent(content);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Unable to save content" });
  }
});

/* ---------------------------------------------------------- upload routes */

const MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = MIME_EXT[file.mimetype] || ".bin";
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (MIME_EXT[file.mimetype]) return cb(null, true);
    cb(new Error("Unsupported image type"));
  },
});

app.post("/api/upload", apiLimiter, requireAuth, requireCsrf, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Image exceeds 6MB" : err.message;
      return res.status(400).json({ error: msg });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

/* unknown API routes must not fall through to the HTML fallback */
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

/* --------------------------------------------------------------- static */

/* never expose backend/source files through the static layer */
const BLOCKED = [
  /^\/server(\/|$)/i,
  /^\/data(\/|$)/i,
  /^\/node_modules(\/|$)/i,
  /^\/\.git(\/|$)/i,
  /^\/\./,
  /^\/package(-lock)?\.json$/i,
  /^\/README\.md$/i,
];

app.use((req, res, next) => {
  if (BLOCKED.some((re) => re.test(req.path))) return res.status(404).end();
  next();
});

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "1h",
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
  })
);

app.use(express.static(ROOT, { extensions: ["html"], maxAge: 0 }));

app.use((req, res) => res.status(404).sendFile(path.join(ROOT, "index.html")));

/* ---------------------------------------------------------------- startup */

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Fade & Blade server running at http://${HOST}:${PORT}`);
  console.log(`Admin panel: http://${HOST}:${PORT}/admin/`);
});
