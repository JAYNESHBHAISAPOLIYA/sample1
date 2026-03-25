# Textures Directory

This directory should contain the following texture files for the Chickpea Revolution website:

## Required Textures

### Soil Textures
- `soil-color.jpg` - Base color/albedo map for farm soil (2K recommended)
- `soil-normal.jpg` - Normal map for soil cracks and bumps
- `soil-rough.jpg` - Roughness map for soil surface variation

### Pod Textures  
- `pod-color.jpg` - Green pod surface with fuzzy texture
- `pod-normal.jpg` - Normal map for pod surface detail

### Chickpea Textures
- `chana-desi-color.jpg` - Desi chana brown/speckled surface
- `chana-desi-normal.jpg` - Normal map for desi chana wrinkles

### HDRI Environment
- `hdri-farm-golden.hdr` - 360° HDRI of golden hour farm field

## Texture Guidelines

1. **Resolution**: 1024x1024 minimum, 2048x2048 recommended
2. **Format**: JPG for color/roughness, PNG for normal maps with transparency
3. **Color Space**: 
   - Color maps: sRGB
   - Normal/Roughness: Linear

## Free Texture Sources

- [Poly Haven](https://polyhaven.com/) - Free PBR textures and HDRIs
- [ambientCG](https://ambientcg.com/) - CC0 PBR materials
- [Texture Ninja](https://texture.ninja/) - Free textures

## Procedural Alternative

The current implementation uses procedural shaders to generate textures at runtime.
Adding real textures will improve visual quality but is optional.
