gsap.registerPlugin(ScrollTrigger);

const isMobile = window.innerWidth < 768;

const state = {
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    lastMouseX: window.innerWidth / 2,
    velX: 0,
    tilt: 0
};

// --- DOM ELEMENTS ---
const preloader = document.getElementById('preloader');
const loaderUI = document.getElementById('loader-ui');
const startUI = document.getElementById('start-ui');
const btnEnter = document.getElementById('btn-enter');
const audioPiano = document.getElementById('bgm-piano');
const btnLantern = document.getElementById('btn-lantern-core');
const loadLanterns = document.querySelectorAll('.load-lantern');

// --- 1. STARTUP LOGIC ---
btnEnter.addEventListener('click', () => {
    // Ignite the Button Lantern
    btnLantern.classList.add('lit');

    // Play Audio
    audioPiano.volume = 0;
    audioPiano.play().then(() => {
        gsap.to(audioPiano, { volume: 0.5, duration: 3 });
    }).catch(e => console.log("Audio error:", e));

    // Transition to Loader after short delay (to see ignition)
    setTimeout(() => {
        gsap.to(startUI, {
            opacity: 0, duration: 0.8, onComplete: () => {
                startUI.style.display = 'none';
                loaderUI.style.display = 'flex'; // Ensure flex centering
                loaderUI.style.opacity = 0;
                gsap.to(loaderUI, { opacity: 1, duration: 1 });
                startIgnitionSequence();
            }
        });
    }, 1200);
});

// --- 2. LOADING SEQUENCE ---
function startIgnitionSequence() {
    let currentLantern = 0;

    // Light one lantern every 1.2 seconds for slow, premium feel
    const ignitionInterval = setInterval(() => {
        if (currentLantern >= loadLanterns.length) {
            clearInterval(ignitionInterval);
            setTimeout(revealSite, 1500); // Wait after all lit
            return;
        }

        loadLanterns[currentLantern].classList.add('lit');
        currentLantern++;

    }, 1200);
}

function revealSite() {
    // Light Mouse Lantern
    const mouseLantern = document.querySelector('#lantern-container .lantern-core');
    if (mouseLantern) mouseLantern.classList.add('lit');

    // ADD THIS LINE: Activate the God Ray beam
    document.getElementById('lantern-container').classList.add('lights-active');

    const tl = gsap.timeline();
    // ... existing timeline code ...
    tl.to(preloader, { yPercent: -100, duration: 2, ease: "power4.inOut" })
        .from(".title-split .char", { y: 100, opacity: 0, rotateX: -90, stagger: 0.05, duration: 1, ease: "back.out(1.5)" }, "-=1")
        .from(".subtitle", { opacity: 0, letterSpacing: "1em", duration: 1.5 }, "-=1");
}

// --- 2. LANTERN PHYSICS (PC ONLY) ---
const lantern = document.getElementById('lantern-container');
const vignette = document.getElementById('vignette-layer');

function updateLantern(x, y) {
    if (isMobile) return;

    state.velX = x - state.lastMouseX;
    state.lastMouseX = x;

    let targetTilt = gsap.utils.clamp(-15, 15, state.velX * -0.8);
    state.tilt += (targetTilt - state.tilt) * 0.1;

    gsap.to(lantern, { x: x, y: y, rotation: state.tilt, duration: 0.5, ease: "power2.out" });
    gsap.to(vignette, { x: -x * 0.03, y: -y * 0.03, duration: 1 });
}

document.addEventListener('mousemove', (e) => {
    if (!isMobile) updateLantern(e.clientX, e.clientY);
});

// --- 3. EMBER SYSTEM ---
const cvs = document.getElementById('ember-canvas');
const ctx = cvs.getContext('2d');
let w, h;
let embers = [];
const emberCount = isMobile ? 0 : 150;

const resize = () => { w = cvs.width = window.innerWidth; h = cvs.height = window.innerHeight; };
window.addEventListener('resize', resize);
resize();

class Ember {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * w;
        this.y = h + 20;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 1 + 0.5;
        this.alpha = Math.random() * 0.8 + 0.2;
        this.life = Math.random() * 100 + 50;
        this.maxLife = this.life;
    }
    update() {
        this.y -= this.speedY;
        this.x += Math.sin(this.y * 0.01) * 0.5;
        this.life--;
        if (this.life <= 0 || this.y < -10) this.reset();
    }
    draw() {
        const lifeRatio = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 100, 0, ${this.alpha * lifeRatio})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
}
for (let i = 0; i < emberCount; i++) embers.push(new Ember());
function animateEmbers() {
    if (emberCount === 0) return;
    ctx.clearRect(0, 0, w, h);
    embers.forEach(e => { e.update(); e.draw(); });
    requestAnimationFrame(animateEmbers);
}
animateEmbers();

// --- 4. TEXT SPLITTER ---
function splitText(selector) {
    document.querySelectorAll(selector).forEach(el => {
        const text = el.innerText;
        el.innerHTML = text.split(' ').map(word =>
            `<span class="word">${word.split('').map(char => `<span class="char">${char}</span>`).join('')}</span>`
        ).join(' ');
    });
}
splitText('.title-split');
splitText('.text-reveal');
splitText('.confession-title');

document.querySelectorAll('section').forEach(section => {
    const chars = section.querySelectorAll('.char');
    if (chars.length > 0) {
        const blurAmount = isMobile ? "0px" : "10px";
        gsap.fromTo(chars,
            { opacity: 0, filter: `blur(${blurAmount})`, y: 20 },
            {
                scrollTrigger: { trigger: section, start: "top 75%", end: "bottom 85%", scrub: 1 },
                opacity: 1, filter: "blur(0px)", y: 0, stagger: 0.05
            }
        );
    }
});

// --- 5. MAGNETIC BUTTONS (PC ONLY) ---
if (!isMobile) {
    document.querySelectorAll('.mag-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => { gsap.to(btn, { scale: 1.05, duration: 0.3 }); });
        btn.addEventListener('mouseleave', () => { gsap.to(btn, { scale: 1, x: 0, y: 0, duration: 0.5 }); });
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.4, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.1 });
        });
    });
}

// --- 6. FILM GRAIN (PC ONLY) ---
const nCvs = document.getElementById('noise-canvas');
const nCtx = nCvs.getContext('2d');
function noise() {
    const nw = nCvs.width = window.innerWidth;
    const nh = nCvs.height = window.innerHeight;
    const idata = nCtx.createImageData(nw, nh);
    const buf = new Uint32Array(idata.data.buffer);
    for (let i = 0; i < buf.length; i++) if (Math.random() < 0.5) buf[i] = 0xff000000;
    nCtx.putImageData(idata, 0, 0);
    requestAnimationFrame(noise);
}
if (!isMobile) {
    noise();
}

// --- 7. LENIS SCROLL ---
const lenis = new Lenis({ duration: 1.5, smooth: true, smoothTouch: false });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// --- 8. ENDING LOGIC ---
// --- 8. ENDING LOGIC (UPDATED) ---
function endStory(message, isHappyEnd) {
    if (isHappyEnd) {
        if (audioPiano.paused) audioPiano.play();
        gsap.to(audioPiano, { volume: 1.0, duration: 3 });

        // TRIGGER LANTERNS ONLY FOR HAPPY ENDING
        startOutroLanterns();
    } else {
        gsap.to(audioPiano, { volume: 0, duration: 2 });
    }

    const outroText = document.querySelector('.outro-text');
    outroText.innerText = message;

    gsap.to('#outro', { opacity: 1, pointerEvents: 'all', duration: 3, ease: "power2.inOut" });

    gsap.fromTo(outroText,
        { opacity: 0, scale: 0.95, filter: "blur(5px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 2, delay: 1.5 }
    );
}

// --- NEW FUNCTION TO GENERATE LANTERNS ---
function startOutroLanterns() {
    const container = document.getElementById('outro-lantern-container');

    setInterval(() => {
        const lantern = document.createElement('div');
        lantern.classList.add('flying-lantern');

        // Randomize position across the screen
        lantern.style.left = Math.random() * 100 + '%';

        // Randomize speed slightly for realism
        const duration = 15 + Math.random() * 10;
        lantern.style.animationDuration = duration + 's';

        // Randomize size
        const scale = 0.5 + Math.random() * 0.5;
        lantern.style.transform = `scale(${scale})`;

        container.appendChild(lantern);

        // Clean up DOM elements after animation ends
        setTimeout(() => {
            lantern.remove();
        }, duration * 1000);

    }, 500); // Spawns a new lantern every 0.5 seconds
}

document.getElementById('btn-yes').addEventListener('click', () => {
    endStory("Then let's start a new chapter.", true);
});
document.getElementById('btn-no').addEventListener('click', () => {
    endStory("Thank You!", false);
});