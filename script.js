// ==========================================
// 1. CUSTOM CURSOR LOGIC
// ==========================================
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');

let mouseX = 0, mouseY = 0;
let outlineX = 0, outlineY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
});

function animateCursor() {
    outlineX += (mouseX - outlineX) * 0.15;
    outlineY += (mouseY - outlineY) * 0.15;
    
    cursorOutline.style.left = `${outlineX}px`;
    cursorOutline.style.top = `${outlineY}px`;
    
    requestAnimationFrame(animateCursor);
}
animateCursor();

const hoverElements = document.querySelectorAll('a, button, .tourney-card, .rule-row, .bento-card, .file-upload');
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ==========================================
// 2. SPA ROUTING
// ==========================================
function navigate(targetId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.remove('active-view'));
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    document.getElementById(targetId).classList.add('active-view');
    const activeLink = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if(activeLink) activeLink.classList.add('active');
    
    window.scrollTo(0, 0);
}

// ==========================================
// 3. MODAL LOGIC
// ==========================================
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if(modalId === 'register-modal') {
        setTimeout(() => nextRegStep(1), 300); 
    }
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) closeModal(overlay.id);
    });
});

// ==========================================
// 4. COUNTDOWN TIMER
// ==========================================
const targetDate = new Date('August 15, 2026 23:59:59').getTime();

const timerInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        clearInterval(timerInterval);
        document.getElementById("countdown-timer").innerHTML = "CLOSED";
        return;
    }

    document.getElementById("days").innerText = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
    document.getElementById("hours").innerText = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
    document.getElementById("minutes").innerText = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    document.getElementById("seconds").innerText = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');
}, 1000);

// ==========================================
// 5. TOURNAMENT DATA
// ==========================================
const upcomingTournaments = [
    {
        id: "T001",
        name: "False9ine Monsoon Cup",
        location: "Tiki Taka, T Nagar",
        format: "5-a-side",
        entry: "₹1,500",
        time: "6:00 PM Reporting"
    },
    {
        id: "T002",
        name: "Midnight Knockouts",
        location: "Game On, Anna Nagar",
        format: "5-a-side + 3 Subs",
        entry: "₹2,000",
        time: "10:00 PM Reporting"
    }
];

function renderTournaments() {
    const grid = document.getElementById('upcoming-grid');
    if(upcomingTournaments.length === 0) {
        grid.innerHTML = `<p style="color:#888;">No upcoming tournaments right now. Follow IG to stay updated.</p>`;
        return;
    }

    grid.innerHTML = upcomingTournaments.map(t => `
        <div class="tourney-card">
            <h3>${t.name}</h3>
            <p>📍 ${t.location}</p>
            <p>⚽ ${t.format} | ⏰ ${t.time}</p>
            <div class="price">${t.entry} / Team</div>
            <button class="action-btn" style="width: 100%; font-size: 1rem; padding: 0.8rem;" 
                onclick="startRegistration('${t.name}', '${t.entry}')">Register Now</button>
        </div>
    `).join('');
    
    const newHoverElements = document.querySelectorAll('.tourney-card, .action-btn');
    newHoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
}
renderTournaments();

// ==========================================
// 6. REGISTRATION WIZARD
// ==========================================
function startRegistration(tName, tEntry) {
    document.getElementById('reg-tournament-details').innerHTML = `<p style="color:#888; margin-bottom:1rem;">Registering for:<br><strong style="color:#fff;">${tName}</strong><br>Fee: ${tEntry}</p>`;
    openModal('register-modal');
    nextRegStep(1);
}

function nextRegStep(stepNum) {
    document.querySelectorAll('.reg-step').forEach(step => step.classList.add('hidden'));
    
    if(stepNum === 2) {
        const tName = document.getElementById('teamName').value;
        const cName = document.getElementById('captainName').value;
        const phone = document.getElementById('captainPhone').value;
        if(!tName || !cName || !phone) {
            alert("Please fill in all team details.");
            document.getElementById('reg-step-1').classList.remove('hidden');
            return;
        }
    }

    if(stepNum === 3) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        document.getElementById('generated-code').innerText = `F9T${randomNum}`;
    }

    document.getElementById(`reg-step-${stepNum}`).classList.remove('hidden');
}