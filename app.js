/* =====================================================
   AetherAI — Animations & Interactive Free AI Studio
   ===================================================== */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------------------------------------------------
     1. Toast Helper & Copy Buttons
  --------------------------------------------------- */
  const toastEl = $("#toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  $$(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetId = btn.dataset.copyTarget;
      const target = document.getElementById(targetId);
      if (!target) return;
      const text = target.innerText.trim();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!");
      } catch {
        showToast("Select and press Ctrl+C to copy");
      }
    });
  });

  /* ---------------------------------------------------
     2. Theme Switcher (Violet / Emerald / Solar)
  --------------------------------------------------- */
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $$(".theme-dot").forEach((d) => {
      d.classList.toggle("active", d.dataset.setTheme === theme);
    });
    localStorage.setItem("aether_theme", theme);
  }

  const savedTheme = localStorage.getItem("aether_theme");
  if (savedTheme) setTheme(savedTheme);

  $$(".theme-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      setTheme(dot.dataset.setTheme);
      showToast(`Theme switched to ${dot.dataset.setTheme}`);
    });
  });

  /* ---------------------------------------------------
     3. Scroll Progress, Navbar & Reveal Observer
  --------------------------------------------------- */
  const scrollProgress = $("#scrollProgress");
  const navbar = $("#navbar");

  window.addEventListener(
    "scroll",
    () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      if (scrollProgress) scrollProgress.style.width = `${pct}%`;
      if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 24);
    },
    { passive: true }
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  $$(".reveal").forEach((el) => revealObserver.observe(el));

  /* Animated Stat Counters */
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.target || 0);
        const suffix = el.dataset.suffix || "";
        const duration = 1100;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = `${Math.round(target * eased)}${suffix}`;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  $$(".counter").forEach((el) => counterObserver.observe(el));

  /* ---------------------------------------------------
     4. Cursor Glow, 3D Tilt Cards & Magnetic Buttons
  --------------------------------------------------- */
  const cursorGlow = $("#cursorGlow");
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };

  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      if (cursorGlow) {
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;
      }
    },
    { passive: true }
  );

  $$(".tilt-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  $$(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.16;
      btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });

  /* ---------------------------------------------------
     5. Background Neural Particle Network Canvas
  --------------------------------------------------- */
  const neuralCanvas = $("#neuralCanvas");
  if (neuralCanvas) {
    const ctx = neuralCanvas.getContext("2d");
    let width = (neuralCanvas.width = window.innerWidth);
    let height = (neuralCanvas.height = window.innerHeight);

    const nodeCount = Math.min(75, Math.floor((width * height) / 21000));
    const nodes = Array.from({ length: Math.max(32, nodeCount) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r: Math.random() * 2 + 1.2,
    }));

    window.addEventListener("resize", () => {
      width = neuralCanvas.width = window.innerWidth;
      height = neuralCanvas.height = window.innerHeight;
    });

    function getThemeRGB() {
      const styles = getComputedStyle(document.documentElement);
      return {
        c1: styles.getPropertyValue("--particle-rgb").trim() || "168, 85, 247",
        c2: styles.getPropertyValue("--particle-rgb-2").trim() || "34, 211, 238",
      };
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);
      const { c1, c2 } = getThemeRGB();

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150 && dist > 1) {
            n.x -= (dx / dist) * 0.45;
            n.y -= (dy / dist) * 0.45;
          }
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c2}, 0.72)`;
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < 135) {
            const alpha = (1 - d / 135) * 0.25;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(${c1}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  }

  /* ---------------------------------------------------
     6. Hero Interactive Typewriter Demo Loop
  --------------------------------------------------- */
  const heroPromptEl = $("#heroPromptText");
  const heroOutputEl = $("#heroOutputText");
  const heroStatusEl = $("#heroStatusLabel");
  const heroModeEl = $("#heroEngineMode");

  const heroDemos = [
    {
      mode: "WRITER",
      status: "Generating viral hook & script...",
      prompt: "Write a 10-second Reel hook for a free AI website",
      output:
        "🚀 Stop paying \$20/month for basic AI!\n\nThis free studio writes scripts, builds code, and renders art right in your browser.\n\nTry it live below — zero sign-up needed.",
    },
    {
      mode: "CODER",
      status: "Architecting clean JavaScript...",
      prompt: "Create a smooth debounce utility in modern JS",
      output:
        "export const debounce = (fn, ms = 250) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n};",
    },
    {
      mode: "ART LAB",
      status: "Enhancing Midjourney & Flux prompt...",
      prompt: "Neon futuristic skyline in rain, cyberpunk",
      output:
        "Ultra-detailed cyberpunk megacity at night, wet asphalt reflections, volumetric neon cyan & violet rim lighting, 35mm anamorphic lens, 8k octane render --ar 16:9",
    },
  ];

  let demoIdx = 0;

  async function typeText(el, text, speed = 22) {
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await new Promise((r) => setTimeout(r, speed));
    }
  }

  async function runHeroLoop() {
    if (!heroPromptEl || !heroOutputEl) return;
    while (true) {
      const demo = heroDemos[demoIdx];
      if (heroModeEl) heroModeEl.textContent = demo.mode;
      if (heroStatusEl) heroStatusEl.textContent = demo.status;
      heroOutputEl.textContent = "";
      await typeText(heroPromptEl, demo.prompt, 32);
      await new Promise((r) => setTimeout(r, 350));
      await typeText(heroOutputEl, demo.output, 16);
      await new Promise((r) => setTimeout(r, 2600));
      demoIdx = (demoIdx + 1) % heroDemos.length;
    }
  }
  runHeroLoop();

  /* ---------------------------------------------------
     7. Studio Tab Switching & Bento Jump
  --------------------------------------------------- */
  function activateStudioTab(tabName) {
    $$(".studio-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tabName);
    });
    $$(".studio-panel").forEach((p) => {
      p.classList.toggle("active", p.id === `panel-${tabName}`);
    });
  }

  $$(".studio-tab").forEach((tab) => {
    tab.addEventListener("click", () => activateStudioTab(tab.dataset.tab));
  });

  $$("[data-jump-tab]").forEach((card) => {
    card.addEventListener("click", () => {
      const targetTab = card.dataset.jumpTab;
      activateStudioTab(targetTab);
      $("#playground")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------------------------------------------------
     8. Tool 1: AI Content & Script Writer
  --------------------------------------------------- */
  const writerTopic = $("#writerTopic");
  const writerFormat = $("#writerFormat");
  const writerTone = $("#writerTone");
  const writerOutput = $("#writerOutput");
  let streamToken = 0;

  async function streamInto(el, text, speed = 10) {
    const token = ++streamToken;
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      if (token !== streamToken) return;
      el.textContent += text[i];
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, speed));
    }
  }

  $$("[data-writer-preset]").forEach((chip) => {
    chip.addEventListener("click", () => {
      writerTopic.value = chip.dataset.writerPreset;
      writerTopic.focus();
    });
  });

  $("#runWriterBtn")?.addEventListener("click", () => {
    const topic = (writerTopic.value || "").trim() || "A free animated AI tool website for creators";
    const fmt = writerFormat.value;
    const tone = writerTone.value;

    const toneTag = {
      viral: "High-Energy Viral Hook",
      pro: "Executive & Clear",
      friendly: "Warm & Conversational",
      futuristic: "Visionary & Sci-Fi",
    }[tone];

    let result = "";
    if (fmt === "reel") {
      result = `[${toneTag} — 30s Reel / Shorts Script]\n\n🎬 HOOK (0–3s):\n"Wait—stop scrolling if you want to create 10x faster using ${topic}!"\n\n⚡ BODY (4–20s):\n1. Most people waste hours starting from a blank page.\n2. With ${topic}, you go from raw idea to polished result in seconds.\n3. Zero paywalls, smooth workflow, and instant export.\n\n🔥 CTA (21–30s):\n"Save this reel, share it with a friend, and drop 'AI' in the comments!"`;
    } else if (fmt === "blog") {
      result = `[${toneTag} — Blog Intro & Outline]\n\n# Why ${topic} Is Changing Everything Right Now\n\nIn a world moving at digital light speed, creators and builders need tools that feel effortless. ${topic} bridges the gap between imagination and execution.\n\n## Key Sections:\n• 1. The Old Bottleneck vs. Instant Automation\n• 2. Step-by-Step Workflow You Can Copy Today\n• 3. Real Results & Speed Benchmarks\n• 4. Final Action Checklist`;
    } else if (fmt === "email") {
      result = `[${toneTag} — High-Converting Email]\n\nSubject: Quick idea about ${topic} ⚡\n\nHi there,\n\nEver noticed how much time gets lost switching between clunky tools? We built a faster way around ${topic}.\n\n✅ Instant setup (under 10 seconds)\n✅ Clean, distraction-free experience\n✅ 100% free to test today\n\nTry it out and let me know what you think.\n\nBest,\nAetherAI Studio`;
    } else {
      result = `[${toneTag} — Viral Ad Copy]\n\n✨ Headline: Meet the Future of ${topic}\n\nTired of slow tools and pricey subscriptions? Unlock ${topic} in one click — smooth animations, instant results, and \$0 cost.\n\n👉 Click "Launch Free" and experience the upgrade now.`;
    }

    streamInto(writerOutput, result, 12);
  });

  /* ---------------------------------------------------
     9. Tool 2: Code & Regex Architect
  --------------------------------------------------- */
  const codeTask = $("#codeTask");
  const codeCustomNote = $("#codeCustomNote");
  const codeOutput = $("#codeOutput");

  $("#runCodeBtn")?.addEventListener("click", () => {
    const task = codeTask.value;
    const custom = (codeCustomNote.value || "").trim().replace(/[^a-zA-Z0-9_]/g, "") || "AetherItem";

    const snippets = {
      "glass-card": `<!-- ${custom} Animated Glass Card -->
<div class="${custom.toLowerCase()}-card">
  <h3>${custom}</h3>
  <p>Smooth GPU-accelerated glassmorphism.</p>
</div>

<style>
.${custom.toLowerCase()}-card {
  padding: 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(16px);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.${custom.toLowerCase()}-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(6, 182, 212, 0.25);
}
</style>`,
      "fetch-retry": `// ${custom}: Resilient Fetch with Exponential Backoff
export async function fetch${custom}(url, retries = 3, delay = 400) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delay * attempt));
    }
  }
}`,
      "python-scraper": `# ${custom}: Async API Client using httpx
import asyncio
import httpx

async def fetch_${custom.toLowerCase()}(endpoint: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(endpoint)
        response.raise_for_status()
        return response.json()

if __name__ == "__main__":
    data = asyncio.run(fetch_${custom.toLowerCase()}("https://api.github.com"))
    print(data)`,
      "regex-email": `// ${custom}: Email & Indian/Intl Phone Validators
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^\\+?[1-9]\\d{9,14}$/;

export function validate${custom}(email, phone) {
  return {
    emailValid: EMAIL_REGEX.test(email.trim()),
    phoneValid: PHONE_REGEX.test(phone.replace(/\\s+/g, "")),
  };
}`,
      "sql-analytics": `-- ${custom}: Top 10 Customers by Total Spend
SELECT
  user_id,
  COUNT(*) AS total_orders,
  ROUND(SUM(amount), 2) AS lifetime_revenue,
  MAX(created_at) AS last_order_at
FROM ${custom.toLowerCase()}
WHERE status = 'completed'
GROUP BY user_id
ORDER BY lifetime_revenue DESC
LIMIT 10;`,
    };

    const code = snippets[task] || snippets["glass-card"];
    streamInto(codeOutput, code, 8);
  });

  /* ---------------------------------------------------
     10. Tool 3: Real AI Image Generator + Procedural Canvas
  --------------------------------------------------- */
  const artIdea = $("#artIdea");
  const artStyle = $("#artStyle");
  const artSize = $("#artSize");
  const artPromptOutput = $("#artPromptOutput");
  const artCanvas = $("#artCanvas");
  const aiGeneratedImg = $("#aiGeneratedImg");
  const imageLoader = $("#imageLoader");
  const imageStatusBadge = $("#imageStatusBadge");
  const imageStageTitle = $("#imageStageTitle");

  let lastGeneratedImageUrl = "";

  $$("[data-art-preset]").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (artIdea) {
        artIdea.value = chip.dataset.artPreset;
        artIdea.focus();
      }
    });
  });

  function renderProceduralArt(seedText, style) {
    if (!artCanvas) return;
    const ctx = artCanvas.getContext("2d");
    const w = artCanvas.width;
    const h = artCanvas.height;

    let hash = 2166136261;
    for (let i = 0; i < seedText.length; i++) {
      hash ^= seedText.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const rand = () => {
      hash += 0x6d2b79f5;
      let t = Math.imul(hash ^ (hash >>> 15), 1 | hash);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const palettes = {
      photoreal: ["#090d16", "#38bdf8", "#818cf8", "#ec4899", "#f8fafc"],
      cyberpunk: ["#070514", "#9333ea", "#06b6d4", "#ec4899", "#38bdf8"],
      pixar: ["#0c1026", "#f59e0b", "#38bdf8", "#a855f7", "#fde047"],
      anime: ["#11071e", "#f43f5e", "#38bdf8", "#c084fc", "#f9a8d4"],
      aurora: ["#040b14", "#10b981", "#22d3ee", "#6366f1", "#a7f3d0"],
      minimal: ["#09090f", "#f8fafc", "#818cf8", "#38bdf8", "#c084fc"],
    };

    const pal = palettes[style] || palettes.cyberpunk;

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, pal[0]);
    bg.addColorStop(1, "#020308");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 6; i++) {
      const cx = rand() * w;
      const cy = rand() * h;
      const radius = 90 + rand() * 190;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
      g.addColorStop(0, pal[1 + (i % 4)] + "cc");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let l = 0; l < 18; l++) {
      ctx.beginPath();
      const yBase = rand() * h;
      ctx.moveTo(0, yBase);
      ctx.bezierCurveTo(w * 0.33, rand() * h, w * 0.66, rand() * h, w, rand() * h);
      ctx.strokeStyle = pal[1 + (l % 4)] + "44";
      ctx.lineWidth = 1 + rand() * 2.5;
      ctx.stroke();
    }

    const px = w * (0.35 + rand() * 0.3);
    const py = h * (0.35 + rand() * 0.3);
    const pr = 52 + rand() * 34;
    ctx.beginPath();
    for (let s = 0; s < 6; s++) {
      const ang = (s * Math.PI) / 3 + rand() * 0.2;
      const x = px + Math.cos(ang) * pr;
      const y = py + Math.sin(ang) * pr;
      s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "#ffffffaa";
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let p = 0; p < 90; p++) {
      ctx.fillStyle = `rgba(255,255,255,${(0.25 + rand() * 0.75).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, rand() * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.font = "600 12px JetBrains Mono, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(`AetherAI • ${style.toUpperCase()}`, 16, h - 14);
  }

  async function runArtGeneration() {
    const allowed = await consumeCreditOrPrompt();
    if (!allowed) return;

    const idea = (artIdea?.value || "").trim() || "Realistic futuristic electric supercar parked in rain on glowing neon Tokyo street, 8k DSLR";
    const style = artStyle?.value || "photoreal";
    const [imgW, imgH] = (artSize?.value || "1024x1024").split("x").map(Number);

    const autoProvider = serverConfigured.openai
      ? "openai"
      : serverConfigured.huggingface
      ? "huggingface"
      : serverConfigured.gemini
      ? "gemini"
      : "free";

    if (imageStageTitle) imageStageTitle.textContent = "Generating Real AI Image...";
    if (imageStatusBadge) imageStatusBadge.textContent = "Working...";
    if (imageLoader) imageLoader.style.display = "flex";
    if (artCanvas) artCanvas.style.display = "none";
    if (aiGeneratedImg) aiGeneratedImg.style.display = "none";

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: idea,
          style,
          width: imgW,
          height: imgH,
          provider: autoProvider,
          apiKey: "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || "Image generation failed");
      }

      lastGeneratedImageUrl = data.imageUrl;
      if (data.revisedPrompt) streamInto(artPromptOutput, data.revisedPrompt, 6);
      if (imageStageTitle) imageStageTitle.textContent = `AI Image (${data.provider || "FLUX"})`;
      if (imageStatusBadge) imageStatusBadge.textContent = "HD Ready";

      if (aiGeneratedImg) {
        aiGeneratedImg.onload = () => {
          if (imageLoader) imageLoader.style.display = "none";
          aiGeneratedImg.style.display = "block";
        };
        aiGeneratedImg.src = data.imageUrl;
      }
    } catch (err) {
      if (imageLoader) imageLoader.style.display = "none";
      if (aiGeneratedImg) aiGeneratedImg.style.display = "none";
      if (artCanvas) artCanvas.style.display = "block";
      lastGeneratedImageUrl = "";
      renderProceduralArt(idea, style);
      if (imageStatusBadge) imageStatusBadge.textContent = "Canvas Fallback";
      showToast(err.message || "Cloud AI busy — try again or add HuggingFace/OpenAI key.");
    }
  }

  $("#runArtBtn")?.addEventListener("click", runArtGeneration);
  $("#downloadArtBtn")?.addEventListener("click", () => {
    if (lastGeneratedImageUrl && aiGeneratedImg?.style.display !== "none") {
      const a = document.createElement("a");
      a.href = lastGeneratedImageUrl;
      a.download = "aether-ai-image.png";
      a.click();
      showToast("AI Image downloaded!");
      return;
    }
    if (!artCanvas) return;
    const link = document.createElement("a");
    link.download = "aether-ai-art.png";
    link.href = artCanvas.toDataURL("image/png");
    link.click();
    showToast("Artwork downloaded as PNG!");
  });

  // Initial render on load
  renderProceduralArt("Futuristic cosmic tiger glowing with neon blue energy", "cyberpunk");

  /* ---------------------------------------------------
     11. Tool 4: Smart Extractive Summarizer & Analyzer
  --------------------------------------------------- */
  const summaryInput = $("#summaryInput");
  const summaryOutput = $("#summaryOutput");
  const mWords = $("#mWords");
  const mRead = $("#mRead");
  const mTone = $("#mTone");

  $("#runSummaryBtn")?.addEventListener("click", () => {
    const raw = (summaryInput.value || "").trim();
    if (!raw) {
      showToast("Paste some text first!");
      return;
    }

    const words = raw.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readSec = Math.max(5, Math.round((wordCount / 200) * 60));

    // Simple sentiment / tone check
    const positiveWords = ["fast", "free", "great", "transforming", "empower", "clean", "best", "modern", "smart", "success"];
    const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ""));
    const posHits = lowerWords.filter((w) => positiveWords.includes(w)).length;
    const toneLabel = posHits >= 2 ? "Optimistic / Forward" : "Informative / Neutral";

    mWords.textContent = String(wordCount);
    mRead.textContent = readSec < 60 ? `${readSec}s` : `${Math.ceil(readSec / 60)}m`;
    mTone.textContent = toneLabel;

    // Keyword extraction
    const stopWords = new Set(["the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "into", "your", "you", "how", "can", "all", "its", "about", "they", "their"]);
    const freq = {};
    lowerWords.forEach((w) => {
      if (w.length > 3 && !stopWords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
    const topKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => `#${k}`);

    // Extractive sentence ranking
    const sentences = raw
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 12);

    const ranked = sentences
      .map((s, idx) => {
        const score = s
          .toLowerCase()
          .split(/\s+/)
          .reduce((acc, w) => acc + (freq[w.replace(/[^a-z]/g, "")] || 0), 0);
        return { s, idx, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .sort((a, b) => a.idx - b.idx);

    const bullets = ranked.length
      ? ranked.map((item) => `• ${item.s}`).join("\n")
      : `• ${raw.slice(0, 160)}...`;

    const report = `📌 KEY TAKEAWAYS:\n${bullets}\n\n🏷️ TOP KEYWORDS:\n${topKeywords.join("  ") || "#ai #summary"}`;
    streamInto(summaryOutput, report, 10);
  });

  /* ---------------------------------------------------
     12. Tool 5: Web Speech Voice Synth + Equalizer
  --------------------------------------------------- */
  const voiceSelect = $("#voiceSelect");
  const voiceRate = $("#voiceRate");
  const voiceRateVal = $("#voiceRateVal");
  const voiceText = $("#voiceText");
  const voiceStateBadge = $("#voiceStateBadge");
  const eqBarsWrap = $("#eqBars");

  const eqBars = [];
  if (eqBarsWrap) {
    for (let i = 0; i < 24; i++) {
      const bar = document.createElement("div");
      bar.className = "eq-bar";
      eqBarsWrap.appendChild(bar);
      eqBars.push(bar);
    }
  }

  let eqTimer = null;
  function setEqualizerActive(active) {
    clearInterval(eqTimer);
    if (voiceStateBadge) voiceStateBadge.textContent = active ? "Speaking..." : "Idle";
    if (!active) {
      eqBars.forEach((b) => (b.style.height = "16px"));
      return;
    }
    eqTimer = setInterval(() => {
      eqBars.forEach((b, idx) => {
        const h = 14 + Math.random() * (idx % 3 === 0 ? 86 : 64);
        b.style.height = `${Math.round(h)}px`;
      });
    }, 110);
  }

  function populateVoices() {
    if (!("speechSynthesis" in window) || !voiceSelect) return;
    const voices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";
    if (!voices.length) {
      const opt = document.createElement("option");
      opt.textContent = "Default System Voice";
      voiceSelect.appendChild(opt);
      return;
    }
    voices.slice(0, 20).forEach((v, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = `${v.name} (${v.lang})`;
      voiceSelect.appendChild(opt);
    });
  }

  if ("speechSynthesis" in window) {
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;
  }

  voiceRate?.addEventListener("input", () => {
    if (voiceRateVal) voiceRateVal.textContent = `${Number(voiceRate.value).toFixed(1)}x`;
  });

  $("#speakBtn")?.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) {
      showToast("Speech synthesis not supported in this browser.");
      return;
    }
    const text = (voiceText.value || "").trim();
    if (!text) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const chosen = voices[Number(voiceSelect?.value || 0)];
    if (chosen) utter.voice = chosen;
    utter.rate = Number(voiceRate?.value || 1);

    utter.onstart = () => setEqualizerActive(true);
    utter.onend = () => setEqualizerActive(false);
    utter.onerror = () => setEqualizerActive(false);

    window.speechSynthesis.speak(utter);
  });

  $("#stopSpeakBtn")?.addEventListener("click", () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setEqualizerActive(false);
  });

  /* ---------------------------------------------------
     13. FAQ Accordion, Mobile Menu & Command Palette
  --------------------------------------------------- */
  $$(".faq-question").forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", String(open));
    });
  });

  const mobileDrawer = $("#mobileDrawer");
  $("#mobileMenuBtn")?.addEventListener("click", () => {
    mobileDrawer?.classList.toggle("open");
  });
  $$(".mobile-link").forEach((lnk) => {
    lnk.addEventListener("click", () => mobileDrawer?.classList.remove("open"));
  });

  // Command Palette
  const cmdModal = $("#cmdModal");
  const cmdInput = $("#cmdInput");

  function openCmd() {
    cmdModal?.classList.add("open");
    cmdModal?.setAttribute("aria-hidden", "false");
    setTimeout(() => cmdInput?.focus(), 40);
  }

  function closeCmd() {
    cmdModal?.classList.remove("open");
    cmdModal?.setAttribute("aria-hidden", "true");
    if (cmdInput) cmdInput.value = "";
    $$(".cmd-item").forEach((i) => (i.style.display = "block"));
  }

  $("#cmdTrigger")?.addEventListener("click", openCmd);
  $("#cmdBackdrop")?.addEventListener("click", closeCmd);
  $("#cmdClose")?.addEventListener("click", closeCmd);

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      cmdModal?.classList.contains("open") ? closeCmd() : openCmd();
    } else if (e.key === "Escape" && cmdModal?.classList.contains("open")) {
      closeCmd();
    }
  });

  cmdInput?.addEventListener("input", () => {
    const q = cmdInput.value.toLowerCase().trim();
    $$(".cmd-item").forEach((item) => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? "block" : "none";
    });
  });

  $$(".cmd-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (item.dataset.cmdTab) {
        activateStudioTab(item.dataset.cmdTab);
        $("#playground")?.scrollIntoView({ behavior: "smooth" });
      } else if (item.dataset.cmdTheme) {
        setTheme(item.dataset.cmdTheme);
        showToast(`Theme switched to ${item.dataset.cmdTheme}`);
      }
      closeCmd();
    });
  });

  /* ---------------------------------------------------
     14. Account Auth, Credits, Razorpay Upgrade & Config
  --------------------------------------------------- */
  let RAZORPAY_KEY_ID = "rzp_test_REPLACE_WITH_YOUR_KEY";
  let serverConfigured = { gemini: false, huggingface: false, groq: false, openai: false, razorpay: false, adsense: false };

  function injectExternalScriptOnce(id, src, attrs = {}) {
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    document.head.appendChild(s);
  }

  async function loadPublicConfig() {
    try {
      const res = await fetch("/api/config/public");
      if (!res.ok) return;
      const data = await res.json();
      if (data.razorpayKeyId) {
        RAZORPAY_KEY_ID = data.razorpayKeyId;
        injectExternalScriptOnce("rzp-checkout-js", "https://checkout.razorpay.com/v1/checkout.js");
      }
      if (data.adsenseClientId && data.adsenseClientId.startsWith("ca-pub-")) {
        injectExternalScriptOnce(
          "adsense-js",
          `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(data.adsenseClientId)}`,
          { crossorigin: "anonymous" }
        );
      }
      if (data.configured) {
        serverConfigured = data.configured;
      }
    } catch {
      // ignore when opened via file://
    }
  }

  loadPublicConfig();

  const upgradeModal = $("#upgradeModal");
  const modalPlanTitle = $("#modalPlanTitle");
  const modalPlanAmount = $("#modalPlanAmount");
  const modalPlanCycle = $("#modalPlanCycle");
  const razorpayForm = $("#razorpayForm");

  const authModal = $("#authModal");
  const authForm = $("#authForm");
  const authNameWrap = $("#authNameWrap");
  const authModalTitle = $("#authModalTitle");
  const authSubmitBtn = $("#authSubmitBtn");
  const authHint = $("#authHint");

  const navLoginBtn = $("#navLoginBtn");
  const userPill = $("#userPill");
  const userPillName = $("#userPillName");
  const userPlanBadge = $("#userPlanBadge");
  const accountStatusText = $("#accountStatusText");
  const creditBadge = $("#creditBadge");
  const barLoginBtn = $("#barLoginBtn");
  const barUpgradeBtn = $("#barUpgradeBtn");
  const navUpgradeBtn = $("#navUpgradeBtn");

  let selectedPlan = { name: "Pro Creator", amount: 199, cycle: "Monthly" };
  let pendingUpgradePlan = null;
  let authMode = "login";
  let authToken = localStorage.getItem("aether_auth_token") || "";
  let currentUser = null;

  function updateAccountUI() {
    const isLoggedIn = Boolean(currentUser);
    const isPro = isLoggedIn && currentUser.plan !== "free";

    if (navLoginBtn) navLoginBtn.style.display = isLoggedIn ? "none" : "inline-flex";
    if (userPill) userPill.style.display = isLoggedIn ? "inline-flex" : "none";
    if (barLoginBtn) barLoginBtn.style.display = isLoggedIn ? "none" : "inline-block";

    if (isLoggedIn) {
      if (userPillName) userPillName.textContent = currentUser.name;
      if (userPlanBadge) {
        userPlanBadge.textContent = isPro ? (currentUser.plan === "lifetime" ? "👑 LIFETIME" : "👑 PRO") : "FREE";
        userPlanBadge.classList.toggle("pro", isPro);
      }
      if (accountStatusText) {
        accountStatusText.textContent = isPro
          ? `Welcome ${currentUser.name} — Pro Plan Active (Ad-Free + Unlimited AI)`
          : `Signed in as ${currentUser.name} — Free Daily Plan`;
      }
      if (creditBadge) {
        creditBadge.textContent = isPro ? "∞ Unlimited" : `${currentUser.dailyCredits} / 5 Credits`;
        creditBadge.classList.toggle("pro", isPro);
      }
      if (barUpgradeBtn) barUpgradeBtn.style.display = isPro ? "none" : "inline-flex";
      if (navUpgradeBtn) navUpgradeBtn.style.display = isPro ? "none" : "inline-flex";
    } else {
      const used = Number(localStorage.getItem("aether_guest_tries") || 0);
      const left = Math.max(0, 2 - used);
      if (accountStatusText) {
        accountStatusText.textContent = "Guest Trial (2 free tries) — Login for 5 daily free credits";
      }
      if (creditBadge) {
        creditBadge.textContent = `${left} / 2 Trial`;
        creditBadge.classList.remove("pro");
      }
      if (barUpgradeBtn) barUpgradeBtn.style.display = "inline-flex";
      if (navUpgradeBtn) navUpgradeBtn.style.display = "inline-flex";
    }

    // Hide AdSense banner slots for paid Pro users
    $$(".ad-banner-wrap").forEach((ad) => {
      ad.style.display = isPro ? "none" : "block";
    });
  }

  async function syncAuthState() {
    if (!authToken) {
      currentUser = null;
      updateAccountUI();
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Session expired");
      const data = await res.json();
      currentUser = data.user;
    } catch {
      authToken = "";
      localStorage.removeItem("aether_auth_token");
      currentUser = null;
    }
    updateAccountUI();
  }

  const forgotView = $("#forgotView");
  const forgotRequestForm = $("#forgotRequestForm");
  const forgotResetForm = $("#forgotResetForm");
  const resetCodeBanner = $("#resetCodeBanner");
  const authTabsWrap = $(".auth-tabs");
  let pendingResetEmail = "";

  function setAuthMode(mode) {
    authMode = mode;
    if (authForm) authForm.style.display = "block";
    if (forgotView) forgotView.style.display = "none";
    if (authTabsWrap) authTabsWrap.style.display = "grid";
    $$(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.authMode === mode));
    const isReg = mode === "register";
    if (authNameWrap) authNameWrap.style.display = isReg ? "block" : "none";
    const nameInput = $("#authName");
    if (nameInput) nameInput.required = isReg;
    if (authModalTitle) authModalTitle.textContent = isReg ? "Create Free Account" : "Login to Your Account";
    if (authSubmitBtn) authSubmitBtn.querySelector("span").textContent = isReg ? "Create Account →" : "Login →";
  }

  function showForgotView() {
    if (authForm) authForm.style.display = "none";
    if (authTabsWrap) authTabsWrap.style.display = "none";
    if (forgotView) forgotView.style.display = "block";
    if (forgotRequestForm) forgotRequestForm.style.display = "block";
    if (forgotResetForm) forgotResetForm.style.display = "none";
    if (authModalTitle) authModalTitle.textContent = "Reset Your Password";
    const typedEmail = ($("#authEmail")?.value || "").trim();
    if (typedEmail && $("#forgotEmail")) $("#forgotEmail").value = typedEmail;
    setTimeout(() => $("#forgotEmail")?.focus(), 40);
  }

  function openAuthModal(mode = "login", customHint = "") {
    setAuthMode(mode);
    if (authHint) {
      authHint.textContent = customHint || "Sign in to sync your 5 daily free credits or unlock Pro.";
    }
    authModal?.classList.add("open");
    authModal?.setAttribute("aria-hidden", "false");
    setTimeout(() => $("#authEmail")?.focus(), 40);
  }

  $("#forgotPassBtn")?.addEventListener("click", showForgotView);
  $("#backToLoginBtn")?.addEventListener("click", () => setAuthMode("login"));

  forgotRequestForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = ($("#forgotEmail")?.value || "").trim();
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not send reset code");
        return;
      }
      pendingResetEmail = email;
      if (forgotRequestForm) forgotRequestForm.style.display = "none";
      if (forgotResetForm) forgotResetForm.style.display = "block";
      if (resetCodeBanner) {
        resetCodeBanner.textContent = data.demoCode
          ? `Your 6-digit verification code: ${data.demoCode} (valid for 10 min)`
          : "Check your email for the 6-digit reset code.";
      }
      showToast("Reset code generated!");
    } catch {
      showToast("Server error — please try again.");
    }
  });

  forgotResetForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = ($("#resetCodeInput")?.value || "").trim();
    const newPassword = $("#resetNewPassword")?.value || "";
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingResetEmail, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Reset failed");
        return;
      }
      if ($("#authEmail")) $("#authEmail").value = pendingResetEmail;
      if ($("#authPassword")) $("#authPassword").value = "";
      forgotResetForm.reset();
      setAuthMode("login");
      showToast("Password updated! Please login.");
    } catch {
      showToast("Server error — please try again.");
    }
  });

  function closeAuthModal() {
    authModal?.classList.remove("open");
    authModal?.setAttribute("aria-hidden", "true");
  }

  $$(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode));
  });

  $("#navLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  $("#barLoginBtn")?.addEventListener("click", () => openAuthModal("login"));
  $("#mobileLoginBtn")?.addEventListener("click", () => {
    mobileDrawer?.classList.remove("open");
    openAuthModal("login");
  });
  $("#authBackdrop")?.addEventListener("click", closeAuthModal);
  $("#authClose")?.addEventListener("click", closeAuthModal);

  $("#logoutBtn")?.addEventListener("click", () => {
    authToken = "";
    currentUser = null;
    localStorage.removeItem("aether_auth_token");
    updateAccountUI();
    showToast("Logged out successfully");
  });

  authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = ($("#authName")?.value || "").trim();
    const email = ($("#authEmail")?.value || "").trim();
    const password = $("#authPassword")?.value || "";

    const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Authentication failed");
        return;
      }

      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem("aether_auth_token", authToken);
      updateAccountUI();
      closeAuthModal();
      showToast(`Welcome, ${currentUser.name}!`);

      if (pendingUpgradePlan) {
        const plan = pendingUpgradePlan;
        pendingUpgradePlan = null;
        openUpgradeModal(plan.name, plan.amount, plan.cycle);
      }
    } catch {
      showToast("Server error — start server.js to use Login.");
    }
  });

  async function consumeCreditOrPrompt() {
    if (!currentUser) {
      const used = Number(localStorage.getItem("aether_guest_tries") || 0);
      if (used >= 2) {
        openAuthModal("register", "Guest trial complete! Create a free account for 5 daily credits.");
        return false;
      }
      localStorage.setItem("aether_guest_tries", String(used + 1));
      updateAccountUI();
      return true;
    }

    if (currentUser.plan !== "free") return true;

    try {
      const res = await fetch("/api/credits/use", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.status === 402) {
        currentUser = data.user;
        updateAccountUI();
        showToast("Daily free credits finished! Upgrade to Pro.");
        openUpgradeModal("Pro Creator", 199, "Monthly");
        return false;
      }
      if (res.ok && data.user) {
        currentUser = data.user;
        updateAccountUI();
        return true;
      }
    } catch {
      return true;
    }
    return true;
  }

  function openUpgradeModal(planName = "Pro Creator", amount = 199, cycle = "Monthly") {
    if (!currentUser) {
      pendingUpgradePlan = { name: planName, amount, cycle };
      openAuthModal("login", `Sign in or create a free account to activate ${planName}.`);
      return;
    }

    selectedPlan = { name: planName, amount: Number(amount), cycle };
    if (modalPlanTitle) modalPlanTitle.textContent = `Upgrade to ${planName}`;
    if (modalPlanAmount) modalPlanAmount.textContent = `₹${amount}`;
    if (modalPlanCycle) modalPlanCycle.textContent = cycle;

    const checkoutName = $("#checkoutName");
    const checkoutEmail = $("#checkoutEmail");
    if (checkoutName) checkoutName.value = currentUser.name;
    if (checkoutEmail) checkoutEmail.value = currentUser.email;

    upgradeModal?.classList.add("open");
    upgradeModal?.setAttribute("aria-hidden", "false");
  }

  function closeUpgradeModal() {
    upgradeModal?.classList.remove("open");
    upgradeModal?.setAttribute("aria-hidden", "true");
  }

  navUpgradeBtn?.addEventListener("click", () => openUpgradeModal("Pro Creator", 199, "Monthly"));
  $("#upgradeBackdrop")?.addEventListener("click", closeUpgradeModal);
  $("#upgradeClose")?.addEventListener("click", closeUpgradeModal);

  $$(".upgrade-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      openUpgradeModal(
        btn.dataset.plan || "Pro Creator",
        btn.dataset.amount || 199,
        btn.dataset.cycle || "Monthly"
      );
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (upgradeModal?.classList.contains("open")) closeUpgradeModal();
      if (authModal?.classList.contains("open")) closeAuthModal();
    }
  });

  async function finalizeServerUpgrade(paymentId = "") {
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          planName: selectedPlan.name,
          amount: selectedPlan.amount,
          paymentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upgrade failed");
        return;
      }
      currentUser = data.user;
      updateAccountUI();
      closeUpgradeModal();
      showToast(`👑 ${selectedPlan.name} Activated! Unlimited AI & Zero Ads unlocked.`);
    } catch {
      showToast("Could not reach server to activate Pro.");
    }
  }

  razorpayForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = ($("#checkoutName")?.value || "").trim();
    const email = ($("#checkoutEmail")?.value || "").trim();

    if (typeof window.Razorpay === "function" && !RAZORPAY_KEY_ID.includes("REPLACE")) {
      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: selectedPlan.amount * 100,
        currency: "INR",
        name: "AetherAI Studio",
        description: `${selectedPlan.name} (${selectedPlan.cycle})`,
        prefill: { name, email },
        handler: (response) => {
          finalizeServerUpgrade(response?.razorpay_payment_id || "");
        },
      });
      rzp.open();
      return;
    }

    finalizeServerUpgrade();
  });

  syncAuthState();

  $$(".aff-cta").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#aff-")) {
        e.preventDefault();
        const partner = link.dataset.partner || "Partner";
        showToast(`Add your ${partner} affiliate URL in index.html`);
      }
    });
  });

  /* Contact Page Form Handler */
  $("#contactForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.reset();
    showToast("Message received! We will reply within 24 hours.");
  });

  /* ---------------------------------------------------
     15. Tool 0: Normal AI Chat Assistant (Cloud + Gemini + Offline)
  --------------------------------------------------- */
  const chatMessages = $("#chatMessages");
  const chatForm = $("#chatForm");
  const chatInput = $("#chatInput");
  const chatEngineSelect = $("#chatEngineSelect");
  const geminiKeyDrawer = $("#geminiKeyDrawer");
  const geminiApiKeyInput = $("#geminiApiKeyInput");
  const chatHistory = [];

  const savedGeminiKey = localStorage.getItem("aether_gemini_key") || "";
  if (geminiApiKeyInput && savedGeminiKey) geminiApiKeyInput.value = savedGeminiKey;

  $("#toggleGeminiKeyBtn")?.addEventListener("click", () => {
    if (!geminiKeyDrawer) return;
    geminiKeyDrawer.style.display = geminiKeyDrawer.style.display === "none" ? "flex" : "none";
  });

  $("#saveGeminiKeyBtn")?.addEventListener("click", () => {
    const key = (geminiApiKeyInput?.value || "").trim();
    localStorage.setItem("aether_gemini_key", key);
    if (key && chatEngineSelect) chatEngineSelect.value = "gemini";
    if (geminiKeyDrawer) geminiKeyDrawer.style.display = "none";
    showToast(key ? "Gemini API key saved locally!" : "API key cleared");
  });

  $$("[data-chat-preset]").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (chatInput) {
        chatInput.value = chip.dataset.chatPreset;
        chatInput.focus();
      }
    });
  });

  function appendChatBubble(role, text) {
    if (!chatMessages) return null;
    const msg = document.createElement("div");
    msg.className = `chat-msg ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";
    avatar.textContent = role === "user" ? "🧑" : "✨";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    const sender = document.createElement("div");
    sender.className = "chat-sender";
    sender.textContent = role === "user" ? "You" : "AetherAI Assistant";

    if (role === "ai") {
      const speakBtn = document.createElement("button");
      speakBtn.type = "button";
      speakBtn.className = "chat-speak-btn";
      speakBtn.textContent = "🔊 Speak";
      speakBtn.addEventListener("click", () => {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(body.textContent || "");
          window.speechSynthesis.speak(u);
        }
      });
      sender.appendChild(speakBtn);
    }

    const body = document.createElement("div");
    body.textContent = text;

    bubble.appendChild(sender);
    bubble.appendChild(body);
    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return body;
  }

  function showChatThinking() {
    if (!chatMessages) return null;
    const msg = document.createElement("div");
    msg.className = "chat-msg ai";
    msg.innerHTML = `<div class="chat-avatar">✨</div><div class="chat-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }

  function smartLocalReply(userText) {
    const q = userText.toLowerCase().trim();
    if (/^(hi|hello|hey|kem cho|kaisa|namaste|su chale)/.test(q)) {
      return "Majama! 👋 Hu tamaro AetherAI assistant chu. Bolo, aaj su banavvu che? Tamne ideas, captions, code, ke koi topic par madad joiye to pucho!";
    }
    if (/^\d[\d\s+\-*/().]+\d$/.test(q)) {
      try {
        const clean = q.replace(/[^0-9+\-*/().]/g, "");
        const ans = Function(`"use strict"; return (${clean})`)();
        return `Answer: ${clean} = ${ans}`;
      } catch {
        // continue
      }
    }
    if (q.includes("image") || q.includes("photo") || q.includes("pic")) {
      return "Image banava mate upar '🎨 AI Image Gen' tab par click karo! Tya tame prompt lakhi ne real AI image banavi ne PNG download kari shako cho.";
    }
    if (q.includes("youtube") || q.includes("reel") || q.includes("idea") || q.includes("viral")) {
      return "🔥 3 Viral AI Content Ideas:\n1. '5 Free AI Websites je students no time bachave che'\n2. 'Zero Coding thi 60 second ma Animated Website kevi rite banavi'\n3. 'AI sathe Reels Script & Thumbnail Prompt 1 minute ma'\n\nJo tame script joiye to '✍️ AI Writer' tab ma topic lakhi ne generate kari shako cho!";
    }
    if (q.includes("python") || q.includes("code") || q.includes("javascript") || q.includes("html")) {
      return "Code example mate:\n\n```python\nfor i in range(1, 6):\n    print(f'AetherAI Step {i}')\n```\n\nVadhu ready-to-use snippets mate '⚡ Code Architect' tab check karo!";
    }
    if (q.includes("quote") || q.includes("motivat")) {
      return "✨ \"Nana steps roj levathi mota sapna hakikat bane che — bas sharuat aaj thi j karo!\"";
    }
    return `Tamaro message malyo: "${userText}"\n\nHu tame aa babato ma madad kari shaku chu:\n• Normal vat-chit (Gujarati / Hinglish / English)\n• Viral Reel & Blog ideas\n• Coding & study explanations\n\n*(Tip: Live Cloud AI athva Gemini API Key mode select karsho to deep AI answers pan malse!)*`;
  }

  async function askCloudAI(prompt) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const systemCtx = "You are AetherAI, a friendly helpful AI assistant. Reply concisely in the same language the user uses (Gujarati, Hinglish, or English).";
      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(systemCtx)}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("Cloud error");
      const txt = (await res.text()).trim();
      if (!txt) throw new Error("Empty reply");
      return txt;
    } finally {
      clearTimeout(timer);
    }
  }

  async function askGeminiAI(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const contents = [
      ...chatHistory.slice(-6),
      { role: "user", parts: [{ text: prompt }] },
    ];
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });
    if (!res.ok) throw new Error("Gemini API error");
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No Gemini text");
    return text;
  }

  chatForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = (chatInput?.value || "").trim();
    if (!text) return;

    const allowed = await consumeCreditOrPrompt();
    if (!allowed) return;

    chatInput.value = "";

    appendChatBubble("user", text);
    const thinkingNode = showChatThinking();
    const mode = chatEngineSelect?.value || "cloud";
    const apiKey = (geminiApiKeyInput?.value || localStorage.getItem("aether_gemini_key") || "").trim();

    let reply = "";
    try {
      if (mode === "local") {
        await new Promise((r) => setTimeout(r, 300));
        reply = smartLocalReply(text);
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            history: chatHistory,
            provider: mode,
            apiKey: mode === "gemini" ? apiKey : "",
          }),
        });
        const data = await res.json();
        if (res.ok && data.reply) {
          reply = data.reply;
        } else if (mode === "gemini" && !apiKey && !serverConfigured.gemini) {
          if (geminiKeyDrawer) geminiKeyDrawer.style.display = "flex";
          throw new Error("Missing Gemini key");
        } else {
          throw new Error(data.error || "Chat fallback");
        }
      }
    } catch {
      reply = smartLocalReply(text);
    }

    thinkingNode?.remove();
    const aiBody = appendChatBubble("ai", "");
    if (aiBody) await streamInto(aiBody, reply, 8);
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

    chatHistory.push({ role: "user", parts: [{ text }] });
    chatHistory.push({ role: "model", parts: [{ text: reply }] });
  });

  $("#clearChatBtn")?.addEventListener("click", () => {
    chatHistory.length = 0;
    if (chatMessages) {
      chatMessages.innerHTML = "";
      appendChatBubble("ai", "Chat cleared! ✨ Navi vat sharu kariye — kai pan pucho.");
    }
  });

  $("#chatMicBtn")?.addEventListener("click", () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast("Voice input Chrome/Edge ma support thay che.");
      return;
    }
    const rec = new SpeechRec();
    rec.lang = "en-IN";
    showToast("Listening... bolo!");
    rec.onresult = (ev) => {
      const spoken = ev.results?.[0]?.[0]?.transcript || "";
      if (chatInput && spoken) {
        chatInput.value = spoken;
        chatForm?.dispatchEvent(new Event("submit"));
      }
    };
    rec.onerror = () => showToast("Mic permission check karo.");
    rec.start();
  });

  /* ---------------------------------------------------
     16. Tool 6: Instant PDF Maker (Pure JS PDF 1.4 + Print)
  --------------------------------------------------- */
  const pdfTitle = $("#pdfTitle");
  const pdfSubtitle = $("#pdfSubtitle");
  const pdfBody = $("#pdfBody");
  const pdfPreviewTitle = $("#pdfPreviewTitle");
  const pdfPreviewSubtitle = $("#pdfPreviewSubtitle");
  const pdfPreviewBody = $("#pdfPreviewBody");

  function syncPdfPreview() {
    if (pdfPreviewTitle) pdfPreviewTitle.textContent = pdfTitle?.value || "Untitled Document";
    if (pdfPreviewSubtitle) pdfPreviewSubtitle.textContent = pdfSubtitle?.value || "";
    if (pdfPreviewBody) pdfPreviewBody.textContent = pdfBody?.value || "";
  }

  [pdfTitle, pdfSubtitle, pdfBody].forEach((el) => el?.addEventListener("input", syncPdfPreview));
  syncPdfPreview();

  const pdfTemplates = {
    invoice: {
      title: "TAX INVOICE #INV-2026-01",
      subtitle: "Issued by AetherAI Digital Studio | Date: 25 Nov 2026",
      body: "Bill To: Client Name / Business\nEmail: client@example.com\n\nItems:\n1. Animated AI Website Design .......... Rs. 12,000\n2. Custom Automation Setup .............. Rs. 5,000\n\nSubtotal: Rs. 17,000\nGST (18%): Rs. 3,060\nGrand Total: Rs. 20,060\n\nThank you for your business!",
    },
    resume: {
      title: "AARAV PATEL - WEB & AI CREATOR",
      subtitle: "Ahmedabad, India | aarav@example.com | +91 98765 43210",
      body: "SUMMARY\nCreative developer passionate about building animated web experiences and AI productivity tools.\n\nSKILLS\n- HTML5, CSS3, Modern JavaScript, Node.js\n- AI Prompt Engineering & Automation\n- UI/UX Motion Design\n\nEXPERIENCE\n- Built AetherAI Free Studio (5+ live interactive tools)\n- Designed responsive client landing pages",
    },
    notes: {
      title: "AI & PROMPT ENGINEERING QUICK NOTES",
      subtitle: "Study Sheet | AetherAI Knowledge Hub",
      body: "1. Clear Context\nAlways specify the role, target audience, and desired output format.\n\n2. Tone & Length\nMention whether you want bullet points, a 30-second script, or a detailed guide.\n\n3. Iteration\nRefine prompts step by step for sharper, higher-quality results.",
    },
  };

  $$("[data-pdf-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tpl = pdfTemplates[btn.dataset.pdfPreset];
      if (!tpl) return;
      if (pdfTitle) pdfTitle.value = tpl.title;
      if (pdfSubtitle) pdfSubtitle.value = tpl.subtitle;
      if (pdfBody) pdfBody.value = tpl.body;
      syncPdfPreview();
      showToast("PDF template loaded!");
    });
  });

  function pdfEscapeText(str) {
    return String(str || "")
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  function wrapPdfLines(text, maxChars = 84) {
    const out = [];
    String(text || "")
      .split(/\r?\n/)
      .forEach((para) => {
        if (!para.trim()) {
          out.push("");
          return;
        }
        const words = para.split(/\s+/);
        let line = "";
        words.forEach((w) => {
          if ((line + " " + w).trim().length > maxChars) {
            if (line) out.push(line);
            line = w;
          } else {
            line = (line + " " + w).trim();
          }
        });
        if (line) out.push(line);
      });
    return out;
  }

  function buildSimplePdfBlob(title, subtitle, body) {
    const bodyLines = wrapPdfLines(body, 82);
    const pagesContent = [];
    const linesPerPage = 42;

    for (let i = 0; i < Math.max(1, bodyLines.length); i += linesPerPage) {
      const slice = bodyLines.slice(i, i + linesPerPage);
      let stream = "BT\n";
      let y = 780;
      if (i === 0) {
        stream += `/F2 18 Tf 50 ${y} Td (${pdfEscapeText(title)}) Tj\n`;
        y -= 24;
        if (subtitle) {
          stream += `ET\nBT\n/F1 10 Tf 50 ${y} Td (${pdfEscapeText(subtitle)}) Tj\n`;
          y -= 18;
        }
        stream += `ET\n0.75 w 50 ${y} m 545 ${y} l S\nBT\n`;
        y -= 24;
      }
      stream += `/F1 11 Tf 1 0 0 1 50 ${y} Tm\n`;
      slice.forEach((line, idx) => {
        if (idx > 0) stream += "0 -16 Td\n";
        stream += `(${pdfEscapeText(line)}) Tj\n`;
      });
      stream += "ET";
      pagesContent.push(stream);
    }

    const objects = [];
    const addObj = (content) => {
      objects.push(content);
      return objects.length;
    };

    const font1 = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const font2 = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    const pagesId = addObj("");
    const pageIds = [];

    pagesContent.forEach((stream) => {
      const contentId = addObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const pageId = addObj(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${contentId} 0 R >>`
      );
      pageIds.push(pageId);
    });

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((obj, idx) => {
      offsets.push(pdf.length);
      pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
    });

    const xrefPos = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  }

  $("#downloadRealPdfBtn")?.addEventListener("click", () => {
    const title = (pdfTitle?.value || "AetherAI Document").trim();
    const subtitle = (pdfSubtitle?.value || "").trim();
    const body = pdfBody?.value || "";
    const blob = buildSimplePdfBlob(title, subtitle, body);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "aether-document";
    a.href = url;
    a.download = `${safeName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${safeName}.pdf!`);
  });

  $("#printPdfBtn")?.addEventListener("click", () => {
    const title = pdfTitle?.value || "AetherAI Document";
    const subtitle = pdfSubtitle?.value || "";
    const body = pdfBody?.value || "";
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      showToast("Allow popups to open Print PDF view");
      return;
    }
    const esc = (s) =>
      String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    win.document.write(
      `<!DOCTYPE html><html><head><title>${esc(title)}</title><style>body{font-family:system-ui,sans-serif;max-width:740px;margin:40px auto;padding:0 24px;color:#0f172a;line-height:1.65;}h1{margin-bottom:4px;}p.sub{color:#64748b;margin-top:0;border-bottom:2px solid #e2e8f0;padding-bottom:14px;}pre{white-space:pre-wrap;font-family:inherit;font-size:15px;}</style></head><body><h1>${esc(title)}</h1><p class="sub">${esc(subtitle)}</p><pre>${esc(body)}</pre><script>window.onload=()=>window.print();<\/script></body></html>`
    );
    win.document.close();
  });

  /* ---------------------------------------------------
     17. Tool 7: Smart 3-in-1 Calculator Hub
  --------------------------------------------------- */
  $$(".calc-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.calcMode;
      $$(".calc-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
      $$(".calc-subpanel").forEach((p) => p.classList.toggle("active", p.id === `calc-${mode}`));
    });
  });

  const calcExprEl = $("#calcExpr");
  const calcResultEl = $("#calcResult");
  const calcHistoryEl = $("#calcHistory");
  let currentExpr = "";

  function safeEvalMath(expr) {
    const clean = String(expr || "")
      .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
      .replace(/[^0-9+\-*/().\s]/g, "");
    if (!clean.trim()) return 0;
    const res = Function(`"use strict"; return (${clean});`)();
    if (!Number.isFinite(res)) throw new Error("Math error");
    return Math.round(res * 1e8) / 1e8;
  }

  function renderCalcDisplay(resultOverride = null) {
    if (calcExprEl) calcExprEl.textContent = currentExpr || "0";
    if (!calcResultEl) return;
    if (resultOverride !== null) {
      calcResultEl.textContent = String(resultOverride);
      return;
    }
    try {
      const val = currentExpr ? safeEvalMath(currentExpr) : 0;
      calcResultEl.textContent = String(val);
    } catch {
      // keep previous partial expression result
    }
  }

  function pushCalcHistory(expr, ans) {
    if (!calcHistoryEl) return;
    const placeholder = $(".placeholder-text", calcHistoryEl);
    if (placeholder) calcHistoryEl.innerHTML = "";
    const row = document.createElement("div");
    row.className = "calc-hist-item";
    row.textContent = `${expr} = ${ans}`;
    row.addEventListener("click", () => {
      currentExpr = String(ans);
      renderCalcDisplay(ans);
    });
    calcHistoryEl.prepend(row);
  }

  $$("[data-calc-val]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentExpr += btn.dataset.calcVal;
      renderCalcDisplay();
    });
  });

  $$("[data-calc-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.calcAct;
      if (act === "clear") {
        currentExpr = "";
        renderCalcDisplay("0");
      } else if (act === "back") {
        currentExpr = currentExpr.slice(0, -1);
        renderCalcDisplay(currentExpr ? null : "0");
      } else if (act === "sqrt") {
        try {
          const val = Math.sqrt(safeEvalMath(currentExpr || "0"));
          const rounded = Math.round(val * 1e6) / 1e6;
          pushCalcHistory(`√(${currentExpr || 0})`, rounded);
          currentExpr = String(rounded);
          renderCalcDisplay(rounded);
        } catch {
          renderCalcDisplay("Error");
        }
      } else if (act === "sq") {
        try {
          const base = safeEvalMath(currentExpr || "0");
          const rounded = Math.round(base * base * 1e6) / 1e6;
          pushCalcHistory(`(${currentExpr || 0})²`, rounded);
          currentExpr = String(rounded);
          renderCalcDisplay(rounded);
        } catch {
          renderCalcDisplay("Error");
        }
      } else if (act === "eval") {
        if (!currentExpr) return;
        try {
          const ans = safeEvalMath(currentExpr);
          pushCalcHistory(currentExpr, ans);
          currentExpr = String(ans);
          renderCalcDisplay(ans);
        } catch {
          renderCalcDisplay("Error");
        }
      }
    });
  });

  $("#clearCalcHistBtn")?.addEventListener("click", () => {
    if (calcHistoryEl) {
      calcHistoryEl.innerHTML = '<span class="placeholder-text">Your recent calculations appear here...</span>';
    }
  });

  // EMI Calculator
  const emiPrincipal = $("#emiPrincipal");
  const emiRate = $("#emiRate");
  const emiYears = $("#emiYears");

  function updateEmi() {
    const P = Number(emiPrincipal?.value || 500000);
    const annual = Number(emiRate?.value || 9.5);
    const years = Number(emiYears?.value || 5);
    const r = annual / 12 / 100;
    const n = years * 12;

    const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - P;
    const fmt = (v) => "₹" + Math.round(v).toLocaleString("en-IN");

    if ($("#emiPrincipalVal")) $("#emiPrincipalVal").textContent = fmt(P);
    if ($("#emiRateVal")) $("#emiRateVal").textContent = `${annual}%`;
    if ($("#emiYearsVal")) $("#emiYearsVal").textContent = `${years} Years`;
    if ($("#emiMonthlyOut")) $("#emiMonthlyOut").textContent = fmt(emi);
    if ($("#emiInterestOut")) $("#emiInterestOut").textContent = fmt(interest);
    if ($("#emiTotalOut")) $("#emiTotalOut").textContent = fmt(total);
  }

  [emiPrincipal, emiRate, emiYears].forEach((el) => el?.addEventListener("input", updateEmi));
  updateEmi();

  // GST & Discount Calculator
  const gstAmount = $("#gstAmount");
  const gstRate = $("#gstRate");
  const discountPct = $("#discountPct");

  function updateGst() {
    const base = Math.max(0, Number(gstAmount?.value || 0));
    const gst = Number(gstRate?.value || 0);
    const disc = Math.min(100, Math.max(0, Number(discountPct?.value || 0)));

    const saved = (base * disc) / 100;
    const afterDisc = base - saved;
    const tax = (afterDisc * gst) / 100;
    const finalTotal = afterDisc + tax;
    const fmt2 = (v) => "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if ($("#gstSavedOut")) $("#gstSavedOut").textContent = fmt2(saved);
    if ($("#gstTaxOut")) $("#gstTaxOut").textContent = fmt2(tax);
    if ($("#gstFinalOut")) $("#gstFinalOut").textContent = fmt2(finalTotal);
  }

  [gstAmount, gstRate, discountPct].forEach((el) => el?.addEventListener("input", updateGst));
  updateGst();

  /* ---------------------------------------------------
     18. Tool 8: Image Resizer & Format Converter
  --------------------------------------------------- */
  const imgDropzone = $("#imgDropzone");
  const imgUploadInput = $("#imgUploadInput");
  const resizeWidth = $("#resizeWidth");
  const resizeHeight = $("#resizeHeight");
  const lockAspectRatio = $("#lockAspectRatio");
  const convertFormat = $("#convertFormat");
  const convertQuality = $("#convertQuality");
  const convertQualityVal = $("#convertQualityVal");
  const origImgInfo = $("#origImgInfo");
  const newImgInfo = $("#newImgInfo");
  const convertSavedBadge = $("#convertSavedBadge");
  const convertedPreviewImg = $("#convertedPreviewImg");
  const imgToolPlaceholder = $("#imgToolPlaceholder");

  let sourceImage = null;
  let sourceOrigBytes = 0;
  let sourceOrigName = "aether-image";
  let convertedBlobUrl = "";

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function loadSourceImageFromFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please upload a valid image file!");
      return;
    }
    sourceOrigBytes = file.size;
    sourceOrigName = file.name.replace(/\.[^.]+$/, "") || "converted-image";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        if (resizeWidth) resizeWidth.value = String(img.naturalWidth);
        if (resizeHeight) resizeHeight.value = String(img.naturalHeight);
        if (origImgInfo) {
          origImgInfo.textContent = `${img.naturalWidth}×${img.naturalHeight} • ${formatBytes(sourceOrigBytes)}`;
        }
        processResizeAndConvert();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function processResizeAndConvert() {
    if (!sourceImage) {
      // Fallback: use procedural canvas as a ready sample if user clicks before uploading
      if (artCanvas) {
        const sampleImg = new Image();
        sampleImg.onload = () => {
          sourceImage = sampleImg;
          sourceOrigBytes = 120000;
          sourceOrigName = "sample-art";
          if (resizeWidth) resizeWidth.value = String(sampleImg.naturalWidth);
          if (resizeHeight) resizeHeight.value = String(sampleImg.naturalHeight);
          if (origImgInfo) origImgInfo.textContent = `${sampleImg.naturalWidth}×${sampleImg.naturalHeight} • Sample`;
          processResizeAndConvert();
        };
        sampleImg.src = artCanvas.toDataURL("image/png");
      }
      return;
    }

    const targetW = Math.max(16, Math.min(8000, Number(resizeWidth?.value || sourceImage.naturalWidth)));
    const targetH = Math.max(16, Math.min(8000, Number(resizeHeight?.value || sourceImage.naturalHeight)));
    const mime = convertFormat?.value || "image/webp";
    const quality = Math.max(0.1, Math.min(1, Number(convertQuality?.value || 85) / 100));

    const offscreen = document.createElement("canvas");
    offscreen.width = targetW;
    offscreen.height = targetH;
    const ctx = offscreen.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.drawImage(sourceImage, 0, 0, targetW, targetH);

    offscreen.toBlob(
      (blob) => {
        if (!blob) return;
        if (convertedBlobUrl) URL.revokeObjectURL(convertedBlobUrl);
        convertedBlobUrl = URL.createObjectURL(blob);

        if (imgToolPlaceholder) imgToolPlaceholder.style.display = "none";
        if (convertedPreviewImg) {
          convertedPreviewImg.src = convertedBlobUrl;
          convertedPreviewImg.style.display = "block";
        }
        const ext = mime.split("/")[1].replace("jpeg", "jpg").toUpperCase();
        if (newImgInfo) newImgInfo.textContent = `${targetW}×${targetH} • ${formatBytes(blob.size)} (${ext})`;

        if (convertSavedBadge) {
          if (sourceOrigBytes > 0 && blob.size < sourceOrigBytes) {
            const pct = Math.round(((sourceOrigBytes - blob.size) / sourceOrigBytes) * 100);
            convertSavedBadge.textContent = `${pct}% Smaller`;
          } else {
            convertSavedBadge.textContent = `Ready (${ext})`;
          }
        }
      },
      mime,
      quality
    );
  }

  imgDropzone?.addEventListener("click", () => imgUploadInput?.click());
  imgUploadInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) loadSourceImageFromFile(file);
  });

  imgDropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    imgDropzone.classList.add("dragover");
  });
  imgDropzone?.addEventListener("dragleave", () => imgDropzone.classList.remove("dragover"));
  imgDropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    imgDropzone.classList.remove("dragover");
    const file = e.dataTransfer?.files?.[0];
    if (file) loadSourceImageFromFile(file);
  });

  resizeWidth?.addEventListener("input", () => {
    if (sourceImage && lockAspectRatio?.checked) {
      const ratio = sourceImage.naturalHeight / sourceImage.naturalWidth;
      if (resizeHeight) resizeHeight.value = String(Math.max(16, Math.round(Number(resizeWidth.value || 100) * ratio)));
    }
  });

  resizeHeight?.addEventListener("input", () => {
    if (sourceImage && lockAspectRatio?.checked) {
      const ratio = sourceImage.naturalWidth / sourceImage.naturalHeight;
      if (resizeWidth) resizeWidth.value = String(Math.max(16, Math.round(Number(resizeHeight.value || 100) * ratio)));
    }
  });

  convertQuality?.addEventListener("input", () => {
    if (convertQualityVal) convertQualityVal.textContent = `${convertQuality.value}%`;
  });

  $$("[data-resize-scale]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!sourceImage) {
        processResizeAndConvert();
        return;
      }
      const scale = Number(btn.dataset.resizeScale || 1);
      if (resizeWidth) resizeWidth.value = String(Math.round(sourceImage.naturalWidth * scale));
      if (resizeHeight) resizeHeight.value = String(Math.round(sourceImage.naturalHeight * scale));
      processResizeAndConvert();
    });
  });

  $$("[data-resize-exact]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [w, h] = btn.dataset.resizeExact.split("x");
      if (resizeWidth) resizeWidth.value = w;
      if (resizeHeight) resizeHeight.value = h;
      processResizeAndConvert();
    });
  });

  $("#applyResizeBtn")?.addEventListener("click", processResizeAndConvert);
  convertFormat?.addEventListener("change", () => {
    if (sourceImage) processResizeAndConvert();
  });

  $("#downloadConvertedBtn")?.addEventListener("click", () => {
    if (!convertedBlobUrl) {
      showToast("Upload and convert an image first!");
      return;
    }
    const ext = (convertFormat?.value || "image/webp").split("/")[1].replace("jpeg", "jpg");
    const a = document.createElement("a");
    a.href = convertedBlobUrl;
    a.download = `${sourceOrigName}-resized.${ext}`;
    a.click();
    showToast(`Downloaded ${sourceOrigName}-resized.${ext}!`);
  });

  $("#sendToResizeBtn")?.addEventListener("click", () => {
    const srcUrl =
      lastGeneratedImageUrl && aiGeneratedImg?.style.display !== "none"
        ? lastGeneratedImageUrl
        : artCanvas?.toDataURL("image/png");
    if (!srcUrl) return;
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      sourceOrigBytes = Math.round(srcUrl.length * 0.75);
      sourceOrigName = "aether-ai-generated";
      if (resizeWidth) resizeWidth.value = String(img.naturalWidth);
      if (resizeHeight) resizeHeight.value = String(img.naturalHeight);
      if (origImgInfo) origImgInfo.textContent = `${img.naturalWidth}×${img.naturalHeight} • AI Image`;
      activateStudioTab("imgtool");
      processResizeAndConvert();
      showToast("Loaded into Resizer & Converter!");
    };
    img.src = srcUrl;
  });
})();
