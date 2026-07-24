/**
 * UniLens Capture
 * ---------------
 * Captures a full-page snapshot with viewport and click position overlaid.
 * Requires html2canvas to be loaded before this script.
 *
 * Usage:
 *   UniLensCapture.init()                          // default: alt+click
 *   UniLensCapture.init({ trigger: fn })           // custom trigger predicate
 *   UniLensCapture.init({ trackMouse: true })      // enable mouse trace
 *   UniLensCapture.init({ trackMouse: true, mouseWindow: 2.5 }) // 2.5s trace
 *   UniLensCapture.capture(clickX, clickY)         // call directly
 *
 * Options:
 *   trigger      {Function}  MouseEvent → bool. Default: alt+click.
 *   trackMouse   {Boolean}   Enable mouse position tracking. Default: false.
 *   mouseWindow  {Number}    Seconds of trace history to render. Default: 2.5.
 *   mouseBuffer  {Number}    Max entries kept in memory. Default: 5000.
 */

const UniLensCapture = (() => {

  // ── Default trigger ──────────────────────────────────────────────────────
  const DEFAULT_TRIGGER = (e) => e.altKey;

  // ── Mouse trace state ────────────────────────────────────────────────────
  // Each entry: { x, y, t } where x/y are page coordinates, t is Date.now()
  let _mouseTrace   = [];
  let _mouseBuffer  = 5000;   // max entries in memory
  let _mouseWindow  = 2.5;    // seconds of history to render
  let _trackMouse   = false;

  function _onMouseMove(e) {
    const now = Date.now();
    _mouseTrace.push({ x: e.pageX, y: e.pageY, t: now });
    // Trim buffer — drop entries beyond the max buffer size
    if (_mouseTrace.length > _mouseBuffer) {
      _mouseTrace.splice(0, _mouseTrace.length - _mouseBuffer);
    }
  }

  // Returns trace entries within the configured window before `atTime`
  function _getRecentTrace(atTime) {
    const cutoff = atTime - _mouseWindow * 1000;
    return _mouseTrace.filter(p => p.t >= cutoff);
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  let _toast = null;

  function _ensureToast() {
    if (_toast) return;
    _toast = document.createElement('div');
    _toast.id = 'unilens-toast';
    Object.assign(_toast.style, {
      position:     'fixed',
      bottom:       '24px',
      left:         '50%',
      transform:    'translateX(-50%)',
      background:   'rgba(0,0,0,0.75)',
      color:        '#fff',
      padding:      '10px 22px',
      borderRadius: '24px',
      fontSize:     '14px',
      pointerEvents:'none',
      opacity:      '0',
      transition:   'opacity 0.3s',
      zIndex:       '2147483647',
      fontFamily:   'sans-serif',
    });
    document.body.appendChild(_toast);
  }

  function _showToast(msg, duration = 3000) {
    _ensureToast();
    _toast.textContent = msg;
    _toast.style.opacity = '1';
    clearTimeout(_toast._timer);
    _toast._timer = setTimeout(() => { _toast.style.opacity = '0'; }, duration);
  }

  // ── Flash ────────────────────────────────────────────────────────────────
  let _flash = null;

  function _flashScreen() {
    if (!_flash) {
      _flash = document.createElement('div');
      Object.assign(_flash.style, {
        position:      'fixed',
        inset:         '0',
        background:    'rgba(255,255,255,0.45)',
        pointerEvents: 'none',
        opacity:       '0',
        transition:    'opacity 0.15s',
        zIndex:        '2147483646',
      });
      document.body.appendChild(_flash);
    }
    _flash.style.opacity = '1';
    setTimeout(() => { _flash.style.opacity = '0'; }, 200);
  }

  // ── object-fit helpers ───────────────────────────────────────────────────
  function _parsePosition(val, elSize) {
    if (!val)                                   return elSize / 2;
    if (val === 'left'  || val === 'top')       return 0;
    if (val === 'right' || val === 'bottom')    return elSize;
    if (val === 'center')                       return elSize / 2;
    if (val.endsWith('%')) return (parseFloat(val) / 100) * elSize;
    return parseFloat(val) || elSize / 2;
  }

  function _makeCanvas(img, elW, elH, style) {
    const c = document.createElement('canvas');
    c.width  = elW;
    c.height = elH;
    c.style.cssText      = img.style.cssText;
    c.style.width        = elW + 'px';
    c.style.height       = elH + 'px';
    c.style.borderRadius = style.borderRadius;
    c.style.display      = style.display;
    c.style.margin       = style.margin;
    c.style.verticalAlign= style.verticalAlign;
    return c;
  }

  // Swap all object-fit <img> elements with correctly clipped <canvas> elements.
  // Returns a restore function to call after html2canvas completes.
  async function _preprocessImages() {
    const swaps = [];

    await Promise.all([...document.querySelectorAll('img')].map(img => new Promise(resolve => {
      const style     = getComputedStyle(img);
      const objectFit = style.objectFit;
      if (!['cover', 'contain', 'fill', 'scale-down'].includes(objectFit)) return resolve();
      if (!img.src) return resolve();

      const rect = img.getBoundingClientRect();
      const elW  = rect.width;
      const elH  = rect.height;
      if (elW === 0 || elH === 0) return resolve();

      const corsImg       = new Image();
      corsImg.crossOrigin = 'anonymous';

      corsImg.onload = () => {
        const natW = corsImg.naturalWidth;
        const natH = corsImg.naturalHeight;
        if (natW === 0 || natH === 0) return resolve();

        const posParts = (style.objectPosition || '50% 50%').split(' ');
        const posX     = _parsePosition(posParts[0], elW);
        const posY     = _parsePosition(posParts[1] ?? posParts[0], elH);
        const scaleW   = elW / natW;
        const scaleH   = elH / natH;

        const c  = _makeCanvas(img, elW, elH, style);
        const cx = c.getContext('2d');

        if (objectFit === 'cover') {
          const s  = Math.max(scaleW, scaleH);
          const sw = elW / s;
          const sh = elH / s;
          const sx = posX * (natW - sw) / elW;
          const sy = posY * (natH - sh) / elH;
          cx.drawImage(corsImg, sx, sy, sw, sh, 0, 0, elW, elH);

        } else if (objectFit === 'contain' || objectFit === 'scale-down') {
          const s  = Math.min(scaleW, scaleH);
          const dw = natW * s;
          const dh = natH * s;
          const dx = (elW - dw) * (posX / elW);
          const dy = (elH - dh) * (posY / elH);
          cx.drawImage(corsImg, 0, 0, natW, natH, dx, dy, dw, dh);

        } else {
          cx.drawImage(corsImg, 0, 0, elW, elH);
        }

        swaps.push({ img, canvas: c });
        img.parentNode.insertBefore(c, img);
        img.style.display = 'none';
        resolve();
      };

      corsImg.onerror = () => resolve();
      corsImg.src = img.src;
    })));

    // Return restore function
    return () => swaps.forEach(({ img, canvas }) => {
      img.style.display = '';
      canvas.remove();
    });
  }

  // ── Core capture ─────────────────────────────────────────────────────────
  async function capture(clickX, clickY) {
    const captureTime = Date.now();   // snapshot time for trace window

    if (typeof html2canvas === 'undefined') {
      console.error('[UniLensCapture] html2canvas is not loaded.');
      _showToast('⚠️ html2canvas not found.', 4000);
      return;
    }

    // Collect viewport state at moment of click
    const vvp        = window.visualViewport;
    const dpr        = window.devicePixelRatio || 1;
    const vpW        = vvp ? vvp.width      : window.innerWidth;
    const vpH        = vvp ? vvp.height     : window.innerHeight;
    const vvpOffsetX = vvp ? vvp.offsetLeft : 0;
    const vvpOffsetY = vvp ? vvp.offsetTop  : 0;
    const pinchZoom  = vvp ? Math.round((vvp.scale ?? 1) * 100) / 100 : 1;
    const scrollX    = window.scrollX;
    const scrollY    = window.scrollY;
    const pageW      = document.documentElement.scrollWidth;
    const pageH      = document.documentElement.scrollHeight;

    _showToast('📸 Capturing full page…');
    _flashScreen();

    // Preprocess images
    const restore = await _preprocessImages();

    // Render full page
    const captureScale = Math.min(dpr, 2) * 0.5;
    let pageCanvas;
    try {
      pageCanvas = await html2canvas(document.body, {
        scrollX:      0,
        scrollY:      0,
        width:        pageW,
        height:       pageH,
        windowWidth:  pageW,
        windowHeight: pageH,
        useCORS:      true,
        allowTaint:   true,
        scale:        captureScale,
      });
    } catch (err) {
      restore();
      _showToast('⚠️ Capture failed: ' + err.message, 4000);
      console.error('[UniLensCapture]', err);
      return;
    }

    restore();

    const scale = pageCanvas.width / pageW;

    // ── Visualization canvas ──────────────────────────────────────────────
    const PANEL_W = 320;
    const VIZ_W   = pageCanvas.width + PANEL_W;
    const VIZ_H   = Math.max(pageCanvas.height, 500);

    const viz = document.createElement('canvas');
    viz.width  = VIZ_W;
    viz.height = VIZ_H;
    const ctx  = viz.getContext('2d');

    // Dark background
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, VIZ_W, VIZ_H);

    // Page thumbnail
    ctx.drawImage(pageCanvas, 0, 0);

    // Viewport rect (accounts for pinch-zoom offset)
    const vpRect = {
      x: (scrollX + vvpOffsetX) * scale,
      y: (scrollY + vvpOffsetY) * scale,
      w: vpW * scale,
      h: vpH * scale,
    };
    ctx.strokeStyle = 'rgba(0,200,255,0.9)';
    ctx.lineWidth   = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(vpRect.x, vpRect.y, vpRect.w, vpRect.h);
    ctx.fillStyle = 'rgba(0,200,255,0.08)';
    ctx.fillRect(vpRect.x, vpRect.y, vpRect.w, vpRect.h);
    ctx.fillStyle = 'rgba(0,200,255,0.9)';
    ctx.font      = `bold ${Math.round(11 * scale)}px sans-serif`;
    ctx.fillText('VIEWPORT', vpRect.x + 4, vpRect.y + 14 * scale);

    // ── Mouse trace ───────────────────────────────────────────────────────
    if (_trackMouse) {
      const trace = _getRecentTrace(captureTime);

      if (trace.length >= 2) {
        const oldest = trace[0].t;
        const newest = trace[trace.length - 1].t;
        const span   = Math.max(newest - oldest, 1);

        for (let i = 1; i < trace.length; i++) {
          const p0 = trace[i - 1];
          const p1 = trace[i];

          // Age ratio: 0 = oldest, 1 = newest
          const age   = (p1.t - oldest) / span;
          const alpha = 0.15 + age * 0.75;          // fade in: 0.15 → 0.9
          const width = (1 + age * 5) * scale;      // thin → thick (2× range)

          ctx.beginPath();
          ctx.moveTo(p0.x * scale, p0.y * scale);
          ctx.lineTo(p1.x * scale, p1.y * scale);
          ctx.strokeStyle = `rgba(255, 187, 0, ${alpha.toFixed(2)})`;
          ctx.lineWidth   = width;
          ctx.lineCap     = 'round';
          ctx.lineJoin    = 'round';
          ctx.setLineDash([]);
          ctx.stroke();
        }

        // Dot at each recorded position (oldest = faint, newest = bright)
        for (let i = 0; i < trace.length; i++) {
          const p     = trace[i];
          const age   = (p.t - oldest) / span;
          const alpha = 0.1 + age * 0.6;
          const r     = (2 + age * 4) * scale;      // 2× min and max radius
          ctx.beginPath();
          ctx.arc(p.x * scale, p.y * scale, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 111, 0, ${alpha.toFixed(2)})`;
          ctx.fill();
        }

        // Arrow tip at the last trace point before click
        const last = trace[trace.length - 1];
        ctx.beginPath();
        ctx.arc(last.x * scale, last.y * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fillStyle   = 'rgba(255, 68, 0, 0.95)';
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth   = 1;
        ctx.fill();
        ctx.stroke();
      }
    }

    // Click crosshair
    const cx2 = clickX * scale;
    const cy2 = clickY * scale;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth   = 2.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(0, cy2); ctx.lineTo(pageCanvas.width, cy2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx2, 0); ctx.lineTo(cx2, pageCanvas.height); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx2, cy2, 18 * scale, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth   = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx2, cy2, 4 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();

    // Minimap
    const MM_PAD = 8;
    const MM_W   = 80 * scale;
    const MM_H   = MM_W * (pageH / pageW);
    const MM_X   = pageCanvas.width - MM_W - MM_PAD;
    const MM_Y   = MM_PAD;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(MM_X - 4, MM_Y - 4, MM_W + 8, MM_H + 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(MM_X, MM_Y, MM_W, MM_H);

    const mmVpX = MM_X + (scrollX / pageW) * MM_W;
    const mmVpY = MM_Y + (scrollY / pageH) * MM_H;
    const mmVpW = (vpW / pageW) * MM_W;
    const mmVpH = (vpH / pageH) * MM_H;
    ctx.fillStyle   = 'rgba(0,200,255,0.35)';
    ctx.fillRect(mmVpX, mmVpY, mmVpW, mmVpH);
    ctx.strokeStyle = 'rgba(0,200,255,0.9)';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(mmVpX, mmVpY, mmVpW, mmVpH);

    const mmCx = MM_X + (clickX / pageW) * MM_W;
    const mmCy = MM_Y + (clickY / pageH) * MM_H;
    ctx.beginPath();
    ctx.arc(mmCx, mmCy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font      = `${Math.round(8 * scale)}px sans-serif`;
    ctx.fillText('minimap', MM_X, MM_Y + MM_H + 10 * scale);

    // ── Info panel ───────────────────────────────────────────────────────
    const PX = pageCanvas.width + 16;
    const PW = PANEL_W - 32;

    function panelText(label, value, y) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font      = '11px sans-serif';
      ctx.fillText(label.toUpperCase(), PX, y);
      ctx.fillStyle = '#fff';
      ctx.font      = 'bold 15px sans-serif';
      ctx.fillText(value, PX, y + 18);
    }

    function panelBar(label, ratio, color, y) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font      = '11px sans-serif';
      ctx.fillText(label, PX, y);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(PX, y + 4, PW, 10);
      ctx.fillStyle = color;
      ctx.fillRect(PX, y + 4, PW * Math.min(ratio, 1), 10);
    }

    ctx.fillStyle = '#00c8ff';
    ctx.font      = 'bold 16px sans-serif';
    ctx.fillText('UniLens Capture', PX, 36);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(PX, 44, PW, 1);

    let py = 64;
    panelText('Click X (page)',     `${clickX}px`,                              py); py += 44;
    panelText('Click Y (page)',     `${clickY}px`,                              py); py += 44;
    panelText('Scroll position',    `(${Math.round(scrollX)}, ${Math.round(scrollY)})`, py); py += 44;
    panelText('Viewport size',      `${Math.round(vpW)} × ${Math.round(vpH)}px`, py); py += 44;
    panelText('Full page size',     `${pageW} × ${pageH}px`,                   py); py += 44;
    panelText('Device pixel ratio', `${dpr}×`,                                  py); py += 44;
    panelText('Pinch zoom',         pinchZoom === 1 ? '1.0 (none)' : `${pinchZoom}×`, py); py += 44;
    if (vvpOffsetX !== 0 || vvpOffsetY !== 0) {
      panelText('VVP offset', `(${Math.round(vvpOffsetX)}, ${Math.round(vvpOffsetY)})`, py);
    }
    py += 20;

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(PX, py - 10, PW, 1);

    const visH = Math.min(vpH, pageH - scrollY);
    const visW = Math.min(vpW, pageW - scrollX);
    panelBar('Vertical coverage',   visH / pageH, '#00c8ff', py); py += 28;
    panelBar('Horizontal coverage', visW / pageW, '#00c8ff', py); py += 36;

    const inViewport = (
      clickX >= scrollX && clickX <= scrollX + vpW &&
      clickY >= scrollY && clickY <= scrollY + vpH
    );
    ctx.fillStyle = inViewport ? '#4cff91' : '#ff6b6b';
    ctx.font      = 'bold 13px sans-serif';
    ctx.fillText(inViewport ? '✓ Click within viewport' : '✗ Click outside viewport', PX, py);
    py += 32;

    const scrollDepth = Math.round((scrollY / Math.max(pageH - vpH, 1)) * 100);
    panelBar(`Scroll depth  ${scrollDepth}%`, scrollY / Math.max(pageH - vpH, 1), '#ff9f43', py);
    py += 36;

    // Mouse trace stats
    if (_trackMouse) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(PX, py - 4, PW, 1);
      py += 10;

      const trace        = _getRecentTrace(captureTime);
      const traceDist    = trace.reduce((d, p, i) => {
        if (i === 0) return 0;
        const dx = p.x - trace[i-1].x;
        const dy = p.y - trace[i-1].y;
        return d + Math.sqrt(dx*dx + dy*dy);
      }, 0);

      panelText('Mouse trace',  `${_mouseWindow}s window`, py); py += 44;
      panelText('Trace points', `${trace.length}`, py); py += 44;
      panelText('Distance',     `${Math.round(traceDist)}px`, py); py += 44;

      // Tiny inline minimap of just the trace
      const TM_W = PW;
      const TM_H = 60;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(PX, py, TM_W, TM_H);

      if (trace.length >= 2) {
        // Normalize trace into the minimap box
        const xs   = trace.map(p => p.x);
        const ys   = trace.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const rangeX = Math.max(maxX - minX, 1);
        const rangeY = Math.max(maxY - minY, 1);
        const pad    = 4;

        const toTM = (p) => ({
          x: PX + pad + ((p.x - minX) / rangeX) * (TM_W - pad*2),
          y: py + pad + ((p.y - minY) / rangeY) * (TM_H - pad*2),
        });

        const oldest = trace[0].t;
        const span   = Math.max(trace[trace.length-1].t - oldest, 1);

        ctx.save();
        ctx.beginPath();
        ctx.rect(PX, py, TM_W, TM_H);
        ctx.clip();

        for (let i = 1; i < trace.length; i++) {
          const a0 = toTM(trace[i-1]);
          const a1 = toTM(trace[i]);
          const age = (trace[i].t - oldest) / span;
          ctx.beginPath();
          ctx.moveTo(a0.x, a0.y);
          ctx.lineTo(a1.x, a1.y);
          ctx.strokeStyle = `rgba(50,180,255,${(0.2 + age * 0.8).toFixed(2)})`;
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        }

        // End dot
        const last = toTM(trace[trace.length-1]);
        ctx.beginPath();
        ctx.arc(last.x, last.y, 3, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(50,180,255,1)';
        ctx.fill();

        ctx.restore();
      }

      ctx.fillStyle   = 'rgba(255,255,255,0.3)';
      ctx.font        = '9px sans-serif';
      ctx.fillText('trace map', PX, py + TM_H + 10);
      py += TM_H + 20;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font      = '10px monospace';
    ctx.fillText(new Date().toISOString(), PX, VIZ_H - 16);

    // ── Download ─────────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `unilens-capture-${Date.now()}.png`;
    link.href     = viz.toDataURL('image/png');
    link.click();

    _showToast(`✅ Downloaded — click at (${clickX}, ${clickY}), scroll depth ${scrollDepth}%`, 4000);
  }

  // ── Public API ───────────────────────────────────────────────────────────
  function init(options = {}) {
    const trigger = options.trigger ?? DEFAULT_TRIGGER;

    // Mouse trace config
    _trackMouse  = options.trackMouse  ?? false;
    _mouseWindow = options.mouseWindow ?? 2.5;
    _mouseBuffer = options.mouseBuffer ?? 5000;

    if (_trackMouse) {
      document.addEventListener('mousemove', _onMouseMove, { passive: true });
      console.log(`[UniLensCapture] Mouse tracking enabled — ${_mouseWindow}s window.`);
    }

    document.addEventListener('click', (e) => {
      if (!trigger(e)) return;
      e.preventDefault();
      capture(e.pageX, e.pageY);
    });

    console.log('[UniLensCapture] Initialized. Trigger:', trigger.toString());
  }

  return { init, capture };

})();
