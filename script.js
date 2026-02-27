(function () {
  const root = document.documentElement;
  const vignette = document.getElementById('vignette');

  // Easing: smooth ease-in-out
  function ease(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Clamp a value between 0 and 1
  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  // Map scroll position to a 0–1 range within a segment
  function segment(progress, start, end) {
    return clamp01((progress - start) / (end - start));
  }

  function loop(timestamp) {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

    // --- Pulse ---
    const t = (timestamp % 3000) / 3000;
    const pulseFactor = (Math.sin(t * Math.PI) + 1) / 2;
    root.style.setProperty('--glow', pulseFactor);

    // --- Vignette radius ---
    const maxRadius = Math.max(window.innerWidth, window.innerHeight) * 0.8;
    let radiusT = ease(segment(progress, 0.20, 0.55));
    const baseRadius = radiusT * maxRadius;
    // Subtle pulse on the radius: +/- 3% of maxRadius
    const radius = baseRadius + pulseFactor * maxRadius * 0.03;

    // --- Vignette edge opacity pulse ---
    // Edges breathe slightly: darken/lighten by a small amount
    const edgePulse = 0.08 * pulseFactor;

    vignette.style.background = `radial-gradient(
      circle ${radius}px at 50% 50%,
      transparent 0%,
      rgba(0, 0, 0, ${0.4 + edgePulse}) 40%,
      rgba(0, 0, 0, ${0.75 + edgePulse}) 60%,
      rgba(0, 0, 0, ${0.92 + edgePulse * 0.5}) 80%,
      #000 100%
    )`;

    // --- "Hello" text opacity ---
    let helloOpacity;
    if (progress < 0.15) {
      helloOpacity = 1;
    } else {
      helloOpacity = 1 - ease(segment(progress, 0.15, 0.35));
    }

    // --- "I'm Skye" text opacity ---
    let skyeOpacity;
    if (progress < 0.40) {
      skyeOpacity = 0;
    } else if (progress < 0.60) {
      skyeOpacity = ease(segment(progress, 0.40, 0.60));
    } else {
      skyeOpacity = 1;
    }

    root.style.setProperty('--hello-opacity', helloOpacity);
    root.style.setProperty('--skye-opacity', skyeOpacity);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
