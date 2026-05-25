// Escape Room — Stage 1 MVP
// 혼자만의 고독한 사투

// --- 적응형 캔버스 ---
let W, H, S;                            // W/H = 캔버스 픽셀, S = 아트 스케일 (W/360 기준)
let ROOM_TOP, ROOM_BOTTOM, BTN_AREA_TOP;
let PLAYER_RANGE_LEFT, PLAYER_RANGE_RIGHT;
const DESKTOP_MAX_W = 500;              // 데스크탑에서 너비 제한 (모바일에서는 자동으로 풀폭)

// --- 밸런스 수치 ---
const AUTO_DRIFT_PER_SEC = 0.025;
const FORWARD_PER_TAP = 0.020;
const BOX_PENALTY = 0.5;
const BOX_INTERVAL_MS = 4000;
const MAX_BOX_COUNT = 8;

// --- 상태 ---
let phase = 'countdown';
let loseReason = null;
let countdownStart = 0;
let playerX = 0.5;
let boxCount = 0;
let lastBoxDrop = 0;
let boxFlashAt = -9999;
let heldRest = false;
let endShownAt = 0;

function setup() {
  recomputeLayout();
  const cnv = createCanvas(W, H);
  cnv.style('display', 'block');
  smooth();
  textAlign(CENTER, CENTER);
  resetGame();
}

function windowResized() {
  recomputeLayout();
  resizeCanvas(W, H);
}

// 뷰포트 크기로부터 레이아웃 좌표·스케일을 재계산
function recomputeLayout() {
  W = Math.min(window.innerWidth, DESKTOP_MAX_W);
  H = window.innerHeight;
  S = W / 360;

  // 하단 버튼 영역
  const btnAreaH = Math.min(170 * S, H * 0.30);
  const bottomMargin = 16 * S;
  BTN_AREA_TOP = H - btnAreaH - bottomMargin;

  // 방 영역
  const roomGap = 16 * S;
  ROOM_BOTTOM = BTN_AREA_TOP - roomGap;
  ROOM_TOP = Math.max(50 * S, H * 0.08);

  // 플레이어 가로 범위
  PLAYER_RANGE_LEFT = W * 0.22;
  PLAYER_RANGE_RIGHT = W * 0.84;
}

function resetGame() {
  phase = 'countdown';
  loseReason = null;
  countdownStart = millis();
  playerX = 0.5;
  boxCount = 0;
  lastBoxDrop = 0;
  boxFlashAt = -9999;
  heldRest = false;
}

function draw() {
  if (phase === 'countdown') stepCountdown();
  else if (phase === 'playing') stepPlaying();

  drawScene();
  drawHUD();

  if (phase === 'countdown') drawCountdownOverlay();
  if (phase === 'playing') drawButtons();
  if (phase === 'win' || phase === 'lose') drawEndCard();
}

// ---------- step ----------
function stepCountdown() {
  const elapsed = (millis() - countdownStart) / 1000;
  if (elapsed > 4.2) {
    phase = 'playing';
    lastBoxDrop = millis();
  }
}

function stepPlaying() {
  const dt = deltaTime / 1000;

  if (!heldRest) {
    playerX -= AUTO_DRIFT_PER_SEC * dt;
  }

  if (millis() - lastBoxDrop > BOX_INTERVAL_MS) {
    boxCount += 1;
    boxFlashAt = millis();
    lastBoxDrop = millis();
  }

  if (playerX >= 1) {
    phase = 'win';
    playerX = 1;
    endShownAt = millis();
  } else if (playerX <= 0) {
    phase = 'lose';
    loseReason = 'bed';
    playerX = 0;
    endShownAt = millis();
  } else if (boxCount >= MAX_BOX_COUNT) {
    phase = 'lose';
    loseReason = 'crushed';
    endShownAt = millis();
  }
}

// ---------- scene ----------
function drawScene() {
  const b = constrain(playerX, 0, 1);
  const bg = lerpColor(color(10, 8, 22), color(80, 65, 115), b);
  background(bg);

  noStroke();
  fill(red(bg) * 0.7, green(bg) * 0.7, blue(bg) * 0.85);
  rect(0, 0, W, ROOM_TOP);

  fill(45 + b * 30, 35 + b * 25, 70 + b * 30);
  rect(0, ROOM_BOTTOM - 30 * S, W, 30 * S);

  drawBed(18 * S, ROOM_BOTTOM - 70 * S);
  drawTrash(95 * S, ROOM_BOTTOM - 22 * S);
  drawTrash(130 * S, ROOM_BOTTOM - 18 * S);

  drawDoor(W - 28 * S, ROOM_TOP + 20 * S, ROOM_BOTTOM - 30 * S);

  const px = lerp(PLAYER_RANGE_LEFT, PLAYER_RANGE_RIGHT, playerX);
  const py = ROOM_BOTTOM - 30 * S;
  drawPlayer(px, py);
  drawBoxStack(px, py, boxCount);

  const darkAlpha = (1 - b) * 140;
  if (darkAlpha > 0) {
    fill(0, darkAlpha);
    rect(0, 0, W, H);
  }
}

function drawBed(x, y) {
  noStroke();
  fill(70, 50, 60);
  rect(x, y, 78 * S, 30 * S);
  fill(150, 80, 95);
  rect(x + 4 * S, y + 4 * S, 70 * S, 22 * S);
  fill(230, 215, 230);
  rect(x + 6 * S, y + 6 * S, 22 * S, 14 * S);
  fill(120, 60, 75);
  rect(x + 36 * S, y + 6 * S, 36 * S, 18 * S);
}

function drawTrash(x, y) {
  noStroke();
  fill(60, 60, 60);
  rect(x, y, 14 * S, 10 * S);
  fill(80, 80, 80);
  rect(x + 4 * S, y - 5 * S, 10 * S, 6 * S);
}

function drawDoor(x, yTop, yBottom) {
  noStroke();
  fill(100, 230, 180, 60);
  rect(x - 6 * S, yTop, 16 * S, yBottom - yTop);
  fill(140, 240, 200);
  rect(x, yTop, 4 * S, yBottom - yTop);
}

function drawPlayer(x, y) {
  noStroke();
  fill(110, 75, 45);
  rect(x - 10 * S, y - 38 * S, 4 * S, 34 * S);
  rect(x - 12 * S, y - 8 * S, 10 * S, 4 * S);
  fill(85, 55, 30);
  rect(x - 11 * S, y - 6 * S, 8 * S, 2 * S);

  fill(40, 35, 60);
  rect(x - 6 * S, y - 8 * S, 4 * S, 8 * S);
  rect(x + 1 * S, y - 8 * S, 4 * S, 8 * S);

  fill(80, 90, 130);
  rect(x - 7 * S, y - 22 * S, 13 * S, 16 * S);

  fill(245, 220, 200);
  rect(x - 5 * S, y - 32 * S, 11 * S, 11 * S);
  fill(40, 30, 35);
  rect(x - 5 * S, y - 32 * S, 11 * S, 5 * S);
  rect(x - 5 * S, y - 28 * S, 2 * S, 3 * S);
  rect(x + 4 * S, y - 28 * S, 2 * S, 3 * S);
  fill(20);
  rect(x + 3 * S, y - 26 * S, 2 * S, 2 * S);
}

function drawBoxStack(x, baseY, count) {
  if (count === 0) return;
  const flash = millis() - boxFlashAt < 400;
  const topIdx = count - 1;
  for (let i = 0; i < count; i++) {
    const bx = x - 16 * S;
    const by = baseY - 42 * S - i * 9 * S;
    const isTop = i === topIdx;
    let c = color(200, 140, 80);
    if (isTop && flash && Math.floor(millis() / 80) % 2 === 0) {
      c = color(255, 230, 160);
    }
    noStroke();
    fill(c);
    rect(bx, by, 18 * S, 9 * S);
    fill(140, 80, 35);
    rect(bx, by + 4 * S, 18 * S, 1 * S);
    rect(bx + 8 * S, by, 1 * S, 9 * S);
  }
}

// ---------- countdown overlay ----------
function drawCountdownOverlay() {
  fill(0, 170);
  rect(0, 0, W, H);
  const elapsed = (millis() - countdownStart) / 1000;
  let label = '';
  let big = true;
  if (elapsed < 1)      label = '3';
  else if (elapsed < 2) label = '2';
  else if (elapsed < 3) label = '1';
  else { label = '방을 탈출하세요'; big = false; }

  fill(255);
  textSize((big ? 90 : 26) * S);
  text(label, W / 2, H / 2);
}

// ---------- HUD ----------
function drawHUD() {
  textSize(12 * S);
  fill(180, 240, 200, 220);
  textAlign(LEFT, TOP);
  text('[ROOM_01]', 10 * S, 12 * S);
  textAlign(RIGHT, TOP);
  text('지게 무게: ' + boxCount, W - 10 * S, 12 * S);
  textAlign(CENTER, CENTER);
}

// ---------- buttons ----------
function forwardBtn() {
  const btnH = Math.min(140 * S, H * 0.22);
  return {
    x: W * 0.28,
    y: BTN_AREA_TOP + 10 * S,
    w: W * 0.66,
    h: btnH,
  };
}
function restBtn() {
  const btnH = Math.min(70 * S, H * 0.11);
  return {
    x: W * 0.04,
    y: BTN_AREA_TOP + 40 * S,
    w: W * 0.22,
    h: btnH,
  };
}
function inRect(mx, my, r) {
  return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}

function drawButtons() {
  const fwd = forwardBtn();
  const rest = restBtn();

  // [앞으로 가기]
  noStroke();
  fill(40, 10, 15);
  rect(fwd.x + 3 * S, fwd.y + 5 * S, fwd.w, fwd.h, 10 * S);
  fill(220, 60, 70);
  rect(fwd.x, fwd.y, fwd.w, fwd.h, 10 * S);
  fill(255, 120, 130);
  rect(fwd.x + 6 * S, fwd.y + 6 * S, fwd.w - 12 * S, 6 * S, 6 * S);
  fill(255);
  textSize(22 * S);
  text('▶ 앞으로 가기', fwd.x + fwd.w / 2, fwd.y + fwd.h / 2);

  // [잠시 쉬기] — 피자박스가 쌓인 모양
  fill(30, 25, 30);
  rect(rest.x + 3 * S, rest.y + 5 * S, rest.w, rest.h, 8 * S);
  fill(heldRest ? 180 : 130, heldRest ? 150 : 125, heldRest ? 130 : 130);
  rect(rest.x, rest.y, rest.w, rest.h, 8 * S);

  push();
  translate(rest.x + 14 * S, rest.y + 14 * S);
  fill(200, 140, 80);
  rect(2 * S, 14 * S, 50 * S, 10 * S);
  rect(6 * S, 6 * S, 46 * S, 10 * S);
  rect(10 * S, -2 * S, 42 * S, 10 * S);
  fill(140, 80, 35);
  rect(2 * S, 18 * S, 50 * S, 1 * S);
  rect(6 * S, 10 * S, 46 * S, 1 * S);
  rect(10 * S, 2 * S, 42 * S, 1 * S);
  pop();
  fill(255);
  textSize(12 * S);
  text('잠시 쉬기', rest.x + rest.w / 2, rest.y + rest.h - 12 * S);
}

// ---------- end card ----------
function drawEndCard() {
  fill(0, 200);
  rect(0, 0, W, H);

  let title, body, hint;
  if (phase === 'win') {
    title = '문에 도달했습니다';
    body = '(1단계 클리어 — 2단계 추가 예정)';
    hint = '※ 본편: 줌아웃 + 멀티룸 연출';
  } else if (loseReason === 'crushed') {
    title = '박스 무게에 짓눌렸습니다';
    body = '지게가 더 이상 버티지 못했습니다';
    hint = '※ 본편: HELP → 줌아웃 → 함께 탈출';
  } else {
    title = '침대에 잠식되었습니다';
    body = '(여기서 HELP 버튼이 등장합니다)';
    hint = '※ 본편: HELP → 줌아웃 → 함께 탈출';
  }

  fill(255);
  textSize(22 * S);
  text(title, W / 2, H / 2 - 50 * S);
  textSize(13 * S);
  fill(230, 230, 230);
  text(body, W / 2, H / 2 - 10 * S);
  fill(160, 200, 220);
  text(hint, W / 2, H / 2 + 14 * S);

  if (millis() - endShownAt > 800) {
    fill(255, 200 + sin(millis() / 300) * 40);
    textSize(12 * S);
    text('탭하면 다시 시작', W / 2, H / 2 + 60 * S);
  }
}

// ---------- input ----------
function handlePress(mx, my) {
  if (phase === 'countdown') return;
  if (phase === 'win' || phase === 'lose') {
    if (millis() - endShownAt > 800) resetGame();
    return;
  }
  if (inRect(mx, my, forwardBtn())) {
    playerX += FORWARD_PER_TAP / (1 + boxCount * BOX_PENALTY);
  } else if (inRect(mx, my, restBtn())) {
    heldRest = true;
  }
}

function handleRelease() {
  heldRest = false;
}

function mousePressed() { handlePress(mouseX, mouseY); return false; }
function mouseReleased() { handleRelease(); return false; }
function touchStarted() {
  if (touches.length > 0) handlePress(touches[0].x, touches[0].y);
  else handlePress(mouseX, mouseY);
  return false;
}
function touchEnded() { handleRelease(); return false; }
