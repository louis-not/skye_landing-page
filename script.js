(function () {
  const root = document.documentElement;
  const vignette = document.getElementById('vignette');
  const ctaSection = document.getElementById('cta-section');

  function ease(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  function segment(progress, start, end) {
    return clamp01((progress - start) / (end - start));
  }

  function fadeInOut(progress, inStart, inEnd, outStart, outEnd) {
    if (progress < inStart) return 0;
    if (progress < inEnd) return ease(segment(progress, inStart, inEnd));
    if (progress < outStart) return 1;
    if (progress < outEnd) return 1 - ease(segment(progress, outStart, outEnd));
    return 0;
  }

  // --- Reliable smooth scroll (works on mobile + desktop) ---
  let scrollAnim = null;

  function smoothScrollTo(targetY) {
    if (scrollAnim) cancelAnimationFrame(scrollAnim);
    const startY = window.scrollY;
    const dist = targetY - startY;
    const duration = Math.min(1200, Math.max(400, Math.abs(dist) * 0.15));
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = ease(t);
      window.scrollTo(0, startY + dist * eased);
      if (t < 1) {
        scrollAnim = requestAnimationFrame(step);
      } else {
        scrollAnim = null;
      }
    }
    scrollAnim = requestAnimationFrame(step);
  }

  // --- Side navigator ---
  const dots = document.querySelectorAll('.nav-dot');
  const navUp = document.querySelector('.nav-up');
  const navDown = document.querySelector('.nav-down');

  // Timeline — text fully-visible windows and their centers:
  //
  // 0. Hello        : visible 0.00–0.06   → target 0.03
  // 1. Skye         : visible 0.25–0.30   → target 0.275
  //    (vignette fully open by 0.22)
  // 2. Day          : visible 0.46–0.51   → target 0.485
  //    (dark pulse at 0.375 resolved)
  // 3. Learn        : visible 0.67–0.71   → target 0.69
  //    (dark pulse at 0.585 resolved)
  // 4. Slow         : visible 0.83–0.87   → target 0.85
  //    (dark pulse at 0.775 resolved)
  // 5. Safe         : visible 0.92–0.95   → target 0.935
  //    (vignette still open, closes at 0.97)
  // 6. CTA          : visible 0.99–1.00   → target 1.0

  const sectionMids = [0.03, 0.275, 0.485, 0.69, 0.85, 0.935, 1.0];

  function scrollToSection(idx) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    smoothScrollTo(sectionMids[idx] * maxScroll);
  }

  function getActiveSection(progress) {
    // Find which section's visible window we're closest to
    const centers = sectionMids;
    let best = 0;
    let bestDist = Math.abs(progress - centers[0]);
    for (let i = 1; i < centers.length; i++) {
      const d = Math.abs(progress - centers[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      scrollToSection(parseInt(this.dataset.section));
    });
  });

  navUp.addEventListener('click', function () {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    var current = getActiveSection(progress);
    if (current > 0) scrollToSection(current - 1);
  });

  navDown.addEventListener('click', function () {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    var current = getActiveSection(progress);
    if (current < sectionMids.length - 1) scrollToSection(current + 1);
  });

  function loop(timestamp) {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

    // --- Pulse (continuous glow) ---
    const t = (timestamp % 3000) / 3000;
    const pulseFactor = (Math.sin(t * Math.PI) + 1) / 2;
    root.style.setProperty('--glow', pulseFactor);

    // --- Vignette radius ---
    const maxRadius = Math.max(window.innerWidth, window.innerHeight) * 0.8;

    // Open vignette early, close it late for CTA
    let radiusOpen = ease(segment(progress, 0.08, 0.22));
    let radiusClose = 1 - ease(segment(progress, 0.97, 1.0));
    let radiusT = radiusOpen * radiusClose;

    // Dark pulses between text transitions
    const pulse1 = 1 - 0.25 * Math.max(0, 1 - Math.abs((progress - 0.375) / 0.02));
    const pulse2 = 1 - 0.25 * Math.max(0, 1 - Math.abs((progress - 0.585) / 0.02));
    const pulse3 = 1 - 0.25 * Math.max(0, 1 - Math.abs((progress - 0.775) / 0.02));
    const darkPulse = Math.min(pulse1, pulse2, pulse3);

    const baseRadius = radiusT * maxRadius * darkPulse;
    const radius = baseRadius + pulseFactor * maxRadius * 0.03;

    const edgePulse = 0.08 * pulseFactor;
    const darkExtra = (1 - darkPulse) * 0.3;

    vignette.style.background = `radial-gradient(
      circle ${radius}px at 50% 50%,
      transparent 0%,
      rgba(0, 0, 0, ${0.4 + edgePulse + darkExtra}) 40%,
      rgba(0, 0, 0, ${0.75 + edgePulse + darkExtra}) 60%,
      rgba(0, 0, 0, ${0.92 + edgePulse * 0.5 + darkExtra}) 80%,
      #000 100%
    )`;

    // --- Text opacities ---
    let helloOpacity;
    if (progress < 0.06) {
      helloOpacity = 1;
    } else {
      helloOpacity = 1 - ease(segment(progress, 0.06, 0.14));
    }

    const skyeOpacity  = fadeInOut(progress, 0.18, 0.25, 0.30, 0.36);
    const dayOpacity   = fadeInOut(progress, 0.40, 0.46, 0.51, 0.57);
    const learnOpacity = fadeInOut(progress, 0.61, 0.67, 0.71, 0.76);
    const slowOpacity  = fadeInOut(progress, 0.78, 0.83, 0.87, 0.91);
    const safeOpacity  = fadeInOut(progress, 0.91, 0.93, 0.95, 0.97);

    let ctaOpacity;
    if (progress < 0.98) {
      ctaOpacity = 0;
    } else {
      ctaOpacity = ease(segment(progress, 0.98, 1.0));
    }

    // Enable pointer events on CTA when visible
    if (ctaOpacity > 0.5) {
      ctaSection.classList.add('active');
    } else {
      ctaSection.classList.remove('active');
    }

    root.style.setProperty('--hello-opacity', helloOpacity);
    root.style.setProperty('--skye-opacity', skyeOpacity);
    root.style.setProperty('--learn-opacity', learnOpacity);
    root.style.setProperty('--day-opacity', dayOpacity);
    root.style.setProperty('--slow-opacity', slowOpacity);
    root.style.setProperty('--safe-opacity', safeOpacity);
    root.style.setProperty('--cta-opacity', ctaOpacity);

    // Update active nav dot
    var activeIdx = getActiveSection(progress);
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === activeIdx);
    });

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  // --- Sound toggle ---
  const video = document.getElementById('bg-video');
  const soundBtn = document.getElementById('sound-toggle');
  const iconMuted = document.getElementById('icon-muted');
  const iconUnmuted = document.getElementById('icon-unmuted');

  soundBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    iconMuted.style.display = video.muted ? '' : 'none';
    iconUnmuted.style.display = video.muted ? 'none' : '';
  });
})();
