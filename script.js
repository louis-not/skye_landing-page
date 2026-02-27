(function () {
  const root = document.documentElement;
  let ticking = false;

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

  function update() {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

    // --- Vignette radius ---
    // 0–20%: stays at 0 (fully black, "Hello" visible)
    // 20–55%: expands from 0 to max
    // 55–100%: stays at max
    const maxRadius = Math.max(window.innerWidth, window.innerHeight) * 0.8;
    let radiusT = ease(segment(progress, 0.20, 0.55));
    const radius = radiusT * maxRadius;

    // --- "Hello" text opacity ---
    // 0–15%: fully visible on black screen
    // 15–35%: fades out as vignette opens
    let helloOpacity;
    if (progress < 0.15) {
      helloOpacity = 1;
    } else {
      helloOpacity = 1 - ease(segment(progress, 0.15, 0.35));
    }

    // --- "I'm Skye" text opacity ---
    // 40–60%: fades in as video is revealed
    // 60–100%: stays visible
    let skyeOpacity;
    if (progress < 0.40) {
      skyeOpacity = 0;
    } else if (progress < 0.60) {
      skyeOpacity = ease(segment(progress, 0.40, 0.60));
    } else {
      skyeOpacity = 1;
    }

    // Apply vignette gradient directly (CSS vars don't work in gradient size)
    const vignette = document.getElementById('vignette');
    vignette.style.background = `radial-gradient(
      circle ${radius}px at 50% 50%,
      transparent 0%,
      rgba(0, 0, 0, 0.3) 60%,
      rgba(0, 0, 0, 0.85) 80%,
      #000 100%
    )`;

    // Apply text opacities
    root.style.setProperty('--hello-opacity', helloOpacity);
    root.style.setProperty('--skye-opacity', skyeOpacity);

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });

  // Initial state
  update();
})();
