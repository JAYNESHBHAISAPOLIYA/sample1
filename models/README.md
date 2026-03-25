# 3D Models Directory

This directory is for Blender-exported GLB models. The current implementation uses procedural geometry for all 3D objects.

## Recommended Models for Enhanced Visuals

### Organic Objects
- `chickpea-pod.glb` - Detailed chickpea pod with morph targets for opening animation
- `chickpea-green.glb` - Fresh green chickpea with SSS material
- `chickpea-desi.glb` - Desi Amreli chana with angular shape and surface detail
- `plant-green.glb` - Full chickpea plant with morph targets for growth
- `plant-dry.glb` - Dried plant variant with curled leaves

### Props
- `bowl-clay.glb` - Terracotta clay bowl (mitti ka bowl)
- `bowl-brass.glb` - Traditional brass bowl (pital)
- `matka-jar.glb` - Terracotta water jar

## Model Guidelines

1. **Poly Count**: 
   - Hero objects (chickpea closeup): 10-50K triangles
   - Background plants: 1-5K triangles
   - Props: 2-10K triangles

2. **Export Settings**:
   - Format: GLB (binary glTF)
   - Include: Draco compression
   - Materials: PBR metallic-roughness workflow
   - Animations: Embedded in GLB

3. **UV Mapping**:
   - Single UV set for all textures
   - 0-1 UV space, no overlapping

4. **Morph Targets** (for animations):
   - Pod opening: `open_0` to `open_100`
   - Plant growth: `growth_0` to `growth_100`
   - Leaf curl: `curl_0` to `curl_100`

## Creating Models in Blender

1. Create model with appropriate topology
2. Set up PBR materials
3. Add shape keys for animations
4. Export as GLB with Draco compression

## Loading Models in Three.js

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('/models/chickpea-pod.glb', (gltf) => {
    scene.add(gltf.scene);
});
```
