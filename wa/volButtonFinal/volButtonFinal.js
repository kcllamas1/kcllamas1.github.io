// bubble volume control it'ssss a work in progress
// main idea: 100 bubbles float around, pop them to raise volume
// each bubble = 1%
 
const canvas      = document.getElementById('bubbleCanvas');
const ctx         = canvas.getContext('2d');
const arena       = document.getElementById('bubbleArena');
const volFill     = document.getElementById('volFill');
const volDisplay  = document.getElementById('volDisplay');
const resetBtn    = document.getElementById('resetBtn');
const addBubblesBtn   = document.getElementById('addBubblesBtn');
const toggleSoundBtn  = document.getElementById('toggleSoundBtn');
const arenaHint   = document.getElementById('arenaHint');
 
const BUBBLE_COUNT  = 100;
const ADD_AMOUNT    = 10;
const MIN_R = 10, MAX_R = 22;
 
let bubbles  = [];
let volume   = 0;
let total    = BUBBLE_COUNT;  /// tracks the aount of active bubble
let isPopping = false;
 
// white noise to test vol
let audioCtx    = null;
let noiseSource = null;
let gainNode    = null;
let soundOn     = false;
 
function initAudio() {
  if (audioCtx) return; 
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
 
  // helps buffer white noise
  const bufferSize = audioCtx.sampleRate * 2; 
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data   = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
 
  noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop   = true;
 
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;
 
  noiseSource.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseSource.start();
}
 
function setNoiseVolume(pct) {
  if (gainNode) {
    gainNode.gain.setTargetAtTime(soundOn ? pct / 100 : 0, audioCtx.currentTime, 0.05);
  }
}
 
toggleSoundBtn.addEventListener('click', () => {
  initAudio();
  soundOn = !soundOn;
  toggleSoundBtn.textContent = soundOn ? '⏸ pause sound' : '▶ start sound';
  setNoiseVolume(volume);
});
 
// canvas setup
function resizeCanvas() {
  const rect = arena.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
}
requestAnimationFrame(() => { resizeCanvas(); spawnBubbles(); });
window.addEventListener('resize', () => { resizeCanvas(); });
 
// buble creation
function makeBubble() {
  const r = MIN_R + Math.random() * (MAX_R - MIN_R);
  return {
    x: r + Math.random() * (canvas.width  - 2 * r),
    y: r + Math.random() * (canvas.height - 2 * r),
    r,
    vx: (Math.random() - 0.5) * 0.9,
    vy: (Math.random() - 0.5) * 0.9,
    wobbleTimer: Math.random() * 120,
    hue: 168 + Math.random() * 40,
    alive: true,
  };
}
 
function spawnBubbles() {
  bubbles = Array.from({ length: BUBBLE_COUNT }, makeBubble);
  total   = BUBBLE_COUNT;
  volume  = 0;
  updateUI();
}
 
// add button of 10 bubbles
function addBubbles() {
  const alive = bubbles.filter(b => b.alive).length;
  const canAdd = Math.max(0, 100 - alive);
  const toAdd = Math.min(ADD_AMOUNT, canAdd);
  for (let i = 0; i < toAdd; i++) {
    bubbles.push(makeBubble());
  }
  total += toAdd;
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
 
// visuals
function drawBubbles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
 
  for (const b of bubbles) {
    if (!b.alive) continue;
 
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${b.hue}, 80%, 72%, 0.75)`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = `hsla(${b.hue}, 80%, 72%, 0.06)`;
    ctx.fill();
 
    // dot for bubble decor
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.32, b.r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
  }
}
 
// pop
function tryPop(x, y) {
  let popped = false;
  for (const b of bubbles) {
    if (!b.alive) continue;
    const dx = b.x - x, dy = b.y - y;
    if (Math.hypot(dx, dy) < b.r + 4) {
      b.alive = false;
      spawnBurst(b.x, b.y);
      popped = true;
    }
  }
  if (popped) {
    updateUI();
  }
}
 
function spawnBurst(x, y) {
  const el = document.createElement('div');
  el.className = 'pop-burst';
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  el.style.background = 'rgba(94, 240, 216, 0.5)';
  arena.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
 
function updateUI() {
  const alive = bubbles.filter(b => b.alive).length;
  // volume = how many bubbles are missing from 100
  volume = Math.min(100, Math.max(0, 100 - alive));
  volFill.style.width    = `${volume}%`;
  volDisplay.textContent = `${volume}%`;
  setNoiseVolume(volume);
}
 
// contrl
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
 
addBubblesBtn.addEventListener('click', addBubbles);
 
// mainloop
function loop() {
  updateBubbles();
  drawBubbles();
  requestAnimationFrame(loop);
}
loop();