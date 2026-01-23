/**
 * Heatmap Gradient System
 * Provides shader code generators for different gradient styles
 */

/**
 * Easing function generators
 * Transform heat value before color interpolation to reveal different value ranges
 */
const EASING_FUNCTIONS = {
  linear: 'h',  // No transformation
  easeIn: 'h * h',  // Quadratic ease-in (emphasizes high values)
  easeOut: '1.0 - (1.0 - h) * (1.0 - h)',  // Quadratic ease-out (emphasizes low values)
  easeInOut: 'smoothstep(0.0, 1.0, h)',  // S-curve (balanced)
  easeInCubic: 'h * h * h',  // Cubic ease-in (stronger emphasis on high values)
  easeOutCubic: '1.0 - pow(1.0 - h, 3.0)',  // Cubic ease-out (stronger emphasis on low values)
  exponential: 'h * h * h * h'  // Strong exponential (very subtle low values)
};

/**
 * Generate smooth gradient shader code
 * Continuous color interpolation from cold to hot
 * @param {string} easing - Easing function name (default: 'linear')
 */
export function generateSmoothGradient(easing = 'linear') {
  const easingFunc = EASING_FUNCTIONS[easing as keyof typeof EASING_FUNCTIONS] || EASING_FUNCTIONS.linear;
  
  return {
    name: easing === 'linear' ? 'smooth' : `smooth-${easing}`,
    easing,
    shaderCode: `
      vec3 heatColor(float h){
        // Apply easing curve to heat value
        h = ${easingFunc};
        
        if(h < 0.2) return mix(vec3(0.2,0.2,0.2), vec3(0.3,0.2,0.4), h/0.2);
        else if(h < 0.4) return mix(vec3(0.3,0.2,0.4), vec3(0.0,0.0,1.0), (h-0.2)/0.2);
        else if(h < 0.6) return mix(vec3(0.0,0.0,1.0), vec3(0.0,1.0,1.0), (h-0.4)/0.2);
        else if(h < 0.8) return mix(vec3(0.0,1.0,1.0), vec3(0.8,0.6,1.0), (h-0.6)/0.2);
        else return mix(vec3(0.8,0.6,1.0), vec3(1.0,0.4,0.8), (h-0.8)/0.2);
      }
    `
  };
}

/**
 * Generate stepped gradient shader code
 * Discrete color bands with sharp transitions
 * @param {number} steps - Number of discrete levels (default: 6)
 * @param {boolean} outlined - Add white borders between steps
 */
export function generateSteppedGradient(steps = 6, outlined = false) {
  
  let shaderCode = `
    vec3 heatColor(float h){
      // Quantize heat value to discrete steps
      float step = floor(h * ${steps.toFixed(1)}) / ${steps.toFixed(1)};
      ${outlined ? `
      // Add white outline at step boundaries
      float stepFrac = fract(h * ${steps.toFixed(1)});
      if (stepFrac < 0.05 || stepFrac > 0.95) {
        return vec3(1.0, 1.0, 1.0); // White border
      }
      ` : ''}
      
      // Color interpolation based on quantized step
      if(step < 0.2) return mix(vec3(0.2,0.2,0.2), vec3(0.3,0.2,0.4), step/0.2);
      else if(step < 0.4) return mix(vec3(0.3,0.2,0.4), vec3(0.0,0.0,1.0), (step-0.2)/0.2);
      else if(step < 0.6) return mix(vec3(0.0,0.0,1.0), vec3(0.0,1.0,1.0), (step-0.4)/0.2);
      else if(step < 0.8) return mix(vec3(0.0,1.0,1.0), vec3(0.8,0.6,1.0), (step-0.6)/0.2);
      else return mix(vec3(0.8,0.6,1.0), vec3(1.0,0.4,0.8), (step-0.8)/0.2);
    }
  `;
  
  return {
    name: outlined ? 'stepped-outlined' : 'stepped',
    steps,
    shaderCode
  };
}

/**
 * Generate monochrome gradient shader code
 * Single color hue, varying intensity/brightness
 * @param {string} colorName - 'red', 'blue', 'green', 'purple', 'orange'
 * @param {string} easing - Easing function name (default: 'linear')
 */
export function generateMonochromeGradient(colorName = 'red', easing = 'linear') {
  const colorMap = {
    red: 'vec3(1.0, 0.0, 0.0)',
    blue: 'vec3(0.0, 0.3, 1.0)',
    green: 'vec3(0.0, 1.0, 0.3)',
    purple: 'vec3(0.7, 0.0, 1.0)',
    orange: 'vec3(1.0, 0.5, 0.0)',
    yellow: 'vec3(1.0, 1.0, 0.0)',
    cyan: 'vec3(0.0, 1.0, 1.0)'
  } as const;
  
  const baseColor = colorMap[colorName as keyof typeof colorMap] || colorMap.red;
  const easingFunc = EASING_FUNCTIONS[easing as keyof typeof EASING_FUNCTIONS] || EASING_FUNCTIONS.linear;
  
  const shaderCode = `
    vec3 heatColor(float h){
      // Apply easing curve
      h = ${easingFunc};
      
      // Dark to bright in single hue
      vec3 cold = vec3(0.1, 0.1, 0.1);
      vec3 hot = ${baseColor};
      return mix(cold, hot, h);
    }
  `;
  
  return {
    name: easing === 'linear' ? `monochrome-${colorName}` : `monochrome-${colorName}-${easing}`,
    easing,
    shaderCode
  };
}

/**
 * Generate stepped monochrome gradient shader code
 * Single color hue with discrete intensity bands
 * @param {string} colorName - 'red', 'blue', 'green', 'purple', 'orange'
 * @param {number} steps - Number of discrete levels (default: 6)
 * @param {boolean} outlined - Add white borders between steps
 */
export function generateSteppedMonochromeGradient(colorName = 'red', steps = 6, outlined = false) {
  const colorMap = {
    red: 'vec3(1.0, 0.0, 0.0)',
    blue: 'vec3(0.0, 0.3, 1.0)',
    green: 'vec3(0.0, 1.0, 0.3)',
    purple: 'vec3(0.7, 0.0, 1.0)',
    orange: 'vec3(1.0, 0.5, 0.0)',
    yellow: 'vec3(1.0, 1.0, 0.0)',
    cyan: 'vec3(0.0, 1.0, 1.0)'
  };
  
  const baseColor = colorMap[colorName as keyof typeof colorMap] || colorMap.red;
  
  const shaderCode = `
    vec3 heatColor(float h){
      // Quantize heat value to discrete steps
      float step = floor(h * ${steps.toFixed(1)}) / ${steps.toFixed(1)};
      ${outlined ? `
      // Add white outline at step boundaries
      float stepFrac = fract(h * ${steps.toFixed(1)});
      if (stepFrac < 0.05 || stepFrac > 0.95) {
        return vec3(1.0, 1.0, 1.0); // White border
      }
      ` : ''}
      
      // Monochrome interpolation based on quantized step
      vec3 cold = vec3(0.1, 0.1, 0.1);
      vec3 hot = ${baseColor};
      return mix(cold, hot, step);
    }
  `;
  
  return {
    name: `stepped-monochrome-${colorName}${outlined ? '-outlined' : ''}`,
    steps,
    shaderCode
  };
}

/**
 * Generate classic thermal gradient (black-red-yellow-white)
 * Traditional heat visualization style
 */
export function generateThermalGradient() {
  const shaderCode = `
    vec3 heatColor(float h){
      if(h < 0.33) return mix(vec3(0.0,0.0,0.0), vec3(1.0,0.0,0.0), h/0.33);      // Black to Red
      else if(h < 0.66) return mix(vec3(1.0,0.0,0.0), vec3(1.0,1.0,0.0), (h-0.33)/0.33); // Red to Yellow
      else return mix(vec3(1.0,1.0,0.0), vec3(1.0,1.0,1.0), (h-0.66)/0.34);       // Yellow to White
    }
  `;
  
  return {
    name: 'thermal',
    shaderCode
  };
}

/**
 * Gradient preset library
 */
export const GRADIENT_PRESETS = {
  // Linear smooth gradients
  smooth: generateSmoothGradient('linear'),
  
  // Eased smooth gradients (reveal low values better)
  smoothEaseOut: generateSmoothGradient('easeOut'),
  smoothEaseIn: generateSmoothGradient('easeIn'),
  smoothEaseInOut: generateSmoothGradient('easeInOut'),
  
  // Stepped gradients
  stepped: generateSteppedGradient(6, false),
  steppedOutlined: generateSteppedGradient(6, true),
  thermal: generateThermalGradient(),
  
  // Linear monochrome gradients
  monochromeRed: generateMonochromeGradient('red', 'linear'),
  monochromeBlue: generateMonochromeGradient('blue', 'linear'),
  monochromeGreen: generateMonochromeGradient('green', 'linear'),
  monochromePurple: generateMonochromeGradient('purple', 'linear'),
  monochromeOrange: generateMonochromeGradient('orange', 'linear'),
  
  // Eased monochrome gradients (reveal low values better)
  monochromeRedEaseOut: generateMonochromeGradient('red', 'easeOut'),
  monochromeBlueEaseOut: generateMonochromeGradient('blue', 'easeOut'),
  monochromeGreenEaseOut: generateMonochromeGradient('green', 'easeOut'),
  monochromePurpleEaseOut: generateMonochromeGradient('purple', 'easeOut'),
  monochromeOrangeEaseOut: generateMonochromeGradient('orange', 'easeOut'),
  
  // Stepped monochrome gradients
  steppedMonochromeRed: generateSteppedMonochromeGradient('red', 6, false),
  steppedMonochromeBlue: generateSteppedMonochromeGradient('blue', 6, false),
  steppedMonochromeGreen: generateSteppedMonochromeGradient('green', 6, false),
  steppedMonochromePurple: generateSteppedMonochromeGradient('purple', 6, false),
  steppedMonochromeOrange: generateSteppedMonochromeGradient('orange', 6, false),
  
  // Stepped monochrome gradients with outlines
  steppedMonochromeRedOutlined: generateSteppedMonochromeGradient('red', 6, true),
  steppedMonochromeBlueOutlined: generateSteppedMonochromeGradient('blue', 6, true),
  steppedMonochromeGreenOutlined: generateSteppedMonochromeGradient('green', 6, true),
  steppedMonochromePurpleOutlined: generateSteppedMonochromeGradient('purple', 6, true),
  steppedMonochromeOrangeOutlined: generateSteppedMonochromeGradient('orange', 6, true)
};

/**
 * Get gradient shader code by name
 * @param {string} gradientName - Name from GRADIENT_PRESETS
 * @returns {string} GLSL shader code for heatColor function
 */
export function getGradientShaderCode(gradientName = 'smooth') {
  const preset = GRADIENT_PRESETS[gradientName as keyof typeof GRADIENT_PRESETS];
  if (!preset) {
    return GRADIENT_PRESETS.smooth.shaderCode;
  }
  return preset.shaderCode;
}

/**
 * Get list of available gradient names for UI
 */
export function getAvailableGradients() {
  return Object.keys(GRADIENT_PRESETS);
}
