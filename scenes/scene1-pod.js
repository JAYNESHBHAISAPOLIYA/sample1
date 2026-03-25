/**
 * SCENE 1: THE AWAKENING
 * Pod crack-open animation with green chickpea reveal
 */

import * as THREE from 'three';

export class Scene1Pod {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.group = new THREE.Group();
        this.group.name = 'scene1-pod';
        
        this.pod = null;
        this.chickpea = null;
        this.particles = [];
        this.isIntroPlaying = false;
        this.introProgress = 0;
        
        // Animation states
        this.podOpenAmount = 0;
        this.chickpeaRevealed = false;
        this.cameraStartPos = new THREE.Vector3(0, 0, 15);
        this.cameraEndPos = new THREE.Vector3(0, 0, 6);
    }
    
    async init() {
        this.createPod();
        this.createChickpea();
        this.createGodRays();
        this.createDustParticles();
        this.createBokehBackground();
        
        this.scene.add(this.group);
        
        // Initial state
        this.group.visible = true;
        this.camera.position.copy(this.cameraStartPos);
        
        return Promise.resolve();
    }
    
    // ==========================================
    // POD GEOMETRY
    // ==========================================
    createPod() {
        // Create pod using custom geometry
        // Pod shape: elongated capsule with seam
        const podGroup = new THREE.Group();
        podGroup.name = 'pod';
        
        // Pod material with fuzzy surface effect
        const podMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A7C3F,
            roughness: 0.8,
            metalness: 0.1,
            emissive: 0x1a2f16,
            emissiveIntensity: 0.1
        });
        
        // Top half of pod
        const podTopGeometry = this.createPodHalfGeometry();
        this.podTop = new THREE.Mesh(podTopGeometry, podMaterial);
        this.podTop.position.y = 0.02;
        this.podTop.castShadow = true;
        
        // Bottom half of pod
        const podBottomGeometry = this.createPodHalfGeometry();
        this.podBottom = new THREE.Mesh(podBottomGeometry, podMaterial.clone());
        this.podBottom.rotation.x = Math.PI;
        this.podBottom.position.y = -0.02;
        this.podBottom.castShadow = true;
        
        // Add bumps to show chickpeas inside
        this.addPodBumps(this.podTop);
        this.addPodBumps(this.podBottom);
        
        // Seam line (crack will form here)
        const seamGeometry = new THREE.BoxGeometry(2.5, 0.02, 0.8);
        const seamMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d6832,
            roughness: 0.9
        });
        this.seam = new THREE.Mesh(seamGeometry, seamMaterial);
        
        podGroup.add(this.podTop);
        podGroup.add(this.podBottom);
        podGroup.add(this.seam);
        
        // Fuzzy surface particles (trichomes)
        this.addFuzzySurface(podGroup);
        
        this.pod = podGroup;
        this.pod.rotation.z = 0.1;
        this.group.add(this.pod);
    }
    
    createPodHalfGeometry() {
        // Create a half-pod shape using a modified sphere
        const geometry = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        
        // Stretch to pod shape
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Elongate along X axis
            positions.setX(i, x * 2.5);
            // Flatten Z axis slightly
            positions.setZ(i, z * 0.8);
            // Adjust Y for smoother curve
            positions.setY(i, y * 0.5);
        }
        
        geometry.computeVertexNormals();
        return geometry;
    }
    
    addPodBumps(podHalf) {
        // Add visible bumps where chickpeas are inside
        const bumpMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a8c4f,
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Two bumps for two chickpeas
        const bump1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 16, 16),
            bumpMaterial
        );
        bump1.position.set(-0.5, 0.15, 0);
        bump1.scale.set(1.2, 0.6, 1);
        
        const bump2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            bumpMaterial
        );
        bump2.position.set(0.4, 0.15, 0);
        bump2.scale.set(1.2, 0.6, 1);
        
        podHalf.add(bump1);
        podHalf.add(bump2);
    }
    
    addFuzzySurface(podGroup) {
        // Create small hair-like particles for fuzzy surface
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI - Math.PI / 2;
            const r = 0.5 + Math.random() * 0.1;
            
            positions[i * 3] = (Math.cos(theta) * r * 2.5) + (Math.random() - 0.5) * 0.2;
            positions[i * 3 + 1] = (Math.sin(phi) * 0.3) + (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 2] = (Math.sin(theta) * r * 0.8) + (Math.random() - 0.5) * 0.1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x6a9c5f,
            size: 0.02,
            transparent: true,
            opacity: 0.6
        });
        
        const fuzz = new THREE.Points(geometry, material);
        fuzz.name = 'fuzz';
        podGroup.add(fuzz);
    }
    
    // ==========================================
    // CHICKPEA GEOMETRY
    // ==========================================
    createChickpea() {
        // Create photorealistic green chickpea
        const geometry = new THREE.SphereGeometry(0.35, 64, 64);
        
        // Slightly deform for organic look
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Add subtle irregularity
            const noise = Math.sin(x * 5) * Math.cos(y * 5) * Math.sin(z * 5) * 0.02;
            const len = Math.sqrt(x * x + y * y + z * z);
            const scale = (len + noise) / len;
            
            positions.setX(i, x * scale);
            positions.setY(i, y * scale);
            positions.setZ(i, z * scale);
        }
        geometry.computeVertexNormals();
        
        // SSS-like material for organic look
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x5a9c4f,
            roughness: 0.3,
            metalness: 0,
            clearcoat: 0.3,
            clearcoatRoughness: 0.4,
            transmission: 0.1,
            thickness: 0.5,
            ior: 1.4,
            emissive: 0x2a4c1f,
            emissiveIntensity: 0.1
        });
        
        this.chickpea = new THREE.Mesh(geometry, material);
        this.chickpea.castShadow = true;
        this.chickpea.receiveShadow = true;
        
        // Start hidden inside pod
        this.chickpea.position.set(0.3, 0, 0);
        this.chickpea.visible = false;
        
        // Add highlight spot
        const highlightGeom = new THREE.SphereGeometry(0.1, 16, 16);
        const highlightMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15
        });
        const highlight = new THREE.Mesh(highlightGeom, highlightMat);
        highlight.position.set(-0.15, 0.2, 0.2);
        this.chickpea.add(highlight);
        
        this.group.add(this.chickpea);
    }
    
    // ==========================================
    // GOD RAYS
    // ==========================================
    createGodRays() {
        // Create volumetric light effect from top-left
        const rayGeometry = new THREE.ConeGeometry(3, 15, 32, 1, true);
        const rayMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xF5A623) },
                uIntensity: { value: 0.3 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uIntensity;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    float gradient = 1.0 - vUv.y;
                    float radial = 1.0 - length(vUv - vec2(0.5)) * 2.0;
                    
                    // Animated noise
                    float noise = sin(vPosition.x * 3.0 + uTime) * 
                                  cos(vPosition.z * 3.0 + uTime * 0.7) * 0.5 + 0.5;
                    
                    float alpha = gradient * radial * noise * uIntensity;
                    
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.godRays = new THREE.Mesh(rayGeometry, rayMaterial);
        this.godRays.position.set(-4, 8, 2);
        this.godRays.rotation.z = Math.PI / 4;
        this.godRays.rotation.x = -Math.PI / 6;
        
        this.group.add(this.godRays);
    }
    
    // ==========================================
    // DUST PARTICLES
    // ==========================================
    createDustParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const alphas = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            sizes[i] = Math.random() * 0.05 + 0.02;
            alphas[i] = Math.random();
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xE8D5A3) }
            },
            vertexShader: `
                attribute float size;
                attribute float alpha;
                
                varying float vAlpha;
                
                uniform float uTime;
                
                void main() {
                    vAlpha = alpha;
                    
                    vec3 pos = position;
                    pos.y += sin(uTime * 0.5 + position.x) * 0.3;
                    pos.x += cos(uTime * 0.3 + position.z) * 0.2;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = (1.0 - dist * 2.0) * vAlpha * 0.5;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.dustParticles = new THREE.Points(geometry, material);
        this.group.add(this.dustParticles);
    }
    
    // ==========================================
    // BOKEH BACKGROUND
    // ==========================================
    createBokehBackground() {
        // Create blurred golden bokeh circles
        const bokehGroup = new THREE.Group();
        bokehGroup.name = 'bokeh';
        
        const bokehCount = 30;
        
        for (let i = 0; i < bokehCount; i++) {
            const size = Math.random() * 2 + 0.5;
            const geometry = new THREE.CircleGeometry(size, 32);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.6, 0.5),
                transparent: true,
                opacity: Math.random() * 0.15 + 0.05
            });
            
            const bokeh = new THREE.Mesh(geometry, material);
            bokeh.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20,
                -15 - Math.random() * 10
            );
            
            bokeh.userData.speed = Math.random() * 0.002 + 0.001;
            bokeh.userData.offset = Math.random() * Math.PI * 2;
            
            bokehGroup.add(bokeh);
        }
        
        this.bokeh = bokehGroup;
        this.group.add(this.bokeh);
    }
    
    // ==========================================
    // CREATE POD OPENING PARTICLES
    // ==========================================
    createCrackParticles() {
        // Fibrous tearing particles when pod opens
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.3;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.02
            ));
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x6a9c5f,
            size: 0.03,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData.velocities = velocities;
        particles.visible = false;
        
        this.crackParticles = particles;
        this.group.add(this.crackParticles);
    }
    
    // ==========================================
    // INTRO ANIMATION
    // ==========================================
    playIntro() {
        this.isIntroPlaying = true;
        this.createCrackParticles();
        
        // GSAP timeline for intro
        const tl = gsap.timeline({
            onComplete: () => {
                this.isIntroPlaying = false;
            }
        });
        
        // 1. Pod materializes from darkness
        tl.from(this.pod.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 2,
            ease: 'power2.out'
        });
        
        // 2. God rays intensify
        tl.to(this.godRays.material.uniforms.uIntensity, {
            value: 0.5,
            duration: 1.5,
            ease: 'power1.in'
        }, '-=1');
        
        // 3. Camera dolly in
        tl.to(this.camera.position, {
            z: 8,
            duration: 2,
            ease: 'power2.inOut'
        }, '-=0.5');
        
        // 4. Pod begins to crack open
        tl.to(this, {
            podOpenAmount: 0.3,
            duration: 1.5,
            ease: 'power1.in',
            onUpdate: () => this.updatePodOpen()
        }, '+=0.5');
        
        // 5. Show crack particles
        tl.call(() => {
            this.crackParticles.visible = true;
        });
        
        // 6. Pod opens wider, chickpea revealed
        tl.to(this, {
            podOpenAmount: 1,
            duration: 2,
            ease: 'power2.out',
            onStart: () => {
                this.chickpea.visible = true;
            },
            onUpdate: () => this.updatePodOpen()
        });
        
        // 7. Chickpea bounces out
        tl.to(this.chickpea.position, {
            x: 0,
            y: -1,
            z: 2,
            duration: 0.6,
            ease: 'bounce.out'
        }, '-=1');
        
        // 8. Chickpea rotates for beauty shot
        tl.to(this.chickpea.rotation, {
            y: Math.PI * 2,
            duration: 3,
            ease: 'none',
            repeat: -1
        });
    }
    
    updatePodOpen() {
        // Animate pod halves separating
        const openDistance = this.podOpenAmount * 0.5;
        
        this.podTop.position.y = 0.02 + openDistance;
        this.podTop.rotation.x = -this.podOpenAmount * 0.3;
        
        this.podBottom.position.y = -0.02 - openDistance;
        this.podBottom.rotation.x = Math.PI + this.podOpenAmount * 0.3;
        
        // Seam breaks apart
        this.seam.scale.y = 1 - this.podOpenAmount;
        this.seam.material.opacity = 1 - this.podOpenAmount;
        
        // Update crack particles
        if (this.crackParticles && this.crackParticles.visible) {
            const positions = this.crackParticles.geometry.attributes.position;
            const velocities = this.crackParticles.userData.velocities;
            
            for (let i = 0; i < positions.count; i++) {
                positions.setX(i, positions.getX(i) + velocities[i].x);
                positions.setY(i, positions.getY(i) + velocities[i].y);
                positions.setZ(i, positions.getZ(i) + velocities[i].z);
                
                // Gravity
                velocities[i].y -= 0.0005;
            }
            
            positions.needsUpdate = true;
        }
    }
    
    // ==========================================
    // SCROLL-BASED UPDATE
    // ==========================================
    update(progress) {
        // Camera movement based on scroll
        const cameraZ = THREE.MathUtils.lerp(8, 4, progress);
        this.camera.position.z = cameraZ;
        
        // Fade out as user scrolls
        this.group.traverse(child => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => {
                        if (m.opacity !== undefined) {
                            m.opacity = 1 - progress;
                        }
                    });
                } else if (child.material.opacity !== undefined) {
                    child.material.opacity = 1 - progress;
                }
            }
        });
        
        // Pod and chickpea move up and back
        if (this.pod) {
            this.pod.position.y = progress * 5;
            this.pod.position.z = progress * -5;
        }
        
        if (this.chickpea && this.chickpea.visible) {
            this.chickpea.position.y = -1 + progress * 6;
        }
    }
    
    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    animate(elapsedTime, delta) {
        // Update god rays
        if (this.godRays) {
            this.godRays.material.uniforms.uTime.value = elapsedTime;
        }
        
        // Update dust particles
        if (this.dustParticles) {
            this.dustParticles.material.uniforms.uTime.value = elapsedTime;
        }
        
        // Animate bokeh
        if (this.bokeh) {
            this.bokeh.children.forEach(child => {
                child.position.y += Math.sin(elapsedTime * child.userData.speed * 100 + child.userData.offset) * 0.01;
                child.position.x += Math.cos(elapsedTime * child.userData.speed * 50 + child.userData.offset) * 0.005;
            });
        }
        
        // Subtle pod sway
        if (this.pod && !this.isIntroPlaying) {
            this.pod.rotation.z = 0.1 + Math.sin(elapsedTime * 0.5) * 0.02;
        }
        
        // Chickpea gentle rotation
        if (this.chickpea && this.chickpea.visible && !this.isIntroPlaying) {
            this.chickpea.rotation.y += delta * 0.3;
        }
    }
    
    // ==========================================
    // CLEANUP
    // ==========================================
    dispose() {
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        this.scene.remove(this.group);
    }
}
