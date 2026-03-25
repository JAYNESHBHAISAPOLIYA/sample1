/**
 * SCENE 4: THE FIELD
 * Wide aerial panorama of chickpea field with wind animation
 */

import * as THREE from 'three';

export class Scene4Field {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.group = new THREE.Group();
        this.group.name = 'scene4-field';
        
        this.plants = [];
        this.windTime = 0;
    }
    
    async init() {
        this.createTerrain();
        this.createSky();
        this.createSun();
        this.createField();
        this.createAtmosphere();
        
        // Start hidden
        this.group.visible = false;
        this.scene.add(this.group);
        
        return Promise.resolve();
    }
    
    // ==========================================
    // TERRAIN
    // ==========================================
    createTerrain() {
        const geometry = new THREE.PlaneGeometry(200, 200, 128, 128);
        geometry.rotateX(-Math.PI / 2);
        
        // Create gentle rolling hills
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            
            // Multiple frequency terrain
            let height = 0;
            height += Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3;
            height += Math.sin(x * 0.05 + z * 0.03) * 1.5;
            height += Math.sin(x * 0.1) * Math.sin(z * 0.08) * 0.5;
            
            positions.setY(i, height);
        }
        geometry.computeVertexNormals();
        
        // Rich soil material
        const material = new THREE.MeshStandardMaterial({
            color: 0x5D4037,
            roughness: 0.95,
            metalness: 0
        });
        
        // Add procedural variation
        material.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            
            shader.fragmentShader = `
                // Noise functions
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
                
                ${shader.fragmentShader}
            `.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Add soil color variation
                vec2 worldPos = vViewPosition.xz * 0.1;
                float n = noise(worldPos) * 0.5 + noise(worldPos * 3.0) * 0.25;
                
                vec3 soilDark = vec3(0.25, 0.15, 0.1);
                vec3 soilLight = vec3(0.45, 0.3, 0.2);
                diffuseColor.rgb = mix(soilDark, soilLight, n);
                `
            );
            
            this.terrainShader = shader;
        };
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.receiveShadow = true;
        this.group.add(this.terrain);
    }
    
    // ==========================================
    // GOLDEN HOUR SKY
    // ==========================================
    createSky() {
        const geometry = new THREE.SphereGeometry(150, 64, 64);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uSunPosition: { value: new THREE.Vector3(-30, 8, -80) },
                uTopColor: { value: new THREE.Color(0x1a0a00) },
                uHorizonColor: { value: new THREE.Color(0xff6b35) },
                uSunColor: { value: new THREE.Color(0xffaa33) }
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
                uniform vec3 uSunPosition;
                uniform vec3 uTopColor;
                uniform vec3 uHorizonColor;
                uniform vec3 uSunColor;
                
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    vec3 direction = normalize(vPosition);
                    float height = direction.y;
                    
                    // Base sky gradient
                    vec3 color;
                    if (height > 0.0) {
                        color = mix(uHorizonColor, uTopColor, pow(height, 0.4));
                    } else {
                        color = uHorizonColor;
                    }
                    
                    // Sun glow
                    vec3 sunDir = normalize(uSunPosition);
                    float sunAngle = dot(direction, sunDir);
                    
                    // Main sun disc
                    float sunDisc = smoothstep(0.995, 1.0, sunAngle);
                    color = mix(color, uSunColor, sunDisc);
                    
                    // Sun atmospheric glow
                    float sunGlow = pow(max(0.0, sunAngle), 8.0);
                    color += uSunColor * sunGlow * 0.3;
                    
                    // Horizon band
                    float horizonBand = 1.0 - abs(height);
                    horizonBand = pow(horizonBand, 6.0);
                    color += uHorizonColor * horizonBand * 0.2;
                    
                    // Subtle purple hue at top
                    if (height > 0.3) {
                        color = mix(color, color * vec3(0.9, 0.85, 1.0), (height - 0.3) * 0.3);
                    }
                    
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
    // SUN
    // ==========================================
    createSun() {
        const sunGroup = new THREE.Group();
        
        // Sun core
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFCC66
        });
        
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sunGroup.add(sun);
        
        // Glow layers
        for (let i = 0; i < 4; i++) {
            const glowGeometry = new THREE.SphereGeometry(7 + i * 3, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.1, 0.8, 0.6 - i * 0.1),
                transparent: true,
                opacity: 0.15 - i * 0.03,
                side: THREE.BackSide
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            sunGroup.add(glow);
        }
        
        sunGroup.position.set(-30, 8, -80);
        this.sun = sunGroup;
        this.group.add(sunGroup);
    }
    
    // ==========================================
    // CHICKPEA FIELD
    // ==========================================
    createField() {
        // Create instanced plants for performance
        const plantGeometry = this.createPlantGeometry();
        const plantMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A7C3F,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        
        // Apply wind shader to material
        plantMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uWindStrength = { value: 0.3 };
            
            shader.vertexShader = `
                uniform float uTime;
                uniform float uWindStrength;
                
                attribute vec3 instanceOffset;
                attribute float instanceScale;
                attribute float instancePhase;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                ${shader.vertexShader}
            `.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                
                // Apply instance transformation
                transformed *= instanceScale;
                transformed += instanceOffset;
                
                // Wind animation - wave pattern across field
                float windWave = sin(uTime * 2.0 + instanceOffset.x * 0.1 + instanceOffset.z * 0.1 + instancePhase);
                float heightFactor = (position.y + 1.0) * 0.5; // More movement at top
                
                transformed.x += windWave * uWindStrength * heightFactor;
                transformed.z += windWave * uWindStrength * 0.3 * heightFactor;
                
                vPosition = transformed;
                `
            );
            
            this.plantShader = shader;
        };
        
        // Create instances
        const rowCount = 25;
        const plantsPerRow = 30;
        const rowSpacing = 3;
        const plantSpacing = 2;
        
        const instanceCount = rowCount * plantsPerRow;
        const offsets = new Float32Array(instanceCount * 3);
        const scales = new Float32Array(instanceCount);
        const phases = new Float32Array(instanceCount);
        
        let idx = 0;
        for (let row = 0; row < rowCount; row++) {
            for (let col = 0; col < plantsPerRow; col++) {
                const x = (col - plantsPerRow / 2) * plantSpacing + (Math.random() - 0.5) * 1;
                const z = (row - rowCount / 2) * rowSpacing + (Math.random() - 0.5) * 1;
                
                // Get terrain height at this position
                const terrainHeight = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3 +
                                    Math.sin(x * 0.05 + z * 0.03) * 1.5;
                
                offsets[idx * 3] = x;
                offsets[idx * 3 + 1] = terrainHeight;
                offsets[idx * 3 + 2] = z;
                
                scales[idx] = 0.8 + Math.random() * 0.4;
                phases[idx] = Math.random() * Math.PI * 2;
                
                idx++;
            }
        }
        
        // Add instance attributes
        plantGeometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets, 3));
        plantGeometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(scales, 1));
        plantGeometry.setAttribute('instancePhase', new THREE.InstancedBufferAttribute(phases, 1));
        
        this.fieldMesh = new THREE.InstancedMesh(plantGeometry, plantMaterial, instanceCount);
        this.fieldMesh.castShadow = true;
        this.fieldMesh.receiveShadow = true;
        
        // Set identity matrix for each instance (actual transform is in shader)
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < instanceCount; i++) {
            this.fieldMesh.setMatrixAt(i, matrix);
        }
        
        this.group.add(this.fieldMesh);
        
        // Add some individual detail plants in foreground
        this.createForegroundPlants();
    }
    
    createPlantGeometry() {
        // Create a simple plant geometry that will be instanced
        const geometry = new THREE.BufferGeometry();
        
        const positions = [];
        const normals = [];
        const uvs = [];
        
        // Stem
        const stemHeight = 1.5;
        const stemRadius = 0.02;
        const stemSegments = 8;
        
        for (let i = 0; i < stemSegments; i++) {
            const angle = (i / stemSegments) * Math.PI * 2;
            const nextAngle = ((i + 1) / stemSegments) * Math.PI * 2;
            
            // Bottom triangle
            positions.push(
                Math.cos(angle) * stemRadius, 0, Math.sin(angle) * stemRadius,
                Math.cos(nextAngle) * stemRadius, 0, Math.sin(nextAngle) * stemRadius,
                Math.cos(angle) * stemRadius * 0.7, stemHeight, Math.sin(angle) * stemRadius * 0.7
            );
            
            // Top triangle
            positions.push(
                Math.cos(nextAngle) * stemRadius, 0, Math.sin(nextAngle) * stemRadius,
                Math.cos(nextAngle) * stemRadius * 0.7, stemHeight, Math.sin(nextAngle) * stemRadius * 0.7,
                Math.cos(angle) * stemRadius * 0.7, stemHeight, Math.sin(angle) * stemRadius * 0.7
            );
            
            // Simple normals pointing outward
            for (let j = 0; j < 6; j++) {
                normals.push(Math.cos(angle + nextAngle) / 2, 0, Math.sin(angle + nextAngle) / 2);
            }
            
            for (let j = 0; j < 6; j++) {
                uvs.push(i / stemSegments, j < 3 ? 0 : 1);
            }
        }
        
        // Add leaves as simple triangles
        const leafCount = 6;
        for (let i = 0; i < leafCount; i++) {
            const leafAngle = (i / leafCount) * Math.PI * 2 + Math.random() * 0.3;
            const leafHeight = 0.3 + (i / leafCount) * 1.0;
            const leafLength = 0.3 + Math.random() * 0.2;
            const leafWidth = 0.1;
            
            const lx = Math.cos(leafAngle);
            const lz = Math.sin(leafAngle);
            
            // Leaf triangle
            positions.push(
                lx * stemRadius, leafHeight, lz * stemRadius,
                lx * (stemRadius + leafLength), leafHeight + 0.1, lz * (stemRadius + leafLength),
                lx * stemRadius, leafHeight + leafWidth, lz * stemRadius
            );
            
            positions.push(
                lx * (stemRadius + leafLength), leafHeight + 0.1, lz * (stemRadius + leafLength),
                lx * (stemRadius + leafLength * 0.5), leafHeight + leafWidth + 0.05, lz * (stemRadius + leafLength * 0.5),
                lx * stemRadius, leafHeight + leafWidth, lz * stemRadius
            );
            
            for (let j = 0; j < 6; j++) {
                normals.push(0, 1, 0);
                uvs.push(0.5, 0.5);
            }
        }
        
        // Add a simple pod shape at top
        const podCenter = new THREE.Vector3(0.1, stemHeight - 0.2, 0);
        const podRadius = 0.08;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const nextAngle = ((i + 1) / 8) * Math.PI * 2;
            
            positions.push(
                podCenter.x, podCenter.y, podCenter.z,
                podCenter.x + Math.cos(angle) * podRadius, podCenter.y + Math.sin(angle) * podRadius * 0.6, podCenter.z + Math.sin(angle) * podRadius * 0.3,
                podCenter.x + Math.cos(nextAngle) * podRadius, podCenter.y + Math.sin(nextAngle) * podRadius * 0.6, podCenter.z + Math.sin(nextAngle) * podRadius * 0.3
            );
            
            normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
            uvs.push(0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    createForegroundPlants() {
        // Add a few detailed plants in the foreground
        const detailPlants = [];
        
        for (let i = 0; i < 5; i++) {
            const plant = this.createDetailPlant();
            plant.position.set(
                (i - 2) * 3 + (Math.random() - 0.5) * 2,
                0,
                8 + Math.random() * 2
            );
            plant.scale.setScalar(1.2 + Math.random() * 0.3);
            
            detailPlants.push(plant);
            this.group.add(plant);
        }
        
        this.detailPlants = detailPlants;
    }
    
    createDetailPlant() {
        const plantGroup = new THREE.Group();
        
        // Stem
        const stemGeometry = new THREE.CylinderGeometry(0.03, 0.05, 2, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A7C3F,
            roughness: 0.8
        });
        
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1;
        plantGroup.add(stem);
        
        // Branches
        for (let i = 0; i < 5; i++) {
            const branchGroup = new THREE.Group();
            
            const branchGeom = new THREE.CylinderGeometry(0.015, 0.02, 0.6, 6);
            const branch = new THREE.Mesh(branchGeom, stemMaterial);
            branch.rotation.z = Math.PI / 4;
            branch.position.y = 0.3;
            branchGroup.add(branch);
            
            // Leaves
            for (let j = 0; j < 4; j++) {
                const leafShape = new THREE.Shape();
                leafShape.moveTo(0, 0);
                leafShape.quadraticCurveTo(0.04, 0.04, 0, 0.1);
                leafShape.quadraticCurveTo(-0.04, 0.04, 0, 0);
                
                const leafGeom = new THREE.ShapeGeometry(leafShape);
                const leafMat = new THREE.MeshStandardMaterial({
                    color: 0x5a9c4f,
                    side: THREE.DoubleSide,
                    roughness: 0.6
                });
                
                const leaf = new THREE.Mesh(leafGeom, leafMat);
                leaf.position.set(j * 0.1 + 0.1, 0.15 + j * 0.06, (j % 2) * 0.1 - 0.05);
                leaf.rotation.z = (j % 2 ? 0.3 : -0.3);
                branchGroup.add(leaf);
            }
            
            // Pod
            if (i % 2 === 0) {
                const podGeom = new THREE.SphereGeometry(0.1, 8, 8);
                const podMat = new THREE.MeshStandardMaterial({ color: 0x4A7C3F, roughness: 0.8 });
                const pod = new THREE.Mesh(podGeom, podMat);
                pod.scale.set(1.3, 0.8, 1);
                pod.position.set(0.4, 0.35, 0);
                branchGroup.add(pod);
            }
            
            const angle = (i / 5) * Math.PI * 2;
            branchGroup.position.set(
                Math.cos(angle) * 0.1,
                0.5 + i * 0.25,
                Math.sin(angle) * 0.1
            );
            branchGroup.rotation.y = angle;
            
            plantGroup.add(branchGroup);
        }
        
        return plantGroup;
    }
    
    // ==========================================
    // ATMOSPHERE
    // ==========================================
    createAtmosphere() {
        // Golden dust particles
        const particleCount = 300;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            sizes[i] = Math.random() * 0.1 + 0.02;
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
                    pos.x += sin(uTime * 0.3 + position.z * 0.05) * 2.0;
                    pos.y += sin(uTime * 0.5 + position.x * 0.05) * 1.0;
                    
                    vAlpha = 0.4 + sin(uTime * 0.5 + position.x + position.z) * 0.2;
                    
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
                    
                    gl_FragColor = vec4(uColor, (1.0 - dist * 2.0) * vAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.dustParticles = new THREE.Points(geometry, material);
        this.group.add(this.dustParticles);
        
        // Light rays / god rays
        this.createGodRays();
    }
    
    createGodRays() {
        const rayGeometry = new THREE.ConeGeometry(30, 80, 32, 1, true);
        const rayMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xF5A623) }
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
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    float gradient = 1.0 - vUv.y;
                    float radial = 1.0 - abs(vUv.x - 0.5) * 2.0;
                    
                    // Animated noise
                    float noise = sin(vPosition.x * 0.5 + uTime) * cos(vPosition.z * 0.5 + uTime * 0.7);
                    noise = noise * 0.5 + 0.5;
                    
                    float alpha = gradient * radial * noise * 0.15;
                    
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.godRays = new THREE.Mesh(rayGeometry, rayMaterial);
        this.godRays.position.set(-30, 40, -50);
        this.godRays.rotation.x = Math.PI / 4;
        this.godRays.rotation.z = Math.PI / 6;
        
        this.group.add(this.godRays);
    }
    
    // ==========================================
    // SCROLL-BASED UPDATE
    // ==========================================
    update(progress) {
        this.group.visible = true;
        
        // Aerial camera animation
        const cameraHeight = THREE.MathUtils.lerp(15, 8, progress);
        const cameraZ = THREE.MathUtils.lerp(25, 15, progress);
        const cameraX = THREE.MathUtils.lerp(-5, 0, progress);
        
        this.camera.position.set(cameraX, cameraHeight, cameraZ);
        this.camera.lookAt(0, 0, -10);
        
        // Fade in effect
        const opacity = Math.min(1, progress * 2);
        
        // Update fog based on progress
        if (this.scene.fog) {
            this.scene.fog.density = 0.015 * (1 - progress * 0.5);
        }
    }
    
    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    animate(elapsedTime, delta) {
        this.windTime = elapsedTime;
        
        // Update plant wind shader
        if (this.plantShader) {
            this.plantShader.uniforms.uTime.value = elapsedTime;
        }
        
        // Update dust particles
        if (this.dustParticles) {
            this.dustParticles.material.uniforms.uTime.value = elapsedTime;
        }
        
        // Update god rays
        if (this.godRays) {
            this.godRays.material.uniforms.uTime.value = elapsedTime;
        }
        
        // Animate detail plants in foreground
        if (this.detailPlants) {
            this.detailPlants.forEach((plant, i) => {
                plant.rotation.z = Math.sin(elapsedTime * 2 + i) * 0.03;
                plant.children.forEach((child, j) => {
                    if (child.rotation) {
                        child.rotation.z += Math.sin(elapsedTime * 2 + i + j) * 0.001;
                    }
                });
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
