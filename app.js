(() => {
  const $ = (id) => document.getElementById(id);

  const presets = {
    fullframe: { w: 36, h: 24, coc: 0.029 },
    apsc: { w: 23.5, h: 15.6, coc: null },
    m43: { w: 17.3, h: 13, coc: null },
    medium: { w: 44, h: 33, coc: null },
    oneinch: { w: 13.2, h: 8.8, coc: null },
    custom: { w: 36, h: 24, coc: null }
  };

  const state = {
    unit: localStorage.getItem("dof-unit") || "metric",
    lensPreset: null,
    loadedFromUrl: false,
    sensor: "fullframe",
    focal: 50,
    aperture: 2.8,
    distanceM: 3,
    sensorW: 36,
    sensorH: 24,
    coc: 0.029
  };

  const fmt = (n, decimals = 2) =>
    new Intl.NumberFormat("es-AR", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n);

  function displayDistance(m, compact = false) {
    if (!Number.isFinite(m)) return "∞";
    const v = state.unit === "metric" ? m : m * 3.280839895;
    const unit = state.unit === "metric" ? "m" : "ft";
    if (compact) {
      if (v >= 1000) return `${fmt(v / 1000, 1)}k ${unit}`;
      if (v >= 100) return `${fmt(v, 0)} ${unit}`;
      if (v >= 10) return `${fmt(v, 1)} ${unit}`;
      return `${fmt(v, 2)} ${unit}`;
    }
    if (v >= 100) return `${fmt(v, 1)} ${unit}`;
    return `${fmt(v, 2)} ${unit}`;
  }


  const cameraPresets = {
    portrait: { sensor:"fullframe", focal:85, aperture:1.8, distanceM:2.4 },
    street: { sensor:"fullframe", focal:35, aperture:4, distanceM:5 },
    landscape: { sensor:"fullframe", focal:24, aperture:8, distanceM:8 },
    macro: { sensor:"fullframe", focal:100, aperture:8, distanceM:0.55 },
    wildlife: { sensor:"fullframe", focal:400, aperture:5.6, distanceM:25 }
  };

  function encodeState() {
    const p = new URLSearchParams({
      s: state.sensor, f: state.focal, a: state.aperture,
      d: state.distanceM, c: state.coc, u: state.unit,
      w: state.sensorW, h: state.sensorH
    });
    return `${location.origin}${location.pathname}?${p.toString()}`;
  }

  function loadStateFromUrl() {
    const p = new URLSearchParams(location.search);
    if (!p.has("f") && !p.has("a") && !p.has("d")) return;
    const n = (key, fallback) => {
      const v = Number(p.get(key));
      return Number.isFinite(v) ? v : fallback;
    };
    state.sensor = p.get("s") || state.sensor;
    state.focal = n("f", state.focal);
    state.aperture = n("a", state.aperture);
    state.distanceM = n("d", state.distanceM);
    state.coc = n("c", state.coc);
    state.sensorW = n("w", state.sensorW);
    state.sensorH = n("h", state.sensorH);
    state.unit = p.get("u") === "imperial" ? "imperial" : "metric";
    state.loadedFromUrl = true;
  }

  function applyCameraPreset(name) {
    const p = cameraPresets[name];
    if (!p) return;
    state.sensor = p.sensor;
    state.focal = p.focal;
    state.aperture = p.aperture;
    state.distanceM = p.distanceM;
    const sensor = presets[state.sensor];
    state.sensorW = sensor.w; state.sensorH = sensor.h;
    state.coc = sensor.coc ?? Math.sqrt(sensor.w*sensor.w + sensor.h*sensor.h) / 1500;
    $("sensorPreset").value = state.sensor;
    state.lensPreset = name;
    document.querySelectorAll("[data-preset]").forEach(b => b.classList.toggle("active", b.dataset.preset === name));
    updateUI();
  }

  function showToast(message) {
    const el = $("shareToast");
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1800);
  }

  let deferredInstallPrompt = null;

  function calculate() {
    const f = state.focal;           // mm
    const N = state.aperture;
    const c = state.coc;             // mm
    const s = state.distanceM * 1000; // mm
    const H = (f * f) / (N * c) + f;
    const near = (H * s) / (H + (s - f));
    const far = s >= H ? Infinity : (H * s) / (H - (s - f));
    const depth = Number.isFinite(far) ? far - near : Infinity;
    return { H: H / 1000, near: near / 1000, far: far / 1000, depth };
  }

  function updateInputs() {
    $("focal").value = state.focal;
    $("aperture").value = state.aperture;
    $("distance").value = state.distanceM;
    $("sensorW").value = state.sensorW;
    $("sensorH").value = state.sensorH;
    $("coc").value = state.coc.toFixed(3);
    $("focalOut").value = `${fmt(state.focal,0)} mm`;
    $("apertureOut").value = `f/${fmt(state.aperture,1)}`;
    $("distanceOut").value = displayDistance(state.distanceM, true);
    $("distanceUnit").textContent = state.unit === "metric" ? "m" : "ft";
    document.querySelectorAll(".unit-btn").forEach(b => b.classList.toggle("active", b.dataset.unit === state.unit));
  }

  function updateUI() {
    updateInputs();
    const r = calculate();
    $("dofValue").textContent = displayDistance(r.depth);
    $("nearValue").textContent = displayDistance(r.near);
    $("farValue").textContent = displayDistance(r.far);
    $("hyperValue").textContent = displayDistance(r.H);
    $("farNote").textContent = Number.isFinite(r.far) ? "punto más lejano aceptablemente nítido" : "la profundidad se extiende hasta infinito";
    const front = state.distanceM - r.near;
    const behind = Number.isFinite(r.far) ? r.far - state.distanceM : Infinity;
    $("frontValue").textContent = displayDistance(front, true);
    $("behindValue").textContent = displayDistance(behind, true);
    $("focusReadout").textContent = displayDistance(state.distanceM, true);
    $("dofSplit").textContent = Number.isFinite(r.depth) ? `${displayDistance(front, true)} delante · ${displayDistance(behind, true)} detrás` : "desde aquí, el fondo se extiende a infinito";
    $("cocInfo").textContent = `${fmt(state.coc,3)} mm · sensor ${fmt(state.sensorW,1)} × ${fmt(state.sensorH,1)} mm`;
    const ratio = Number.isFinite(behind) && front > 0 ? (behind / front).toFixed(1) : "∞";
    $("ratioInfo").textContent = Number.isFinite(behind) ? `Aproximadamente ${fmt(front / (r.depth || 1) * 100,0)}% delante y ${fmt(behind / (r.depth || 1) * 100,0)}% detrás · relación ${ratio}:1.` : "La zona detrás del sujeto continúa hasta infinito.";
    $("tipInfo").textContent = state.distanceM >= r.H ? "Ya estás en o más allá de la hiperfocal: el fondo llega hasta infinito." : `La hiperfocal es ${displayDistance(r.H)}. Enfocar allí maximiza la profundidad útil.`;
    drawChart(r);
  }

  function setSensor(preset) {
    state.sensor = preset;
    const p = presets[preset];
    state.sensorW = p.w; state.sensorH = p.h;
    state.coc = p.coc ?? Math.sqrt(p.w*p.w + p.h*p.h) / 1500;
    $("sensorW").disabled = preset !== "custom";
    $("sensorH").disabled = preset !== "custom";
    $("coc").disabled = false;
    updateUI();
  }

  function drawChart(r) {
    const svg = $("dofChart");
    const W = 1000, H = 430;
    const left = 65, right = 35, y = 225;
    const maxBase = Math.max(state.distanceM * 2.2, Number.isFinite(r.far) ? r.far * 1.25 : r.H * 1.25, r.H * .6, 8);
    const minX = 0;
    const maxX = Math.max(maxBase, state.distanceM + 2);
    const x = d => left + (Math.log10(Math.max(d, 0.03)) - Math.log10(0.03)) /
      (Math.log10(maxX) - Math.log10(0.03)) * (W-left-right);
    const nearX = x(Math.max(r.near, 0.03));
    const focusX = x(state.distanceM);
    const farX = Number.isFinite(r.far) ? x(Math.max(r.far, 0.03)) : W-right;
    const hyperX = x(Math.min(r.H, maxX));

    let ticks = [0.1,0.3,1,3,10,30,100,300,1000].filter(v => v < maxX && v >= 0.03);
    const label = d => displayDistance(d, true).replace(" ", "");
    svg.innerHTML = `
      <defs>
        <linearGradient id="focusGrad" x1="0" x2="1"><stop offset="0" stop-color="#8cf0bc" stop-opacity=".18"/><stop offset=".5" stop-color="#36bf7a" stop-opacity=".30"/><stop offset="1" stop-color="#8cf0bc" stop-opacity=".18"/></linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-opacity=".08"/></filter>
      </defs>
      <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
      <line x1="${left}" y1="${y}" x2="${W-right}" y2="${y}" stroke="var(--line)" stroke-width="3"/>
      <rect x="${nearX}" y="125" width="${Math.max(4,farX-nearX)}" height="200" rx="20" fill="url(#focusGrad)"/>
      ${ticks.map(t=>`<g><line x1="${x(t)}" y1="205" x2="${x(t)}" y2="245" stroke="var(--line)"/><text x="${x(t)}" y="270" text-anchor="middle" font-size="11" fill="var(--muted)">${label(t)}</text></g>`).join("")}
      <text x="${left}" y="55" font-size="11" fill="var(--muted)" font-weight="700">CÁMARA</text>
      <g transform="translate(${left-28},${y-37})">
        <rect x="0" y="12" width="55" height="48" rx="9" fill="var(--dark)" filter="url(#shadow)"/>
        <circle cx="28" cy="36" r="14" fill="none" stroke="#8cf0bc" stroke-width="4"/>
        <circle cx="28" cy="36" r="5" fill="#8cf0bc"/>
      </g>
      <line x1="${nearX}" y1="115" x2="${nearX}" y2="335" stroke="#36bf7a" stroke-width="2" stroke-dasharray="6 6"/>
      <line x1="${farX}" y1="115" x2="${farX}" y2="335" stroke="#36bf7a" stroke-width="2" stroke-dasharray="6 6"/>
      <text x="${nearX}" y="105" text-anchor="middle" font-size="10" fill="var(--muted)">CERCANO</text>
      <text x="${farX}" y="105" text-anchor="middle" font-size="10" fill="var(--muted)">${Number.isFinite(r.far) ? "LEJANO" : "∞"}</text>
      <line x1="${hyperX}" y1="72" x2="${hyperX}" y2="360" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 5"/>
      <text x="${hyperX}" y="63" text-anchor="middle" font-size="10" fill="var(--muted)">HIPERFOCAL</text>
      <g class="drag-subject" data-drag="subject">
        <line x1="${focusX}" y1="105" x2="${focusX}" y2="340" stroke="var(--dark)" stroke-width="2"/>
        <circle cx="${focusX}" cy="${y}" r="18" fill="var(--dark)"/>
        <circle cx="${focusX}" cy="${y}" r="7" fill="#8cf0bc"/>
        <text x="${focusX}" y="350" text-anchor="middle" font-size="11" fill="var(--ink)" font-weight="800">SUJETO</text>
      </g>
      <text x="${(nearX+farX)/2}" y="145" text-anchor="middle" font-size="12" fill="var(--accent-strong)" font-weight="800">ZONA ENFOCADA</text>
      <g transform="translate(${Math.max(left+25, focusX+35)},${y-82})">
        <rect width="130" height="42" rx="10" fill="var(--panel)" stroke="var(--line)"/>
        <text x="65" y="17" text-anchor="middle" font-size="9" fill="var(--muted)">DISTANCIA</text>
        <text x="65" y="32" text-anchor="middle" font-size="12" fill="var(--ink)" font-weight="800">${displayDistance(state.distanceM,true)}</text>
      </g>
    `;

    const subject = svg.querySelector('[data-drag="subject"]');
    subject.addEventListener("pointerdown", e => {
      subject.setPointerCapture(e.pointerId);
      const move = ev => {
        const rect = svg.getBoundingClientRect();
        const px = (ev.clientX - rect.left) / rect.width * W;
        const ratio = Math.max(0, Math.min(1, (px-left)/(W-left-right)));
        const logD = Math.log10(0.03) + ratio * (Math.log10(maxX)-Math.log10(0.03));
        const d = Math.pow(10, logD);
        state.distanceM = Math.max(.15, Math.min(1000, d));
        updateUI();
      };
      const up = () => { subject.removeEventListener("pointermove", move); subject.removeEventListener("pointerup", up); };
      subject.addEventListener("pointermove", move);
      subject.addEventListener("pointerup", up);
    });
  }

  $("sensorPreset").addEventListener("change", e => setSensor(e.target.value));
  $("sensorW").addEventListener("input", e => { state.sensorW = +e.target.value || 1; state.sensor="custom"; $("sensorPreset").value="custom"; state.coc=Math.sqrt(state.sensorW**2+state.sensorH**2)/1500; $("coc").value=state.coc.toFixed(3); updateUI(); });
  $("sensorH").addEventListener("input", e => { state.sensorH = +e.target.value || 1; state.sensor="custom"; $("sensorPreset").value="custom"; state.coc=Math.sqrt(state.sensorW**2+state.sensorH**2)/1500; $("coc").value=state.coc.toFixed(3); updateUI(); });
  $("coc").addEventListener("input", e => { state.coc = Math.max(.001,+e.target.value || .001); updateUI(); });
  $("focal").addEventListener("input", e => { state.focal=+e.target.value; updateUI(); });
  $("aperture").addEventListener("input", e => { state.aperture=+e.target.value; updateUI(); });
  $("distance").addEventListener("input", e => { state.distanceM=+e.target.value; updateUI(); });
  document.querySelectorAll(".unit-btn").forEach(b => b.addEventListener("click", () => { state.unit=b.dataset.unit; localStorage.setItem("dof-unit",state.unit); updateUI(); }));
  document.querySelectorAll("[data-distance]").forEach(b => b.addEventListener("click", () => { state.distanceM=+b.dataset.distance; updateUI(); }));
  $("hyperfocalBtn").addEventListener("click", () => { state.distanceM=Math.min(1000,calculate().H); updateUI(); });
  $("resetBtn").addEventListener("click", () => {
    Object.assign(state,{sensor:"fullframe",focal:50,aperture:2.8,distanceM:3,sensorW:36,sensorH:24,coc:.029,lensPreset:null});
    $("sensorPreset").value="fullframe";
    document.querySelectorAll("[data-preset]").forEach(b => b.classList.remove("active"));
    history.replaceState(null,"",location.pathname);
    updateUI();
  });

  document.querySelectorAll("[data-preset]").forEach(b =>
    b.addEventListener("click", () => applyCameraPreset(b.dataset.preset))
  );

  $("shareBtn").addEventListener("click", async () => {
    const url = encodeState();
    history.replaceState(null, "", url);
    if (navigator.share) {
      try {
        await navigator.share({ title: "DoF Studio", text: "Configuración de profundidad de campo", url });
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Configuración copiada al portapapeles");
    } catch (_) {
      window.prompt("Copia esta configuración:", url);
    }
  });

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    $("installBtn").hidden = false;
  });

  $("installBtn").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $("installBtn").hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    $("installBtn").hidden = true;
    showToast("DoF Studio instalado");
  });

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  $("themeBtn").addEventListener("click", () => document.body.classList.toggle("dark"));

  loadStateFromUrl();
  $("sensorPreset").value = state.sensor;
  $("sensorW").disabled = state.sensor !== "custom";
  updateUI();
})();