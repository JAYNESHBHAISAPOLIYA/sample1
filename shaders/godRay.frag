// God Ray Fragment Shader
// Creates volumetric light rays effect

precision highp float;

uniform float uTime;
uniform vec3 uLightColor;
uniform float uIntensity;
uniform float uDecay;
uniform int uSamples;
uniform vec2 uLightPosition;
uniform sampler2D uSceneTexture;

varying vec2 vUv;

// Noise for ray variation
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float n = i.x + i.y * 57.0;
    return mix(
        mix(hash(n), hash(n + 1.0), f.x),
        mix(hash(n + 57.0), hash(n + 58.0), f.x),
        f.y
    );
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    
    return value;
}

void main() {
    vec2 texCoord = vUv;
    
    // Direction from current pixel to light source
    vec2 deltaTexCoord = texCoord - uLightPosition;
    deltaTexCoord *= 1.0 / float(uSamples);
    
    // Initial color from scene
    vec4 color = texture2D(uSceneTexture, texCoord);
    float illuminationDecay = 1.0;
    
    // Ray marching
    vec2 sampleCoord = texCoord;
    
    for (int i = 0; i < 64; i++) {
        if (i >= uSamples) break;
        
        sampleCoord -= deltaTexCoord;
        
        // Sample scene at this point
        vec4 sampleColor = texture2D(uSceneTexture, sampleCoord);
        
        // Add noise variation to rays
        float noiseValue = fbm(sampleCoord * 10.0 + vec2(uTime * 0.5, 0.0));
        float rayVariation = 0.8 + noiseValue * 0.4;
        
        // Accumulate light with decay
        sampleColor *= illuminationDecay * uIntensity * rayVariation;
        color += sampleColor;
        
        // Decay the illumination
        illuminationDecay *= uDecay;
    }
    
    // Add light color tint
    color.rgb = mix(color.rgb, uLightColor, 0.3);
    
    // Radial falloff from light position
    float dist = length(vUv - uLightPosition);
    float radialFalloff = 1.0 - smoothstep(0.0, 1.0, dist);
    
    // Angular variation for ray appearance
    float angle = atan(vUv.y - uLightPosition.y, vUv.x - uLightPosition.x);
    float rays = sin(angle * 8.0 + uTime) * 0.5 + 0.5;
    rays = mix(0.7, 1.0, rays);
    
    color.rgb *= radialFalloff * rays;
    
    // Preserve alpha
    color.a = 1.0;
    
    gl_FragColor = color;
}
