// shaders/heatmapShaders.js
import * as THREE from 'three';
import { getGradientShaderCode } from './heatmapGradients';

export function createHeatmapComputeMaterial(textureSize: number, agentRadius: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      prevHeat: { value: null },
      vertexPos: { value: null },
      agentsPos: { value: null },
      numAgents: { value: 0 },
      radius: { value: agentRadius },
      playing: { value: true },
      speedFactor: { value: 1.0 }, // Normalize accumulation by speed
    },
    vertexShader: `void main(){gl_Position=vec4(position,1.0);}`,
    fragmentShader: `
      precision highp float;
      uniform sampler2D prevHeat;
      uniform sampler2D vertexPos;
      uniform vec3 agentsPos[32];
      uniform int numAgents;
      uniform float radius;
      uniform bool playing;
      uniform float speedFactor;

      void main(){
        vec2 uv = gl_FragCoord.xy / vec2(${textureSize}.0);
        vec3 pos = texture2D(vertexPos, uv).xyz;
        float heat = texture2D(prevHeat, uv).r;

        if(playing){
          for(int i=0;i<32;i++){
            if(i>=numAgents) break;
            vec3 d = pos - agentsPos[i];
            float d2 = dot(d,d);
            float influence = max(0.0,1.0 - d2/(radius*radius));
            // Divide accumulation by speed factor to normalize across playback speeds
            heat += influence / speedFactor;
          }
        }

        gl_FragColor = vec4(heat,0.0,0.0,1.0);
      }
    `,
  });
}

export function createHeatmapDisplayMaterial(
  heatTexture: THREE.Texture,
  maxHeat: number,
  useTransparency = true,
  minHeat = 0.0,
  gradientStyle = 'smooth'
): THREE.ShaderMaterial {
  // Get gradient shader code
  const gradientShaderCode = getGradientShaderCode(gradientStyle);
  
  return new THREE.ShaderMaterial({
    uniforms: {
      heatTex: { value: heatTexture },
      maxHeat: { value: maxHeat },
      minHeat: { value: minHeat },
      useTransparency: { value: useTransparency },
    },
    transparent: useTransparency,
    depthWrite: true, // Keep depth writes enabled for performance
    alphaTest: useTransparency ? 0.01 : 0, // Discard fully transparent pixels instead of blending
    vertexShader: `
      attribute vec2 heatUV;
      varying float vHeat;
      uniform sampler2D heatTex;
      void main(){
        vHeat = texture2D(heatTex, heatUV).r;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying float vHeat;
      uniform float maxHeat;
      uniform float minHeat;
      uniform bool useTransparency;

      ${gradientShaderCode}

      void main(){
        // Remap heat to range [minHeat, maxHeat], then clamp to [0, 1]
        float h = clamp((vHeat - minHeat) / (maxHeat - minHeat), 0.0, 1.0);
        vec3 col = heatColor(h);
        // Make 0 heat fully transparent, gradually increase opacity with heat
        float alpha = useTransparency ? h : 1.0;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}