const TRAIL_LENGTH = 28;
const FOLLOW_SPEED = 0.2;
const IDLE_TIMEOUT = 700;

export function initGlowCursor() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const hasFinePointer = matchMedia('(any-pointer: fine)').matches;
  const touchOnly = coarsePointer && !hasFinePointer;
  if (reducedMotion || touchOnly || innerWidth < 800) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'glow-cursor';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);

  const context = canvas.getContext('2d');
  const trail = Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }));
  const target = { x: -100, y: -100 };
  let idleTimer;
  let visible = false;

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function setActive(active) {
    visible = active;
    canvas.classList.toggle('is-active', active);
  }

  function handlePointerMove(event) {
    target.x = event.clientX;
    target.y = event.clientY;
    if (trail[0].x < 0) trail.forEach((point) => Object.assign(point, target));
    setActive(true);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => setActive(false), IDLE_TIMEOUT);
  }

  function drawTrail() {
    trail[0].x += (target.x - trail[0].x) * FOLLOW_SPEED;
    trail[0].y += (target.y - trail[0].y) * FOLLOW_SPEED;
    for (let index = 1; index < trail.length; index++) {
      trail[index].x += (trail[index - 1].x - trail[index].x) * 0.42;
      trail[index].y += (trail[index - 1].y - trail[index].y) * 0.42;
    }

    context.clearRect(0, 0, innerWidth, innerHeight);
    if (trail[0].x < 0) return;

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.shadowColor = 'rgb(202 255 51 / 85%)';
    context.shadowBlur = visible ? 20 : 10;

    for (let index = trail.length - 1; index > 0; index--) {
      const progress = 1 - index / trail.length;
      context.beginPath();
      context.moveTo(trail[index].x, trail[index].y);
      context.lineTo(trail[index - 1].x, trail[index - 1].y);
      context.strokeStyle = `rgb(202 255 51 / ${0.05 + progress * 0.48})`;
      context.lineWidth = 1 + progress * 7;
      context.stroke();
    }

    const pulse = 8 + Math.sin(performance.now() / 180) * 1.5;
    const glow = context.createRadialGradient(
      trail[0].x,
      trail[0].y,
      0,
      trail[0].x,
      trail[0].y,
      pulse * 2.8,
    );
    glow.addColorStop(0, 'rgb(255 255 255 / 95%)');
    glow.addColorStop(0.24, 'rgb(202 255 51 / 80%)');
    glow.addColorStop(1, 'rgb(202 255 51 / 0%)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(trail[0].x, trail[0].y, pulse * 2.8, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function animate() {
    drawTrail();
    requestAnimationFrame(animate);
  }

  resize();
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('mouseleave', () => setActive(false));
  animate();
}
