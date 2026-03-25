// Water Splat Fragment Shader
// Creates dynamic wet patch spreading effect on soil

precision highp float;

uniform float uTime;
uniform float uSplatProgress;
uniform vec2 uSplatCenter;
uniform float uSplatRadius;
uniform sampler2D uSoilTexture;
uniform sampler2D uSoilNormal;

varying vec2 vUv;
varying vec3 vWorldPosition;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    // Calculate distance from splat center
    vec2 worldPos = vWorldPosition.xz;
    float distFromCenter = length(worldPos - uSplatCenter);
    
    // Organic edge using noise
    float noiseValue = snoise(worldPos * 2.0) * 0.3;
    float adjustedRadius = uSplatRadius * uSplatProgress + noiseValue;
    
    // Wet factor with soft falloff
    float wetFactor = 1.0 - smoothstep(adjustedRadius * 0.7, adjustedRadius, distFromCenter);
    
    // Ripple effect at the edge
    float ripple = sin((distFromCenter - uTime * 2.0) * 10.0) * 0.5 + 0.5;
    float edgeFactor = smoothstep(adjustedRadius * 0.8, adjustedRadius, distFromCenter);
    wetFactor += ripple * edgeFactor * 0.2 * (1.0 - smoothstep(0.0, 0.5, uSplatProgress));
    
    // Sample base soil texture
    vec4 dryColor = texture2D(uSoilTexture, vUv);
    
    // Wet soil is darker and slightly more saturated
    vec3 wetColor = dryColor.rgb * 0.5;
    wetColor = mix(wetColor, wetColor * vec3(0.9, 0.85, 0.8), 0.3);
    
    // Blend based on wet factor
    vec3 finalColor = mix(dryColor.rgb, wetColor, wetFactor * uSplatProgress);
    
    // Add subtle specular highlight to wet area
    float specular = pow(max(0.0, dot(normalize(vec3(0.0, 1.0, 0.0)), normalize(vec3(0.3, 1.0, 0.3)))), 32.0);
    finalColor += vec3(0.1) * specular * wetFactor * uSplatProgress;
    
    // Roughness output (for PBR)
    float roughness = mix(0.95, 0.6, wetFactor * uSplatProgress);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
