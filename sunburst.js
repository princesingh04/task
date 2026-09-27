/**
 * Cosmic Sunburst Web Component (<cosmic-sunburst>)
 * Universal, framework-agnostic interactive sunburst animation.
 * 
 * Usage:
 *   <script src="sunburst.js"></script>
 *   <cosmic-sunburst theme="sunrise" speed="920" rays="180"></cosmic-sunburst>
 */

const THEMES = [
  {
    id: "sunrise",
    name: "Sunrise Amber",
    bgGradient: "radial-gradient(ellipse 80% 60% at 50% -10%, #1e130c 0%, #0d0907 50%, #050403 100%)",
    stops: {
      rayStart: "#ffeeaa",
      rayMid: "#ff9933",
      rayEnd: "#cc3300",
      glowCore: "rgba(255, 170, 50, 0.4)",
      glowMid: "rgba(255, 100, 20, 0.12)"
    },
    dotColor: "#ffe4a0",
    spotlight: "rgba(255, 160, 50, 0.16)"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    bgGradient: "radial-gradient(ellipse 80% 60% at 50% -10%, #150928 0%, #0b0518 50%, #04020a 100%)",
    stops: {
      rayStart: "#00ffff",
      rayMid: "#bf00ff",
      rayEnd: "#ff007f",
      glowCore: "rgba(191, 0, 255, 0.35)",
      glowMid: "rgba(0, 255, 255, 0.12)"
    },
    dotColor: "#00ffff",
    spotlight: "rgba(191, 0, 255, 0.16)"
  },
  {
    id: "sunset",
    name: "Sunset Crimson",
    bgGradient: "radial-gradient(ellipse 80% 60% at 50% -10%, #260a16 0%, #13040b 50%, #060104 100%)",
    stops: {
      rayStart: "#ffe066",
      rayMid: "#ff3366",
      rayEnd: "#790038",
      glowCore: "rgba(255, 51, 102, 0.38)",
      glowMid: "rgba(255, 150, 50, 0.12)"
    },
    dotColor: "#ffe066",
    spotlight: "rgba(255, 51, 102, 0.16)"
  },
  {
    id: "emerald",
    name: "Emerald Aurora",
    bgGradient: "radial-gradient(ellipse 80% 60% at 50% -10%, #061c16 0%, #030f0c 50%, #010605 100%)",
    stops: {
      rayStart: "#a8ffb2",
      rayMid: "#00d68f",
      rayEnd: "#005238",
      glowCore: "rgba(0, 214, 143, 0.35)",
      glowMid: "rgba(50, 255, 180, 0.1)"
    },
    dotColor: "#a8ffb2",
    spotlight: "rgba(0, 214, 143, 0.15)"
  },
  {
    id: "twilight",
    name: "Deep Twilight",
    bgGradient: "radial-gradient(ellipse 80% 60% at 50% -10%, #0a1128 0%, #050814 50%, #020308 100%)",
    stops: {
      rayStart: "#cbe5ff",
      rayMid: "#4d88ff",
      rayEnd: "#142666",
      glowCore: "rgba(77, 136, 255, 0.38)",
      glowMid: "rgba(100, 180, 255, 0.12)"
    },
    dotColor: "#cbe5ff",
    spotlight: "rgba(77, 136, 255, 0.16)"
  },
  {
    id: "minimalist",
    name: "Monochrome Silver",
    bgGradient: "radial-gradient(ellipse 80% 60% at 50% -10%, #202022 0%, #111112 50%, #060607 100%)",
    stops: {
      rayStart: "#ffffff",
      rayMid: "#aaaaaa",
      rayEnd: "#333333",
      glowCore: "rgba(255, 255, 255, 0.25)",
      glowMid: "rgba(200, 200, 200, 0.08)"
    },
    dotColor: "#ffffff",
    spotlight: "rgba(255, 255, 255, 0.12)"
  }
];

class CosmicSunburst extends HTMLElement {
  static get observedAttributes() {
    return ["theme", "speed", "radius", "rays", "spotlight"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._theme = "sunrise";
    this._speed = 920;
    this._radius = 88;
    this._rayCount = 180;
    this._hasSpotlight = true;

    this.activeLoopRays = new Set();
    this.rayDataList = [];
    this.animFrameId = null;

    this.mouseActive = false;
    this.targetX = 500;
    this.targetY = 310;
    this.currentX = 500;
    this.currentY = 310;
    this.targetOp = 0;
    this.currentOp = 0;
    this.lastMouseX = 500;
    this.mouseDir = 1;

    this.panelLeft = 0;
    this.panelTop = 0;
    this.panelWidth = 1000;
    this.panelHeight = 620;

    this.ORIGIN_X = 500;
    this.ORIGIN_Y = 630;
  }

  connectedCallback() {
    this._readAttributes();
    this._render();
    this._bindEvents();
  }

  disconnectedCallback() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.shadowRoot) return;
    this._readAttributes();
    if (name === "theme") {
      this._applyTheme(this._theme);
    } else if (name === "rays") {
      this._buildSunburst();
    }
  }

  _readAttributes() {
    if (this.hasAttribute("theme")) this._theme = this.getAttribute("theme");
    if (this.hasAttribute("speed")) this._speed = parseFloat(this.getAttribute("speed")) || 920;
    if (this.hasAttribute("radius")) this._radius = parseFloat(this.getAttribute("radius")) || 88;
    if (this.hasAttribute("rays")) this._rayCount = parseInt(this.getAttribute("rays"), 10) || 180;
    if (this.hasAttribute("spotlight")) this._hasSpotlight = this.getAttribute("spotlight") !== "false";
  }

  get theme() { return this._theme; }
  set theme(val) { this.setAttribute("theme", val); }

  get speed() { return this._speed; }
  set speed(val) { this.setAttribute("speed", val); }

  setTheme(themeId) {
    this.theme = themeId;
  }

  cycleTheme() {
    const idx = THEMES.findIndex(t => t.id === this._theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    this.setTheme(next.id);
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 380px;
          overflow: hidden;
          background: #050403;
          border-radius: inherit;
        }

        .container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          transition: background 0.65s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glow-backdrop {
          position: absolute;
          bottom: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 580px;
          height: 580px;
          border-radius: 50%;
          pointer-events: none;
          transition: background 0.65s ease, opacity 0.65s ease;
        }

        .cursor-spotlight {
          position: absolute;
          top: -120px;
          left: -120px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          will-change: transform, opacity;
          mix-blend-mode: screen;
          filter: blur(28px);
        }

        .sunburst-svg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          display: block;
        }

        .burst-ray {
          stroke: url(#rayRadialGrad);
          stroke-linecap: round;
          pointer-events: auto;
          cursor: pointer;
          animation: ray-shoot 1.3s cubic-bezier(0.16, 1, 0.3, 1) var(--shoot-del, 0s) both;
          transition: opacity 0.6s ease;
        }

        @keyframes ray-shoot {
          0% { stroke-dashoffset: var(--len); opacity: 0; }
          20% { opacity: var(--base-op); }
          100% { stroke-dashoffset: 0; opacity: var(--base-op); }
        }

        .burst-dot {
          pointer-events: auto;
          cursor: pointer;
          animation: dot-bloom 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--shoot-del, 0s) + 0.75s) both;
          transition: fill 0.6s ease, opacity 0.6s ease;
        }

        @keyframes dot-bloom {
          0% { opacity: 0; transform: scale(0); }
          70% { opacity: 1; transform: scale(1.45); }
          100% { opacity: var(--base-op); transform: scale(1); }
        }

        stop {
          transition: stop-color 0.65s ease, stop-opacity 0.65s ease;
        }
      </style>

      <div class="container" id="container">
        <div class="glow-backdrop" id="glowBackdrop"></div>
        <div class="cursor-spotlight" id="cursorSpotlight"></div>
        <svg class="sunburst-svg" id="sunburstSvg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMax slice">
          <defs>
            <radialGradient id="rayRadialGrad" cx="50%" cy="100%" r="95%" fx="50%" fy="100%">
              <stop id="rayStopStart" offset="0%" stop-color="#ffeeaa" stop-opacity="0.9" />
              <stop id="rayStopMid" offset="55%" stop-color="#ff9933" stop-opacity="0.75" />
              <stop id="rayStopEnd" offset="100%" stop-color="#cc3300" stop-opacity="0.25" />
            </radialGradient>
            <radialGradient id="glowRadialGrad" cx="50%" cy="50%" r="50%">
              <stop id="glowStopCore" offset="0%" stop-color="rgba(255, 170, 50, 0.4)" />
              <stop id="glowStopMid" offset="40%" stop-color="rgba(255, 100, 20, 0.12)" />
              <stop id="glowStopOuter" offset="100%" stop-color="transparent" />
            </radialGradient>
          </defs>
          <g id="raysGroup"></g>
          <g id="dotsGroup"></g>
        </svg>
      </div>
    `;

    this._container = this.shadowRoot.getElementById("container");
    this._glowBackdrop = this.shadowRoot.getElementById("glowBackdrop");
    this._cursorSpotlight = this.shadowRoot.getElementById("cursorSpotlight");
    this._raysGroup = this.shadowRoot.getElementById("raysGroup");
    this._dotsGroup = this.shadowRoot.getElementById("dotsGroup");

    this._buildSunburst();
    this._applyTheme(this._theme);
  }

  _buildSunburst() {
    this._raysGroup.innerHTML = "";
    this._dotsGroup.innerHTML = "";
    this.rayDataList = [];
    this.activeLoopRays.clear();

    const count = this._rayCount;
    const halfSpan = 80;
    const step = (halfSpan * 2) / (count - 1);

    // Deterministic pseudo-random seed
    let s = 982451653;
    const prng = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const baseAngleDeg = -halfSpan + i * step;
      const jitter = (prng() - 0.5) * step * 0.42;
      const angleDeg = baseAngleDeg + jitter;
      const angleRad = (angleDeg * Math.PI) / 180;
      const sinA = Math.sin(angleRad);
      const cosA = Math.cos(angleRad);

      const centerFactor = Math.cos(angleRad);
      const normAngle = Math.abs(angleDeg) / halfSpan;
      const maxReachable = 595 - 118 * Math.pow(normAngle, 1.75);

      const tierRoll = prng();
      let length;
      let dotRadius;

      if (tierRoll > 0.72) {
        length = maxReachable * (0.92 + prng() * 0.08);
        dotRadius = 2.2 + prng() * 0.35;
      } else if (tierRoll > 0.40) {
        length = maxReachable * (0.68 + prng() * 0.20);
        dotRadius = 1.7 + prng() * 0.4;
      } else if (tierRoll > 0.18) {
        length = maxReachable * (0.45 + prng() * 0.18);
        dotRadius = 1.35 + prng() * 0.35;
      } else {
        length = maxReachable * (0.24 + prng() * 0.17);
        dotRadius = 1.05 + prng() * 0.3;
      }

      const x2 = this.ORIGIN_X + length * sinA;
      const y2 = this.ORIGIN_Y - length * cosA;

      const baseOpacity = parseFloat((0.28 + 0.70 * Math.pow(centerFactor, 1.25)).toFixed(3));
      const strokeWidth = parseFloat((0.85 + 0.45 * Math.pow(centerFactor, 1.5)).toFixed(2));
      const shootDelay = (0.12 + (Math.abs(angleDeg) / halfSpan) * 0.58 + prng() * 0.08).toFixed(3);

      const ux = sinA;
      const uy = -cosA;
      const vx = cosA;
      const vy = sinA;

      const A_para = Math.min(42, length * 0.08 + 10);
      const A_perp = Math.min(28, length * 0.055 + 7);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "burst-ray");
      line.setAttribute("x1", this.ORIGIN_X);
      line.setAttribute("y1", this.ORIGIN_Y);
      line.setAttribute("x2", x2.toFixed(1));
      line.setAttribute("y2", y2.toFixed(1));
      line.setAttribute("stroke-width", strokeWidth);
      line.style.setProperty("--len", `${length.toFixed(1)}px`);
      line.style.setProperty("--shoot-del", `${shootDelay}s`);
      line.style.setProperty("--base-op", baseOpacity);
      line.style.strokeDasharray = `${length.toFixed(1)}px`;
      line.style.strokeDashoffset = `${length.toFixed(1)}px`;

      this._raysGroup.appendChild(line);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "burst-dot");
      circle.setAttribute("cx", x2.toFixed(1));
      circle.setAttribute("cy", y2.toFixed(1));
      circle.setAttribute("r", dotRadius.toFixed(2));
      circle.style.setProperty("--shoot-del", `${shootDelay}s`);
      circle.style.setProperty("--base-op", baseOpacity);

      this._dotsGroup.appendChild(circle);

      const rayObj = {
        line,
        dot: circle,
        x2,
        y2,
        ux,
        uy,
        vx,
        vy,
        A_para,
        A_perp,
        minX: Math.min(this.ORIGIN_X, x2),
        maxX: Math.max(this.ORIGIN_X, x2),
        minY: Math.min(this.ORIGIN_Y, y2),
        maxY: Math.max(this.ORIGIN_Y, y2),
        isLooping: false,
        loopStartTime: 0,
        loopDuration: this._speed,
        loopDir: 1
      };

      line.addEventListener("pointerenter", () => this._triggerRayLoop(rayObj, this.mouseDir));
      circle.addEventListener("pointerenter", () => this._triggerRayLoop(rayObj, this.mouseDir));

      this.rayDataList.push(rayObj);
    }

    setTimeout(() => {
      this.rayDataList.forEach(r => {
        r.line.style.strokeDasharray = "none";
        r.line.style.strokeDashoffset = "0";
      });
    }, 2200);
  }

  _applyTheme(themeId, isInitial = false) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    this._currentThemeObj = theme;

    this._container.style.background = theme.bgGradient;
    this._glowBackdrop.style.background = `radial-gradient(circle at 50% 90%, ${theme.stops.glowCore} 0%, ${theme.stops.glowMid} 40%, transparent 75%)`;
    this._cursorSpotlight.style.background = `radial-gradient(circle, ${theme.spotlight} 0%, transparent 70%)`;

    const stopStart = this.shadowRoot.getElementById("rayStopStart");
    const stopMid = this.shadowRoot.getElementById("rayStopMid");
    const stopEnd = this.shadowRoot.getElementById("rayStopEnd");
    const dots = this.shadowRoot.querySelectorAll(".burst-dot");

    if (isInitial || !this._currentRenderedStops) {
      this._currentRenderedStops = {
        rayStart: theme.stops.rayStart,
        rayMid: theme.stops.rayMid,
        rayEnd: theme.stops.rayEnd,
        dotColor: theme.dotColor
      };
      if (stopStart) stopStart.setAttribute("stop-color", theme.stops.rayStart);
      if (stopMid) stopMid.setAttribute("stop-color", theme.stops.rayMid);
      if (stopEnd) stopEnd.setAttribute("stop-color", theme.stops.rayEnd);
      dots.forEach(d => { d.style.fill = theme.dotColor; });
      this.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme.id, name: theme.name } }));
      return;
    }

    if (this._themeAnimFrame) cancelAnimationFrame(this._themeAnimFrame);

    const parseColor = (str) => {
      if (!str) return [255, 255, 255, 1];
      str = str.trim();
      if (str.startsWith("#")) {
        let hex = str.slice(1);
        if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
        const num = parseInt(hex, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 1];
      }
      const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\)/);
      if (m) return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), m[4] !== undefined ? parseFloat(m[4]) : 1];
      return [255, 255, 255, 1];
    };

    const formatColor = (c) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
    const lerpColor = (c1, c2, t) => [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t, c1[3] + (c2[3] - c1[3]) * t];

    const fromStart = parseColor(this._currentRenderedStops.rayStart);
    const toStart = parseColor(theme.stops.rayStart);
    const fromMid = parseColor(this._currentRenderedStops.rayMid);
    const toMid = parseColor(theme.stops.rayMid);
    const fromEnd = parseColor(this._currentRenderedStops.rayEnd);
    const toEnd = parseColor(theme.stops.rayEnd);
    const fromDot = parseColor(this._currentRenderedStops.dotColor);
    const toDot = parseColor(theme.dotColor);

    const startTime = performance.now();
    const duration = 650;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

      if (stopStart) stopStart.setAttribute("stop-color", formatColor(lerpColor(fromStart, toStart, ease)));
      if (stopMid) stopMid.setAttribute("stop-color", formatColor(lerpColor(fromMid, toMid, ease)));
      if (stopEnd) stopEnd.setAttribute("stop-color", formatColor(lerpColor(fromEnd, toEnd, ease)));
      const dotC = formatColor(lerpColor(fromDot, toDot, ease));
      dots.forEach(d => { d.style.fill = dotC; });

      if (progress < 1) {
        this._themeAnimFrame = requestAnimationFrame(step);
      } else {
        this._currentRenderedStops = {
          rayStart: theme.stops.rayStart,
          rayMid: theme.stops.rayMid,
          rayEnd: theme.stops.rayEnd,
          dotColor: theme.dotColor
        };
        this._themeAnimFrame = null;
      }
    };

    this._themeAnimFrame = requestAnimationFrame(step);
    this.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme.id, name: theme.name } }));
  }

  _bindEvents() {
    this._updateMetrics();
    this._resizeObserver = new ResizeObserver(() => this._updateMetrics());
    this._resizeObserver.observe(this);

    this.addEventListener("pointerenter", (e) => {
      this._updateMetrics();
      this.targetX = e.clientX - this.panelLeft;
      this.targetY = e.clientY - this.panelTop;
      this.currentX = this.targetX;
      this.currentY = this.targetY;
      this.lastMouseX = this.targetX;
      this.targetOp = 1;
      this.mouseActive = true;

      if (!this.animFrameId) {
        this.animFrameId = requestAnimationFrame((t) => this._renderFrame(t));
      }
    }, { passive: true });

    this.addEventListener("pointermove", (e) => {
      const curX = e.clientX - this.panelLeft;
      const curY = e.clientY - this.panelTop;

      const deltaX = curX - this.lastMouseX;
      if (Math.abs(deltaX) > 1) {
        this.mouseDir = deltaX > 0 ? 1 : -1;
      }
      this.lastMouseX = curX;

      this.targetX = curX;
      this.targetY = curY;
      this.targetOp = 1;
      this.mouseActive = true;

      const svgX = (curX / this.panelWidth) * 1000;
      const svgY = (curY / this.panelHeight) * 620;

      const r = this._radius;
      const rSq = r * r;

      const count = this.rayDataList.length;
      for (let i = 0; i < count; i++) {
        const ray = this.rayDataList[i];
        if (ray.isLooping) continue;

        if (
          svgX < ray.minX - r ||
          svgX > ray.maxX + r ||
          svgY < ray.minY - r ||
          svgY > ray.maxY + r
        ) {
          continue;
        }

        const dSq = this._distToSegmentSquared(svgX, svgY, this.ORIGIN_X, this.ORIGIN_Y, ray.x2, ray.y2);
        if (dSq < rSq) {
          this._triggerRayLoop(ray, this.mouseDir);
        }
      }

      if (!this.animFrameId) {
        this.animFrameId = requestAnimationFrame((t) => this._renderFrame(t));
      }
    }, { passive: true });

    this.addEventListener("pointerleave", () => {
      this.targetOp = 0;
      this.mouseActive = false;
    });
  }

  _updateMetrics() {
    const rect = this.getBoundingClientRect();
    this.panelLeft = rect.left;
    this.panelTop = rect.top;
    this.panelWidth = rect.width || 1000;
    this.panelHeight = rect.height || 620;
  }

  _distToSegmentSquared(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return (px - projX) * (px - projX) + (py - projY) * (py - projY);
  }

  _triggerRayLoop(ray, direction = 1) {
    if (ray.isLooping) return;
    const now = performance.now();
    if (ray.lastLoopEndTime && (now - ray.lastLoopEndTime < 60)) return;

    ray.line.style.strokeDasharray = "none";
    ray.line.style.strokeDashoffset = "0";

    ray.isLooping = true;
    ray.loopStartTime = now;
    ray.loopDuration = this._speed;
    ray.loopDir = direction >= 0 ? 1 : -1;
    this.activeLoopRays.add(ray);

    if (!this.animFrameId) {
      this.animFrameId = requestAnimationFrame((t) => this._renderFrame(t));
    }
  }

  _renderFrame(timestamp) {
    // 1. Ambient cursor spotlight
    if (this._hasSpotlight && this._cursorSpotlight) {
      this.currentX += (this.targetX - this.currentX) * 0.72;
      this.currentY += (this.targetY - this.currentY) * 0.72;
      this.currentOp += (this.targetOp - this.currentOp) * 0.25;

      this._cursorSpotlight.style.transform = `translate3d(${this.currentX.toFixed(1)}px, ${this.currentY.toFixed(1)}px, 0)`;
      this._cursorSpotlight.style.opacity = this.currentOp.toFixed(3);
    }

    // 2. Fixed-Base 360-degree Top Ray Rotation Engine
    if (this.activeLoopRays.size > 0) {
      const now = timestamp || performance.now();
      for (const ray of this.activeLoopRays) {
        const elapsed = now - ray.loopStartTime;
        const rawProgress = elapsed / ray.loopDuration;

        if (rawProgress >= 1) {
          ray.line.setAttribute("x2", ray.x2.toFixed(1));
          ray.line.setAttribute("y2", ray.y2.toFixed(1));
          ray.dot.setAttribute("cx", ray.x2.toFixed(1));
          ray.dot.setAttribute("cy", ray.y2.toFixed(1));
          ray.isLooping = false;
          ray.lastLoopEndTime = now;
          this.activeLoopRays.delete(ray);
        } else {
          // Smoothstep Hermite curve: zero velocity at start and end
          const p = rawProgress * rawProgress * (3 - 2 * rawProgress);
          const phi = 2 * Math.PI * p; // Full 360 degree rotation

          const dPerp = ray.loopDir * ray.A_perp * Math.sin(phi);
          const dPara = ray.A_para * (1 - Math.cos(phi));

          const curX2 = ray.x2 + dPerp * ray.vx + dPara * ray.ux;
          const curY2 = ray.y2 + dPerp * ray.vy + dPara * ray.uy;

          // Base (x1, y1) stays permanently fixed at ORIGIN_X, ORIGIN_Y
          ray.line.setAttribute("x2", curX2.toFixed(1));
          ray.line.setAttribute("y2", curY2.toFixed(1));
          ray.dot.setAttribute("cx", curX2.toFixed(1));
          ray.dot.setAttribute("cy", curY2.toFixed(1));
        }
      }
    }

    // 3. Keep rAF active only when rays or spotlight are in motion
    if (this.mouseActive || this.currentOp > 0.005 || this.activeLoopRays.size > 0) {
      this.animFrameId = requestAnimationFrame((t) => this._renderFrame(t));
    } else {
      this.currentOp = 0;
      if (this._cursorSpotlight) this._cursorSpotlight.style.opacity = "0";
      this.animFrameId = null;
    }
  }
}

// Auto-register Web Component
if (typeof customElements !== "undefined" && !customElements.get("cosmic-sunburst")) {
  customElements.define("cosmic-sunburst", CosmicSunburst);
}

// Universal export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CosmicSunburst, THEMES };
}
