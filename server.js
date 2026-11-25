const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.PORT ? "0.0.0.0" : "127.0.0.1";
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, "users_db.json");
const KEYS_PATH = path.join(ROOT, "api_keys.json");
const DAILY_FREE_CREDITS = 5;

function loadApiKeys() {
  let fileKeys = {};
  try {
    if (fs.existsSync(KEYS_PATH)) {
      fileKeys = JSON.parse(fs.readFileSync(KEYS_PATH, "utf8")) || {};
    }
  } catch {
    fileKeys = {};
  }
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || fileKeys.geminiApiKey || "",
    huggingfaceToken: process.env.HUGGINGFACE_TOKEN || fileKeys.huggingfaceToken || "",
    groqApiKey: process.env.GROQ_API_KEY || fileKeys.groqApiKey || "",
    openaiApiKey: process.env.OPENAI_API_KEY || fileKeys.openaiApiKey || "",
    googleClientId: process.env.GOOGLE_CLIENT_ID || fileKeys.googleClientId || "191735130109-g1nrl8ti70gpj7k34ttka08t8ftoo39k.apps.googleusercontent.com",
    adsenseClientId: process.env.ADSENSE_CLIENT_ID || fileKeys.adsenseClientId || "",
    merchantUpiId: process.env.MERCHANT_UPI_ID || fileKeys.merchantUpiId || "yashlimbasiya1234-2@okaxis",
    merchantName: process.env.MERCHANT_NAME || fileKeys.merchantName || "AetherAI Studio",
    bankAccountInfo: process.env.BANK_ACCOUNT_INFO || fileKeys.bankAccountInfo || "",
  };
}

function saveApiKeys(partial) {
  const curr = loadApiKeys();
  const next = {
    geminiApiKey: typeof partial.geminiApiKey === "string" ? partial.geminiApiKey.trim() : curr.geminiApiKey,
    huggingfaceToken: typeof partial.huggingfaceToken === "string" ? partial.huggingfaceToken.trim() : curr.huggingfaceToken,
    groqApiKey: typeof partial.groqApiKey === "string" ? partial.groqApiKey.trim() : curr.groqApiKey,
    openaiApiKey: typeof partial.openaiApiKey === "string" ? partial.openaiApiKey.trim() : curr.openaiApiKey,
    googleClientId: typeof partial.googleClientId === "string" ? partial.googleClientId.trim() : curr.googleClientId,
    adsenseClientId: typeof partial.adsenseClientId === "string" ? partial.adsenseClientId.trim() : curr.adsenseClientId,
    merchantUpiId: typeof partial.merchantUpiId === "string" ? partial.merchantUpiId.trim() : curr.merchantUpiId,
    merchantName: typeof partial.merchantName === "string" ? partial.merchantName.trim() : curr.merchantName,
    bankAccountInfo: typeof partial.bankAccountInfo === "string" ? partial.bankAccountInfo.trim() : curr.bankAccountInfo,
  };
  fs.writeFileSync(KEYS_PATH, JSON.stringify(next, null, 2));
  return next;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch {
    // recreate on error
  }
  const initial = {
    tokenSecret: crypto.randomBytes(32).toString("hex"),
    users: [],
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  return initial;
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, keyHex] = String(stored || "").split(":");
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, "hex");
  const derived = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(keyBuf, derived);
}

function signToken(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function sanitizeUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan,
    dailyCredits: u.plan === "free" ? u.dailyCredits : "unlimited",
    upgradedAt: u.upgradedAt || null,
  };
}

function refreshDailyCreditsIfNeeded(user) {
  const today = todayKey();
  if (user.plan === "free" && user.lastResetDate !== today) {
    user.dailyCredits = DAILY_FREE_CREDITS;
    user.lastResetDate = today;
    return true;
  }
  return false;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function getAuthUser(req, db) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const payload = verifyToken(token, db.tokenSecret);
  if (!payload) return null;
  return db.users.find((u) => u.id === payload.userId) || null;
}

const server = http.createServer(async (req, res) => {
  const cleanUrl = (req.url || "/").split("?")[0];

  // API Routes
  if (cleanUrl.startsWith("/api/")) {
    const db = loadDB();

    try {
      if (cleanUrl === "/api/auth/register" && req.method === "POST") {
        const { name, email, password } = await readJsonBody(req);
        const cleanName = String(name || "").trim();
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanPass = String(password || "");

        if (!cleanName || !cleanEmail.includes("@") || cleanPass.length < 4) {
          return sendJson(res, 400, { error: "Valid name, email, and password (4+ chars) required." });
        }
        if (db.users.some((u) => u.email === cleanEmail)) {
          return sendJson(res, 409, { error: "Account already exists with this email. Please login." });
        }

        const newUser = {
          id: crypto.randomUUID(),
          name: cleanName,
          email: cleanEmail,
          passwordHash: hashPassword(cleanPass),
          plan: "free",
          dailyCredits: DAILY_FREE_CREDITS,
          lastResetDate: todayKey(),
          createdAt: new Date().toISOString(),
        };
        db.users.push(newUser);
        saveDB(db);

        const token = signToken(
          { userId: newUser.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 },
          db.tokenSecret
        );
        return sendJson(res, 201, { token, user: sanitizeUser(newUser) });
      }

      if (cleanUrl === "/api/auth/login" && req.method === "POST") {
        const { email, password } = await readJsonBody(req);
        const cleanEmail = String(email || "").trim().toLowerCase();
        const user = db.users.find((u) => u.email === cleanEmail);

        if (!user || !verifyPassword(String(password || ""), user.passwordHash)) {
          return sendJson(res, 401, { error: "Invalid email or password." });
        }

        if (refreshDailyCreditsIfNeeded(user)) saveDB(db);
        const token = signToken(
          { userId: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 },
          db.tokenSecret
        );
        return sendJson(res, 200, { token, user: sanitizeUser(user) });
      }

      if (cleanUrl === "/api/auth/google" && req.method === "POST") {
        const { credential } = await readJsonBody(req);
        if (!credential) {
          return sendJson(res, 400, { error: "Missing Google credential token." });
        }
        const serverKeys = loadApiKeys();
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(String(credential))}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const info = await verifyRes.json();
        if (!verifyRes.ok || info.email_verified !== "true" || !info.email) {
          return sendJson(res, 401, { error: "Invalid Google Sign-In token." });
        }
        if (serverKeys.googleClientId && info.aud !== serverKeys.googleClientId) {
          return sendJson(res, 401, { error: "Google Client ID mismatch." });
        }

        const cleanEmail = String(info.email).trim().toLowerCase();
        let user = db.users.find((u) => u.email === cleanEmail);
        if (!user) {
          user = {
            id: crypto.randomUUID(),
            name: String(info.name || cleanEmail.split("@")[0]).trim(),
            email: cleanEmail,
            passwordHash: hashPassword(crypto.randomBytes(24).toString("hex")),
            authProvider: "google",
            plan: "free",
            dailyCredits: DAILY_FREE_CREDITS,
            lastResetDate: todayKey(),
            createdAt: new Date().toISOString(),
          };
          db.users.push(user);
          saveDB(db);
        } else if (refreshDailyCreditsIfNeeded(user)) {
          saveDB(db);
        }

        const token = signToken(
          { userId: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 },
          db.tokenSecret
        );
        return sendJson(res, 200, { token, user: sanitizeUser(user) });
      }

      if (cleanUrl === "/api/auth/me" && req.method === "GET") {
        const user = getAuthUser(req, db);
        if (!user) return sendJson(res, 401, { error: "Not authenticated" });
        if (refreshDailyCreditsIfNeeded(user)) saveDB(db);
        return sendJson(res, 200, { user: sanitizeUser(user) });
      }

      if (cleanUrl === "/api/auth/forgot-password" && req.method === "POST") {
        const { email } = await readJsonBody(req);
        const cleanEmail = String(email || "").trim().toLowerCase();
        const user = db.users.find((u) => u.email === cleanEmail);
        if (!user) {
          return sendJson(res, 404, { error: "No account found with this email." });
        }
        const code = String(Math.floor(100000 + Math.random() * 900000));
        user.resetCode = code;
        user.resetExpiresAt = Date.now() + 10 * 60 * 1000;
        saveDB(db);
        return sendJson(res, 200, {
          ok: true,
          message: "Reset code generated! Enter the 6-digit code below.",
          demoCode: code,
        });
      }

      if (cleanUrl === "/api/auth/reset-password" && req.method === "POST") {
        const { email, code, newPassword } = await readJsonBody(req);
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanCode = String(code || "").trim();
        const cleanPass = String(newPassword || "");

        const user = db.users.find((u) => u.email === cleanEmail);
        if (!user || !user.resetCode || user.resetCode !== cleanCode) {
          return sendJson(res, 400, { error: "Invalid reset code or email." });
        }
        if (Date.now() > Number(user.resetExpiresAt || 0)) {
          return sendJson(res, 400, { error: "Reset code expired. Request a new code." });
        }
        if (cleanPass.length < 4) {
          return sendJson(res, 400, { error: "New password must be at least 4 characters." });
        }

        user.passwordHash = hashPassword(cleanPass);
        delete user.resetCode;
        delete user.resetExpiresAt;
        saveDB(db);
        return sendJson(res, 200, { ok: true, message: "Password updated! You can login now." });
      }

      if (cleanUrl === "/api/credits/use" && req.method === "POST") {
        const user = getAuthUser(req, db);
        if (!user) return sendJson(res, 401, { error: "Login required", code: "AUTH_REQUIRED" });
        refreshDailyCreditsIfNeeded(user);

        if (user.plan === "free") {
          if (user.dailyCredits <= 0) {
            saveDB(db);
            return sendJson(res, 402, {
              error: "Daily free limit reached! Upgrade to Pro for unlimited usage.",
              code: "UPGRADE_REQUIRED",
              user: sanitizeUser(user),
            });
          }
          user.dailyCredits -= 1;
          saveDB(db);
        }
        return sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
      }

      if (cleanUrl === "/api/billing/upgrade" && req.method === "POST") {
        const user = getAuthUser(req, db);
        if (!user) {
          return sendJson(res, 401, { error: "Please login first before upgrading.", code: "AUTH_REQUIRED" });
        }
        const { planName, amount, paymentId, paymentMethod } = await readJsonBody(req);
        const normalized = String(planName || "").toLowerCase().includes("lifetime") ? "lifetime" : "pro";

        user.plan = normalized;
        user.upgradedAt = new Date().toISOString();
        user.lastPayment = {
          planName: planName || "Pro Creator",
          amount: Number(amount || 199),
          paymentMethod: paymentMethod || "upi",
          paymentId: paymentId || `upi_${crypto.randomBytes(6).toString("hex")}`,
        };
        saveDB(db);
        return sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
      }

      if (cleanUrl === "/api/config/public" && req.method === "GET") {
        const keys = loadApiKeys();
        return sendJson(res, 200, {
          googleClientId: keys.googleClientId,
          adsenseClientId: keys.adsenseClientId,
          paymentConfig: {
            upiId: keys.merchantUpiId,
            merchantName: keys.merchantName,
            bankInfo: keys.bankAccountInfo,
          },
          configured: {
            gemini: Boolean(keys.geminiApiKey),
            huggingface: Boolean(keys.huggingfaceToken),
            groq: Boolean(keys.groqApiKey),
            openai: Boolean(keys.openaiApiKey),
            googleLogin: Boolean(keys.googleClientId),
            adsense: Boolean(keys.adsenseClientId),
          },
        });
      }

      if (cleanUrl === "/api/admin/save-keys" && req.method === "POST") {
        const remote = req.socket?.remoteAddress || "";
        const isLocal = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
        if (!isLocal) {
          return sendJson(res, 403, { error: "Key updates via UI are allowed only on localhost." });
        }
        const body = await readJsonBody(req);
        const saved = saveApiKeys(body);
        return sendJson(res, 200, {
          ok: true,
          configured: {
            gemini: Boolean(saved.geminiApiKey),
            huggingface: Boolean(saved.huggingfaceToken),
            groq: Boolean(saved.groqApiKey),
            openai: Boolean(saved.openaiApiKey),
            googleLogin: Boolean(saved.googleClientId),
            adsense: Boolean(saved.adsenseClientId),
          },
        });
      }

      if (cleanUrl === "/api/chat" && req.method === "POST") {
        const { prompt, history, provider, apiKey } = await readJsonBody(req);
        const userPrompt = String(prompt || "").trim();
        if (!userPrompt) return sendJson(res, 400, { error: "Prompt is required." });

        const serverKeys = loadApiKeys();
        const chosenProvider = provider || "cloud";
        const systemPrompt = "You are AetherAI, a friendly helpful AI assistant. Reply clearly in the same language the user uses (Gujarati, Hinglish, or English).";

        // 1. Google Gemini
        if (chosenProvider === "gemini") {
          const gKey = (apiKey || serverKeys.geminiApiKey || "").trim();
          if (!gKey) return sendJson(res, 400, { error: "Gemini API key not configured." });
          const contents = [
            ...(Array.isArray(history) ? history.slice(-6) : []),
            { role: "user", parts: [{ text: userPrompt }] },
          ];
          const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(gKey)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
              }),
              signal: AbortSignal.timeout(25000),
            }
          );
          const gData = await gRes.json();
          const reply = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!gRes.ok || !reply) return sendJson(res, 502, { error: gData?.error?.message || "Gemini error" });
          return sendJson(res, 200, { reply, provider: "Google Gemini" });
        }

        // 2. Groq Llama 3.3 (Free Tier Ultra-Fast)
        if (chosenProvider === "groq") {
          const qKey = (apiKey || serverKeys.groqApiKey || "").trim();
          if (!qKey) return sendJson(res, 400, { error: "Groq API key not configured." });
          const messages = [
            { role: "system", content: systemPrompt },
            ...(Array.isArray(history)
              ? history.slice(-6).map((m) => ({
                  role: m.role === "model" ? "assistant" : "user",
                  content: m.parts?.[0]?.text || "",
                }))
              : []),
            { role: "user", content: userPrompt },
          ];
          const qRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${qKey}`,
            },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages }),
            signal: AbortSignal.timeout(25000),
          });
          const qData = await qRes.json();
          const reply = qData?.choices?.[0]?.message?.content;
          if (!qRes.ok || !reply) return sendJson(res, 502, { error: qData?.error?.message || "Groq error" });
          return sendJson(res, 200, { reply, provider: "Groq Llama 3.3" });
        }

        // 3. OpenAI ChatGPT
        if (chosenProvider === "openai") {
          const oKey = (apiKey || serverKeys.openaiApiKey || "").trim();
          if (!oKey) return sendJson(res, 400, { error: "OpenAI API key not configured." });
          const messages = [
            { role: "system", content: systemPrompt },
            ...(Array.isArray(history)
              ? history.slice(-6).map((m) => ({
                  role: m.role === "model" ? "assistant" : "user",
                  content: m.parts?.[0]?.text || "",
                }))
              : []),
            { role: "user", content: userPrompt },
          ];
          const oRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${oKey}`,
            },
            body: JSON.stringify({ model: "gpt-4o-mini", messages }),
            signal: AbortSignal.timeout(25000),
          });
          const oData = await oRes.json();
          const reply = oData?.choices?.[0]?.message?.content;
          if (!oRes.ok || !reply) return sendJson(res, 502, { error: oData?.error?.message || "OpenAI error" });
          return sendJson(res, 200, { reply, provider: "OpenAI ChatGPT" });
        }

        // 4. Default Free Cloud AI (No Key)
        const pUrl = `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}?system=${encodeURIComponent(systemPrompt)}`;
        const pRes = await fetch(pUrl, { signal: AbortSignal.timeout(15000) });
        if (!pRes.ok) return sendJson(res, 502, { error: "Free Cloud AI unavailable" });
        const reply = (await pRes.text()).trim();
        return sendJson(res, 200, { reply, provider: "Free Cloud AI" });
      }

      if (cleanUrl === "/api/generate-image" && req.method === "POST") {
        const { prompt, style, width, height, provider, apiKey } = await readJsonBody(req);
        const serverKeys = loadApiKeys();
        const rawPrompt = String(prompt || "").trim();
        if (!rawPrompt) return sendJson(res, 400, { error: "Prompt is required." });

        const effectiveKey =
          (apiKey || "").trim() ||
          (provider === "openai"
            ? serverKeys.openaiApiKey
            : provider === "huggingface"
            ? serverKeys.huggingfaceToken
            : provider === "gemini"
            ? serverKeys.geminiApiKey
            : "");

        const w = Math.min(1440, Math.max(512, Number(width || 1024)));
        const h = Math.min(1440, Math.max(512, Number(height || 1024)));

        const styleHints = {
          photoreal: "photorealistic DSLR photography, natural skin/surface textures, golden hour cinematic lighting, ultra sharp 8k",
          cyberpunk: "cinematic cyberpunk scene, realistic wet neon reflections, volumetric fog, ultra detailed 8k",
          pixar: "3D animated feature film style, expressive lighting, smooth subsurface scattering, rich Pixar-like detail",
          anime: "high-budget modern anime illustration, crisp linework, dramatic lighting, Makoto Shinkai atmosphere",
          aurora: "epic cosmic fantasy art, luminous aurora lighting, ultra sharp 8k composition",
          minimal: "clean modern vector emblem logo on solid dark background, sharp geometry, centered, no messy text",
        };
        const styleSuffix = styleHints[style] || styleHints.photoreal;

        // Helper: rewrite Gujarati/Hinglish/short ideas into detailed English visual prompt like ChatGPT does
        async function buildDetailedPrompt(input) {
          try {
            const sys = "Translate any Gujarati/Hindi/Hinglish into English and expand the user's idea into ONE rich, vivid, detailed image generation prompt (max 60 words). Output ONLY the prompt, nothing else.";
            const url = `https://text.pollinations.ai/${encodeURIComponent(input + " (" + styleSuffix + ")")}?system=${encodeURIComponent(sys)}`;
            const resTxt = await fetch(url, { signal: AbortSignal.timeout(7000) });
            if (resTxt.ok) {
              const txt = (await resTxt.text()).trim().replace(/^["']|["']$/g, "");
              if (txt && txt.length > 15 && txt.length < 500) return txt;
            }
          } catch {
            // fallback below
          }
          return `${input}, ${styleSuffix}, clean composition, masterpiece, high resolution`;
        }

        const detailedPrompt = await buildDetailedPrompt(rawPrompt);

        // 1. OpenAI DALL-E 3 (Exact ChatGPT Quality when OpenAI Key provided)
        if (provider === "openai" && effectiveKey) {
          const size = w > h ? "1792x1024" : h > w ? "1024x1792" : "1024x1024";
          const oaRes = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${effectiveKey}`,
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: detailedPrompt,
              n: 1,
              size,
              response_format: "b64_json",
            }),
            signal: AbortSignal.timeout(45000),
          });
          const oaData = await oaRes.json();
          if (!oaRes.ok) {
            return sendJson(res, 502, { error: oaData?.error?.message || "OpenAI image generation failed." });
          }
          const b64 = oaData?.data?.[0]?.b64_json;
          return sendJson(res, 200, {
            imageUrl: `data:image/png;base64,${b64}`,
            revisedPrompt: oaData?.data?.[0]?.revised_prompt || detailedPrompt,
            provider: "OpenAI DALL-E 3",
          });
        }

        // 2. Hugging Face FLUX.1-schnell (Free HF Token)
        if (provider === "huggingface" && effectiveKey) {
          const hfRes = await fetch(
            "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${effectiveKey}`,
              },
              body: JSON.stringify({ inputs: detailedPrompt }),
              signal: AbortSignal.timeout(45000),
            }
          );
          if (!hfRes.ok) {
            const errTxt = await hfRes.text();
            return sendJson(res, 502, { error: `Hugging Face error: ${errTxt.slice(0, 140)}` });
          }
          const buf = Buffer.from(await hfRes.arrayBuffer());
          const ctype = hfRes.headers.get("content-type") || "image/jpeg";
          return sendJson(res, 200, {
            imageUrl: `data:${ctype};base64,${buf.toString("base64")}`,
            revisedPrompt: detailedPrompt,
            provider: "FLUX.1-schnell",
          });
        }

        // 3. Google Gemini Imagen 3 (Gemini API Key)
        if (provider === "gemini" && effectiveKey) {
          const ratio = w > h ? "16:9" : h > w ? "9:16" : "1:1";
          const gmRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(effectiveKey)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instances: [{ prompt: detailedPrompt }],
                parameters: { sampleCount: 1, aspectRatio: ratio },
              }),
              signal: AbortSignal.timeout(45000),
            }
          );
          const gmData = await gmRes.json();
          if (!gmRes.ok) {
            return sendJson(res, 502, { error: gmData?.error?.message || "Gemini Imagen generation failed." });
          }
          const b64 = gmData?.predictions?.[0]?.bytesBase64Encoded;
          return sendJson(res, 200, {
            imageUrl: `data:image/png;base64,${b64}`,
            revisedPrompt: detailedPrompt,
            provider: "Google Imagen 3",
          });
        }

        // 4. Default Free Cloud Flux -> Turbo (No API Key Required)
        const seed = Math.floor(Math.random() * 9999999);
        const models = ["flux", "turbo"];
        for (const mdl of models) {
          try {
            const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(detailedPrompt)}?model=${mdl}&width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=true`;
            const imgRes = await fetch(imgUrl, {
              headers: { "User-Agent": "AetherAI-Studio/1.0" },
              signal: AbortSignal.timeout(35000),
            });
            const ctype = imgRes.headers.get("content-type") || "";
            if (imgRes.ok && ctype.startsWith("image/")) {
              const buf = Buffer.from(await imgRes.arrayBuffer());
              if (buf.length > 2048) {
                return sendJson(res, 200, {
                  imageUrl: `data:${ctype};base64,${buf.toString("base64")}`,
                  revisedPrompt: detailedPrompt,
                  provider: `Cloud ${mdl.toUpperCase()}`,
                });
              }
            }
          } catch {
            // try next model
          }
        }

        return sendJson(res, 503, {
          error: "Free Cloud AI image server is busy right now. Try again, paste a free Hugging Face / OpenAI key, or use Instant Canvas Art.",
          revisedPrompt: detailedPrompt,
          offlineFallback: true,
        });
      }

      return sendJson(res, 404, { error: "API route not found" });
    } catch (err) {
      return sendJson(res, 400, { error: err.message || "Bad request" });
    }
  }

  // Static File Serving
  const relPath = cleanUrl === "/" ? "index.html" : cleanUrl.replace(/^\/+/, "");
  const filePath = path.join(ROOT, relPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`AetherAI running at http://${HOST === "0.0.0.0" ? "0.0.0.0" : "localhost"}:${PORT}`);
});
