// Escape Room — Stage 1 MVP
// 혼자만의 고독한 사투

const W = 360;
const H = 640;
const ROOM_TOP = 70;
const ROOM_BOTTOM = 440;
const BTN_AREA_TOP = 470;

const PLAYER_RANGE_LEFT = 70;   // 침대 가까운 x
const PLAYER_RANGE_RIGHT = W - 55; // 문 가까운 x

// --- 밸런스 수치 ---
const AUTO_DRIFT_PER_SEC = 0.025;       // 가만히 있으면 약 40초에 침대 도달
const FORWARD_PER_TAP = 0.020;          // 박스 0개 기준 한 탭당 전진
const BOX_PENALTY = 0.5;                // forward / (1 + boxCount * 0.5)
const BOX_INTERVAL_MS = 4000;
const MAX_BOX_COUNT = 8;                // 이 수치 이상 쌓이면 압사

// --- 상태 ---
let phase = 'countdown';   // 'countdown' | 'playing' | 'win' | 'lose'
let loseReason = null;     // 'bed' | 'crushed'
let countdownStart = 0;
let playerX = 0.5;          // 0 = 침대, 1 = 문
let boxCount = 0;
let lastBoxDrop = 0;
let boxFlashAt = -9999;
let heldRest = false;
let endShownAt = 0;

function setup() {
  const cnv = createCanvas(W, H);
  cnv.style('display', 'block');
  pixelDensity(1);
  noSmooth();
  textAlign(CENTER, CENTER);
  resetGame();
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
  // 밝기: 오른쪽으로 갈수록 밝아짐
  const b = constrain(playerX, 0, 1);
  const bg = lerpColor(color(10, 8, 22), color(80, 65, 115), b);
  background(bg);

  // 위쪽 벽 영역 살짝 어둡게
  noStroke();
  fill(red(bg) * 0.7, green(bg) * 0.7, blue(bg) * 0.85);
  rect(0, 0, W, ROOM_TOP);

  // 바닥
  fill(45 + b * 30, 35 + b * 25, 70 + b * 30);
  rect(0, ROOM_BOTTOM - 30, W, 30);

  // 침대 (왼쪽)
  drawBed(18, ROOM_BOTTOM - 70);
  // 쓰레기 더미
  drawTrash(95, ROOM_BOTTOM - 22);
  drawTrash(130, ROOM_BOTTOM - 18);

  // 문 (오른쪽 세로 선)
  drawDoor(W - 28, ROOM_TOP + 20, ROOM_BOTTOM - 30);

  // 캐릭터 + 박스
  const px = lerp(PLAYER_RANGE_LEFT, PLAYER_RANGE_RIGHT, playerX);
  const py = ROOM_BOTTOM - 30;
  drawPlayer(px, py);
  drawBoxStack(px, py, boxCount);

  // 어두움 오버레이 (왼쪽일수록 진함)
  const darkAlpha = (1 - b) * 140;
  if (darkAlpha > 0) {
    fill(0, darkAlpha);
    rect(0, 0, W, H);
  }
}

function drawBed(x, y) {
  noStroke();
  fill(70, 50, 60);
  rect(x, y, 78, 30);                // 프레임
  fill(150, 80, 95);
  rect(x + 4, y + 4, 70, 22);        // 매트리스
  fill(230, 215, 230);
  rect(x + 6, y + 6, 22, 14);        // 베개
  // 흐트러진 이불 한 자락
  fill(120, 60, 75);
  rect(x + 36, y + 6, 36, 18);
}

function drawTrash(x, y) {
  noStroke();
  fill(60, 60, 60);
  rect(x, y, 14, 10);
  fill(80, 80, 80);
  rect(x + 4, y - 5, 10, 6);
}

function drawDoor(x, yTop, yBottom) {
  noStroke();
  // 문 빛 번짐
  fill(100, 230, 180, 60);
  rect(x - 6, yTop, 16, yBottom - yTop);
  // 문선
  fill(140, 240, 200);
  rect(x, yTop, 4, yBottom - yTop);
}

function drawPlayer(x, y) {
  noStroke();
  // 지게 (등 뒤 — 캐릭터 왼쪽으로 약간 오프셋)
  fill(110, 75, 45);
  rect(x - 10, y - 38, 4, 34);       // 세로 프레임
  rect(x - 12, y - 8, 10, 4);        // 받침
  fill(85, 55, 30);
  rect(x - 11, y - 6, 8, 2);

  // 다리
  fill(40, 35, 60);
  rect(x - 6, y - 8, 4, 8);
  rect(x + 1, y - 8, 4, 8);

  // 몸통 (후드 느낌)
  fill(80, 90, 130);
  rect(x - 7, y - 22, 13, 16);

  // 머리
  fill(245, 220, 200);
  rect(x - 5, y - 32, 11, 11);
  // 머리카락
  fill(40, 30, 35);
  rect(x - 5, y - 32, 11, 5);
  rect(x - 5, y - 28, 2, 3);
  rect(x + 4, y - 28, 2, 3);
  // 오른쪽을 바라보는 눈
  fill(20);
  rect(x + 3, y - 26, 2, 2);
}

function drawBoxStack(x, baseY, count) {
  if (count === 0) return;
  const flash = millis() - boxFlashAt < 400;
  const topIdx = count - 1;
  for (let i = 0; i < count; i++) {
    const bx = x - 16;
    const by = baseY - 42 - i * 9;
    const isTop = i === topIdx;
    let c = color(200, 140, 80);
    if (isTop && flash && Math.floor(millis() / 80) % 2 === 0) {
      c = color(255, 230, 160);
    }
    noStroke();
    fill(c);
    rect(bx, by, 18, 9);
    // 박스 디테일
    fill(140, 80, 35);
    rect(bx, by + 4, 18, 1);
    rect(bx + 8, by, 1, 9);
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
  textSize(big ? 90 : 26);
  text(label, W / 2, H / 2);
}

// ---------- HUD ----------
function drawHUD() {
  textSize(12);
  fill(180, 240, 200, 220);
  textAlign(LEFT, TOP);
  text('[ROOM_01]', 10, 12);
  textAlign(RIGHT, TOP);
  text('지게 무게: ' + boxCount, W - 10, 12);
  textAlign(CENTER, CENTER);
}

// ---------- buttons ----------
function forwardBtn() {
  return { x: 20, y: BTN_AREA_TOP + 10, w: 230, h: 140 };
}
function restBtn() {
  return { x: 265, y: BTN_AREA_TOP + 50, w: 80, h: 70 };
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
  rect(fwd.x + 3, fwd.y + 5, fwd.w, fwd.h, 10);
  fill(220, 60, 70);
  rect(fwd.x, fwd.y, fwd.w, fwd.h, 10);
  fill(255, 120, 130);
  rect(fwd.x + 6, fwd.y + 6, fwd.w - 12, 6, 6);
  fill(255);
  textSize(22);
  text('▶ 앞으로 가기', fwd.x + fwd.w / 2, fwd.y + fwd.h / 2);

  // [잠시 쉬기] — 피자박스가 쌓인 모양
  fill(30, 25, 30);
  rect(rest.x + 3, rest.y + 5, rest.w, rest.h, 8);
  fill(heldRest ? 180 : 130, heldRest ? 150 : 125, heldRest ? 130 : 130);
  rect(rest.x, rest.y, rest.w, rest.h, 8);
  // 작은 피자박스 아이콘 더미
  push();
  translate(rest.x + 14, rest.y + 14);
  fill(200, 140, 80);
  rect(2, 14, 50, 10);
  rect(6, 6, 46, 10);
  rect(10, -2, 42, 10);
  fill(140, 80, 35);
  rect(2, 18, 50, 1);
  rect(6, 10, 46, 1);
  rect(10, 2, 42, 1);
  pop();
  fill(255);
  textSize(12);
  text('잠시 쉬기', rest.x + rest.w / 2, rest.y + rest.h - 12);
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
  textSize(22);
  text(title, W / 2, H / 2 - 50);
  textSize(13);
  fill(230, 230, 230);
  text(body, W / 2, H / 2 - 10);
  fill(160, 200, 220);
  text(hint, W / 2, H / 2 + 14);

  if (millis() - endShownAt > 800) {
    fill(255, 200 + sin(millis() / 300) * 40);
    textSize(12);
    text('탭하면 다시 시작', W / 2, H / 2 + 60);
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
