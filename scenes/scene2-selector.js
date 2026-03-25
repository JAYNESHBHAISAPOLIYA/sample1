/**
 * SCENE 2: CHOOSE YOUR CHANA
 * Product selector with 3 chickpea plant variants
 */

import * as THREE from 'three';

export class Scene2Selector {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.group = new THREE.Group();
        this.group.name = 'scene2-selector';
        
        this.plants = [];
        this.selectedPlant = null;
        this.ground = null;
        this.sky = null;
        
        // Wind shader time
        this.windTime = 0;
    }
    
    async init() {
        this.createGround();
        this.createSky();
        this.createPlants();
        this.createAtmosphere();
        
        // Start hidden
        this.group.visible = false;
        this.scene.add(this.group);
        
        return Promise.resolve();
    }
    
    // ==========================================
    // GROUND - INDIAN FARM SOIL
    // ==========================================
    createGround() {
        // Large ground plane with cracked dry soil texture
        const geometry = new THREE.PlaneGeometry(100, 100, 64, 64);
        geometry.rotateX(-Math.PI / 2);
        
        // Displace vertices for uneven terrain
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            
            // Create gentle undulation
            const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.3 +
                          Math.sin(x * 0.3 + z * 0.2) * 0.1;
            
            positions.setY(i, height);
        }
        geometry.computeVertexNormals();
        
        // Soil material
        const material = new THREE.MeshStandardMaterial({
            color: 0x5D4037,
            roughness: 0.95,
            metalness: 0,
            flatShading: false
        });
        
        // Add procedural cracks using shader
        material.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            
            shader.vertexShader = `
                varying vec2 vWorldUv;
                varying vec3 vWorldPos;
                ${shader.vertexShader}
            `.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vWorldUv = uv * 20.0;
                vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                `
            );
            
            shader.fragmentShader = `
                varying vec2 vWorldUv;
                varying vec3 vWorldPos;
                
                // Simple noise function
                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }
                
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    
                    float a = hash(i);
                    float b = hash(i + vec2(1.0, 0.0));
                    float c = hash(i + vec2(0.0, 1.0));
                    float d = hash(i + vec2(1.0, 1.0));
                    
                    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                }
                
                float crackPattern(vec2 uv) {
                    float n = noise(uv * 3.0) * 0.5 + noise(uv * 6.0) * 0.25 + noise(uv * 12.0) * 0.125;
                    return smoothstep(0.4, 0.5, n);
                }
                
                ${shader.fragmentShader}
            `.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Add crack darkening
                float crack = crackPattern(vWorldUv);
                diffuseColor.rgb *= mix(0.6, 1.0, crack);
                
                // Add color variation
                float colorNoise = noise(vWorldUv * 0.5);
                diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.9, 0.85, 0.8), colorNoise * 0.3);
                `
            );
            
            this.groundShader = shader;
        };
        
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.receiveShadow = true;
        this.ground.position.y = -2;
        
        this.group.add(this.ground);
    }
    
    // ==========================================
    // SKY - GOLDEN HOUR GRADIENT
    // ==========================================
    createSky() {
        // Gradient sky dome
        const geometry = new THREE.SphereGeometry(50, 32, 32);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTopColor: { value: new THREE.Color(0x1a0a00) },
                uBottomColor: { value: new THREE.Color(0xF5A623) },
                uHorizonColor: { value: new THREE.Color(0xff7b00) },
                uSunPosition: { value: new THREE.Vector3(-10, 2, -20) }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    vPosition = position;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uTopColor;
                uniform vec3 uBottomColor;
                uniform vec3 uHorizonColor;
                uniform vec3 uSunPosition;
                
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    // Vertical gradient
                    float h = normalize(vPosition).y;
                    
                    vec3 color;
                    if (h > 0.0) {
                        // Sky (above horizon)
                        color = mix(uHorizonColor, uTopColor, pow(h, 0.5));
                    } else {
                        // Below horizon
                        color = mix(uHorizonColor, uBottomColor, pow(-h, 0.3));
                    }
                    
                    // Sun glow
                    vec3 sunDir = normalize(uSunPosition);
                    vec3 viewDir = normalize(vPosition);
                    float sunDot = dot(viewDir, sunDir);
                    float sunGlow = pow(max(0.0, sunDot), 32.0);
                    color += vec3(1.0, 0.8, 0.4) * sunGlow * 0.5;
                    
                    // Horizon haze
                    float horizonHaze = 1.0 - abs(h);
                    horizonHaze = pow(horizonHaze, 3.0);
                    color = mix(color, uHorizonColor, horizonHaze * 0.3);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false
        });
        
        this.sky = new THREE.Mesh(geometry, material);
        this.group.add(this.sky);
        
        // Add sun sphere
        this.createSun();
    }
    
    createSun() {
        // Glowing sun
        const geometry = new THREE.SphereGeometry(3, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFAA33
        });
        
        this.sun = new THREE.Mesh(geometry, material);
        this.sun.position.set(-15, 3, -30);
        
        // Sun glow
        const glowGeometry = new THREE.SphereGeometry(5, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(0xF5A623) }
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
                varying vec3 vNormal;
                
                void main() {
                    float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(uColor, intensity * 0.5);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sun.add(glow);
        
        this.group.add(this.sun);
    }
    
    // ==========================================
    // CHICKPEA PLANTS
    // ==========================================
    createPlants() {
        const plantPositions = [
            { x: -4, variant: 'green', label: 'Lila Chana' },
            { x: 0, variant: 'kabuli', label: 'Kabuli' },
            { x: 4, variant: 'desi', label: 'Desi Amreli' }
        ];
        
        plantPositions.forEach(config => {
            const plant = this.createSinglePlant(config.variant);
            plant.position.set(config.x, -2, 0);
            plant.userData.variant = config.variant;
            plant.userData.label = config.label;
            
            // Add floating label
            this.createPlantLabel(plant, config.label);
            
            this.plants.push(plant);
            this.group.add(plant);
        });
    }
    
    createSinglePlant(variant) {
        const plantGroup = new THREE.Group();
        plantGroup.name = `plant-${variant}`;
        
        // Color schemes for different variants
        const colors = {
            green: { stem: 0x4A7C3F, leaf: 0x5a9c4f, pod: 0x4A7C3F },
            kabuli: { stem: 0x5a8c5a, leaf: 0x6aac6a, pod: 0x7abc7a },
            desi: { stem: 0x7a6a5a, leaf: 0x8a7a6a, pod: 0x9a8a7a }
        };
        
        const colorScheme = colors[variant] || colors.green;
        
        // Main stem
        const stemGeometry = new THREE.CylinderGeometry(0.03, 0.05, 2, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: colorScheme.stem,
            roughness: 0.8
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1;
        stem.castShadow = true;
        plantGroup.add(stem);
        
        // Branches with leaves and pods
        const branchCount = 5 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < branchCount; i++) {
            const branch = this.createBranch(colorScheme, variant);
            const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.3;
            const height = 0.5 + (i / branchCount) * 1.5;
            
            branch.position.set(
                Math.cos(angle) * 0.1,
                height,
                Math.sin(angle) * 0.1
            );
            branch.rotation.z = (Math.random() - 0.5) * 0.3 + Math.cos(angle) * 0.5;
            branch.rotation.y = angle;
            
            plantGroup.add(branch);
        }
        
        // Apply wind shader
        this.applyWindShader(plantGroup, variant);
        
        return plantGroup;
    }
    
    createBranch(colorScheme, variant) {
        const branchGroup = new THREE.Group();
        
        // Branch stem
        const branchGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.8, 6);
        const branchMaterial = new THREE.MeshStandardMaterial({
            color: colorScheme.stem,
            roughness: 0.8
        });
        
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        branch.position.y = 0.4;
        branch.rotation.z = 0.3;
        branchGroup.add(branch);
        
        // Compound leaves (chickpea has pinnate leaves)
        const leafCount = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < leafCount; i++) {
            const leaf = this.createLeaf(colorScheme.leaf);
            const t = i / leafCount;
            
            leaf.position.set(
                t * 0.6 + 0.1,
                0.3 + t * 0.3,
                (i % 2 === 0 ? 0.1 : -0.1)
            );
            leaf.rotation.z = (i % 2 === 0 ? 0.3 : -0.3);
            leaf.scale.setScalar(0.5 + t * 0.3);
            
            branchGroup.add(leaf);
        }
        
        // Pods
        if (Math.random() > 0.3) {
            const pod = this.createPod(colorScheme.pod, variant);
            pod.position.set(0.5, 0.5, 0);
            pod.rotation.z = Math.PI / 4;
            branchGroup.add(pod);
        }
        
        return branchGroup;
    }
    
    createLeaf(color) {
        // Simple oval leaf shape
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.05, 0.05, 0, 0.15);
        shape.quadraticCurveTo(-0.05, 0.05, 0, 0);
        
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            side: THREE.DoubleSide,
            roughness: 0.6
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    createPod(color, variant) {
        // Chickpea pod - small fuzzy oval
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        
        // Deform to pod shape
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            
            positions.setX(i, x * 1.5);
            positions.setY(i, y * 0.8);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.85,
            metalness: 0
        });
        
        const pod = new THREE.Mesh(geometry, material);
        pod.castShadow = true;
        
        // Add bump for chickpea inside
        const bump = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            material.clone()
        );
        bump.position.y = 0.05;
        pod.add(bump);
        
        return pod;
    }
    
    applyWindShader(plantGroup, variant) {
        // Store original positions for wind animation
        plantGroup.traverse(child => {
            if (child.isMesh) {
                child.userData.originalPosition = child.position.clone();
                child.userData.windOffset = Math.random() * Math.PI * 2;
                child.userData.windStrength = 0.02 + Math.random() * 0.02;
            }
        });
    }
    
    createPlantLabel(plant, text) {
        // Create floating label above plant
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '24px "Cormorant Garamond", serif';
        context.fillStyle = '#E8D5A3';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });
        
        const geometry = new THREE.PlaneGeometry(2, 0.5);
        const label = new THREE.Mesh(geometry, material);
        label.position.y = 3;
        
        plant.add(label);
        plant.userData.label3D = label;
    }
    
    // ==========================================
    // ATMOSPHERE EFFECTS
    // ==========================================
    createAtmosphere() {
        // Ground dust particles
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = Math.random() * 5 - 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
            sizes[i] = Math.random() * 0.05 + 0.01;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xF5A623) }
            },
            vertexShader: `
                attribute float size;
                uniform float uTime;
                
                varying float vAlpha;
                
                void main() {
                    vec3 pos = position;
                    pos.x += sin(uTime * 0.5 + position.z * 0.1) * 0.5;
                    pos.y += sin(uTime * 0.3 + position.x * 0.1) * 0.2;
                    
                    vAlpha = 0.3 + sin(uTime + position.x) * 0.2;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (200.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = (1.0 - dist * 2.0) * vAlpha;
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
    // PLANT SELECTION
    // ==========================================
    highlightPlant(variant) {
        this.plants.forEach(plant => {
            if (plant.userData.variant === variant) {
                this.selectedPlant = plant;
                
                // Glow effect
                gsap.to(plant.scale, {
                    x: 1.1,
                    y: 1.1,
                    z: 1.1,
                    duration: 0.5,
                    ease: 'power2.out'
                });
                
                // Brighten
                plant.traverse(child => {
                    if (child.material) {
                        gsap.to(child.material, {
                            emissiveIntensity: 0.3,
                            duration: 0.5
                        });
                    }
                });
            } else {
                // Dim other plants
                gsap.to(plant.scale, {
                    x: 0.9,
                    y: 0.9,
                    z: 0.9,
                    duration: 0.5
                });
                
                plant.traverse(child => {
                    if (child.material && child.material.opacity !== undefined) {
                        gsap.to(child.material, {
                            opacity: 0.5,
                            duration: 0.5
                        });
                    }
                });
            }
        });
    }
    
    // ==========================================
    // SCROLL-BASED UPDATE
    // ==========================================
    update(progress) {
        // Show this scene
        this.group.visible = true;
        
        // Camera movement - pull back to reveal field
        const cameraZ = THREE.MathUtils.lerp(10, 15, progress);
        const cameraY = THREE.MathUtils.lerp(0, 3, progress);
        
        this.camera.position.z = cameraZ;
        this.camera.position.y = cameraY;
        this.camera.lookAt(0, 0, 0);
        
        // Fade in plants
        const plantOpacity = Math.min(1, progress * 2);
        this.plants.forEach((plant, i) => {
            plant.traverse(child => {
                if (child.material) {
                    if (child.material.opacity !== undefined) {
                        child.material.transparent = true;
                        child.material.opacity = plantOpacity;
                    }
                }
            });
        });
    }
    
    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    animate(elapsedTime, delta) {
        this.windTime = elapsedTime;
        
        // Update dust particles
        if (this.dustParticles) {
            this.dustParticles.material.uniforms.uTime.value = elapsedTime;
        }
        
        // Animate plants with wind
        this.plants.forEach((plant, plantIndex) => {
            plant.traverse(child => {
                if (child.userData.originalPosition) {
                    const wind = Math.sin(elapsedTime * 2 + child.userData.windOffset + plantIndex) * 
                                child.userData.windStrength;
                    
                    child.position.x = child.userData.originalPosition.x + wind;
                    child.rotation.z = wind * 2;
                }
            });
            
            // Float labels
            if (plant.userData.label3D) {
                plant.userData.label3D.position.y = 3 + Math.sin(elapsedTime + plantIndex) * 0.1;
                plant.userData.label3D.lookAt(this.camera.position);
            }
        });
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
