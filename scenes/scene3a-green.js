/**
 * SCENE 3A: GREEN CHICKPEA JOURNEY
 * Watering → Growth → Harvest flow for fresh green chana
 */

import * as THREE from 'three';

export class Scene3Green {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.group = new THREE.Group();
        this.group.name = 'scene3-green';
        
        this.plant = null;
        this.matka = null;
        this.bowl = null;
        this.waterParticles = null;
        this.wetDecal = null;
        
        this.growthProgress = 0;
        this.currentStep = 0; // 0: watering, 1: growth, 2: harvest, 3: bowl
    }
    
    async init() {
        this.createGround();
        this.createMatka();
        this.createPlant();
        this.createBowl();
        this.createWaterParticles();
        this.createPollenParticles();
        this.createBees();
        
        // Start hidden
        this.group.visible = false;
        this.scene.add(this.group);
        
        return Promise.resolve();
    }
    
    // ==========================================
    // GROUND WITH WET DECAL
    // ==========================================
    createGround() {
        const geometry = new THREE.PlaneGeometry(30, 30, 64, 64);
        geometry.rotateX(-Math.PI / 2);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x5D4037,
            roughness: 0.95,
            metalness: 0
        });
        
        // Shader for wet soil effect
        material.onBeforeCompile = (shader) => {
            shader.uniforms.uWetness = { value: 0 };
            shader.uniforms.uWetCenter = { value: new THREE.Vector2(0, 0) };
            shader.uniforms.uWetRadius = { value: 0 };
            
            shader.fragmentShader = `
                uniform float uWetness;
                uniform vec2 uWetCenter;
                uniform float uWetRadius;
                
                ${shader.fragmentShader}
            `.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Wet soil effect
                vec2 groundPos = vViewPosition.xz;
                float distFromCenter = length(groundPos - uWetCenter);
                float wetFactor = 1.0 - smoothstep(0.0, uWetRadius, distFromCenter);
                wetFactor *= uWetness;
                
                // Darken and add slight shine when wet
                diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.5, wetFactor);
                `
            );
            
            this.groundShader = shader;
        };
        
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.position.y = -2;
        this.ground.receiveShadow = true;
        this.group.add(this.ground);
    }
    
    // ==========================================
    // TERRACOTTA JAR (MATKA)
    // ==========================================
    createMatka() {
        const matkaGroup = new THREE.Group();
        matkaGroup.name = 'matka';
        
        // Create matka shape using lathe geometry
        const points = [];
        for (let i = 0; i < 20; i++) {
            const t = i / 19;
            // Classic matka profile
            let r;
            if (t < 0.1) {
                r = 0.3; // Bottom
            } else if (t < 0.5) {
                r = 0.3 + Math.sin((t - 0.1) / 0.4 * Math.PI / 2) * 0.5; // Bulge
            } else if (t < 0.8) {
                r = 0.8 - (t - 0.5) / 0.3 * 0.4; // Neck
            } else {
                r = 0.4 + (t - 0.8) / 0.2 * 0.1; // Rim
            }
            
            points.push(new THREE.Vector2(r, t * 1.5));
        }
        
        const geometry = new THREE.LatheGeometry(points, 32);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xC1622F,
            roughness: 0.9,
            metalness: 0
        });
        
        this.matka = new THREE.Mesh(geometry, material);
        this.matka.castShadow = true;
        
        // Add texture variation
        const noiseGeometry = new THREE.SphereGeometry(0.02, 4, 4);
        const noiseMaterial = new THREE.MeshStandardMaterial({
            color: 0xa85020,
            roughness: 1
        });
        
        for (let i = 0; i < 30; i++) {
            const noise = new THREE.Mesh(noiseGeometry, noiseMaterial);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.6 + 0.2;
            const r = 0.5 + Math.random() * 0.3;
            
            noise.position.set(
                Math.sin(phi) * Math.cos(theta) * r,
                phi / Math.PI * 1.5,
                Math.sin(phi) * Math.sin(theta) * r
            );
            
            this.matka.add(noise);
        }
        
        matkaGroup.add(this.matka);
        
        // Position above plant
        matkaGroup.position.set(0, 4, 0);
        matkaGroup.rotation.z = 0; // Will be animated to tip
        
        this.matkaGroup = matkaGroup;
        this.group.add(matkaGroup);
    }
    
    // ==========================================
    // GROWING PLANT
    // ==========================================
    createPlant() {
        this.plantGroup = new THREE.Group();
        this.plantGroup.name = 'growing-plant';
        
        // Will be populated during growth animation
        this.stem = null;
        this.branches = [];
        this.leaves = [];
        this.pods = [];
        
        this.plantGroup.position.y = -2;
        this.plantGroup.scale.set(0, 0, 0); // Start invisible
        
        this.group.add(this.plantGroup);
    }
    
    growPlant(progress) {
        // Animated growth based on progress (0-1)
        this.growthProgress = progress;
        
        // Scale up
        const scale = Math.min(1, progress * 1.2);
        this.plantGroup.scale.setScalar(scale);
        
        if (progress > 0 && !this.stem) {
            this.createGrowingStem();
        }
        
        if (progress > 0.2 && this.branches.length === 0) {
            this.createGrowingBranches();
        }
        
        if (progress > 0.4) {
            this.updateLeaves(progress);
        }
        
        if (progress > 0.7) {
            this.updatePods(progress);
        }
    }
    
    createGrowingStem() {
        const geometry = new THREE.CylinderGeometry(0.03, 0.06, 2, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4A7C3F,
            roughness: 0.8
        });
        
        this.stem = new THREE.Mesh(geometry, material);
        this.stem.position.y = 1;
        this.stem.castShadow = true;
        this.plantGroup.add(this.stem);
    }
    
    createGrowingBranches() {
        const branchCount = 6;
        
        for (let i = 0; i < branchCount; i++) {
            const branchGroup = new THREE.Group();
            
            const branchGeom = new THREE.CylinderGeometry(0.015, 0.025, 0.6, 6);
            const branchMat = new THREE.MeshStandardMaterial({
                color: 0x4A7C3F,
                roughness: 0.8
            });
            
            const branch = new THREE.Mesh(branchGeom, branchMat);
            branch.rotation.z = Math.PI / 4;
            branch.position.y = 0.3;
            
            branchGroup.add(branch);
            
            const angle = (i / branchCount) * Math.PI * 2;
            const height = 0.5 + (i / branchCount) * 1.3;
            
            branchGroup.position.set(
                Math.cos(angle) * 0.1,
                height,
                Math.sin(angle) * 0.1
            );
            branchGroup.rotation.y = angle;
            
            this.branches.push(branchGroup);
            this.plantGroup.add(branchGroup);
            
            // Add leaf positions for this branch
            this.createBranchLeaves(branchGroup, i);
        }
    }
    
    createBranchLeaves(branchGroup, branchIndex) {
        const leafCount = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < leafCount; i++) {
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.quadraticCurveTo(0.04, 0.04, 0, 0.12);
            shape.quadraticCurveTo(-0.04, 0.04, 0, 0);
            
            const geometry = new THREE.ShapeGeometry(shape);
            const material = new THREE.MeshStandardMaterial({
                color: 0x5a9c4f,
                side: THREE.DoubleSide,
                roughness: 0.6
            });
            
            const leaf = new THREE.Mesh(geometry, material);
            
            const t = i / leafCount;
            leaf.position.set(
                t * 0.5 + 0.1,
                0.2 + t * 0.3,
                (i % 2 === 0 ? 0.08 : -0.08)
            );
            leaf.rotation.z = (i % 2 === 0 ? 0.3 : -0.3);
            leaf.scale.setScalar(0); // Start invisible
            
            leaf.userData.targetScale = 0.4 + t * 0.3;
            leaf.userData.growStart = 0.4 + branchIndex * 0.05 + i * 0.02;
            
            this.leaves.push(leaf);
            branchGroup.add(leaf);
        }
        
        // Add pod to some branches
        if (Math.random() > 0.4) {
            const podGroup = this.createHarvestablePod();
            podGroup.position.set(0.4, 0.4, 0);
            podGroup.rotation.z = Math.PI / 4;
            podGroup.scale.setScalar(0);
            podGroup.userData.growStart = 0.7 + branchIndex * 0.03;
            
            this.pods.push(podGroup);
            branchGroup.add(podGroup);
        }
    }
    
    createHarvestablePod() {
        const podGroup = new THREE.Group();
        
        const geometry = new THREE.SphereGeometry(0.12, 16, 16);
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            positions.setX(i, positions.getX(i) * 1.4);
            positions.setY(i, positions.getY(i) * 0.9);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x4A7C3F,
            roughness: 0.8
        });
        
        const pod = new THREE.Mesh(geometry, material);
        pod.castShadow = true;
        podGroup.add(pod);
        
        // Bump
        const bump = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            material.clone()
        );
        bump.position.y = 0.04;
        pod.add(bump);
        
        return podGroup;
    }
    
    updateLeaves(progress) {
        this.leaves.forEach(leaf => {
            if (progress > leaf.userData.growStart) {
                const leafProgress = (progress - leaf.userData.growStart) / 0.3;
                const scale = Math.min(1, leafProgress) * leaf.userData.targetScale;
                leaf.scale.setScalar(scale);
            }
        });
    }
    
    updatePods(progress) {
        this.pods.forEach(pod => {
            if (progress > pod.userData.growStart) {
                const podProgress = (progress - pod.userData.growStart) / 0.3;
                const scale = Math.min(1, podProgress);
                pod.scale.setScalar(scale);
            }
        });
    }
    
    // ==========================================
    // CLAY BOWL
    // ==========================================
    createBowl() {
        const bowlGroup = new THREE.Group();
        bowlGroup.name = 'clay-bowl';
        
        // Bowl shape using lathe
        const points = [];
        for (let i = 0; i < 15; i++) {
            const t = i / 14;
            const r = 0.3 + Math.sin(t * Math.PI) * 0.5;
            points.push(new THREE.Vector2(r, t * 0.6));
        }
        
        const geometry = new THREE.LatheGeometry(points, 32);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xC1622F,
            roughness: 0.85,
            metalness: 0
        });
        
        const bowl = new THREE.Mesh(geometry, material);
        bowl.castShadow = true;
        bowl.receiveShadow = true;
        bowlGroup.add(bowl);
        
        // Add irregularity to rim
        const rimGeometry = new THREE.TorusGeometry(0.5, 0.03, 8, 32);
        const rim = new THREE.Mesh(rimGeometry, material);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.6;
        bowlGroup.add(rim);
        
        // Pre-create chickpeas in bowl
        this.chickpeasInBowl = [];
        for (let i = 0; i < 4; i++) {
            const chickpea = this.createGreenChickpea();
            const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.5;
            const r = 0.1 + Math.random() * 0.2;
            
            chickpea.position.set(
                Math.cos(angle) * r,
                0.15 + Math.random() * 0.1,
                Math.sin(angle) * r
            );
            chickpea.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            chickpea.scale.setScalar(0.8 + Math.random() * 0.2);
            
            this.chickpeasInBowl.push(chickpea);
            bowlGroup.add(chickpea);
        }
        
        this.bowl = bowlGroup;
        this.bowl.position.set(2, -1.7, 3);
        this.bowl.visible = false;
        
        this.group.add(this.bowl);
    }
    
    createGreenChickpea() {
        const geometry = new THREE.SphereGeometry(0.15, 32, 32);
        
        // Slight deformation
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            const noise = Math.sin(x * 8) * Math.cos(y * 8) * 0.015;
            const len = Math.sqrt(x * x + y * y + z * z);
            const scale = (len + noise) / len;
            
            positions.setX(i, x * scale);
            positions.setY(i, y * scale);
            positions.setZ(i, z * scale);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x5a9c4f,
            roughness: 0.35,
            metalness: 0,
            clearcoat: 0.2,
            clearcoatRoughness: 0.5
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    // ==========================================
    // WATER PARTICLES
    // ==========================================
    createWaterParticles() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 4;
            positions[i * 3 + 2] = 0;
            
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                -0.1 - Math.random() * 0.1,
                (Math.random() - 0.5) * 0.02
            ));
            
            sizes[i] = 0.03 + Math.random() * 0.02;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(0x4da6ff) },
                uOpacity: { value: 0.6 }
            },
            vertexShader: `
                attribute float size;
                varying float vAlpha;
                
                void main() {
                    vAlpha = 1.0 - (4.0 - position.y) / 6.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (200.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                varying float vAlpha;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = (1.0 - dist * 2.0) * vAlpha * uOpacity;
                    
                    // Refraction effect
                    vec3 color = uColor + vec3(0.2) * (1.0 - dist);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.waterParticles = new THREE.Points(geometry, material);
        this.waterParticles.userData.velocities = velocities;
        this.waterParticles.visible = false;
        
        this.group.add(this.waterParticles);
    }
    
    animateWater(active) {
        if (!this.waterParticles) return;
        
        this.waterParticles.visible = active;
        
        if (active) {
            const positions = this.waterParticles.geometry.attributes.position;
            const velocities = this.waterParticles.userData.velocities;
            
            for (let i = 0; i < positions.count; i++) {
                let y = positions.getY(i);
                
                // Apply velocity
                positions.setX(i, positions.getX(i) + velocities[i].x);
                positions.setY(i, y + velocities[i].y);
                positions.setZ(i, positions.getZ(i) + velocities[i].z);
                
                // Reset if below ground
                if (positions.getY(i) < -2) {
                    positions.setX(i, (Math.random() - 0.5) * 0.3);
                    positions.setY(i, 4);
                    positions.setZ(i, (Math.random() - 0.5) * 0.3);
                }
            }
            
            positions.needsUpdate = true;
        }
    }
    
    // ==========================================
    // POLLEN & BEE PARTICLES
    // ==========================================
    createPollenParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = Math.random() * 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xF5A623,
            size: 0.02,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        this.pollenParticles = new THREE.Points(geometry, material);
        this.pollenParticles.visible = false;
        this.group.add(this.pollenParticles);
    }
    
    createBees() {
        this.bees = [];
        
        for (let i = 0; i < 3; i++) {
            const beeGroup = new THREE.Group();
            
            // Simple bee body
            const body = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xFFCC00 })
            );
            body.scale.set(1.5, 1, 1);
            beeGroup.add(body);
            
            // Stripes
            const stripe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8),
                new THREE.MeshStandardMaterial({ color: 0x000000 })
            );
            stripe.rotation.z = Math.PI / 2;
            stripe.position.x = 0.02;
            beeGroup.add(stripe);
            
            // Wings
            const wing = new THREE.Mesh(
                new THREE.CircleGeometry(0.04, 8),
                new THREE.MeshBasicMaterial({ 
                    color: 0xffffff, 
                    transparent: true, 
                    opacity: 0.5,
                    side: THREE.DoubleSide 
                })
            );
            wing.position.set(0, 0.03, 0.02);
            wing.rotation.x = Math.PI / 4;
            beeGroup.add(wing);
            
            const wing2 = wing.clone();
            wing2.position.z = -0.02;
            beeGroup.add(wing2);
            
            beeGroup.position.set(
                (Math.random() - 0.5) * 3,
                1 + Math.random() * 2,
                (Math.random() - 0.5) * 3
            );
            
            beeGroup.userData.offset = Math.random() * Math.PI * 2;
            beeGroup.userData.speed = 1 + Math.random() * 0.5;
            beeGroup.userData.radius = 1 + Math.random();
            
            this.bees.push(beeGroup);
            beeGroup.visible = false;
            this.group.add(beeGroup);
        }
    }
    
    animateBees(elapsedTime, active) {
        this.bees.forEach(bee => {
            bee.visible = active;
            
            if (active) {
                const t = elapsedTime * bee.userData.speed + bee.userData.offset;
                const r = bee.userData.radius;
                
                bee.position.x = Math.cos(t) * r;
                bee.position.z = Math.sin(t) * r;
                bee.position.y = 1.5 + Math.sin(t * 3) * 0.3;
                
                bee.rotation.y = t + Math.PI / 2;
            }
        });
    }
    
    // ==========================================
    // SCROLL-BASED UPDATE
    // ==========================================
    update(progress) {
        this.group.visible = true;
        
        // Determine current step based on progress
        if (progress < 0.25) {
            this.currentStep = 0; // Watering
            this.updateWateringStep(progress / 0.25);
        } else if (progress < 0.6) {
            this.currentStep = 1; // Growth
            this.updateGrowthStep((progress - 0.25) / 0.35);
        } else if (progress < 0.85) {
            this.currentStep = 2; // Harvest
            this.updateHarvestStep((progress - 0.6) / 0.25);
        } else {
            this.currentStep = 3; // Bowl reveal
            this.updateBowlStep((progress - 0.85) / 0.15);
        }
    }
    
    updateWateringStep(progress) {
        // Tip the matka
        this.matkaGroup.rotation.z = progress * Math.PI / 3;
        this.matkaGroup.visible = true;
        
        // Animate water
        this.animateWater(progress > 0.3);
        
        // Update wet ground
        if (this.groundShader) {
            this.groundShader.uniforms.uWetness.value = Math.min(1, progress * 2);
            this.groundShader.uniforms.uWetRadius.value = progress * 3;
        }
        
        // Camera position
        this.camera.position.set(3, 2, 8);
        this.camera.lookAt(0, 0, 0);
        
        // Hide bowl
        this.bowl.visible = false;
        this.pollenParticles.visible = false;
    }
    
    updateGrowthStep(progress) {
        // Hide matka
        this.matkaGroup.visible = false;
        this.animateWater(false);
        
        // Grow the plant
        this.growPlant(progress);
        
        // Show pollen and bees in later growth
        this.pollenParticles.visible = progress > 0.5;
        
        // Camera pulls back
        const cameraZ = THREE.MathUtils.lerp(8, 10, progress);
        const cameraY = THREE.MathUtils.lerp(2, 1, progress);
        this.camera.position.set(3, cameraY, cameraZ);
        this.camera.lookAt(0, 0, 0);
    }
    
    updateHarvestStep(progress) {
        // Keep plant full grown
        this.growPlant(1);
        
        // Shake a pod
        if (this.pods.length > 0) {
            const shakePod = this.pods[0];
            shakePod.rotation.z = Math.PI / 4 + Math.sin(progress * 20) * 0.1 * (1 - progress);
        }
        
        // Bowl slides in
        this.bowl.visible = true;
        this.bowl.position.x = THREE.MathUtils.lerp(5, 2, progress);
        
        // Camera moves to side view
        this.camera.position.set(
            THREE.MathUtils.lerp(3, 4, progress),
            THREE.MathUtils.lerp(1, 1.5, progress),
            THREE.MathUtils.lerp(10, 7, progress)
        );
        this.camera.lookAt(1, 0, 1);
    }
    
    updateBowlStep(progress) {
        // Focus on bowl
        this.camera.position.set(
            THREE.MathUtils.lerp(4, 3, progress),
            THREE.MathUtils.lerp(1.5, 0.5, progress),
            THREE.MathUtils.lerp(7, 5, progress)
        );
        this.camera.lookAt(2, -1, 3);
        
        // Bowl jiggles
        if (progress < 0.3) {
            this.bowl.rotation.z = Math.sin(progress * 30) * 0.02;
        } else {
            this.bowl.rotation.z = 0;
        }
    }
    
    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    animate(elapsedTime, delta) {
        // Animate pollen floating
        if (this.pollenParticles && this.pollenParticles.visible) {
            const positions = this.pollenParticles.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const y = positions.getY(i);
                positions.setY(i, y + Math.sin(elapsedTime + i) * 0.002);
                positions.setX(i, positions.getX(i) + Math.cos(elapsedTime * 0.5 + i) * 0.001);
            }
            positions.needsUpdate = true;
        }
        
        // Animate bees
        this.animateBees(elapsedTime, this.currentStep === 1 && this.growthProgress > 0.5);
        
        // Water particles
        if (this.currentStep === 0) {
            this.animateWater(this.waterParticles.visible);
        }
        
        // Plant wind sway
        if (this.plantGroup.scale.x > 0) {
            this.branches.forEach((branch, i) => {
                branch.rotation.z = Math.sin(elapsedTime * 2 + i) * 0.03;
            });
        }
        
        // Chickpeas in bowl subtle movement
        if (this.bowl.visible && this.chickpeasInBowl) {
            this.chickpeasInBowl.forEach((chick, i) => {
                chick.rotation.y += delta * 0.1;
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
