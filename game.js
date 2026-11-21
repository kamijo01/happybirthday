const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
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

const bow = { x: 80, y: 200, angle: 0 };
let arrow = { x: 80, y: 200, vx: 0, vy: 0, active: false };
let heart = { x: 340, y: 200, size: 36, speedY: 2.5 };

function startBgMusic() {
    if (!bgMusic || isMuted) return;
    bgMusic.volume = gameWon ? 0.15 : 0.45;
    bgMusic.play().catch(() => {});
}

function playWinMusic() {
    if (!winMusic || isMuted) return;
    if (bgMusic) bgMusic.volume = 0.15;
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
            if (gameWon) playWinMusic();
            else startBgMusic();
        }
    });
}

function resizeGame() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPhone = w < 640;

    if (isPhone) {
        canvas.width = Math.min(340, Math.max(240, w - 32));
        canvas.height = Math.min(220, Math.max(160, Math.round(canvas.width * 0.65)));
    } else {
        canvas.width = Math.min(820, Math.max(480, w - 80));
        canvas.height = Math.min(480, Math.max(300, h - 80));
    }

    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";

    bow.x = Math.round(canvas.width * 0.14);
    bow.y = Math.round(canvas.height * 0.54);

    heart.x = Math.round(canvas.width * 0.82);
    heart.size = isPhone ? 20 : 48;
    heart.y = Math.min(Math.max(heart.y || canvas.height * 0.5, heart.size + 15), canvas.height - heart.size - 15);
    heart.speedY = isPhone ? 1.8 : 2.6;

    if (!arrow.active) {
        arrow.x = bow.x;
        arrow.y = bow.y;
    }
}

resizeGame();
window.addEventListener("resize", resizeGame);

function getPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function shootArrow() {
    if (arrow.active || gameWon) return;
    startBgMusic();

    const speed = canvas.width < 450 ? 9 : 14;
    arrow.active = true;
    arrow.x = bow.x;
    arrow.y = bow.y;
    arrow.vx = Math.cos(bow.angle) * speed;
    arrow.vy = Math.sin(bow.angle) * speed;
    arrowTrail = [];
}

canvas.addEventListener("pointermove", (e) => {
    const pt = getPoint(e);
    bow.angle = Math.atan2(pt.y - bow.y, pt.x - bow.x);
});

canvas.addEventListener("pointerdown", (e) => {
    const pt = getPoint(e);
    bow.angle = Math.atan2(pt.y - bow.y, pt.x - bow.x);
    shootArrow();
});

function drawAimGuide() {
    if (arrow.active || gameWon) return;
    const len = canvas.width < 450 ? 60 : 120;
    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bow.x, bow.y);
    ctx.lineTo(bow.x + Math.cos(bow.angle) * len, bow.y + Math.sin(bow.angle) * len);
    ctx.stroke();
    ctx.restore();
}

function drawHeart(x, y, size) {
    ctx.save();
    const grad = ctx.createLinearGradient(x, y - size * 0.4, x, y + size);
    grad.addColorStop(0, "#ff758f");
    grad.addColorStop(1, "#d90429");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
    ctx.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
    ctx.fill();
    ctx.restore();
}

function drawArrowShape(scale = 1) {
    const grad = ctx.createLinearGradient(-24 * scale, 0, 26 * scale, 0);
    grad.addColorStop(0, "#f4a261");
    grad.addColorStop(1, "#ffd166");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(-22 * scale, 0);
    ctx.lineTo(18 * scale, 0);
    ctx.stroke();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.moveTo(28 * scale, 0);
    ctx.lineTo(16 * scale, -6 * scale);
    ctx.lineTo(16 * scale, 6 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.moveTo(-15 * scale, 0);
    ctx.lineTo(-26 * scale, -6 * scale);
    ctx.lineTo(-20 * scale, 0);
    ctx.closePath();
    ctx.fill();
}

function drawBowAndArrow() {
    const scale = canvas.width < 450 ? 0.65 : 1;
    const span = 42 * scale;
    const pull = (!arrow.active && !gameWon) ? -16 * scale : -5 * scale;

    for (let i = 0; i < arrowTrail.length; i++) {
        const t = arrowTrail[i];
        ctx.fillStyle = `rgba(255, 209, 102, ${((i + 1) / arrowTrail.length) * 0.35})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.save();
    ctx.translate(bow.x, bow.y);
    ctx.rotate(bow.angle);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(10 * scale, -span);
    ctx.lineTo(pull, 0);
    ctx.lineTo(10 * scale, span);
    ctx.stroke();

    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(28 * scale, -span * 0.4, 28 * scale, -span * 0.8, 10 * scale, -span);
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(28 * scale, span * 0.4, 28 * scale, span * 0.8, 10 * scale, span);
    ctx.stroke();

    if (!arrow.active && !gameWon) {
        ctx.save();
        ctx.translate(8 * scale, 0);
        drawArrowShape(scale);
        ctx.restore();
    }

    ctx.restore();

    if (arrow.active) {
        const flightAngle = Math.atan2(arrow.vy, arrow.vx);
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(flightAngle);
        drawArrowShape(scale);
        ctx.restore();
    }
}

function spawnConfetti(x, y) {
    const colors = ["#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#ffffff"];
    for (let i = 0; i < 50; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        particles.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 2,
            size: 4 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 60 + Math.floor(Math.random() * 25)
        });
    }
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);

        if (p.life <= 0) particles.splice(i, 1);
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameWon) {
        heart.y += heart.speedY;
        if (heart.y > canvas.height - heart.size - 12 || heart.y < 14) {
            heart.speedY *= -1;
        }

        if (arrow.active) {
            arrowTrail.push({ x: arrow.x, y: arrow.y });
            if (arrowTrail.length > 10) arrowTrail.shift();

            arrow.x += arrow.vx;
            arrow.y += arrow.vy;
            arrow.vy += 0.18;

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
        heart.y = Math.round(canvas.height * 0.5);
        if (card) card.style.display = "none";
        resetMusicForReplay();
    });
}

update();
