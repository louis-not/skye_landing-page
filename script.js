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

  // Timeline (scroll %):
  //
  // 0–6%    : Hello visible on black
  // 6–14%   : Hello fades out
  // 8–22%   : Vignette opens
  //
  // 18–25%  : "I'm Skye" fades in
  // 25–30%  : visible
  // 30–36%  : fades out
  // 36–39%  : dark pulse
  //
  // 40–46%  : "Let's learn" fades in
  // 46–51%  : visible
  // 51–57%  : fades out
  // 57–60%  : dark pulse
  //
  // 61–67%  : "Talk about your day" fades in
  // 67–71%  : visible
  // 71–76%  : fades out
  // 76–79%  : dark pulse
  //
  // 80–85%  : "Hold up" fades in
  // 85–88%  : visible
  // 88–92%  : fades out
  // 92–94%  : dark pulse (vignette closes fully)
  //
  // 92–97%  : "No Worries" fades in
  // 97–100% : visible, then vignette closes to black
  //
  // 98–100% : CTA fades in on black

  // --- Side navigator ---
  const dots = document.querySelectorAll('.nav-dot');
  const navUp = document.querySelector('.nav-up');
  const navDown = document.querySelector('.nav-down');

  // Scroll targets — center of each text's fully-visible window
  const sectionMids = [0.03, 0.275, 0.485, 0.69, 0.865, 0.945, 0.995];

  function scrollToProgress(target) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: target * maxScroll, behavior: 'smooth' });
  }

  function getActiveSection(progress) {
    for (let i = sectionMids.length - 1; i >= 0; i--) {
      if (progress >= sectionMids[i] - 0.08) return i;
    }
    return 0;
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var idx = parseInt(this.dataset.section);
      scrollToProgress(sectionMids[idx]);
    });
  });

  navUp.addEventListener('click', function () {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    var current = getActiveSection(progress);
    if (current > 0) scrollToProgress(sectionMids[current - 1]);
  });

  navDown.addEventListener('click', function () {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    var current = getActiveSection(progress);
    if (current < sectionMids.length - 1) scrollToProgress(sectionMids[current + 1]);
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

    // Open vignette in the beginning, close it at the end for CTA
    let radiusOpen = ease(segment(progress, 0.08, 0.22));
    let radiusClose = 1 - ease(segment(progress, 0.96, 0.99));
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
    const slowOpacity  = fadeInOut(progress, 0.80, 0.85, 0.88, 0.92);
    const safeOpacity  = fadeInOut(progress, 0.92, 0.96, 0.97, 0.99);

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
})();
