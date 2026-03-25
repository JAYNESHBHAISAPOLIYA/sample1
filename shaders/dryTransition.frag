// Dry Transition Fragment Shader
// Animates color transition from green to brown for plant drying effect

precision highp float;

uniform float uDryProgress;
uniform float uTime;
uniform vec3 uGreenColor;
uniform vec3 uYellowColor;
uniform vec3 uBrownColor;
uniform sampler2D uBaseTexture;
uniform sampler2D uNormalMap;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Noise for organic transition
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

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

void main() {
    // Sample base texture
    vec4 baseColor = texture2D(uBaseTexture, vUv);
    
    // Create organic transition pattern
    float transitionNoise = fbm(vUv * 5.0 + vec2(uTime * 0.1, 0.0));
    
    // Adjust dry progress with noise for non-uniform drying
    float localDryProgress = uDryProgress + (transitionNoise - 0.5) * 0.3;
    localDryProgress = clamp(localDryProgress, 0.0, 1.0);
    
    // Color transition: green -> yellow -> brown
    vec3 currentColor;
    if (localDryProgress < 0.5) {
        // Green to yellow
        float t = localDryProgress * 2.0;
        currentColor = mix(uGreenColor, uYellowColor, t);
    } else {
        // Yellow to brown
        float t = (localDryProgress - 0.5) * 2.0;
        currentColor = mix(uYellowColor, uBrownColor, t);
    }
    
    // Apply base texture color variation
    currentColor *= baseColor.rgb;
    
    // Darken edges more as they dry (curling leaf effect)
    float edgeDarken = smoothstep(0.0, 0.3, min(vUv.x, min(vUv.y, min(1.0 - vUv.x, 1.0 - vUv.y))));
    currentColor *= mix(0.7, 1.0, edgeDarken + (1.0 - localDryProgress) * 0.3);
    
    // Add speckles/spots as plant dries
    float speckle = step(0.95, noise(vUv * 50.0)) * localDryProgress;
    currentColor = mix(currentColor, uBrownColor * 0.5, speckle);
    
    // Roughness increases as plant dries
    float roughness = mix(0.6, 0.95, localDryProgress);
    
    // Subtle shimmer for fresh leaves
    float shimmer = (1.0 - localDryProgress) * pow(max(0.0, dot(vNormal, vec3(0.3, 1.0, 0.3))), 8.0) * 0.2;
    currentColor += vec3(shimmer);
    
    // Wilting effect - darken bottom areas
    float wiltDarken = smoothstep(0.0, 0.5, vPosition.y);
    currentColor *= mix(0.8, 1.0, wiltDarken * (1.0 - localDryProgress * 0.5));
    
    gl_FragColor = vec4(currentColor, 1.0);
}
