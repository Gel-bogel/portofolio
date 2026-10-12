/* =========================================================
   Data Analyst Portfolio — main.js
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasChart = typeof window.Chart !== "undefined";

  const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const palette = () => ({
    accent: cssVar("--accent"),
    accent2: cssVar("--accent-2"),
    accent3: cssVar("--accent-3"),
    success: cssVar("--success"),
    text: cssVar("--text"),
    muted: cssVar("--muted"),
    border: cssVar("--border"),
  });
  const alpha = (hex, a) => {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };

  /* ---------- Theme ---------- */
  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };
  const savedTheme = storage.get("theme");
  if (savedTheme) root.dataset.theme = savedTheme;
  else if (window.matchMedia("(prefers-color-scheme: light)").matches) root.dataset.theme = "light";

  const charts = new Set();
  const applyChartTheme = () => {
    if (!hasChart) return;
    const p = palette();
    Chart.defaults.color = p.muted;
    Chart.defaults.borderColor = p.border;
    Chart.defaults.font.family = "'Space Grotesk', system-ui, sans-serif";
    [...charts].forEach((c) => c.$refresh && c.$refresh());
  };

  $("#themeToggle").addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    storage.set("theme", next);
    applyChartTheme();
  });
  applyChartTheme();

  /* ---------- Preloader ---------- */
  document.body.classList.add("is-loading");
  const pctEl = $("#preloaderPct");
  let pct = 0;
  const loadTick = setInterval(() => {
    pct = Math.min(100, pct + Math.ceil(Math.random() * 12));
    pctEl.textContent = pct;
    if (pct >= 100) clearInterval(loadTick);
  }, 70);
  const finishLoading = () => {
    const done = () => {
      clearInterval(loadTick);
      pctEl.textContent = "100";
      setTimeout(() => {
        $("#preloader").classList.add("is-done");
        document.body.classList.remove("is-loading");
        startTyping();
      }, 250);
    };
    pct >= 100 ? done() : setTimeout(done, Math.max(0, 900 - performance.now()));
  };
  if (document.readyState === "complete") finishLoading();
  else window.addEventListener("load", finishLoading);

  /* ---------- Custom cursor ---------- */
  const cursor = $("#cursor");
  const dot = $("#cursorDot");
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    const loop = () => {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("mouseover", (e) => {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, .project, select, input, textarea"));
    });
  }

  /* ---------- Navbar, progress, to-top ---------- */
  const nav = $("#nav");
  const progress = $("#scrollProgress");
  const toTop = $("#toTop");
  const links = $$(".nav__link");
  const sections = links.map((l) => $(l.getAttribute("href")));
  let lastY = 0;

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle("is-scrolled", y > 20);
    nav.classList.toggle("is-hidden", y > lastY && y > 400 && !navMenu.classList.contains("is-open"));
    toTop.classList.toggle("is-show", y > 700);
    lastY = y;

    let current = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    links.forEach((l, i) => l.classList.toggle("is-active", i === current));

    updateTimeline();
  };

  const navMenu = $("#navMenu");
  const burger = $("#navBurger");
  burger.addEventListener("click", () => {
    const open = navMenu.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
  });
  links.forEach((l) => l.addEventListener("click", () => {
    navMenu.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }));
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Typed text ---------- */
  const roles = ["Data Analyst.", "SQL Enthusiast.", "Dashboard Builder.", "Data Storyteller.", "Python Developer."];
  const typedEl = $("#typed");
  let typingStarted = false;
  function startTyping() {
    if (typingStarted) return;
    typingStarted = true;
    if (reduceMotion) { typedEl.textContent = roles[0]; return; }
    let r = 0, c = 0, deleting = false;
    const tick = () => {
      const word = roles[r];
      c += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, c);
      let wait = deleting ? 45 : 95;
      if (!deleting && c === word.length) { deleting = true; wait = 1600; }
      else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; wait = 350; }
      setTimeout(tick, wait);
    };
    tick();
  }

  /* ---------- Hero particle network ---------- */
  const canvas = $("#heroCanvas");
  const ctx = canvas.getContext("2d");
  let pts = [], W = 0, H = 0, dpr = 1;
  const mouse = { x: -9999, y: -9999 };

  const resizeCanvas = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (W * H) / 16000));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.8,
    }));
  };
  canvas.parentElement.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
  });
  canvas.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });

  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(canvas);

  const drawNetwork = () => {
    requestAnimationFrame(drawNetwork);
    if (!heroVisible) return;
    const p = palette();
    ctx.clearRect(0, 0, W, H);
    const LINK = 130;
    for (const a of pts) {
      if (!reduceMotion) { a.x += a.vx; a.y += a.vy; }
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;
      const dx = a.x - mouse.x, dy = a.y - mouse.y, dm = Math.hypot(dx, dy);
      if (dm < 140) { a.x += dx / dm * 1.2; a.y += dy / dm * 1.2; }
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = alpha(p.accent, (1 - d / LINK) * 0.35);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    pts.forEach((a, i) => {
      ctx.fillStyle = i % 7 === 0 ? p.accent2 : alpha(p.accent, 0.8);
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    });
  };
  resizeCanvas();
  drawNetwork();
  let resizeT;
  window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(resizeCanvas, 150); });

  /* ---------- Counters ---------- */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const dur = 1800, start = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + (target * eased).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Reveal on scroll ---------- */
  $$("[data-delay]").forEach((el) => el.style.setProperty("--d", `${el.dataset.delay}ms`));
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("is-visible");
      $$("[data-count]", el).forEach(animateCount);
      if (el.matches("[data-count]")) animateCount(el);
      revealObs.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- Tilt & magnetic ---------- */
  const addTilt = (el, max = 10) => {
    if (reduceMotion || !matchMedia("(hover: hover)").matches) return;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateY(-4px)`;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  };
  $$("[data-tilt]").forEach((el) => addTilt(el, 12));

  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Chart helper ---------- */
  // Creates a chart lazily when its canvas scrolls into view, and rebuilds it on theme change.
  const lazyChart = (canvasEl, buildConfig) => {
    if (!hasChart || !canvasEl) return null;
    const holder = { chart: null };
    const create = () => {
      if (holder.chart) { charts.delete(holder.chart); holder.chart.destroy(); }
      holder.chart = new Chart(canvasEl, buildConfig(palette()));
      holder.chart.$refresh = create;
      charts.add(holder.chart);
    };
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { create(); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(canvasEl);
    return holder;
  };

  /* ---------- Radar ---------- */
  lazyChart($("#radarChart"), (p) => ({
    type: "radar",
    data: {
      labels: ["SQL", "Python", "Visualisasi", "Statistik", "Business Sense", "Komunikasi"],
      datasets: [{
        label: "Level",
        data: [92, 88, 90, 82, 85, 87],
        backgroundColor: alpha(p.accent, 0.2),
        borderColor: p.accent,
        pointBackgroundColor: p.accent2,
        pointRadius: 4,
        borderWidth: 2,
      }],
    },
    options: {
      animation: { duration: 1600, easing: "easeOutQuart" },
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100, ticks: { display: false, stepSize: 20 },
          grid: { color: p.border }, angleLines: { color: p.border },
          pointLabels: { color: p.text, font: { size: 12, weight: "500" } },
        },
      },
    },
  }));

  /* ---------- Projects ---------- */
  const projects = [
    {
      title: "Sales Performance Dashboard", cat: "dashboard", label: "Dashboard",
      desc: "Dashboard Power BI untuk memantau penjualan, margin, dan target per cabang secara real-time.",
      problem: "Manajemen membutuhkan 2 hari untuk menyusun laporan penjualan bulanan secara manual dari banyak file Excel.",
      result: "Laporan otomatis harian, waktu penyusunan turun 95%, dan keputusan stok jadi lebih cepat.",
      metric: ["95%", "lebih cepat"], tags: ["Power BI", "DAX", "SQL Server"], type: "line",
      data: [32, 38, 35, 46, 44, 52, 58, 55, 63, 70, 68, 78],
    },
    {
      title: "Customer Churn Analysis", cat: "analysis", label: "Analisis",
      desc: "Analisis cohort dan segmentasi pelanggan untuk menemukan pemicu utama churn pada layanan berlangganan.",
      problem: "Tingkat churn naik 4% dalam dua kuartal tanpa penyebab yang jelas.",
      result: "Menemukan 3 segmen berisiko tinggi; kampanye retensi menurunkan churn 1.8 poin.",
      metric: ["-1.8pt", "churn rate"], tags: ["Python", "Pandas", "Seaborn"], type: "bar",
      data: [12, 10.5, 9.8, 9.1, 8.2, 7.4, 6.9, 6.3],
    },
    {
      title: "Demand Forecasting", cat: "ml", label: "Machine Learning",
      desc: "Model prediksi permintaan mingguan menggunakan time series & gradient boosting untuk 300+ SKU.",
      problem: "Overstock dan stockout terjadi bersamaan karena perencanaan berbasis intuisi.",
      result: "MAPE 8.7%, biaya persediaan turun 14% dalam 3 bulan pertama.",
      metric: ["8.7%", "MAPE"], tags: ["Python", "Prophet", "XGBoost"], type: "line",
      data: [40, 44, 41, 50, 53, 49, 58, 62, 60, 66, 71, 69],
    },
    {
      title: "Marketing Funnel & A/B Test", cat: "analysis", label: "Analisis",
      desc: "Evaluasi funnel akuisisi dan uji A/B halaman checkout dengan pengujian signifikansi statistik.",
      problem: "Drop-off besar di tahap checkout, tim tidak yakin variasi desain mana yang lebih baik.",
      result: "Variasi B menang signifikan (p = 0.012) dan menaikkan konversi 12%.",
      metric: ["+12%", "konversi"], tags: ["SQL", "Statistik", "BigQuery"], type: "bar",
      data: [100, 72, 48, 31, 22],
    },
    {
      title: "HR Attrition Dashboard", cat: "dashboard", label: "Dashboard",
      desc: "Dashboard Tableau interaktif untuk tim HR: turnover, kepuasan kerja, dan risiko resign.",
      problem: "HR tidak memiliki visibilitas terpadu terhadap data karyawan dari 4 sistem berbeda.",
      result: "Satu sumber kebenaran untuk 1.200 karyawan; turnover turun 6% YoY.",
      metric: ["-6%", "turnover"], tags: ["Tableau", "SQL", "ETL"], type: "doughnut",
      data: [46, 28, 16, 10],
    },
    {
      title: "Customer Segmentation (RFM + K-Means)", cat: "ml", label: "Machine Learning",
      desc: "Segmentasi pelanggan e-commerce berdasarkan Recency, Frequency, Monetary dan clustering K-Means.",
      problem: "Semua pelanggan menerima promo yang sama sehingga ROI kampanye rendah.",
      result: "5 segmen persona; ROI kampanye email naik 2.3×.",
      metric: ["2.3×", "ROI"], tags: ["Python", "Scikit-learn", "RFM"], type: "scatter",
      data: null,
    },
  ];

  const scatterData = () => Array.from({ length: 60 }, (_, i) => {
    const c = i % 3;
    return { x: [20, 55, 80][c] + (Math.random() - 0.5) * 26, y: [70, 35, 75][c] + (Math.random() - 0.5) * 26, c };
  });

  const miniConfig = (proj, p, full = false) => {
    const colors = [p.accent, p.accent3, p.accent2, p.success];
    const base = {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1400, easing: "easeOutQuart" },
      plugins: { legend: { display: full && proj.type === "doughnut", position: "right" }, tooltip: { enabled: full } },
      scales: proj.type === "doughnut" ? {} : {
        x: { display: full, grid: { display: false } },
        y: { display: full, grid: { color: p.border } },
      },
    };
    if (proj.type === "line") {
      return {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
          datasets: [{
            data: proj.data, borderColor: p.accent, borderWidth: 2.5, tension: 0.4, fill: true,
            pointRadius: full ? 3 : 0,
            backgroundColor: (c) => {
              const { ctx: g, chartArea } = c.chart;
              if (!chartArea) return alpha(p.accent, 0.2);
              const grad = g.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              grad.addColorStop(0, alpha(p.accent, 0.4));
              grad.addColorStop(1, alpha(p.accent, 0));
              return grad;
            },
          }],
        },
        options: base,
      };
    }
    if (proj.type === "bar") {
      const labels = proj.data.length === 5
        ? ["Visit", "Product", "Cart", "Checkout", "Paid"]
        : proj.data.map((_, i) => `Q${i + 1}`);
      return {
        type: "bar",
        data: { labels, datasets: [{ data: proj.data, backgroundColor: proj.data.map((_, i) => alpha(i % 2 ? p.accent3 : p.accent, 0.85)), borderRadius: 6 }] },
        options: base,
      };
    }
    if (proj.type === "doughnut") {
      return {
        type: "doughnut",
        data: { labels: ["Karier", "Gaji", "Manajemen", "Lainnya"], datasets: [{ data: proj.data, backgroundColor: colors, borderWidth: 0 }] },
        options: { ...base, cutout: "68%", animation: { animateRotate: true, duration: 1600 } },
      };
    }
    const pts = proj._scatter || (proj._scatter = scatterData());
    return {
      type: "scatter",
      data: {
        datasets: [0, 1, 2].map((c) => ({
          label: `Cluster ${c + 1}`,
          data: pts.filter((d) => d.c === c),
          backgroundColor: alpha(colors[c], 0.8),
          pointRadius: full ? 5 : 3,
        })),
      },
      options: { ...base, plugins: { ...base.plugins, legend: { display: full } } },
    };
  };

  const grid = $("#projectGrid");
  let projectCharts = [];

  const renderProjects = (filter) => {
    projectCharts.forEach((h) => { if (h?.chart) { charts.delete(h.chart); h.chart.destroy(); } });
    projectCharts = [];
    grid.innerHTML = "";
    projects
      .map((proj, idx) => ({ proj, idx }))
      .filter(({ proj }) => filter === "all" || proj.cat === filter)
      .forEach(({ proj, idx }, i) => {
        const card = document.createElement("article");
        card.className = "project";
        card.style.setProperty("--i", `${i * 90}ms`);
        card.tabIndex = 0;
        card.innerHTML = `
          <div class="project__thumb">
            <span class="project__cat">${proj.label}</span>
            <canvas></canvas>
          </div>
          <div class="project__body">
            <h3>${proj.title}</h3>
            <p>${proj.desc}</p>
            <div class="project__metric"><strong>${proj.metric[0]}</strong>${proj.metric[1]}</div>
            <div class="tags">${proj.tags.map((t) => `<span>${t}</span>`).join("")}</div>
            <span class="project__more">Lihat studi kasus
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </div>`;
        grid.appendChild(card);
        addTilt(card, 8);
        card.addEventListener("click", () => openModal(idx));
        card.addEventListener("keydown", (e) => { if (e.key === "Enter") openModal(idx); });
        projectCharts.push(lazyChart($("canvas", card), (p) => miniConfig(proj, p)));
      });
  };

  const filterBtns = $$(".filter");
  const indicator = $("#filterIndicator");
  const moveIndicator = (btn) => {
    indicator.style.width = `${btn.offsetWidth}px`;
    indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
  };
  filterBtns.forEach((btn) => btn.addEventListener("click", () => {
    if (btn.classList.contains("is-active")) return;
    filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    moveIndicator(btn);
    const cards = $$(".project", grid);
    cards.forEach((c) => c.classList.add("is-leaving"));
    setTimeout(() => renderProjects(btn.dataset.filter), cards.length ? 320 : 0);
  }));
  renderProjects("all");
  requestAnimationFrame(() => moveIndicator($(".filter.is-active")));
  window.addEventListener("resize", () => moveIndicator($(".filter.is-active")));
  document.fonts?.ready.then(() => moveIndicator($(".filter.is-active")));

  /* ---------- Modal ---------- */
  const modal = $("#modal");
  let modalChart = null, lastFocus = null;
  const openModal = (idx) => {
    const proj = projects[idx];
    lastFocus = document.activeElement;
    $("#modalCat").textContent = proj.label;
    $("#modalTitle").textContent = proj.title;
    $("#modalDesc").textContent = proj.desc;
    $("#modalProblem").textContent = proj.problem;
    $("#modalResult").textContent = proj.result;
    $("#modalTags").innerHTML = proj.tags.map((t) => `<span>${t}</span>`).join("");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (hasChart) {
      modalChart?.destroy();
      setTimeout(() => {
        modalChart = new Chart($("#modalChart"), miniConfig(proj, palette(), true));
      }, 200);
    }
    $(".modal__close").focus();
  };
  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus?.focus();
  };
  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });

  /* ---------- Interactive dashboard ---------- */
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const regionFactor = { all: 1, jawa: 0.52, sumatra: 0.22, kalimantan: 0.14, sulawesi: 0.12 };
  const yearGrowth = { 2024: 1, 2025: 1.18, 2026: 1.34 };
  let seedOffset = 0;

  // Deterministic pseudo-random generator so each filter combination is stable until "Acak data".
  const rng = (seed) => () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const buildDataset = (year, region) => {
    const rand = rng(Number(year) * 7 + Object.keys(regionFactor).indexOf(region) * 131 + seedOffset * 977);
    const f = regionFactor[region] * yearGrowth[year];
    const revenue = months.map((_, i) => Math.round((820 + i * 38 + Math.sin(i / 1.8) * 120 + rand() * 160) * f));
    const target = months.map((_, i) => Math.round((850 + i * 35) * f));
    const categories = [30 + rand() * 12, 22 + rand() * 10, 16 + rand() * 8, 10 + rand() * 8, 6 + rand() * 6].map(Math.round);
    const channels = [42 + rand() * 20, 28 + rand() * 16, 18 + rand() * 12, 10 + rand() * 10].map(Math.round);
    const orders = Math.round(revenue.reduce((a, b) => a + b, 0) * (4.1 + rand() * 0.6));
    const csat = 4.1 + rand() * 0.7;
    return { revenue, target, categories, channels, orders, csat };
  };

  const fmtRp = (jt) => jt >= 1000 ? `Rp${(jt / 1000).toFixed(2)} M` : `Rp${jt} jt`;
  const fmtNum = (n) => n.toLocaleString("id-ID");

  let state = { year: "2024", region: "all" };
  let current = buildDataset(state.year, state.region);
  let previous = null;
  let lineC = null, doughC = null, barC = null;

  const lineConfig = (p) => ({
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Revenue", data: current.revenue, borderColor: p.accent, borderWidth: 3, tension: 0.4, fill: true,
          pointBackgroundColor: p.accent, pointRadius: 3, pointHoverRadius: 7,
          backgroundColor: (c) => {
            const { ctx: g, chartArea } = c.chart;
            if (!chartArea) return alpha(p.accent, 0.2);
            const grad = g.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            grad.addColorStop(0, alpha(p.accent, 0.35));
            grad.addColorStop(1, alpha(p.accent, 0));
            return grad;
          },
        },
        { label: "Target", data: current.target, borderColor: p.accent2, borderDash: [6, 6], borderWidth: 2, pointRadius: 0, tension: 0.4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 1200, easing: "easeOutQuart" },
      plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: p.border } } },
    },
  });
  const doughnutConfig = (p) => ({
    type: "doughnut",
    data: {
      labels: ["Elektronik", "Fashion", "Rumah Tangga", "Kecantikan", "Lainnya"],
      datasets: [{ data: current.categories, backgroundColor: [p.accent, p.accent3, p.accent2, p.success, p.muted], borderWidth: 0, hoverOffset: 12 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "65%",
      animation: { animateRotate: true, animateScale: true, duration: 1400 },
      plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 14 } } },
    },
  });
  const barConfig = (p) => ({
    type: "bar",
    data: {
      labels: ["Marketplace", "Website", "Toko Fisik", "Sosial Media"],
      datasets: [{ label: "Share (%)", data: current.channels, backgroundColor: [p.accent, p.accent3, p.accent2, p.success].map((c) => alpha(c, 0.85)), borderRadius: 8, borderSkipped: false }],
    },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      animation: { duration: 1200, easing: "easeOutBack" },
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: p.border } }, y: { grid: { display: false } } },
    },
  });

  const setTrend = (el, now, before, suffix = "%") => {
    if (!before) { el.textContent = "vs. periode lalu: —"; el.className = ""; return; }
    const diff = ((now - before) / before) * 100;
    el.textContent = `${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff).toFixed(1)}${suffix} vs. sebelumnya`;
    el.className = diff >= 0 ? "up" : "down";
  };

  const tweenNumber = (el, from, to, format) => {
    const start = performance.now(), dur = 900;
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = format(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    el.parentElement.classList.remove("flash");
    void el.offsetWidth;
    el.parentElement.classList.add("flash");
  };

  const renderKpis = () => {
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const rev = sum(current.revenue);
    const aov = (rev * 1e6) / current.orders;
    const prevRev = previous ? sum(previous.revenue) : 0;
    const prevAov = previous ? (prevRev * 1e6) / previous.orders : 0;

    tweenNumber($("#kpiRevenue"), prevRev, rev, (v) => fmtRp(Math.round(v)));
    tweenNumber($("#kpiOrders"), previous?.orders || 0, current.orders, (v) => fmtNum(Math.round(v)));
    tweenNumber($("#kpiAov"), prevAov, aov, (v) => `Rp${fmtNum(Math.round(v))}`);
    tweenNumber($("#kpiCsat"), previous?.csat || 0, current.csat, (v) => `${v.toFixed(2)} / 5`);

    setTrend($("#kpiRevenueTrend"), rev, prevRev);
    setTrend($("#kpiOrdersTrend"), current.orders, previous?.orders);
    setTrend($("#kpiAovTrend"), aov, prevAov);
    setTrend($("#kpiCsatTrend"), current.csat, previous?.csat);

    // Auto insights
    const best = current.revenue.indexOf(Math.max(...current.revenue));
    const worst = current.revenue.indexOf(Math.min(...current.revenue));
    const above = current.revenue.filter((v, i) => v >= current.target[i]).length;
    const catLabels = ["Elektronik", "Fashion", "Rumah Tangga", "Kecantikan", "Lainnya"];
    const topCat = catLabels[current.categories.indexOf(Math.max(...current.categories))];
    const chLabels = ["Marketplace", "Website", "Toko Fisik", "Sosial Media"];
    const topCh = chLabels[current.channels.indexOf(Math.max(...current.channels))];
    const h1 = sum(current.revenue.slice(0, 6)), h2 = sum(current.revenue.slice(6));
    const items = [
      ["📈", `Revenue tertinggi terjadi di bulan <b>${months[best]}</b> (${fmtRp(current.revenue[best])}), terendah di <b>${months[worst]}</b>.`],
      ["🎯", `Target tercapai pada <b>${above} dari 12</b> bulan (${Math.round((above / 12) * 100)}%).`],
      ["🛒", `Kategori <b>${topCat}</b> menyumbang porsi terbesar, kanal <b>${topCh}</b> paling dominan.`],
      ["🔍", `Semester 2 ${h2 >= h1 ? "tumbuh" : "turun"} <b>${Math.abs(((h2 - h1) / h1) * 100).toFixed(1)}%</b> dibanding semester 1.`],
    ];
    $("#insightList").innerHTML = items
      .map(([icon, txt], i) => `<li style="--i:${i * 110}ms"><span>${icon}</span><p>${txt}</p></li>`)
      .join("");
  };

  const updateDashboard = () => {
    previous = current;
    current = buildDataset(state.year, state.region);
    [[lineC, (c) => { c.data.datasets[0].data = current.revenue; c.data.datasets[1].data = current.target; }],
     [doughC, (c) => { c.data.datasets[0].data = current.categories; }],
     [barC, (c) => { c.data.datasets[0].data = current.channels; }]]
      .forEach(([h, fn]) => { if (h?.chart) { fn(h.chart); h.chart.update(); } });
    renderKpis();
  };

  lineC = lazyChart($("#lineChart"), lineConfig);
  doughC = lazyChart($("#doughnutChart"), doughnutConfig);
  barC = lazyChart($("#barChart"), barConfig);

  const kpiObs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { renderKpis(); kpiObs.disconnect(); }
  }, { threshold: 0.3 });
  kpiObs.observe($(".board__kpis"));

  $$("#periodSeg button").forEach((btn) => btn.addEventListener("click", () => {
    $$("#periodSeg button").forEach((b) => b.classList.toggle("is-active", b === btn));
    state.year = btn.dataset.period;
    updateDashboard();
  }));
  $("#regionSelect").addEventListener("change", (e) => { state.region = e.target.value; updateDashboard(); });
  $("#shuffleBtn").addEventListener("click", () => { seedOffset++; updateDashboard(); });

  /* ---------- Timeline progress ---------- */
  const timeline = $("#timeline");
  const tlProgress = $("#timelineProgress");
  function updateTimeline() {
    const r = timeline.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    tlProgress.style.height = `${k * 100}%`;
  }

  /* ---------- Contact form ---------- */
  const form = $("#contactForm");
  const topic = $("#topic");
  topic.addEventListener("change", () => topic.classList.toggle("has-value", !!topic.value));

  const validators = {
    name: (v) => v.trim().length > 1,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    topic: (v) => !!v,
    message: (v) => v.trim().length >= 10,
  };
  const validateField = (el) => {
    const ok = validators[el.name](el.value);
    const field = el.closest(".field");
    field.classList.remove("is-invalid");
    if (!ok) { void field.offsetWidth; field.classList.add("is-invalid"); }
    return ok;
  };
  $$("input, textarea, select", form).forEach((el) => {
    el.addEventListener("blur", () => el.value && validateField(el));
    el.addEventListener("input", () => el.closest(".field").classList.contains("is-invalid") && validateField(el));
  });

  const toast = $("#toast");
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-show");
    setTimeout(() => toast.classList.remove("is-show"), 3500);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = $$("input, textarea, select", form);
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) return;
    const btn = $("#submitBtn");
    btn.classList.add("is-loading");
    btn.disabled = true;
    // Simulated send — connect to a form service (Formspree, EmailJS, etc.) for real delivery.
    setTimeout(() => {
      btn.classList.remove("is-loading");
      btn.disabled = false;
      form.reset();
      topic.classList.remove("has-value");
      showToast(`✓ Terima kasih! Pesan Anda berhasil dikirim.`);
    }, 1400);
  });

  $("#cvBtn").addEventListener("click", (e) => {
    e.preventDefault();
    showToast("📄 Tambahkan file CV Anda di folder assets/ untuk mengaktifkan unduhan.");
  });

  /* ---------- Misc ---------- */
  $("#year").textContent = new Date().getFullYear();
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
