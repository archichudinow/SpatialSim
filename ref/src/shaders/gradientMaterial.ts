/**
 * Gradient Material
 * Simple shader material with optional vertical gradient
 * Much faster than MeshLambertMaterial with custom gradient effects
 */
import * as THREE from 'three';

/**
 * Create a gradient shader material
 * @param {number} baseColor - Base color (hex) for bottom of gradient or solid color
 * @param {number} opacity - Opacity value (0.0 to 1.0) when not using gradient
 * @param {boolean} flatShading - Enable flat shading (currently unused)
 * @param {boolean} useGradient - Use vertical gradient instead of transparency
 * @param {number} topColor - Optional top color for gradient (hex). If not provided, calculated from baseColor
 * @returns {THREE.ShaderMaterial}
 */
export function createGradientMaterial(
  baseColor = 0x333333, 
  opacity = 0.2, 
  _flatShading = true, 
  useGradient = false,
  topColor?: number
) {
  // Convert hex color to vec3
  const threeColor = new THREE.Color(baseColor);
  
  // Use provided top color or calculate lighter color for gradient
  const lighterColor = topColor !== undefined 
    ? new THREE.Color(topColor)
    : new THREE.Color(
        Math.min(threeColor.r + 0.2, 1.0),
        Math.min(threeColor.g + 0.2, 1.0),
        Math.min(threeColor.b + 0.2, 1.0)
      );
  
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Vector3(threeColor.r, threeColor.g, threeColor.b) },
      lighterColor: { value: new THREE.Vector3(lighterColor.r, lighterColor.g, lighterColor.b) },
      opacity: { value: opacity },
      useGradient: { value: useGradient }
    },
    transparent: !useGradient,  // No transparency when using gradient
    depthWrite: true,
    side: THREE.DoubleSide,  // Render both front and back faces to prevent disappearing
    

    
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      
      void main() {
        // Transform normal to view space for simple lighting
        vNormal = normalize(normalMatrix * normal);
        
        // Calculate view space position
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        // World position for gradient
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 lighterColor;
      uniform float opacity;
      uniform bool useGradient;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      
      void main() {
        // Calculate color with gradient if enabled
        vec3 finalColor = baseColor;
        if (useGradient) {
          // Vertical gradient based on Y position (-50 to +180 meter range)
          // Adjust these values to match your model's actual Y bounds
          float gradientFactor = clamp((vWorldPosition.y + 50.0) / 180.0, 0.0, 1.0);
          finalColor = mix(baseColor, lighterColor, gradientFactor);
        }
        
        // No lighting - just pure gradient color
        float alpha = useGradient ? 1.0 : opacity;
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
  });
}
