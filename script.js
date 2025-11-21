gsap.registerPlugin(ScrollTrigger);

const state = {
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    mouseVel: 0
};

// --- 1. STARTUP LOGIC ---
const loaderBar = document.querySelector('.loader-bar-fill');
const preloader = document.getElementById('preloader');
const loaderUI = document.getElementById('loader-ui');
const startUI = document.getElementById('start-ui');
const btnEnter = document.getElementById('btn-enter');
const audioPiano = document.getElementById('bgm-piano');

btnEnter.addEventListener('click', () => {
    // 1. Play Piano Immediately
    audioPiano.volume = 0; 
    audioPiano.play().then(() => {
        gsap.to(audioPiano, { volume: 0.5, duration: 3 });
    }).catch(e => console.log("Audio error:", e));

    // 2. Transition to Loading
    gsap.to(startUI, { opacity: 0, duration: 0.5, onComplete: () => {
        startUI.style.display = 'none';
        loaderUI.style.display = 'block';
        gsap.to(loaderUI, { opacity: 1, duration: 0.5 });
        startFakeLoad();
    }});
});

function startFakeLoad() {
    let loadProgress = 0;
    const loading = setInterval(() => {
        loadProgress += Math.random() * 15;
        if(loadProgress > 100) loadProgress = 100;
        loaderBar.style.width = `${loadProgress}%`;
        
        if(loadProgress === 100) {
            clearInterval(loading);
            revealSite();
        }
    }, 100);
}

function revealSite() {
    const tl = gsap.timeline();
    tl.to(preloader, { yPercent: -100, duration: 1.5, ease: "power4.inOut", delay: 0.2 })
      .from(".title-split .char", { y: 100, opacity: 0, rotateX: -90, stagger: 0.05, duration: 1, ease: "back.out(1.5)" }, "-=0.8")
      .from(".subtitle", { opacity: 0, letterSpacing: "1em", duration: 1.5 }, "-=1");
}

// --- 2. LANTERN PHYSICS (MOUSE + TOUCH) ---
const lantern = document.getElementById('lantern-container');
const lanternHalo = document.querySelector('.lantern-halo');
const vignette = document.getElementById('vignette-layer');

function updateLantern(x, y) {
    const dx = x - state.mouseX;
    const dy = y - state.mouseY;
    state.mouseVel = Math.sqrt(dx*dx + dy*dy);
    
    state.mouseX = x;
    state.mouseY = y;

    gsap.to(lantern, { x: x, y: y, duration: 0.6, ease: "power3.out" });
    gsap.to(vignette, { x: -x * 0.03, y: -y * 0.03, duration: 1 });
}

document.addEventListener('mousemove', (e) => {
    updateLantern(e.clientX, e.clientY);
});

document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    updateLantern(touch.clientX, touch.clientY);
}, { passive: true });


// --- 3. EMBER SYSTEM ---
const cvs = document.getElementById('ember-canvas');
const ctx = cvs.getContext('2d');
let w, h;
let embers = [];
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
        this.y -= this.speedY + (state.mouseVel * 0.005);
        this.x += Math.sin(this.y * 0.01) * 0.5;
        this.life--;
        if (this.life <= 0 || this.y < -10) this.reset();
    }
    draw() {
        const lifeRatio = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 100, 0, ${this.alpha * lifeRatio})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
    }
}
for(let i=0; i<120; i++) embers.push(new Ember());
function animateEmbers() {
    ctx.clearRect(0,0,w,h);
    embers.forEach(e => { e.update(); e.draw(); });
    requestAnimationFrame(animateEmbers);
}
animateEmbers();

// --- 4. TEXT SPLITTER ---
function splitText(selector) {
    document.querySelectorAll(selector).forEach(el => {
        const text = el.innerText;
        el.innerHTML = text.split('').map(char => 
            char === ' ' ? ' ' : `<span class="char">${char}</span>`
        ).join('');
    });
}
splitText('.title-split');
splitText('.text-reveal');
splitText('.confession-title');

document.querySelectorAll('section').forEach(section => {
    const chars = section.querySelectorAll('.char');
    if(chars.length > 0) {
        gsap.fromTo(chars, 
            { opacity: 0, filter: "blur(10px)", y: 20 },
            {
                scrollTrigger: { trigger: section, start: "top 75%", end: "bottom 85%", scrub: 1 },
                opacity: 1, filter: "blur(0px)", y: 0, stagger: 0.05
            }
        );
    }
});

// --- 5. MAGNETIC BUTTONS ---
document.querySelectorAll('.mag-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        gsap.to(lanternHalo, { width: 350, height: 350, background: "radial-gradient(circle, rgba(255,220,150,0.25) 0%, transparent 70%)", duration: 0.4 });
    });
    btn.addEventListener('mouseleave', () => {
        gsap.to(lanternHalo, { width: 600, height: 600, background: "radial-gradient(circle, rgba(255,150,50,0.12) 0%, transparent 70%)", duration: 0.4 });
        gsap.to(btn, { x: 0, y: 0, duration: 0.5 });
    });
    btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width/2)*0.4, y: (e.clientY - r.top - r.height/2)*0.4, duration: 0.1 });
    });
});

// --- 6. FILM GRAIN ---
const nCvs = document.getElementById('noise-canvas');
const nCtx = nCvs.getContext('2d');
function noise() {
    const nw = nCvs.width = window.innerWidth;
    const nh = nCvs.height = window.innerHeight;
    const idata = nCtx.createImageData(nw, nh);
    const buf = new Uint32Array(idata.data.buffer);
    for(let i=0; i<buf.length; i++) if(Math.random() < 0.5) buf[i] = 0xff000000;
    nCtx.putImageData(idata, 0, 0);
    requestAnimationFrame(noise);
}
noise();

// --- 7. LENIS SCROLL ---
const lenis = new Lenis({ duration: 1.5, smooth: true });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// --- 8. ENDING LOGIC ---
function endStory(message, isHappyEnd) {
    if(isHappyEnd) {
        if(audioPiano.paused) audioPiano.play();
        gsap.to(audioPiano, { volume: 1.0, duration: 3 });
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

document.getElementById('btn-yes').addEventListener('click', () => {
    endStory("Then let's start a new chapter.", true);
});
document.getElementById('btn-no').addEventListener('click', () => {
    endStory("Thank You!", false);
});