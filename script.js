// --- 1. INIT & DEPENDENCIES ---
gsap.registerPlugin(ScrollTrigger);

// Central State for Physics (Mouse position & Velocity)
const state = {
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    mouseVel: 0
};

// --- 2. PRELOADER & AUDIO ---
const loaderBar = document.querySelector('.loader-bar-fill');
const preloader = document.getElementById('preloader');
const audioRain = document.getElementById('sfx-rain');
const audioFire = document.getElementById('sfx-fire');
const audioPiano = document.getElementById('bgm-piano');

// Fake loading simulation
let loadProgress = 0;
const loading = setInterval(() => {
    loadProgress += Math.random() * 10;
    if(loadProgress > 100) loadProgress = 100;
    loaderBar.style.width = `${loadProgress}%`;
    
    if(loadProgress === 100) {
        clearInterval(loading);
        startExperience();
    }
}, 60);

function startExperience() {
    // Reveal Animation
    const tl = gsap.timeline();
    tl.to(preloader, { yPercent: -100, duration: 1.5, ease: "power4.inOut", delay: 0.2 })
      .from(".title-split .char", { y: 100, opacity: 0, rotateX: -90, stagger: 0.05, duration: 1, ease: "back.out(1.5)" }, "-=0.8")
      .from(".subtitle", { opacity: 0, letterSpacing: "1em", duration: 1.5 }, "-=1");

    // Audio Unlock (Browsers require a click to play audio)
    window.addEventListener('click', () => {
        if(audioRain.paused) {
            audioRain.volume = 0.2; audioRain.play();
            audioFire.volume = 0.1; audioFire.play();
            // Piano stays silent until the end
            audioPiano.volume = 0; audioPiano.play();
        }
    }, { once: true });
}

// --- 3. LANTERN PHYSICS & PARALLAX ---
const lantern = document.getElementById('lantern-container');
const lanternHalo = document.querySelector('.lantern-halo');
const vignette = document.getElementById('vignette-layer');

document.addEventListener('mousemove', (e) => {
    // 1. Calculate Velocity (Used for Ember Physics)
    const dx = e.clientX - state.mouseX;
    const dy = e.clientY - state.mouseY;
    state.mouseVel = Math.sqrt(dx*dx + dy*dy);
    
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;

    // 2. Move Lantern (with Lag for weight)
    gsap.to(lantern, { 
        x: state.mouseX, 
        y: state.mouseY, 
        duration: 0.6, 
        ease: "power3.out" 
    });

    // 3. Move Vignette (Parallax Effect)
    gsap.to(vignette, { 
        x: -state.mouseX * 0.03, 
        y: -state.mouseY * 0.03, 
        duration: 1 
    });
});

// --- 4. PROCEDURAL EMBER SYSTEM ---
const cvs = document.getElementById('ember-canvas');
const ctx = cvs.getContext('2d');
let w, h;
let embers = [];

// Handle Window Resize
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
        // Embers float up, affected by mouse velocity (The "Roar" effect)
        this.y -= this.speedY + (state.mouseVel * 0.005);
        this.x += Math.sin(this.y * 0.01) * 0.5;
        this.life--;
        
        if (this.life <= 0 || this.y < -10) this.reset();
    }
    draw() {
        const lifeRatio = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, ${100 + lifeRatio * 100}, 0, ${this.alpha * lifeRatio})`;
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); 
        ctx.fill();
    }
}

// Spawn 120 embers
for(let i=0; i<120; i++) embers.push(new Ember());

function animateEmbers() {
    ctx.clearRect(0,0,w,h);
    embers.forEach(e => { e.update(); e.draw(); });
    requestAnimationFrame(animateEmbers);
}
animateEmbers();

// --- 5. TEXT REVEAL (THE FIX) ---
function splitText(selector) {
    document.querySelectorAll(selector).forEach(el => {
        const text = el.innerText;
        // CRITICAL FIX: We use a normal space (' ') so CSS word-wrap works.
        // We do NOT use &nbsp;
        el.innerHTML = text.split('').map(char => 
            char === ' ' ? ' ' : `<span class="char">${char}</span>`
        ).join('');
    });
}

splitText('.title-split');
splitText('.text-reveal');
splitText('.confession-title');

// Scroll Animations (Ink Bleed)
document.querySelectorAll('section').forEach(section => {
    const chars = section.querySelectorAll('.char');
    if(chars.length > 0) {
        gsap.fromTo(chars, 
            { opacity: 0, filter: "blur(10px)", y: 20 },
            {
                scrollTrigger: { 
                    trigger: section, 
                    start: "top 75%", 
                    end: "bottom 85%", 
                    scrub: 1 
                },
                opacity: 1, 
                filter: "blur(0px)", 
                y: 0, 
                stagger: 0.05 
            }
        );
    }
});

// --- 6. MAGNETIC BUTTONS & LANTERN EXPANSION ---
document.querySelectorAll('.mag-btn').forEach(btn => {
    // HOVER ENTER: Expand the lantern light
    btn.addEventListener('mouseenter', () => {
        gsap.to(lanternHalo, { 
            width: 350, 
            height: 350, 
            background: "radial-gradient(circle, rgba(255,220,150,0.25) 0%, transparent 70%)", 
            duration: 0.4 
        });
    });

    // HOVER LEAVE: Reset lantern and button position
    btn.addEventListener('mouseleave', () => {
        gsap.to(lanternHalo, { 
            width: 600, 
            height: 600, 
            background: "radial-gradient(circle, rgba(255,150,50,0.12) 0%, transparent 70%)", 
            duration: 0.4 
        });
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    });

    // MOUSE MOVE: Magnetic Pull
    btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        // Calculate distance from center
        const x = (e.clientX - r.left - r.width/2) * 0.4;
        const y = (e.clientY - r.top - r.height/2) * 0.4;
        gsap.to(btn, { x: x, y: y, duration: 0.1 });
    });
});

// --- 7. ACTIVE FILM GRAIN ---
const nCvs = document.getElementById('noise-canvas');
const nCtx = nCvs.getContext('2d');
function noise() {
    const nw = nCvs.width = window.innerWidth;
    const nh = nCvs.height = window.innerHeight;
    const idata = nCtx.createImageData(nw, nh);
    const buf = new Uint32Array(idata.data.buffer);
    // Random black pixels
    for(let i=0; i<buf.length; i++) if(Math.random() < 0.5) buf[i] = 0xff000000;
    nCtx.putImageData(idata, 0, 0);
    requestAnimationFrame(noise);
}
noise();

// --- 8. LENIS SCROLL (Smooth) ---
const lenis = new Lenis({ duration: 1.5, smooth: true });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);


// --- 9. DUAL ENDING LOGIC ---
function endStory(message, isHappyEnd) {
    // 1. Fade out Rain and Fire
    gsap.to([audioRain, audioFire], { volume: 0, duration: 2 });
    
    // 2. Handle Piano
    if(isHappyEnd) {
        // Happy End: Swell the music
        if(audioPiano.paused) audioPiano.play();
        gsap.to(audioPiano, { volume: 0.8, duration: 3 });
    } else {
        // Polite End: Fade music out
        gsap.to(audioPiano, { volume: 0, duration: 2 });
    }

    // 3. Set Text
    const outroText = document.querySelector('.outro-text');
    outroText.innerText = message;

    // 4. Fade Screen to Black
    gsap.to('#outro', { opacity: 1, pointerEvents: 'all', duration: 3, ease: "power2.inOut" });
    
    // 5. Reveal Message
    gsap.fromTo(outroText, 
        { opacity: 0, scale: 0.95, filter: "blur(5px)" }, 
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 2, delay: 1.5 }
    );
}

// Attach to Buttons
document.getElementById('btn-yes').addEventListener('click', () => {
    endStory("Then let's start a new chapter.", true);
});

document.getElementById('btn-no').addEventListener('click', () => {
    endStory("Thank You!", false);
});