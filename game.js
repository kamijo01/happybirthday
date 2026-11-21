// ==========================================
// 1. SETUP NG CANVAS, CARD, AUDIO, AT CONTROLS
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const card = document.getElementById("birthdayCard");
const replayBtn = document.getElementById("replayBtn");
const bgMusic = document.getElementById("bgMusic");
const winMusic = document.getElementById("winMusic");
const musicBtn = document.getElementById("musicBtn");

let gameWon = false;
let winTimer = null;
let particles = [];
let arrowTrail = [];
let isMuted = false;

// Posisyon at anggulo ng pana (Bow)
const bow = { x: 110, y: 250, angle: 0 };

// Detalye at galaw ng palaso (Arrow)
let arrow = { x: 110, y: 250, vx: 0, vy: 0, active: false };

// Detalye at galaw ng gumagalaw na puso (Heart)
let heart = { x: 640, y: 250, size: 48, speedY: 3 };


// ==========================================
// 2. AUDIO CONTROLS (BG MUSIC & WIN MUSIC)
// ==========================================
function startBgMusic() {
    if (!bgMusic || isMuted) return;
    bgMusic.volume = gameWon ? 0.15 : 0.45;
    bgMusic.play().catch(() => {});
}

function playWinMusic() {
    if (!winMusic || isMuted) return;
    if (bgMusic) {
        bgMusic.volume = 0.15;
    }
    winMusic.currentTime = 0;
    winMusic.volume = 0.85;
    winMusic.play().catch(() => {});
}

function resetMusicForReplay() {
    if (winMusic) {
        winMusic.pause();
        winMusic.currentTime = 0;
    }
    if (bgMusic && !isMuted) {
        bgMusic.volume = 0.45;
        bgMusic.play().catch(() => {});
    }
}

function updateMusicButton() {
    if (!musicBtn) return;
    musicBtn.textContent = isMuted ? "🔇 Music: OFF" : "🔊 Music: ON";
}

if (musicBtn) {
    musicBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        isMuted = !isMuted;
        if (bgMusic) bgMusic.muted = isMuted;
        if (winMusic) winMusic.muted = isMuted;
        updateMusicButton();
        if (!isMuted) {
            if (gameWon) {
                playWinMusic();
            } else {
                startBgMusic();
            }
        }
    });
}


// ==========================================
// 3. RESPONSIVE SIZING (PC & MOBILE)
// ==========================================
function resizeGame() {
    if (!canvas) return;

    const availWidth = Math.max(280, window.innerWidth - 28);
    const availHeight = Math.max(260, window.innerHeight - 28);

    const isPortraitMobile = availWidth < 600 && availHeight > availWidth;

    let width = availWidth;
    let height = isPortraitMobile
        ? Math.min(availHeight, Math.round(availWidth * 1.15))
        : Math.min(availHeight, Math.round(availWidth * 0.65));

    if (!isPortraitMobile && width / height > 1.85) {
        width = Math.round(height * 1.75);
    }

    canvas.width = Math.max(280, width);
    canvas.height = Math.max(220, height);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    bow.x = Math.max(54, Math.round(canvas.width * 0.14));
    bow.y = Math.round(canvas.height * 0.52);

    heart.x = Math.min(canvas.width - 56, Math.round(canvas.width * 0.82));
    heart.size = Math.max(32, Math.min(68, Math.round(Math.min(canvas.width, canvas.height) * 0.11)));
    heart.y = Math.min(
        Math.max(heart.y || canvas.height * 0.5, heart.size + 28),
        canvas.height - heart.size - 32
    );
    heart.speedY = Math.max(2, Math.min(4.5, canvas.height * 0.0065));

    if (!arrow.active) {
        arrow.x = bow.x;
        arrow.y = bow.y;
    }
}

resizeGame();
window.addEventListener("resize", resizeGame);


// ==========================================
// 4. PAG-ASINTA AT PAGPANA (POINTER INPUT)
// ==========================================
function getCanvasPoint(e) {
    if (!canvas) return { x: bow.x + 100, y: bow.y };
    const rect = canvas.getBoundingClientRect();
    const safeWidth = rect.width > 0 ? rect.width : canvas.width || 1;
    const safeHeight = rect.height > 0 ? rect.height : canvas.height || 1;
    const scaleX = canvas.width / safeWidth;
    const scaleY = canvas.height / safeHeight;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function updateBowAngleFromEvent(e) {
    const pt = getCanvasPoint(e);
    const nextAngle = Math.atan2(pt.y - bow.y, pt.x - bow.x);
    if (Number.isFinite(nextAngle)) {
        bow.angle = nextAngle;
    }
}

function shootArrow() {
    if (!canvas || arrow.active || gameWon) return;

    startBgMusic();

    const angle = Number.isFinite(bow.angle) ? bow.angle : 0;
    const speed = Math.max(13, canvas.width * 0.021);

    arrow.active = true;
    arrow.x = bow.x;
    arrow.y = bow.y;
    arrow.vx = Math.cos(angle) * speed;
    arrow.vy = Math.sin(angle) * speed;
    arrowTrail = [];
}

if (canvas) {
    canvas.addEventListener("pointermove", (e) => {
        updateBowAngleFromEvent(e);
    });

    canvas.addEventListener("pointerdown", (e) => {
        updateBowAngleFromEvent(e);
        shootArrow();
    });
}


// ==========================================
// 5. DRAWING NG AIM GUIDE, HEART, BOW, ARROW & CONFETTI
// ==========================================
function drawAimGuide() {
    if (!ctx || !canvas || arrow.active || gameWon) return;

    const angle = Number.isFinite(bow.angle) ? bow.angle : 0;
    const guideLen = Math.min(150, canvas.width * 0.24);

    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bow.x, bow.y);
    ctx.lineTo(bow.x + Math.cos(angle) * guideLen, bow.y + Math.sin(angle) * guideLen);
    ctx.stroke();
    ctx.restore();
}

function drawHeart(x, y, size) {
    if (!ctx) return;

    ctx.save();
    ctx.shadowColor = "rgba(255, 77, 109, 0.55)";
    ctx.shadowBlur = 18;

    const grad = ctx.createLinearGradient(x, y - size * 0.4, x, y + size);
    grad.addColorStop(0, "#ff758f");
    grad.addColorStop(1, "#d90429");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
    ctx.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x - size * 0.36, y + size * 0.08, size * 0.14, size * 0.07, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawArrowShape(lengthScale = 1, isFlying = false) {
    const shaftGrad = ctx.createLinearGradient(-26 * lengthScale, 0, 28 * lengthScale, 0);
    shaftGrad.addColorStop(0, "#f4a261");
    shaftGrad.addColorStop(1, "#ffd166");

    ctx.strokeStyle = shaftGrad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-24 * lengthScale, 0);
    ctx.lineTo(20 * lengthScale, 0);
    ctx.stroke();

    ctx.fillStyle = isFlying ? "#fff3b0" : "#ffd166";
    ctx.beginPath();
    ctx.moveTo(30 * lengthScale, 0);
    ctx.lineTo(18 * lengthScale, -6.5 * lengthScale);
    ctx.lineTo(20 * lengthScale, 0);
    ctx.lineTo(18 * lengthScale, 6.5 * lengthScale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.moveTo(-16 * lengthScale, 0);
    ctx.lineTo(-28 * lengthScale, -7 * lengthScale);
    ctx.lineTo(-22 * lengthScale, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#4cc9f0";
    ctx.beginPath();
    ctx.moveTo(-16 * lengthScale, 0);
    ctx.lineTo(-28 * lengthScale, 7 * lengthScale);
    ctx.lineTo(-22 * lengthScale, 0);
    ctx.closePath();
    ctx.fill();
}

function drawBowAndArrow() {
    if (!ctx) return;

    const bowSpan = heart.size < 40 ? 36 : 48;
    const tipX = bowSpan * 0.24;
    const curveOutX = bowSpan * 0.68;
    const stringPullX = (!arrow.active && !gameWon) ? -18 : -6;
    const angle = Number.isFinite(bow.angle) ? bow.angle : 0;

    for (let i = 0; i < arrowTrail.length; i++) {
        const t = arrowTrail[i];
        const alpha = ((i + 1) / arrowTrail.length) * 0.35;
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.fillStyle = `rgba(255, 209, 102, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.save();
    ctx.translate(bow.x, bow.y);
    ctx.rotate(angle);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(tipX, -bowSpan);
    ctx.lineTo(stringPullX, 0);
    ctx.lineTo(tipX, bowSpan);
    ctx.stroke();

    const bowGrad = ctx.createLinearGradient(0, -bowSpan, curveOutX, bowSpan);
    bowGrad.addColorStop(0, "#ffd166");
    bowGrad.addColorStop(0.5, "#fff8f0");
    bowGrad.addColorStop(1, "#ff758f");

    ctx.save();
    ctx.shadowColor = "rgba(255, 209, 102, 0.35)";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = bowGrad;
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(curveOutX, -bowSpan * 0.35, curveOutX, -bowSpan * 0.78, tipX, -bowSpan);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(curveOutX, bowSpan * 0.35, curveOutX, bowSpan * 0.78, tipX, bowSpan);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "#e94560";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.lineTo(-2, 9);
    ctx.stroke();

    if (!arrow.active && !gameWon) {
        ctx.save();
        ctx.translate(10, 0);
        drawArrowShape(0.95, false);
        ctx.restore();
    }

    ctx.restore();

    if (arrow.active && Number.isFinite(arrow.x) && Number.isFinite(arrow.y)) {
        const flightAngle = Math.atan2(arrow.vy, arrow.vx);
        ctx.save();
        ctx.shadowColor = "rgba(255, 209, 102, 0.65)";
        ctx.shadowBlur = 10;
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(Number.isFinite(flightAngle) ? flightAngle : 0);
        drawArrowShape(1.05, true);
        ctx.restore();
    }
}

function spawnConfetti(x, y) {
    const colors = ["#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#ffffff"];
    for (let i = 0; i < 55; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6.5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.2,
            size: 4 + Math.random() * 5.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 65 + Math.floor(Math.random() * 30)
        });
    }
}

function updateAndDrawParticles() {
    if (!ctx) return;

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}


// ==========================================
// 6. MAIN GAME LOOP & REPLAY LOGIC
// ==========================================
function update() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameWon) {
        heart.y += heart.speedY;
        if (heart.y > canvas.height - heart.size - 28 || heart.y < 32) {
            heart.speedY *= -1;
        }

        if (arrow.active) {
            const flightAngle = Math.atan2(arrow.vy, arrow.vx);
            arrowTrail.push({
                x: arrow.x,
                y: arrow.y,
                angle: Number.isFinite(flightAngle) ? flightAngle : 0
            });
            if (arrowTrail.length > 10) {
                arrowTrail.shift();
            }

            arrow.x += arrow.vx;
            arrow.y += arrow.vy;
            arrow.vy += 0.22;

            if (arrow.x > canvas.width || arrow.y > canvas.height || arrow.y < 0) {
                arrow.active = false;
                arrowTrail = [];
            }

            const dist = Math.hypot(arrow.x - heart.x, arrow.y - (heart.y + heart.size * 0.5));
            if (dist < heart.size + 8) {
                gameWon = true;
                arrow.active = false;
                arrowTrail = [];
                playWinMusic();
                spawnConfetti(heart.x, heart.y + heart.size * 0.5);
                winTimer = setTimeout(() => {
                    if (card) card.style.display = "block";
                }, 450);
            }
        }

        drawAimGuide();
        drawHeart(heart.x, heart.y, heart.size);
        drawBowAndArrow();
    } else {
        drawHeart(heart.x, heart.y, heart.size);
        updateAndDrawParticles();
    }

    requestAnimationFrame(update);
}

if (replayBtn) {
    replayBtn.addEventListener("click", () => {
        clearTimeout(winTimer);
        gameWon = false;
        arrow.active = false;
        arrow.x = bow.x;
        arrow.y = bow.y;
        arrowTrail = [];
        particles = [];
        heart.y = Math.round(canvas ? canvas.height * 0.5 : 250);
        if (card) card.style.display = "none";
        resetMusicForReplay();
    });
}

update();