// --------------------------------------------------
// STRAPONTIN TRAIL + RETRACT + STOP CARD + ROTATING TAGLINE
//
// ✅ LOCAL ASSETS:
//    - 1.png ... 10.png
//    - font.otf
//
// ✅ ONE project image PER "movement start"
// ✅ FIXED: quiet gate uses draw() movement (no mouseMoved trap)
//    Next project is allowed ONLY if there was NO movement
//    for 3 seconds before the movement start.
// --------------------------------------------------

const PROJECT_COUNT = 10;
const FONT_FILE = "font.otf";

// --------- ASSETS ----------
let imgs = [];
let imgReady = [];
let fallbackImg;
let uiFont = null;

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
// QUIET-TIME GATE (3 seconds without movement)
// --------------------------------------------------
const QUIET_BEFORE_NEXT_MS = 3000;
const MOVE_START_DIST = 10;

// We track last movement time INSIDE draw()
let lastMoveEventAt = 0;

let nextProjectArmed = false;
let quietQualified = false;
let quietAnchorX = 0, quietAnchorY = 0;

// --------------------------------------------------
// PRELOAD (ROBUST LOCAL LOADING)
// --------------------------------------------------
function preload() {
  fallbackImg = makeFallbackGraphic();

  uiFont = loadFont(
    FONT_FILE,
    () => {},
    () => { uiFont = null; }
  );

  imgs = new Array(PROJECT_COUNT);
  imgReady = new Array(PROJECT_COUNT).fill(false);

  for (let i = 1; i <= PROJECT_COUNT; i++) {
    const idx = i - 1;
    const filename = `${i}.png`;

    imgs[idx] = loadImage(
      filename,
      () => { imgReady[idx] = true; },
      () => {
        imgs[idx] = fallbackImg;
        imgReady[idx] = true;
      }
    );
  }
}

// --------------------------------------------------
// SETUP
// --------------------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noStroke();

  if (uiFont) textFont(uiFont);

  sx = mouseX;
  sy = mouseY;
  emitX = sx;
  emitY = sy;

  currentMoveImg = pickNextMovementImage();

  const now = millis();
  lastMoveTime = now;
  lastMoveEventAt = now;
  lastSpawnTime = now;
  stateStart = now;
  taglineTransitionStart = now;
}

// --------------------------------------------------
// DRAW LOOP
// --------------------------------------------------
function draw() {
  background(255);
  const now = millis();

  sx = lerp(sx, mouseX, smoothAmt);
  sy = lerp(sy, mouseY, smoothAmt);

  // movement seen by draw()
  const moved = (mouseX !== pmouseX) || (mouseY !== pmouseY);

  // update last movement timestamp
  if (moved) lastMoveEventAt = now;

  // --------- QUIET QUALIFICATION ----------
  // Only after 3 seconds without movement, while armed
  if (nextProjectArmed && !quietQualified) {
    if (now - lastMoveEventAt >= QUIET_BEFORE_NEXT_MS) {
      quietQualified = true;
      quietAnchorX = mouseX;
      quietAnchorY = mouseY;
    }
  }

  // Switch only when moving away from anchor AFTER quiet
  const canSwitchNow =
    nextProjectArmed &&
    quietQualified &&
    dist(mouseX, mouseY, quietAnchorX, quietAnchorY) >= MOVE_START_DIST;

  if (moved) {
    hasMovedOnce = true;

    // ✅ Switch image on movement start after quiet
    if (canSwitchNow) {
      currentMoveImg = pickNextMovementImage();
      nextProjectArmed = false;
      quietQualified = false;

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

        // Arm next switch (quiet gate will qualify after 3s without movement)
        nextProjectArmed = true;
        quietQualified = false;

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
  const readyIdx = [];
  for (let i = 0; i < imgs.length; i++) {
    if (imgReady[i]) readyIdx.push(i);
  }

  if (!readyIdx.length) return fallbackImg;

  if (readyIdx.length === 1) {
    lastPickedIndex = readyIdx[0];
    return imgs[readyIdx[0]] || fallbackImg;
  }

  let idx = readyIdx[floor(random(readyIdx.length))];
  if (idx === lastPickedIndex) {
    const k = readyIdx.indexOf(idx);
    idx = readyIdx[(k + 1) % readyIdx.length];
  }
  lastPickedIndex = idx;

  return imgs[idx] || fallbackImg;
}

// --------------------------------------------------
// TRAIL DRAWING
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

  let a = 1;
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
  const maxW = min(560 * 2, width - 80);
  const x = width / 2 - maxW / 2;
  const y = height / 2;

  const prev = TAGLINES[prevTaglineIndex];
  const next = TAGLINES[taglineIndex];
  const fontRapport = 1.5

  push();
  blendMode(DIFFERENCE);
  fill(255);
  textSize(20 * fontRapport);
  textLeading(28 * fontRapport);
  textAlign(CENTER);

  text(BASE_LINE, x, y - 12 * fontRapport, maxW);

  if (!hasSwappedOnce) {
    text(next, x, y + 12 * fontRapport, maxW);
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

  const lineH = 28 * fontRapport;
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
  const img = currentMoveImg || fallbackImg;
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
