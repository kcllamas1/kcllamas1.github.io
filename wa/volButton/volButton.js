// bubble volume control it'ssss a work in progress
// main idea: 100 bubbles float around, pop them to raise volume
// each bubble = 1%
 
const canvas     = document.getElementById('bubbleCanvas');
const ctx        = canvas.getContext('2d');
const arena      = document.getElementById('bubbleArena');
const volFill    = document.getElementById('volFill');
const volDisplay = document.getElementById('volDisplay');
const poppedCount = document.getElementById('poppedCount');
const resetBtn   = document.getElementById('resetBtn');
const arenaHint  = document.getElementById('arenaHint');
 
const BUBBLE_COUNT = 100;
const MIN_R = 10, MAX_R = 22;
 
let bubbles = [];
let volume = 0;
let isPopping = false;
 
// canvas setup
function resizeCanvas() {
  const rect = arena.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
}
requestAnimationFrame(() => { resizeCanvas(); spawnBubbles(); });
window.addEventListener('resize', () => { resizeCanvas(); spawnBubbles(); });
 
// make the buubles
function makeBubble() {
  const r = MIN_R + Math.random() * (MAX_R - MIN_R);
  return {
    x: r + Math.random() * (canvas.width  - 2 * r),
    y: r + Math.random() * (canvas.height - 2 * r),
    r,
    vx: (Math.random() - 0.5) * 0.9,
    vy: (Math.random() - 0.5) * 0.9,
    wobbleTimer: Math.random() * 120,
    hue: 180 + Math.random() * 60,
    alive: true,
  };
}
 
function spawnBubbles() {
  bubbles = Array.from({ length: BUBBLE_COUNT }, makeBubble);
  volume = 0;
  updateUI();
}
 
// phys
function updateBubbles() {
  const W = canvas.width, H = canvas.height;
  for (const b of bubbles) {
    if (!b.alive) continue;
 
    b.wobbleTimer--;
    if (b.wobbleTimer <= 0) {
      b.vx += (Math.random() - 0.5) * 0.6;
      b.vy += (Math.random() - 0.5) * 0.6;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > 1.4) { b.vx *= 1.4 / speed; b.vy *= 1.4 / speed; }
      b.wobbleTimer = 60 + Math.random() * 120;
    }
 
    b.x += b.vx;
    b.y += b.vy;
 
    if (b.x - b.r < 0) { b.x = b.r;     b.vx *= -1; }
    if (b.x + b.r > W) { b.x = W - b.r; b.vx *= -1; }
    if (b.y - b.r < 0) { b.y = b.r;     b.vy *= -1; }
    if (b.y + b.r > H) { b.y = H - b.r; b.vy *= -1; }
  }
}
 
// more visual stuff
// goas..make bubbles look nicer, these are pretty rough
function drawBubbles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
 
  for (const b of bubbles) {
    if (!b.alive) continue;
 
    //basic circle for now
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${b.hue}, 70%, 60%, 0.8)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = `hsla(${b.hue}, 70%, 80%, 0.1)`;
    ctx.fill();
 
    // small highlight dot to make it look more bubblely
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
  }
}
 
//popping the bubble
function tryPop(x, y) {
  let popped = false;
  for (const b of bubbles) {
    if (!b.alive) continue;
    const dx = b.x - x, dy = b.y - y;
    if (Math.hypot(dx, dy) < b.r + 4) {
      b.alive = false;
      volume = Math.min(100, volume + 1);
      spawnBurst(b.x, b.y);
      popped = true;
    }
  }
  if (popped) updateUI();
}
 
function spawnBurst(x, y) {
  const el = document.createElement('div');
  el.className = 'pop-burst';
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  el.style.background = 'rgba(100, 200, 255, 0.5)';
  arena.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
 
// 
function updateUI() {
  const popped = BUBBLE_COUNT - bubbles.filter(b => b.alive).length;
  volFill.style.width  = `${volume}%`;
  volDisplay.textContent = `${volume}%`;
  poppedCount.textContent = popped;
}
 
// controls
arena.addEventListener('mousedown', e => {
  isPopping = true;
  arenaHint.classList.add('hidden');
  const rect = arena.getBoundingClientRect();
  tryPop(e.clientX - rect.left, e.clientY - rect.top);
});
window.addEventListener('mouseup', () => { isPopping = false; });
arena.addEventListener('mousemove', e => {
  if (!isPopping) return;
  const rect = arena.getBoundingClientRect();
  tryPop(e.clientX - rect.left, e.clientY - rect.top);
});
 
// touch support.. added this so it works on phone too
arena.addEventListener('touchstart', e => {
  e.preventDefault();
  isPopping = true;
  arenaHint.classList.add('hidden');
  const rect = arena.getBoundingClientRect();
  tryPop(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
}, { passive: false });
arena.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!isPopping) return;
  const rect = arena.getBoundingClientRect();
  tryPop(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
}, { passive: false });
arena.addEventListener('touchend', () => { isPopping = false; });
 
resetBtn.addEventListener('click', () => {
  spawnBubbles();
  arenaHint.classList.remove('hidden');
});
 
// main loop
function loop() {
  updateBubbles();
  drawBubbles();
  requestAnimationFrame(loop);
}
loop();