/**
 * CHICKPEA REVOLUTION - Main Application
 * Orchestrates all 3D scenes, animations, and interactions
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Import scene modules
import { Scene1Pod } from './scenes/scene1-pod.js';
import { Scene2Selector } from './scenes/scene2-selector.js';
import { Scene3Green } from './scenes/scene3a-green.js';
import { Scene3Desi } from './scenes/scene3b-desi.js';
import { Scene4Field } from './scenes/scene4-field.js';

// ==========================================
// GLOBAL STATE
// ==========================================
const state = {
    isLoaded: false,
    currentScene: 1,
    selectedVariant: null,
    cartItems: [],
    scrollProgress: 0,
    isMobile: window.innerWidth < 768
};

// ==========================================
// THREE.JS SETUP
// ==========================================
class ChickpeaApp {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLighting();
        this.setupPostProcessing();
        this.setupScenes();
        this.setupEventListeners();
        this.setupLenis();
        this.setupGSAP();
        this.setupCustomCursor();
        this.startLoadingSequence();
    }
    
    // ==========================================
    // RENDERER
    // ==========================================
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: !state.isMobile,
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x000000, 1);
    }
    
    // ==========================================
    // CAMERA
    // ==========================================
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.sizes.width / this.sizes.height,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 10);
        
        // Optional orbit controls for development
        // this.controls = new OrbitControls(this.camera, this.canvas);
        // this.controls.enableDamping = true;
    }
    
    // ==========================================
    // LIGHTING
    // ==========================================
    setupLighting() {
        // Will be managed per-scene, but setup base ambient
        this.ambientLight = new THREE.AmbientLight(0xE8D5A3, 0.2);
        
        // Main directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xF5A623, 1.5);
        this.sunLight.position.set(-5, 10, 5);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 50;
        this.sunLight.shadow.camera.left = -10;
        this.sunLight.shadow.camera.right = 10;
        this.sunLight.shadow.camera.top = 10;
        this.sunLight.shadow.camera.bottom = -10;
        
        // Rim light for dramatic effect
        this.rimLight = new THREE.DirectionalLight(0xF5A623, 0.5);
        this.rimLight.position.set(5, 5, -5);
    }
    
    // ==========================================
    // POST PROCESSING
    // ==========================================
    setupPostProcessing() {
        if (state.isMobile) {
            this.composer = null;
            return;
        }
        
        this.composer = new EffectComposer(this.renderer);
        
        // We'll add passes after scenes are initialized
        this.renderPass = null;
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.sizes.width, this.sizes.height),
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
    }
    
    // ==========================================
    // SCENES
    // ==========================================
    setupScenes() {
        // Create main scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x3B1F0A, 0.02);
        
        // Add base lights
        this.scene.add(this.ambientLight);
        this.scene.add(this.sunLight);
        this.scene.add(this.rimLight);
        
        // Initialize scene modules
        this.scenes = {
            pod: new Scene1Pod(this.scene, this.camera, this.renderer),
            selector: new Scene2Selector(this.scene, this.camera, this.renderer),
            green: new Scene3Green(this.scene, this.camera, this.renderer),
            desi: new Scene3Desi(this.scene, this.camera, this.renderer),
            field: new Scene4Field(this.scene, this.camera, this.renderer)
        };
        
        // Setup post-processing with scene
        if (this.composer) {
            this.renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(this.renderPass);
            this.composer.addPass(this.bloomPass);
        }
    }
    
    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => this.onResize());
        
        // Mouse move for cursor
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Plant selector clicks
        document.querySelectorAll('.plant-selector').forEach(btn => {
            btn.addEventListener('click', (e) => this.onPlantSelect(e));
        });
        
        // Weight buttons
        document.querySelectorAll('.weight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.onWeightSelect(e));
        });
        
        // Add to cart
        document.getElementById('add-to-cart-btn')?.addEventListener('click', () => this.onAddToCart());
    }
    
    onResize() {
        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;
        state.isMobile = window.innerWidth < 768;
        
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        if (this.composer) {
            this.composer.setSize(this.sizes.width, this.sizes.height);
        }
    }
    
    onMouseMove(event) {
        this.mouse.x = (event.clientX / this.sizes.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.sizes.height) * 2 + 1;
        
        // Update custom cursor
        const cursor = document.getElementById('custom-cursor');
        if (cursor) {
            cursor.style.left = event.clientX + 'px';
            cursor.style.top = event.clientY + 'px';
        }
    }
    
    onPlantSelect(event) {
        const variant = event.currentTarget.dataset.variant;
        state.selectedVariant = variant;
        
        // Update UI
        document.querySelectorAll('.plant-selector').forEach(btn => {
            if (btn.dataset.variant === variant) {
                btn.classList.add('active');
                btn.classList.remove('dimmed');
            } else {
                btn.classList.add('dimmed');
                btn.classList.remove('active');
            }
        });
        
        // Trigger scene transition
        this.transitionToJourney(variant);
    }
    
    onWeightSelect(event) {
        document.querySelectorAll('.weight-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Update price based on weight
        const weight = parseInt(event.currentTarget.dataset.weight);
        const basePrice = state.selectedVariant === 'desi' ? 149 : 199;
        const price = Math.round(basePrice * (weight / 250));
        document.getElementById('product-price').textContent = `₹${price}`;
    }
    
    onAddToCart() {
        const weight = document.querySelector('.weight-btn.active').dataset.weight;
        const variant = state.selectedVariant;
        
        state.cartItems.push({ variant, weight });
        
        // Update cart icon
        const cartCount = document.getElementById('cart-count');
        cartCount.textContent = state.cartItems.length;
        cartCount.classList.add('show', 'bounce');
        setTimeout(() => cartCount.classList.remove('bounce'), 400);
        
        // Trigger confetti
        this.createConfetti();
        
        // Button feedback
        const btn = document.getElementById('add-to-cart-btn');
        btn.textContent = 'Added! ✓';
        btn.style.background = 'linear-gradient(to right, #2d5a27, #4A7C3F)';
        setTimeout(() => {
            btn.textContent = 'Add to Cart';
            btn.style.background = '';
        }, 2000);
    }
    
    // ==========================================
    // SMOOTH SCROLL (LENIS)
    // ==========================================
    setupLenis() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 2
        });
        
        this.lenis.on('scroll', (e) => {
            state.scrollProgress = e.progress;
            this.onScroll(e);
        });
    }
    
    onScroll(e) {
        // Update scenes based on scroll position
        const scrollY = e.scroll;
        const viewportHeight = window.innerHeight;
        
        // Determine current scene
        const scene1End = viewportHeight * 2;
        const scene2End = scene1End + viewportHeight * 1.5;
        const scene3End = scene2End + viewportHeight * 4;
        
        if (scrollY < scene1End) {
            state.currentScene = 1;
            const progress = scrollY / scene1End;
            this.scenes.pod.update(progress);
        } else if (scrollY < scene2End) {
            state.currentScene = 2;
            const progress = (scrollY - scene1End) / (scene2End - scene1End);
            this.scenes.selector.update(progress);
        } else if (scrollY < scene3End && state.selectedVariant) {
            state.currentScene = 3;
            const progress = (scrollY - scene2End) / (scene3End - scene2End);
            if (state.selectedVariant === 'desi') {
                this.scenes.desi.update(progress);
            } else {
                this.scenes.green.update(progress);
            }
        } else {
            state.currentScene = 4;
            const progress = Math.min(1, (scrollY - scene3End) / viewportHeight);
            this.scenes.field.update(progress);
        }
    }
    
    // ==========================================
    // GSAP SCROLL TRIGGERS
    // ==========================================
    setupGSAP() {
        gsap.registerPlugin(ScrollTrigger);
        
        // Scene 1: Hero text reveal
        ScrollTrigger.create({
            trigger: '#scene-1',
            start: 'top top',
            end: '50% top',
            onEnter: () => {
                setTimeout(() => {
                    document.getElementById('hero-text').style.opacity = '1';
                    document.getElementById('hero-text').style.transform = 'translateY(0)';
                    document.getElementById('scroll-indicator').style.opacity = '1';
                }, 2500);
            },
            onLeave: () => {
                document.getElementById('hero-text').style.opacity = '0';
                document.getElementById('scroll-indicator').style.opacity = '0';
            },
            onEnterBack: () => {
                document.getElementById('hero-text').style.opacity = '1';
                document.getElementById('scroll-indicator').style.opacity = '1';
            }
        });
        
        // Scene 2: Selector UI
        ScrollTrigger.create({
            trigger: '#scene-2',
            start: 'top center',
            end: 'bottom center',
            onEnter: () => {
                document.getElementById('selector-ui').style.opacity = '1';
                document.getElementById('main-nav').style.opacity = '1';
            },
            onLeave: () => {
                document.getElementById('selector-ui').style.opacity = '0';
            },
            onEnterBack: () => {
                document.getElementById('selector-ui').style.opacity = '1';
            },
            onLeaveBack: () => {
                document.getElementById('selector-ui').style.opacity = '0';
            }
        });
        
        // Scene 3: Journey progress
        ScrollTrigger.create({
            trigger: '#scene-3',
            start: 'top top',
            end: 'bottom bottom',
            onEnter: () => {
                document.getElementById('journey-progress').style.opacity = '1';
            },
            onLeave: () => {
                document.getElementById('journey-progress').style.opacity = '0';
            },
            onEnterBack: () => {
                document.getElementById('journey-progress').style.opacity = '1';
            },
            onLeaveBack: () => {
                document.getElementById('journey-progress').style.opacity = '0';
            },
            onUpdate: (self) => {
                this.updateJourneyProgress(self.progress);
            }
        });
        
        // Scene 4: Footer
        ScrollTrigger.create({
            trigger: '#scene-4',
            start: 'top center',
            onEnter: () => {
                document.getElementById('field-content').style.opacity = '1';
            }
        });
    }
    
    updateJourneyProgress(progress) {
        const steps = document.querySelectorAll('.journey-step');
        const activeStep = Math.floor(progress * 4);
        
        steps.forEach((step, i) => {
            if (i < activeStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (i === activeStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        // Update journey texts
        const texts = document.querySelectorAll('.journey-text');
        texts.forEach((text, i) => {
            if (i === activeStep && activeStep < 3) {
                text.classList.add('visible');
            } else {
                text.classList.remove('visible');
            }
        });
        
        // Show product card at end of journey
        if (progress > 0.85) {
            document.getElementById('product-card').classList.add('visible');
        } else {
            document.getElementById('product-card').classList.remove('visible');
        }
    }
    
    transitionToJourney(variant) {
        // Update product card info based on variant
        const nameEl = document.getElementById('product-name');
        const subtitleEl = document.getElementById('product-subtitle');
        const badgeEl = document.getElementById('product-badge');
        const priceEl = document.getElementById('product-price');
        const btn = document.getElementById('add-to-cart-btn');
        
        if (variant === 'desi') {
            nameEl.textContent = 'Desi Amreli';
            subtitleEl.textContent = 'Traditional Brown Chickpeas';
            badgeEl.textContent = 'Sun-Dried';
            badgeEl.className = 'inline-block px-3 py-1 bg-terracotta/20 text-terracotta text-xs rounded-full mb-4';
            priceEl.textContent = '₹149';
            btn.style.background = 'linear-gradient(to right, #C1622F, #d4763f)';
        } else if (variant === 'kabuli') {
            nameEl.textContent = 'Kabuli Chana';
            subtitleEl.textContent = 'Premium White Chickpeas';
            badgeEl.textContent = 'Premium Select';
            badgeEl.className = 'inline-block px-3 py-1 bg-cream/20 text-cream text-xs rounded-full mb-4';
            priceEl.textContent = '₹249';
            btn.style.background = 'linear-gradient(to right, #8B7355, #a08060)';
        } else {
            nameEl.textContent = 'Lila Chana';
            subtitleEl.textContent = 'Fresh Green Chickpeas';
            badgeEl.textContent = 'Fresh Harvest';
            badgeEl.className = 'inline-block px-3 py-1 bg-chana-green/20 text-chana-green text-xs rounded-full mb-4';
            priceEl.textContent = '₹199';
            btn.style.background = '';
        }
        
        // Smooth scroll to scene 3
        this.lenis.scrollTo('#scene-3', { duration: 1.5 });
    }
    
    // ==========================================
    // CUSTOM CURSOR
    // ==========================================
    setupCustomCursor() {
        if (state.isMobile) return;
        
        const cursor = document.getElementById('custom-cursor');
        
        // Add special effects on hover
        const interactiveElements = document.querySelectorAll('a, button, .plant-selector');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
            });
        });
    }
    
    // ==========================================
    // CONFETTI EFFECT
    // ==========================================
    createConfetti() {
        const container = document.getElementById('confetti-container');
        const colors = ['#4A7C3F', '#E8D5A3', '#F5A623', '#C1622F'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '50%';
            confetti.style.width = Math.random() * 8 + 4 + 'px';
            confetti.style.height = confetti.style.width;
            
            container.appendChild(confetti);
            
            gsap.to(confetti, {
                y: (Math.random() - 0.5) * 400,
                x: (Math.random() - 0.5) * 200,
                rotation: Math.random() * 720,
                opacity: 0,
                duration: 2 + Math.random(),
                ease: 'power2.out',
                onComplete: () => confetti.remove()
            });
        }
    }
    
    // ==========================================
    // LOADING SEQUENCE
    // ==========================================
    startLoadingSequence() {
        const loader = document.getElementById('loader');
        const progressRect = document.getElementById('pod-progress');
        const percentText = document.getElementById('load-percent');
        
        let progress = 0;
        
        // Initialize all scenes
        const loadPromises = Object.values(this.scenes).map(scene => scene.init());
        
        // Simulate loading progress
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            // Update progress bar (pod fill)
            const y = 70 - (progress / 100) * 70;
            progressRect.setAttribute('y', y);
            percentText.textContent = Math.floor(progress) + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 100);
        
        // Wait for all scenes to initialize
        Promise.all(loadPromises).then(() => {
            setTimeout(() => {
                loader.classList.add('hidden');
                state.isLoaded = true;
                this.startAnimation();
            }, 500);
        }).catch(err => {
            console.error('Loading error:', err);
            // Still hide loader after timeout
            setTimeout(() => {
                loader.classList.add('hidden');
                state.isLoaded = true;
                this.startAnimation();
            }, 3000);
        });
    }
    
    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    startAnimation() {
        // Start scene 1 intro animation
        this.scenes.pod.playIntro();
        
        // Start render loop
        this.animate();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update Lenis
        this.lenis.raf(performance.now());
        
        // Update clock
        const elapsedTime = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();
        
        // Update active scene
        if (state.isLoaded) {
            switch (state.currentScene) {
                case 1:
                    this.scenes.pod.animate(elapsedTime, delta);
                    break;
                case 2:
                    this.scenes.selector.animate(elapsedTime, delta);
                    break;
                case 3:
                    if (state.selectedVariant === 'desi') {
                        this.scenes.desi.animate(elapsedTime, delta);
                    } else {
                        this.scenes.green.animate(elapsedTime, delta);
                    }
                    break;
                case 4:
                    this.scenes.field.animate(elapsedTime, delta);
                    break;
            }
        }
        
        // Update controls if enabled
        // this.controls?.update();
        
        // Render
        if (this.composer && !state.isMobile) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// ==========================================
// INITIALIZE APP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    new ChickpeaApp();
});
