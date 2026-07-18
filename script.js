/* ==========================================================================
   FALSE9INE DIGITAL CORE ENGINE - SPA INTERACTION AND ROUTING ARCHITECTURE
   ========================================================================== */

// --- 1. STATE MANAGEMENT & DATA STORAGE ---
// Add a tournament object here when one is confirmed — the grid renders
// automatically. Leave empty and the "next drop" state below shows instead.
const upcomingTournaments = [];

// Target timestamp for registration closing event
const targetDate = new Date('August 15, 2026 23:59:59').getTime();

// --- 2. CORE INITIALIZATION ENGINE ---
document.addEventListener("DOMContentLoaded", () => {
    initCursor();
    initCountdown();
    renderTournaments();
    renderStats();
    refreshCursorTargets();
    initTilt();
    initRipple();
    moveNavIndicator();
    spawnParticles();
    initPreloader();

    setTimeout(() => {
        const home = document.getElementById('home');
        if (home) staggerReveal(home);
        animateStats();
    }, 950);
});

window.addEventListener('resize', moveNavIndicator);

// --- 3. DYNAMIC SINGLE PAGE NAVIGATION (SPA) ---
// Sub-pages that aren't in the nav bar themselves — keep the parent tab highlighted
const navParentMap = { upcoming: 'tournaments' };

function navigate(targetId) {
    // Top out scroll bar positions instantly for visual continuity
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Enforce safety sweep by purging any floating modal layer triggers
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));

    // Swap layout visibility states via classes
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.remove('active-view'));
    
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active-view');
    }
    
    // Manage dynamic highlighting states on header menus
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const navTargetId = navParentMap[targetId] || targetId;
    const activeLink = document.querySelector(`.nav-item[data-target="${navTargetId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    moveNavIndicator();

    if (targetSection) staggerReveal(targetSection);
    // Freshly injected cards (e.g. tournament tickets) need their own tilt binding
    initTilt();
}

// Punch cards in one-by-one when a section opens, instead of all at once
function staggerReveal(section) {
    const items = section.querySelectorAll('.hub-card, .tourney-card, .bento-card, .rule-row, .hiw-step, .founder-card, .faq-item, .stat-cell');
    items.forEach((el, i) => {
        el.classList.remove('revealed');
        el.style.transitionDelay = `${i * 70}ms`;
        // Force reflow so the animation restarts on repeat visits
        void el.offsetWidth;
        el.classList.add('reveal');
        requestAnimationFrame(() => el.classList.add('revealed'));
    });
}

// --- 4. HIGH-FIDELITY MAGNETIC CUSTOM CURSOR ---
let mouseX = 0, mouseY = 0;
let outlineX = 0, outlineY = 0;

function initCursor() {
    const cursorDot = document.getElementById('cursor-dot');
    const cursorOutline = document.getElementById('cursor-outline');
    
    if (!cursorDot || !cursorOutline) return;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Exact hardware positioning for primary point tracker
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    });

    function animateCursor() {
        // Linear Interpolation (LERP) physics calculations for custom easing lag
        outlineX += (mouseX - outlineX) * 0.15;
        outlineY += (mouseY - outlineY) * 0.15;
        
        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
}

// Track mouse positioning states over critical interactives
function refreshCursorTargets() {
    const targets = document.querySelectorAll('a, button, .tourney-card, .hub-card, .rule-row, .bento-card, .founder-card, .hiw-step, .faq-question, .goal-zone, .fab-game, input');
    targets.forEach(el => {
        // Avoid dual assignment listeners duplicate stacks
        el.removeEventListener('mouseenter', addHoverClass);
        el.removeEventListener('mouseleave', removeHoverClass);
        
        el.addEventListener('mouseenter', addHoverClass);
        el.addEventListener('mouseleave', removeHoverClass);
    });
}

function addHoverClass() { document.body.classList.add('cursor-hover'); }
function removeHoverClass() { document.body.classList.remove('cursor-hover'); }

// --- 5. OVERLAY MODAL MANAGER SUBSYSTEM ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('active');
    if (modalId === 'register-modal') {
        // Graceful reset timing allows fading structural closures to finish tracking smoothly
        setTimeout(() => nextRegStep(1), 300); 
    }
}

// Closes a modal when the darkened backdrop itself (not its content) is clicked
function handleOutsideClick(event, modalId) {
    if (event.target.id === modalId) closeModal(modalId);
}

// --- 6. REAL-TIME MATH COUNTDOWN MODULE ---
function initCountdown() {
    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(timerInterval);
            const timerText = document.getElementById("countdown-timer");
            if (timerText) timerText.innerHTML = "REGISTRATIONS CLOSED";
            return;
        }

        // Exact time component computations
        const d = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
        const h = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
        const m = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const s = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');

        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minutesEl = document.getElementById("minutes");
        const secondsEl = document.getElementById("seconds");

        if (daysEl) daysEl.innerText = d;
        if (hoursEl) hoursEl.innerText = h;
        if (minutesEl) minutesEl.innerText = m;
        if (secondsEl) secondsEl.innerText = s;
    }, 1000);
}

// --- 7. DYNAMIC ELEMENT INJECTION GENERATOR ---
function renderTournaments() {
    const grid = document.getElementById('upcoming-grid');
    if (!grid) return;

    if (upcomingTournaments.length === 0) {
        grid.innerHTML = `
            <div class="empty-fixture">
                <div class="empty-stamp">SEASON LOADING</div>
                <h3>No fixtures live right now</h3>
                <p>We're locking in the next turf, date, and format. Follow the page — early DMs usually grab the first slots when it drops.</p>
                <a href="https://instagram.com/false9ine.duo" target="_blank" class="action-btn">Follow for Drop Alerts</a>
            </div>`;
        return;
    }

    grid.innerHTML = upcomingTournaments.map(t => `
        <div class="tourney-card tilt-card">
            <div class="ticket-main">
                <div class="ticket-code">${t.id} // BOARDING NOW</div>
                <h3 class="ticket-name">${t.name}</h3>
                <p class="ticket-meta">📍 <strong>${t.location}</strong></p>
                <p class="ticket-meta">⚽ ${t.format} &nbsp;|&nbsp; ⏰ ${t.time}</p>
            </div>
            <div class="ticket-tear"></div>
            <div class="ticket-stub">
                <div class="price">${t.entry}<small>PER TEAM</small></div>
                <button class="action-btn" onclick="startRegistration('${t.name}', '${t.entry}')">Register</button>
            </div>
        </div>
    `).join('');
    
    // Bind freshly generated interface nodes back to tracking engines
    refreshCursorTargets();
}

// --- 8. STEPPED USER REGISTRATION WIZARD FLOW ---
function startRegistration(tName, tEntry) {
    const detailsContainer = document.getElementById('reg-tournament-details');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <p style="color: var(--text-muted); line-height: 1.4;">Registering for:<br>
            <strong style="color: #fff; font-size: 1.1rem;">${tName}</strong><br>
            Entry Fee: <span style="color: var(--accent-green); font-weight: 700;">${tEntry}</span></p>
        `;
    }
    openModal('register-modal');
    nextRegStep(1);
}

function nextRegStep(stepNum) {
    if (stepNum === 2) {
        const tName = document.getElementById('teamName').value.trim();
        const cName = document.getElementById('captainName').value.trim();
        const phone = document.getElementById('captainPhone').value.trim();
        
        if (!tName || !cName || !phone) {
            alert("Please fill in all team details.");
            return;
        }
    }

    if (stepNum === 3) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const codeOutput = document.getElementById('generated-code');
        if (codeOutput) {
            codeOutput.innerText = `F9T-${randomNum}`;
        }
        setTimeout(() => launchConfetti(document.getElementById('reg-step-3')), 150);
    }

    // Toggle DOM class structures to cycle panel visibility cleanly
    document.querySelectorAll('.reg-step').forEach(step => {
        step.classList.add('hidden');
        step.classList.remove('active-step');
    });
    
    const targetStep = document.getElementById(`reg-step-${stepNum}`);
    if (targetStep) {
        targetStep.classList.remove('hidden');
        targetStep.classList.add('active-step');
    }
}
// --- 9. SLIDING NAV INDICATOR ---
function moveNavIndicator() {
    const indicator = document.getElementById('nav-indicator');
    const active = document.querySelector('.nav-item.active');
    if (!indicator) return;
    if (!active) { indicator.style.width = '0px'; return; }
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.left = `${active.offsetLeft}px`;
}

// --- 10. MAGNETIC 3D CARD TILT (pointer devices only) ---
const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function initTilt() {
    if (!canTilt) return;
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.removeEventListener('mousemove', handleTiltMove);
        card.removeEventListener('mouseleave', handleTiltLeave);
        card.addEventListener('mousemove', handleTiltMove);
        card.addEventListener('mouseleave', handleTiltLeave);
    });
}

function handleTiltMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const rotateY = (relX - 0.5) * 10;   // left/right tilt
    const rotateX = (0.5 - relY) * 10;   // up/down tilt
    card.style.transform = `perspective(800px) translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

function handleTiltLeave(e) {
    e.currentTarget.style.transform = '';
}

// --- 11. BUTTON RIPPLE ---
function initRipple() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple-el';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
    });
}

// --- 12. CONFETTI BURST ON SUCCESSFUL REGISTRATION ---
function launchConfetti(container) {
    if (!container) return;
    const colors = ['#3ecf5b', '#4fd8ff', '#f5f3ea'];
    for (let i = 0; i < 26; i++) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = `${Math.random() * 0.25}s`;
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
        setTimeout(() => piece.remove(), 1700);
    }
}

// --- 13. STATS STRIP (edit these numbers whenever you have real ones) ---
const statsData = [
    { value: 50, suffix: '+', label: 'Teams Hosted' },
    { value: 12, suffix: '+', label: 'Tournaments Run' },
    { value: 500, suffix: '+', label: 'Players in the Community' },
    { value: 4, suffix: '', label: 'Match Formats' }
];

function renderStats() {
    const strip = document.getElementById('stats-strip');
    if (!strip) return;
    strip.innerHTML = statsData.map(s => `
        <div class="stat-cell">
            <div class="stat-value" data-target="${s.value}" data-suffix="${s.suffix}">0${s.suffix}</div>
            <span class="stat-label">${s.label}</span>
        </div>
    `).join('');
}

function animateStats() {
    document.querySelectorAll('.stat-value').forEach(el => {
        const target = parseInt(el.dataset.target, 10) || 0;
        const suffix = el.dataset.suffix || '';
        const duration = 1100;
        const start = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = `${Math.round(target * eased)}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

// --- 14. FAQ ACCORDION ---
function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    if (!item) return;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
}

// --- 15. PENALTY SHOOTOUT GAME ---
const goalZoneCenters = { tl: [63, 52], tc: [150, 52], tr: [237, 52], bl: [63, 118], bc: [150, 118], br: [237, 118] };
const keeperDivePositions = { l: [78, 85], c: [150, 85], r: [222, 85] };
let shootBusy = false, shootIndex = 0, shootScore = 0;

function columnOfZone(zone) {
    if (zone.includes('l')) return 'l';
    if (zone.includes('r')) return 'r';
    return 'c';
}

function positionBall(x, y, opacity = 1) {
    const ball = document.getElementById('goal-ball');
    if (!ball) return;
    ball.style.left = `${(x / 300) * 100}%`;
    ball.style.top = `${(y / 170) * 100}%`;
    ball.style.opacity = opacity;
}

function openGameModal() {
    openModal('game-modal');
    resetGame();
}

function resetGame() {
    shootBusy = false; shootIndex = 0; shootScore = 0;
    const shotCount = document.getElementById('shot-count');
    const scoreCount = document.getElementById('score-count');
    const resultBox = document.getElementById('game-result');
    const sub = document.getElementById('game-sub');
    const keeper = document.getElementById('keeper-icon');

    if (shotCount) shotCount.textContent = 1;
    if (scoreCount) scoreCount.textContent = 0;
    if (resultBox) resultBox.classList.add('hidden');
    if (sub) sub.textContent = 'Pick your corner. Beat the keeper.';
    if (keeper) keeper.setAttribute('transform', 'translate(150,85)');
    positionBall(150, 163, 1);
    document.querySelectorAll('.goal-zone').forEach(z => z.disabled = false);
}

function shoot(zone) {
    if (shootBusy || shootIndex >= 5) return;
    shootBusy = true;
    document.querySelectorAll('.goal-zone').forEach(z => z.disabled = true);

    const cols = ['l', 'c', 'r'];
    const keeperCol = cols[Math.floor(Math.random() * cols.length)];
    const keeper = document.getElementById('keeper-icon');
    const [kx, ky] = keeperDivePositions[keeperCol];
    if (keeper) keeper.setAttribute('transform', `translate(${kx},${ky})`);

    const [tx, ty] = goalZoneCenters[zone];
    positionBall(tx, ty, 1);

    const scored = columnOfZone(zone) !== keeperCol;
    const sub = document.getElementById('game-sub');

    setTimeout(() => {
        shootIndex++;
        if (scored) { shootScore++; if (sub) sub.textContent = 'GOAL! 🥅'; playGoalSound(); }
        else { if (sub) sub.textContent = 'SAVED! 🧤'; playSaveSound(); }

        const scoreCount = document.getElementById('score-count');
        if (scoreCount) scoreCount.textContent = shootScore;

        if (shootIndex >= 5) {
            finishGame();
        } else {
            const shotCount = document.getElementById('shot-count');
            if (shotCount) shotCount.textContent = shootIndex + 1;
            setTimeout(() => {
                if (keeper) keeper.setAttribute('transform', 'translate(150,85)');
                positionBall(150, 163, 1);
                shootBusy = false;
                document.querySelectorAll('.goal-zone').forEach(z => z.disabled = false);
            }, 650);
        }
    }, 400);
}

function finishGame() {
    const resultBox = document.getElementById('game-result');
    const title = document.getElementById('game-result-title');
    const text = document.getElementById('game-result-text');
    const sub = document.getElementById('game-sub');
    if (!resultBox || !title || !text) return;

    let heading, body;
    if (shootScore === 5) {
        heading = 'PERFECT — 5/5';
        body = "Ice in your veins. Bring that composure to the turf.";
        setTimeout(() => launchConfetti(document.querySelector('.game-box')), 100);
    } else if (shootScore >= 3) {
        heading = `SOLID — ${shootScore}/5`;
        body = "Good enough to win a shootout. Register and prove it live.";
    } else {
        heading = `${shootScore}/5 — ROUGH SHIFT`;
        body = "The keeper had your number. Redemption's one tap away.";
    }
    title.textContent = heading;
    text.textContent = body;
    resultBox.classList.remove('hidden');
    if (sub) sub.textContent = 'Shootout complete';
}

// --- 16. OPENING ANIMATION ---
function initPreloader() {
    const preloader = document.getElementById('preloader');
    const fill = document.getElementById('preloader-fill');
    if (!preloader) return;
    requestAnimationFrame(() => { if (fill) fill.style.width = '100%'; });
    setTimeout(() => {
        preloader.classList.add('preloader-hide');
        setTimeout(() => preloader.remove(), 650);
    }, 1050);
}

// --- 17. AMBIENT DRIFTING BACKGROUND PARTICLES ---
function spawnParticles() {
    const container = document.getElementById('bg-particles');
    if (!container) return;
    const count = window.innerWidth < 640 ? 8 : 16;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.className = 'bg-particle';
        const size = 3 + Math.random() * 5;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.setProperty('--drift', `${Math.random() * 80 - 40}px`);
        p.style.animationDuration = `${14 + Math.random() * 12}s`;
        p.style.animationDelay = `${Math.random() * -20}s`;
        container.appendChild(p);
    }
}

// --- 18. LIGHTWEIGHT SFX (no audio files — generated tones) ---
let audioCtx;
function playTone(freq, duration, type, gainStart) {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(gainStart, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* Web Audio unsupported — fail silently */ }
}
function playGoalSound() {
    playTone(660, 0.12, 'triangle', 0.16);
    setTimeout(() => playTone(880, 0.18, 'triangle', 0.13), 90);
}
function playSaveSound() {
    playTone(160, 0.22, 'sawtooth', 0.1);
}

// --- 19. SHARE SHOOTOUT SCORE ---
function shareScore() {
    const text = `I scored ${shootScore}/5 in the False9ine Penalty Shootout ⚽ Think you can beat me?`;
    if (navigator.share) {
        navigator.share({ text }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        const sub = document.getElementById('game-sub');
        if (sub) sub.textContent = 'Copied to clipboard!';
    }
}