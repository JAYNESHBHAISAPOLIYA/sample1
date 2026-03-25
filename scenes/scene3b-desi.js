/**
 * SCENE 3B: DESI AMRELI CHANA JOURNEY
 * Sunrise → Drying → Reveal for traditional brown chickpea
 */

import * as THREE from 'three';

export class Scene3Desi {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.group = new THREE.Group();
        this.group.name = 'scene3-desi';
        
        this.sun = null;
        this.plant = null;
        this.bowl = null;
        this.desiChana = null;
        this.heatHaze = null;
        
        this.sunriseProgress = 0;
        this.dryingProgress = 0;
        this.currentStep = 0;
    }
    
    async init() {
        this.createGround();
        this.createSky();
        this.createSun();
        this.createPlant();
        this.createDesiChana();
        this.createBrassBowl();
        this.createHeatHaze();
        this.createDustParticles();
        
        // Start hidden
        this.group.visible = false;
        this.scene.add(this.group);
        
        return Promise.resolve();
    }
    
    // ==========================================
    // GROUND
    // ==========================================
    createGround() {
        const geometry = new THREE.PlaneGeometry(50, 50, 32, 32);
        geometry.rotateX(-Math.PI / 2);
        
        // Add displacement
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            positions.setY(i, Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.2);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x6B4423,
            roughness: 0.95,
            metalness: 0
        });
        
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.position.y = -2;
        this.ground.receiveShadow = true;
        this.group.add(this.ground);
    }
    
    // ==========================================
    // ANIMATED SKY
    // ==========================================
    createSky() {
        const geometry = new THREE.SphereGeometry(45, 32, 32);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uSunriseProgress: { value: 0 },
                uNightColor: { value: new THREE.Color(0x0a0a20) },
                uDawnColor: { value: new THREE.Color(0xff6b35) },
                uDayColor: { value: new THREE.Color(0x87ceeb) },
                uSunPosition: { value: new THREE.Vector3(0, -5, -30) }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uSunriseProgress;
                uniform vec3 uNightColor;
                uniform vec3 uDawnColor;
                uniform vec3 uDayColor;
                uniform vec3 uSunPosition;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    float height = normalize(vPosition).y;
                    
                    // Base gradient based on time
                    vec3 nightSky = mix(uNightColor * 1.5, uNightColor, height);
                    vec3 dawnSky = mix(uDawnColor, vec3(0.3, 0.2, 0.4), height);
                    vec3 daySky = mix(vec3(1.0, 0.9, 0.7), uDayColor, height);
                    
                    vec3 color;
                    if (uSunriseProgress < 0.3) {
                        // Night to dawn
                        float t = uSunriseProgress / 0.3;
                        color = mix(nightSky, dawnSky, t);
                    } else if (uSunriseProgress < 0.7) {
                        // Dawn to day
                        float t = (uSunriseProgress - 0.3) / 0.4;
                        color = mix(dawnSky, daySky, t);
                    } else {
                        color = daySky;
                    }
                    
                    // Sun glow
                    vec3 sunDir = normalize(uSunPosition);
                    float sunAngle = dot(normalize(vPosition), sunDir);
                    float sunGlow = pow(max(0.0, sunAngle), 8.0);
                    color += vec3(1.0, 0.6, 0.2) * sunGlow * uSunriseProgress;
                    
                    // Horizon glow
                    float horizonGlow = 1.0 - abs(height);
                    horizonGlow = pow(horizonGlow, 4.0);
                    color += uDawnColor * horizonGlow * 0.3 * (1.0 - uSunriseProgress * 0.5);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false
        });
        
        this.sky = new THREE.Mesh(geometry, material);
        this.group.add(this.sky);
    }
    
    // ==========================================
    // ANIMATED SUN
    // ==========================================
    createSun() {
        const sunGroup = new THREE.Group();
        
        // Sun core
        const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
        const sunMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                
                void main() {
                    vUv = uv;
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uIntensity;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                
                void main() {
                    // Core gradient
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    
                    vec3 coreColor = vec3(1.0, 0.9, 0.7);
                    vec3 edgeColor = vec3(1.0, 0.5, 0.1);
                    
                    vec3 color = mix(coreColor, edgeColor, fresnel);
                    
                    // Pulsing
                    float pulse = 1.0 + sin(uTime * 2.0) * 0.05;
                    color *= pulse * uIntensity;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });
        
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sunGroup.add(sun);
        
        // Sun glow layers
        for (let i = 0; i < 3; i++) {
            const glowGeometry = new THREE.SphereGeometry(4 + i * 1.5, 32, 32);
            const glowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    uColor: { value: new THREE.Color(0xff6b35) },
                    uOpacity: { value: 0.3 - i * 0.08 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 uColor;
                    uniform float uOpacity;
                    varying vec3 vNormal;
                    
                    void main() {
                        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                        gl_FragColor = vec4(uColor, intensity * uOpacity);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            sunGroup.add(glow);
        }
        
        // Lens flare sprites
        const flareTexture = this.createFlareTexture();
        for (let i = 0; i < 5; i++) {
            const flareMaterial = new THREE.SpriteMaterial({
                map: flareTexture,
                color: new THREE.Color(0xff8844),
                transparent: true,
                opacity: 0.4 - i * 0.06,
                blending: THREE.AdditiveBlending
            });
            
            const flare = new THREE.Sprite(flareMaterial);
            flare.scale.setScalar(2 + i * 0.5);
            flare.position.set(
                (i - 2) * 0.5,
                (i - 2) * -0.3,
                0.1 * i
            );
            
            sunGroup.add(flare);
        }
        
        this.sunGroup = sunGroup;
        this.sunGroup.position.set(0, -10, -30); // Start below horizon
        this.group.add(this.sunGroup);
    }
    
    createFlareTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 200, 150, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 150, 100, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    // ==========================================
    // DRYING PLANT
    // ==========================================
    createPlant() {
        this.plantGroup = new THREE.Group();
        this.plantGroup.name = 'drying-plant';
        
        // Create plant that will dry out
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A7C3F,
            roughness: 0.8
        });
        
        // Main stem
        const stemGeometry = new THREE.CylinderGeometry(0.03, 0.06, 2, 8);
        this.stem = new THREE.Mesh(stemGeometry, stemMaterial.clone());
        this.stem.position.y = 1;
        this.plantGroup.add(this.stem);
        
        // Branches with leaves
        this.branches = [];
        this.leaves = [];
        this.pods = [];
        
        for (let i = 0; i < 6; i++) {
            const branchGroup = new THREE.Group();
            
            // Branch
            const branchGeom = new THREE.CylinderGeometry(0.015, 0.025, 0.7, 6);
            const branch = new THREE.Mesh(branchGeom, stemMaterial.clone());
            branch.rotation.z = Math.PI / 4;
            branch.position.y = 0.35;
            branchGroup.add(branch);
            this.branches.push(branch);
            
            // Leaves
            for (let j = 0; j < 5; j++) {
                const leafShape = new THREE.Shape();
                leafShape.moveTo(0, 0);
                leafShape.quadraticCurveTo(0.04, 0.04, 0, 0.12);
                leafShape.quadraticCurveTo(-0.04, 0.04, 0, 0);
                
                const leafGeom = new THREE.ShapeGeometry(leafShape);
                const leafMat = new THREE.MeshStandardMaterial({
                    color: 0x5a9c4f,
                    side: THREE.DoubleSide,
                    roughness: 0.6
                });
                
                const leaf = new THREE.Mesh(leafGeom, leafMat);
                leaf.position.set(
                    j * 0.12 + 0.1,
                    0.2 + j * 0.08,
                    (j % 2 === 0 ? 0.06 : -0.06)
                );
                leaf.rotation.z = (j % 2 === 0 ? 0.3 : -0.3);
                leaf.scale.setScalar(0.4 + j * 0.1);
                
                leaf.userData.originalRotation = leaf.rotation.z;
                leaf.userData.originalColor = new THREE.Color(0x5a9c4f);
                
                this.leaves.push(leaf);
                branchGroup.add(leaf);
            }
            
            // Pod
            if (i % 2 === 0) {
                const pod = this.createDryingPod();
                pod.position.set(0.5, 0.4, 0);
                pod.rotation.z = Math.PI / 4;
                this.pods.push(pod);
                branchGroup.add(pod);
            }
            
            const angle = (i / 6) * Math.PI * 2;
            branchGroup.position.set(
                Math.cos(angle) * 0.1,
                0.6 + (i / 6) * 1.2,
                Math.sin(angle) * 0.1
            );
            branchGroup.rotation.y = angle;
            
            this.plantGroup.add(branchGroup);
        }
        
        this.plantGroup.position.y = -2;
        this.group.add(this.plantGroup);
    }
    
    createDryingPod() {
        const podGroup = new THREE.Group();
        
        const geometry = new THREE.SphereGeometry(0.12, 16, 16);
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            positions.setX(i, positions.getX(i) * 1.4);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x4A7C3F,
            roughness: 0.8
        });
        
        const pod = new THREE.Mesh(geometry, material);
        podGroup.add(pod);
        
        podGroup.userData.originalColor = new THREE.Color(0x4A7C3F);
        
        return podGroup;
    }
    
    updateDrying(progress) {
        this.dryingProgress = progress;
        
        // Color transition: green → yellow → brown
        const greenColor = new THREE.Color(0x4A7C3F);
        const yellowColor = new THREE.Color(0xB8A030);
        const brownColor = new THREE.Color(0x7a5a3a);
        
        let currentColor;
        if (progress < 0.5) {
            currentColor = greenColor.clone().lerp(yellowColor, progress * 2);
        } else {
            currentColor = yellowColor.clone().lerp(brownColor, (progress - 0.5) * 2);
        }
        
        // Update stem
        this.stem.material.color.copy(currentColor);
        
        // Update branches and curl leaves
        this.branches.forEach((branch, i) => {
            branch.material.color.copy(currentColor);
        });
        
        this.leaves.forEach((leaf, i) => {
            leaf.material.color.copy(currentColor);
            
            // Curl leaves as they dry
            const curlAmount = progress * 0.5;
            leaf.rotation.x = curlAmount;
            leaf.scale.y = 1 - progress * 0.3; // Shrink
        });
        
        // Update pods - flatten and wrinkle
        this.pods.forEach(pod => {
            pod.children[0].material.color.copy(currentColor);
            pod.scale.y = 1 - progress * 0.4; // Flatten
        });
    }
    
    // ==========================================
    // DESI AMRELI CHANA
    // ==========================================
    createDesiChana() {
        const chanaGroup = new THREE.Group();
        chanaGroup.name = 'desi-chana';
        
        // Irregular, angular shape (bread-like, compressed cushion)
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const positions = geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            let x = positions.getX(i);
            let y = positions.getY(i);
            let z = positions.getZ(i);
            
            // Compress to make it less round
            y *= 0.7;
            
            // Add angular irregularity
            const angle = Math.atan2(z, x);
            const irregularity = Math.sin(angle * 4) * 0.03 + Math.cos(angle * 6) * 0.02;
            x *= 1 + irregularity;
            z *= 1 + irregularity;
            
            // Add surface texture/wrinkles
            const wrinkle = Math.sin(x * 15) * Math.cos(z * 15) * 0.015;
            const len = Math.sqrt(x * x + y * y + z * z);
            const scale = (len + wrinkle) / len;
            
            positions.setX(i, x * scale);
            positions.setY(i, y * scale);
            positions.setZ(i, z * scale);
        }
        geometry.computeVertexNormals();
        
        // Desi chana material - earthy brown with speckles
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x6B4423,
            roughness: 0.85,
            metalness: 0,
            clearcoat: 0.05,
            clearcoatRoughness: 0.9
        });
        
        // Add subtle SSS effect
        material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Add slight warm brown subsurface effect
                diffuseColor.rgb += vec3(0.1, 0.05, 0.02) * 0.3;
                `
            );
        };
        
        this.desiChana = new THREE.Mesh(geometry, material);
        this.desiChana.castShadow = true;
        
        // Add characteristic "beak" ridge
        const beakGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.15, 8);
        const beakMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a3a1a,
            roughness: 0.9
        });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(0.2, 0, 0);
        beak.rotation.z = Math.PI / 2;
        this.desiChana.add(beak);
        
        // Add speckling (darker spots)
        for (let i = 0; i < 15; i++) {
            const speckle = new THREE.Mesh(
                new THREE.SphereGeometry(0.015, 4, 4),
                new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 })
            );
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 0.28;
            
            speckle.position.set(
                Math.sin(phi) * Math.cos(theta) * r,
                Math.cos(phi) * r * 0.7,
                Math.sin(phi) * Math.sin(theta) * r
            );
            
            this.desiChana.add(speckle);
        }
        
        chanaGroup.add(this.desiChana);
        
        // Position off-screen initially
        chanaGroup.position.set(0, 10, 0);
        chanaGroup.visible = false;
        
        this.desiChanaGroup = chanaGroup;
        this.group.add(chanaGroup);
    }
    
    // ==========================================
    // BRASS BOWL (PITAL)
    // ==========================================
    createBrassBowl() {
        const bowlGroup = new THREE.Group();
        bowlGroup.name = 'brass-bowl';
        
        // Bowl shape
        const points = [];
        for (let i = 0; i < 15; i++) {
            const t = i / 14;
            const r = 0.35 + Math.sin(t * Math.PI) * 0.45;
            points.push(new THREE.Vector2(r, t * 0.5));
        }
        
        const geometry = new THREE.LatheGeometry(points, 32);
        
        // Brass material
        const material = new THREE.MeshStandardMaterial({
            color: 0xB5A642,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const bowl = new THREE.Mesh(geometry, material);
        bowl.castShadow = true;
        bowl.receiveShadow = true;
        bowlGroup.add(bowl);
        
        // Decorative rim
        const rimGeometry = new THREE.TorusGeometry(0.55, 0.04, 8, 32);
        const rim = new THREE.Mesh(rimGeometry, material);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.5;
        bowlGroup.add(rim);
        
        // Inner decorative pattern
        const patternGeometry = new THREE.RingGeometry(0.3, 0.5, 32);
        const patternMaterial = new THREE.MeshStandardMaterial({
            color: 0x9A8642,
            roughness: 0.5,
            metalness: 0.7,
            side: THREE.DoubleSide
        });
        const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
        pattern.rotation.x = -Math.PI / 2;
        pattern.position.y = 0.05;
        bowlGroup.add(pattern);
        
        // Pre-create chickpeas in bowl
        this.chickpeasInBowl = [];
        for (let i = 0; i < 5; i++) {
            const chickpea = this.createSmallDesiChana();
            const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
            const r = 0.1 + Math.random() * 0.2;
            
            chickpea.position.set(
                Math.cos(angle) * r,
                0.12 + Math.random() * 0.1,
                Math.sin(angle) * r
            );
            chickpea.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.chickpeasInBowl.push(chickpea);
            bowlGroup.add(chickpea);
        }
        
        this.brassBowl = bowlGroup;
        this.brassBowl.position.set(2.5, -1.75, 3);
        this.brassBowl.visible = false;
        
        this.group.add(this.brassBowl);
    }
    
    createSmallDesiChana() {
        const geometry = new THREE.SphereGeometry(0.12, 16, 16);
        const positions = geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            let x = positions.getX(i);
            let y = positions.getY(i);
            let z = positions.getZ(i);
            
            y *= 0.7;
            const irregularity = Math.sin(Math.atan2(z, x) * 4) * 0.02;
            x *= 1 + irregularity;
            z *= 1 + irregularity;
            
            positions.setX(i, x);
            positions.setY(i, y);
            positions.setZ(i, z);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x6B4423,
            roughness: 0.85,
            metalness: 0
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    // ==========================================
    // HEAT HAZE EFFECT
    // ==========================================
    createHeatHaze() {
        const geometry = new THREE.PlaneGeometry(30, 10, 64, 32);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uIntensity;
                
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    
                    vec3 pos = position;
                    
                    // Wave distortion
                    float wave = sin(pos.x * 2.0 + uTime * 3.0) * 
                                 cos(pos.x * 3.0 + uTime * 2.0) * 
                                 uIntensity * 0.2;
                    pos.y += wave * (1.0 - uv.y);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uIntensity;
                varying vec2 vUv;
                
                void main() {
                    float alpha = (1.0 - vUv.y) * 0.1 * uIntensity;
                    gl_FragColor = vec4(1.0, 0.95, 0.9, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        this.heatHaze = new THREE.Mesh(geometry, material);
        this.heatHaze.position.set(0, 3, -5);
        this.heatHaze.visible = false;
        
        this.group.add(this.heatHaze);
    }
    
    // ==========================================
    // DUST PARTICLES
    // ==========================================
    createDustParticles() {
        const particleCount = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = Math.random() * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xD4A574) }
            },
            vertexShader: `
                uniform float uTime;
                
                varying float vAlpha;
                
                void main() {
                    vec3 pos = position;
                    pos.x += sin(uTime * 0.5 + position.z) * 0.5;
                    pos.y += sin(uTime * 0.3 + position.x * 0.5) * 0.3;
                    
                    vAlpha = 0.3 + sin(uTime + position.y) * 0.2;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = 3.0 * (100.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    gl_FragColor = vec4(uColor, (1.0 - dist * 2.0) * vAlpha);
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
    // POD SHATTER PARTICLES
    // ==========================================
    createShatterParticles() {
        if (this.shatterParticles) return;
        
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.05,
                (Math.random() - 0.5) * 0.1
            ));
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x7a5a3a,
            size: 0.05,
            transparent: true,
            opacity: 0.9
        });
        
        this.shatterParticles = new THREE.Points(geometry, material);
        this.shatterParticles.userData.velocities = velocities;
        this.shatterParticles.visible = false;
        this.shatterParticles.position.copy(this.pods[0].parent.position);
        this.shatterParticles.position.y += 1;
        
        this.group.add(this.shatterParticles);
    }
    
    animateShatter() {
        if (!this.shatterParticles || !this.shatterParticles.visible) return;
        
        const positions = this.shatterParticles.geometry.attributes.position;
        const velocities = this.shatterParticles.userData.velocities;
        
        for (let i = 0; i < positions.count; i++) {
            positions.setX(i, positions.getX(i) + velocities[i].x);
            positions.setY(i, positions.getY(i) + velocities[i].y);
            positions.setZ(i, positions.getZ(i) + velocities[i].z);
            
            // Gravity
            velocities[i].y -= 0.002;
        }
        
        positions.needsUpdate = true;
        
        // Fade out
        this.shatterParticles.material.opacity -= 0.01;
        if (this.shatterParticles.material.opacity <= 0) {
            this.shatterParticles.visible = false;
        }
    }
    
    // ==========================================
    // SCROLL-BASED UPDATE
    // ==========================================
    update(progress) {
        this.group.visible = true;
        
        if (progress < 0.3) {
            this.currentStep = 0; // Sunrise
            this.updateSunriseStep(progress / 0.3);
        } else if (progress < 0.65) {
            this.currentStep = 1; // Drying
            this.updateDryingStep((progress - 0.3) / 0.35);
        } else if (progress < 0.85) {
            this.currentStep = 2; // Reveal
            this.updateRevealStep((progress - 0.65) / 0.2);
        } else {
            this.currentStep = 3; // Bowl
            this.updateBowlStep((progress - 0.85) / 0.15);
        }
    }
    
    updateSunriseStep(progress) {
        this.sunriseProgress = progress;
        
        // Animate sun rising
        this.sunGroup.position.y = THREE.MathUtils.lerp(-10, 8, progress);
        
        // Update sky
        this.sky.material.uniforms.uSunriseProgress.value = progress;
        this.sky.material.uniforms.uSunPosition.value.y = this.sunGroup.position.y;
        
        // Show heat haze as sun rises
        this.heatHaze.visible = progress > 0.5;
        if (this.heatHaze.material.uniforms) {
            this.heatHaze.material.uniforms.uIntensity.value = Math.max(0, (progress - 0.5) * 2);
        }
        
        // Camera position
        this.camera.position.set(-5, 2, 12);
        this.camera.lookAt(0, 2, 0);
        
        // Hide elements
        this.brassBowl.visible = false;
        this.desiChanaGroup.visible = false;
    }
    
    updateDryingStep(progress) {
        // Update plant drying
        this.updateDrying(progress);
        
        // Heat haze at full intensity
        if (this.heatHaze.material.uniforms) {
            this.heatHaze.material.uniforms.uIntensity.value = 1;
        }
        
        // Camera slowly moves
        this.camera.position.set(
            THREE.MathUtils.lerp(-5, 0, progress),
            THREE.MathUtils.lerp(2, 1.5, progress),
            THREE.MathUtils.lerp(12, 8, progress)
        );
        this.camera.lookAt(0, 0.5, 0);
    }
    
    updateRevealStep(progress) {
        // Create shatter particles if not exists
        this.createShatterParticles();
        
        // Show shatter effect at start
        if (progress < 0.2) {
            this.shatterParticles.visible = true;
            this.shatterParticles.material.opacity = 1 - progress * 5;
        }
        
        // Hide drying pod
        if (this.pods.length > 0) {
            this.pods[0].visible = progress < 0.1;
        }
        
        // Show and animate hero desi chana
        this.desiChanaGroup.visible = true;
        this.desiChanaGroup.position.set(
            0,
            THREE.MathUtils.lerp(3, 0.5, progress),
            THREE.MathUtils.lerp(0, 2, progress)
        );
        
        // Camera focuses on chana
        this.camera.position.set(
            THREE.MathUtils.lerp(0, 2, progress),
            THREE.MathUtils.lerp(1.5, 0.5, progress),
            THREE.MathUtils.lerp(8, 4, progress)
        );
        this.camera.lookAt(this.desiChanaGroup.position);
        
        // Slow orbit rotation
        this.desiChana.rotation.y = progress * Math.PI * 2;
    }
    
    updateBowlStep(progress) {
        // Keep desi chana visible but move aside
        this.desiChanaGroup.position.x = THREE.MathUtils.lerp(0, -1, progress);
        
        // Show brass bowl
        this.brassBowl.visible = true;
        this.brassBowl.position.x = THREE.MathUtils.lerp(5, 2.5, progress);
        
        // Camera shows both
        this.camera.position.set(
            THREE.MathUtils.lerp(2, 3, progress),
            THREE.MathUtils.lerp(0.5, 0.8, progress),
            THREE.MathUtils.lerp(4, 5, progress)
        );
        this.camera.lookAt(1, -0.5, 2);
        
        // Bowl settles
        if (progress < 0.3) {
            this.brassBowl.rotation.z = Math.sin(progress * 30) * 0.02;
        } else {
            this.brassBowl.rotation.z = 0;
        }
    }
    
    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    animate(elapsedTime, delta) {
        // Sun material animation
        if (this.sunGroup && this.sunGroup.children[0].material.uniforms) {
            this.sunGroup.children[0].material.uniforms.uTime.value = elapsedTime;
        }
        
        // Heat haze
        if (this.heatHaze && this.heatHaze.visible) {
            this.heatHaze.material.uniforms.uTime.value = elapsedTime;
        }
        
        // Dust particles
        if (this.dustParticles) {
            this.dustParticles.material.uniforms.uTime.value = elapsedTime;
        }
        
        // Shatter animation
        this.animateShatter();
        
        // Desi chana subtle rotation
        if (this.desiChanaGroup && this.desiChanaGroup.visible && this.currentStep >= 2) {
            this.desiChana.rotation.y += delta * 0.2;
        }
        
        // Plant wind sway (reduced when dried)
        const swayAmount = 0.02 * (1 - this.dryingProgress * 0.8);
        this.branches.forEach((branch, i) => {
            branch.rotation.z = Math.sin(elapsedTime * 2 + i) * swayAmount;
        });
        
        // Bowl chickpeas subtle movement
        if (this.brassBowl && this.brassBowl.visible) {
            this.chickpeasInBowl.forEach((chick, i) => {
                chick.rotation.y += delta * 0.05;
            });
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
