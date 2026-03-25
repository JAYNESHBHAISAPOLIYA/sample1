# 🌱 Chickpea Revolution

An immersive, scroll-driven 3D experience celebrating Indian chickpeas (chana) — built with Three.js, GSAP, and WebGL.

![Chickpea Revolution](https://img.shields.io/badge/Three.js-r160-blue) ![GSAP](https://img.shields.io/badge/GSAP-3.12-green) ![Tailwind](https://img.shields.io/badge/Tailwind-3.0-cyan)

## ✨ Features

- **Scene 1 - The Awakening**: Cinematic pod crack-open animation with green chickpea reveal
- **Scene 2 - Choose Your Chana**: Interactive 3D plant selector with three varieties
- **Scene 3A - Green Journey**: Watering → Growth → Harvest flow with particle effects
- **Scene 3B - Desi Journey**: Sunrise → Drying → Reveal with dramatic lighting
- **Scene 4 - The Field**: Panoramic chickpea field with wind animation

## 🎨 Visual Effects

- God rays and volumetric lighting
- Procedural wind animation for plants
- Water particle systems with refraction
- Heat haze shimmer effect
- Golden hour sky gradients
- Custom cursor that's a rotating chickpea

## 🛠 Tech Stack

- **Three.js (r160)** - 3D rendering engine
- **GSAP + ScrollTrigger** - Scroll-driven animations
- **Lenis** - Smooth scrolling
- **Tailwind CSS** - UI styling
- **Custom GLSL Shaders** - Wind, water splat, dry transition, god rays

## 📁 Project Structure

```
/
├── index.html          # Main HTML with Tailwind config
├── style.css           # Custom styles and animations
├── main.js             # App orchestrator and Three.js setup
├── scenes/
│   ├── scene1-pod.js       # Hero pod animation
│   ├── scene2-selector.js  # Plant variant selector
│   ├── scene3a-green.js    # Green chickpea journey
│   ├── scene3b-desi.js     # Desi chickpea journey
│   └── scene4-field.js     # Field panorama
├── shaders/
│   ├── wind.vert           # Vegetation wind animation
│   ├── waterSplat.frag     # Wet soil spreading effect
│   ├── dryTransition.frag  # Plant drying color transition
│   └── godRay.frag         # Volumetric light rays
├── textures/           # PBR texture maps (optional)
└── models/             # GLB models (optional, using procedural)
```

## 🚀 Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chickpea-revolution.git
cd chickpea-revolution
```

2. Serve with any static server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Open `http://localhost:8000` in your browser

### Requirements

- Modern browser with WebGL 2.0 support
- ES6 module support
- Recommended: Chrome, Firefox, or Edge (latest)

## 🎭 Interaction Flow

1. **Land** → Watch the pod crack open and reveal a green chickpea
2. **Scroll** → Camera pulls back to reveal the field
3. **Select** → Click on one of three chickpea plant variants
4. **Journey** → Experience the immersive growth/drying animation
5. **Cart** → Add the product with celebration confetti
6. **Scroll** → Continue to the panoramic field view

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Deep Soil Brown | `#3B1F0A` | Backgrounds, earth |
| Chickpea Cream | `#E8D5A3` | Text, highlights |
| Fresh Green | `#4A7C3F` | Plants, green chana |
| Golden Sun | `#F5A623` | Lighting, accents |
| Clay Terracotta | `#C1622F` | Props, desi theme |

## 📱 Performance

- **Mobile**: Reduced particle counts (70%), disabled post-processing
- **LOD**: Distance-based detail switching for plants
- **Instancing**: Efficient rendering for field plants
- **Frustum Culling**: Only render visible objects

## 🌾 Credits

- Inspired by Apple/corn product reveal experiences
- Indian chana farm aesthetic
- Typography: Cormorant Garamond, DM Sans

## 📄 License

MIT License - Feel free to use for your own projects!

---

**From Gujarat's soil to your kitchen.** 🌿