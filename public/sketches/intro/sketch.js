// --------------------------------------------------
// STRAPONTIN TRAIL + RETRACT + STOP CARD + ROTATING TAGLINE
//
// ✅ ONE project image PER movement
// ✅ NEW STRONG FIX (your request):
//    Next project is allowed ONLY if there were NO mouse events
//    for 3 seconds before the movement.
//
//    - We track last mouse event time via mouseMoved(event).
//    - When we enter the still/stop-card cycle, we "arm" next project.
//    - But we only actually switch if:
//        (now - lastMouseEventAt) >= QUIET_BEFORE_NEXT_MS
//      and cursor moved away from a small anchor.
// --------------------------------------------------

// --------- IMAGES ----------
let imgs = [];
let fallbackImg;

const IMGUR_IDS = ["EmMOLoF", "ThZMWir", "Izb4G8V", "aFUjiyK", "2wSjAnu", "78bH4oj"];

// --------- TEXT ----------
const BASE_LINE = "Bureau 1217 is a design studio based in Geneva and Lyon.";

const TAGLINES = [
  "We combine Identity, Digital Design & Development",
  "We blend technology and design to foster bold ideas.",
  "We connect research, strategy and creativity.",
  "We help you step toward your next communication step.",
  "We bridges meaning and form to connect people to ideas."
];

let taglineIndex = 0;
let prevTaglineIndex = 0;
let taglineTransitionStart = 0;
const taglineTransitionDuration = 950;

let pendingTaglineSwap = false;
let taglineSwapAt = 0;
const taglineSwapDelay = 180;

let hasSwappedOnce = false;

// --------- TRAIL ----------
let stamps = [];
let emitX = 0, emitY = 0;

const stepDist = 28;
const minInterval = 35;
let lastSpawnTime = 0;

let sx = 0, sy = 0;
const smoothAmt = 0.22;

let hasPath = false;
let hasMovedOnce = false;

// ✅ CONSTANT "CARD" SIZE (portrait)
const CARD_H = 220;
const CARD_AR = 0.72;
const CARD_W = Math.round(CARD_H * CARD_AR);

// Stop card size
const IDLE_H = 240;
const IDLE_W = Math.round(IDLE_H * CARD_AR);

// --------- STATES ----------
const STATE_MOVE = "MOVE";
const STATE_HOLD = "HOLD";
const STATE_RETRACT = "RETRACT";
const STATE_YELLOW = "YELLOW";

let state = STATE_MOVE;
let stateStart = 0;

let lastMoveTime = 0;
let idleDelay = 340;
const holdDuration = 200;
let retractDuration = 650;

let stopX = 0, stopY = 0;
let retractN0 = 0;

const yellowDuration = 1500;

// --------- ONE IMAGE PER MOVEMENT ----------
let currentMoveImg = null;
let lastPickedIndex = -1;

// --------------------------------------------------
// QUIET-TIME GATE (3 seconds without mouse events)
// --------------------------------------------------
const QUIET_BEFORE_NEXT_MS = 3000;  // <-- your deal: 3 seconds
const MOVE_START_DIST = 10;         // how far we must move after quiet time to count

let lastMouseEventAt = 0;

let nextProjectArmed = false;       // we WANT to go to next project on next move…
let quietQualified = false;         // …but only after 3s with no events
let quietAnchorX = 0, quietAnchorY = 0;

// p5 calls this when mouse moves (real browser mousemove). :contentReference[oaicite:1]{index=1}
function mouseMoved() {
  lastMouseEventAt = millis();
  // If there’s any mouse event, we invalidate "quiet qualified"
  // (because the deal is: NO event for 3 seconds).
  quietQualified = false;
  return false;
}

// --------------------------------------------------
// SETUP
// --------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noStroke();

  fallbackImg = makeFallbackGraphic();

  for (const id of IMGUR_IDS) loadImgurWithFallbacks(id, img => imgs.push(img));

  sx = mouseX;
  sy = mouseY;
  emitX = sx;
  emitY = sy;

  currentMoveImg = pickNextMovementImage();

  const now = millis();
  lastMoveTime = now;
  lastSpawnTime = now;
  stateStart = now;
  taglineTransitionStart = now;

  lastMouseEventAt = now;
}

// --------------------------------------------------
// DRAW LOOP
// --------------------------------------------------
function draw() {
  background(255);
  const now = millis();

  sx = lerp(sx, mouseX, smoothAmt);
  sy = lerp(sy, mouseY, smoothAmt);

  // "moved" for trail / state machine purposes (unchanged)
  const moved = (mouseX !== pmouseX) || (mouseY !== pmouseY);

  // --------- QUIET QUALIFICATION ----------
  // If next project is armed, we only allow switching after 3s of NO mouse events.
  if (nextProjectArmed && !quietQualified) {
    if (now - lastMouseEventAt >= QUIET_BEFORE_NEXT_MS) {
      quietQualified = true;
      quietAnchorX = mouseX;
      quietAnchorY = mouseY;
    }
  }

  // If we are quiet-qualified, we switch project only when we move away from anchor
  // (so tiny first pixel doesn’t instantly flip).
  const canSwitchNow =
    nextProjectArmed &&
    quietQualified &&
    dist(mouseX, mouseY, quietAnchorX, quietAnchorY) >= MOVE_START_DIST;

  if (moved) {
    hasMovedOnce = true;

    // ✅ the only place we actually switch project:
    if (canSwitchNow) {
      currentMoveImg = pickNextMovementImage();
      nextProjectArmed = false;
      quietQualified = false;

      // clear trail for new movement
      stamps = [];
      emitX = sx;
      emitY = sy;
    }

    // any movement cancels hold/retract/yellow instantly
    state = STATE_MOVE;
    lastMoveTime = now;

    // cancel scheduled swap if user moves
    pendingTaglineSwap = false;

    if (now - lastSpawnTime >= minInterval) {
      emitAlongPath(emitX, emitY, sx, sy, stepDist);
      emitX = sx;
      emitY = sy;
      lastSpawnTime = now;
    }
  }

  // -------- STATE MACHINE --------

  if (state === STATE_MOVE) {
    if (hasPath && (now - lastMoveTime > idleDelay)) {
      state = STATE_HOLD;
      stateStart = now;
      stopX = mouseX;
      stopY = mouseY;
    }
  }

  else if (state === STATE_HOLD) {
    if (now - stateStart >= holdDuration) {
      state = STATE_RETRACT;
      stateStart = now;

      retractN0 = stamps.length;
      retractDuration = constrain(320 + retractN0 * 14, 420, 950);
    }
  }

  else if (state === STATE_RETRACT) {
    const t = (now - stateStart) / retractDuration;
    if (t >= 1) {
      stamps = [];

      if (hasPath && hasMovedOnce) {
        state = STATE_YELLOW;
        stateStart = now;

        // Arm project switching, but gated by 3s of NO mouse events.
        nextProjectArmed = true;
        quietQualified = false;
        // don’t set anchor here; it gets set only once we pass quiet time.

        pendingTaglineSwap = true;
        taglineSwapAt = now + taglineSwapDelay;
      } else {
        state = STATE_MOVE;
      }
    }
  }

  else if (state === STATE_YELLOW) {
    if (pendingTaglineSwap && now >= taglineSwapAt) {
      pendingTaglineSwap = false;

      prevTaglineIndex = taglineIndex;
      taglineIndex = (taglineIndex + 1) % TAGLINES.length;
      taglineTransitionStart = now;

      hasSwappedOnce = true;
    }

    if (now - stateStart >= yellowDuration) {
      // ✅ Do NOT auto-advance project here.
      state = STATE_MOVE;
      emitX = sx;
      emitY = sy;
      lastMoveTime = now;
    }
  }

  // -------- DRAW TRAIL --------
  if (state === STATE_MOVE || state === STATE_HOLD) {
    drawStampsFull();
  } else if (state === STATE_RETRACT) {
    drawStampsRetracting(now);
  }

  // -------- STOP CARD --------
  if (state === STATE_YELLOW) {
    drawStopCardWithFlow(now);
  }

  // -------- TEXT --------
  drawDifferenceText();
}

// --------------------------------------------------
// Pick NEXT movement image (avoid immediate repeat)
// --------------------------------------------------
function pickNextMovementImage() {
  if (!imgs.length) return fallbackImg;
  if (imgs.length === 1) return imgs[0];

  let idx = floor(random(imgs.length));
  if (idx === lastPickedIndex) idx = (idx + 1) % imgs.length;
  lastPickedIndex = idx;

  return imgs[idx];
}

// --------------------------------------------------
// TRAIL DRAWING (CONSTANT CARD SIZE, CENTER-CROPPED)
// --------------------------------------------------
function drawStampsFull() {
  for (const s of stamps) {
    drawImageCroppedToAspect(s.img, s.x, s.y, CARD_W, CARD_H);
  }
}

function drawStampsRetracting(now) {
  const t = constrain((now - stateStart) / retractDuration, 0, 1);
  const p = easeInExpo(t);

  const remaining = ceil((1 - p) * retractN0);
  const startIndex = max(0, stamps.length - remaining);

  for (let i = startIndex; i < stamps.length; i++) {
    const s = stamps[i];
    drawImageCroppedToAspect(s.img, s.x, s.y, CARD_W, CARD_H);
  }
}

// --------------------------------------------------
// STOP CARD (FLOW)
// --------------------------------------------------
function drawStopCardWithFlow(now) {
  const img = currentMoveImg || fallbackImg;

  const tt = now - stateStart;

  const inDur = 140;
  const outDur = 260;
  const holdEnd = max(inDur, yellowDuration - outDur);

  let a;
  if (tt < inDur) {
    a = easeOutCubic(constrain(tt / inDur, 0, 1));
  } else if (tt > holdEnd) {
    const u = constrain((tt - holdEnd) / outDur, 0, 1);
    a = 1 - easeInOutCubic(u);
  } else {
    a = 1;
  }

  const sc = lerp(0.99, 1.0, a);

  push();
  translate(stopX, stopY);
  scale(sc);
  tint(255, 255 * a);
  drawImageCroppedToAspect(img, 0, 0, IDLE_W, IDLE_H);
  pop();
  noTint();
}

// --------------------------------------------------
// TEXT + MASKED SLIDE
// --------------------------------------------------
function drawDifferenceText() {
  const maxW = min(560, width - 80);
  const x = width / 2 - maxW / 2;
  const y = height / 2;

  const prev = TAGLINES[prevTaglineIndex];
  const next = TAGLINES[taglineIndex];

  push();
  blendMode(DIFFERENCE);
  fill(255);
  textSize(20);
  textLeading(28);
  textAlign(LEFT, CENTER);

  text(BASE_LINE, x, y - 14, maxW);

  if (!hasSwappedOnce) {
    text(next, x, y + 14, maxW);
    blendMode(BLEND);
    pop();
    return;
  }

  const raw = constrain(
    (millis() - taglineTransitionStart) / taglineTransitionDuration,
    0,
    1
  );
  const t = easeInOutCubic(raw);

  const lineH = 28;
  const rectX = x;
  const rectW = maxW;
  const rectH = lineH;
  const rectY = (y + 14) - rectH / 2;

  const slideDist = 34;

  const outY = (y + 14) + lerp(0, slideDist, t);
  const inY  = (y + 14) + lerp(-slideDist, 0, t);

  const aOut = 1 - t;
  const aIn  = t;

  // outgoing masked
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(rectX, rectY, rectW, rectH);
  drawingContext.clip();
  fill(255, 255 * aOut);
  text(prev, x, outY, maxW);
  drawingContext.restore();
  pop();

  // incoming masked
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(rectX, rectY, rectW, rectH);
  drawingContext.clip();
  fill(255, 255 * aIn);
  text(next, x, inY, maxW);
  drawingContext.restore();
  pop();

  blendMode(BLEND);
  pop();
}

// --------------------------------------------------
// EMISSION
// --------------------------------------------------
function emitAlongPath(x0, y0, x1, y1, step) {
  const d = dist(x0, y0, x1, y1);

  if (d < step * 0.65) {
    spawnStamp(x1, y1);
    return;
  }

  const steps = floor(d / step);
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    spawnStamp(lerp(x0, x1, u), lerp(y0, y1, u));
  }
}

function spawnStamp(x, y) {
  const img = currentMoveImg || (imgs.length ? imgs[0] : fallbackImg);
  stamps.push({ x, y, img });

  hasPath = true;
  if (stamps.length > 240) stamps.shift();
}

// --------------------------------------------------
// CONSTANT CARD CROPPING (CENTER-CROP)
// --------------------------------------------------
function drawImageCroppedToAspect(img, x, y, dw, dh) {
  img = img || fallbackImg;
  if (!img || !img.width || !img.height) return;

  const iw = img.width;
  const ih = img.height;

  const targetAR = dw / dh;
  const srcAR = iw / ih;

  let sx, sy, sw, sh;

  if (srcAR > targetAR) {
    sh = ih;
    sw = ih * targetAR;
    sx = (iw - sw) * 0.5;
    sy = 0;
  } else {
    sw = iw;
    sh = iw / targetAR;
    sx = 0;
    sy = (ih - sh) * 0.5;
  }

  image(img, x, y, dw, dh, sx, sy, sw, sh);
}

// --------------------------------------------------
// UTILS
// --------------------------------------------------
function loadImgurWithFallbacks(id, onSuccess, onFail) {
  const exts = ["png", "jpg", "jpeg", "gif"];
  let idx = 0;

  function tryNext() {
    if (idx >= exts.length) return onFail?.();
    const url = `https://i.imgur.com/${id}.${exts[idx++]}`;
    loadImage(url, (img) => onSuccess?.(img), () => tryNext());
  }
  tryNext();
}

function makeFallbackGraphic() {
  const g = createGraphics(240, 160);
  g.background(240);
  g.fill(0);
  g.textAlign(CENTER, CENTER);
  g.text("loading…", 120, 80);
  return g;
}

// EASING
function easeInExpo(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return pow(2, 10 * (x - 1));
}
function easeOutCubic(x) {
  return 1 - pow(1 - x, 3);
}
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
