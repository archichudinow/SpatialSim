/**
 * GLBExporter - Converts recorded frame data to GLB format
 * Mimics the structure of existing GLB files with position and lookAt animation tracks
 * References: three.js GLTFExporter and data_ref/glb.md structure
 */

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';

export class GLBExporter {
  /**
   * Export recording data to GLB format
   * @param {Object} recordingData - { metadata, frames, length, duration }
   * @returns {Promise<Blob>} GLB file blob
   */
  static async exportToGLB(recordingData) {
    if (!recordingData || recordingData.frames.length === 0) {
      throw new Error('No recording data to export');
    }

    const { metadata, frames, length } = recordingData;

    // Create minimal scene structure matching GLB format
    const scene = new THREE.Scene();
    scene.name = `${metadata.participant}_${metadata.scenario}`;
    scene.userData = {};

    // Create position node (gaze origin)
    const positionNode = new THREE.Object3D();
    positionNode.name = 'position';
    scene.add(positionNode);

    // Create lookAt node (gaze focus)
    const lookAtNode = new THREE.Object3D();
    lookAtNode.name = 'lookAt';
    scene.add(lookAtNode);

    // Create root metadata node
    const metadataNode = new THREE.Object3D();
    metadataNode.name = `agent_${metadata.participant}_${metadata.scenario}`;
    metadataNode.userData = {
      scenario: metadata.scenario,
      participant: metadata.participant,
      color: metadata.color,
      length: length,
    };
    scene.add(metadataNode);

    // Create animation tracks
    const times = [];
    const positions = [];
    const lookAts = [];

    frames.forEach((frame) => {
      times.push(frame.time);
      positions.push(frame.position.x, frame.position.y, frame.position.z);
      lookAts.push(frame.lookAt.x, frame.lookAt.y, frame.lookAt.z);
    });

    // Create position track animation
    const positionTrack = new THREE.VectorKeyframeTrack(
      'position.position',
      times,
      positions,
      THREE.InterpolateLinear
    );

    // Create lookAt track animation
    const lookAtTrack = new THREE.VectorKeyframeTrack(
      'lookAt.position',
      times,
      lookAts,
      THREE.InterpolateLinear
    );

    // Create animation clip
    const duration = frames[frames.length - 1].time;
    const animationClip = new THREE.AnimationClip('AgentMotion', duration, [
      positionTrack,
      lookAtTrack,
    ]);

    // Export scene with animation
    const exporter = new GLTFExporter();

    return new Promise((resolve, reject) => {
      const options = {
        animations: [animationClip],
        binary: true,
      };

      exporter.parse(
        scene,
        (glb) => {
          const blob = new Blob([glb], { type: 'application/octet-stream' });
          resolve(blob);
        },
        (error) => {
          reject(new Error(`GLB export failed: ${error.message}`));
        },
        options
      );
    });
  }

  /**
   * Download GLB file
   * @param {Blob} glbBlob - GLB file blob from exportToGLB
   * @param {Object} metadata - { participant, scenario }
   */
  static downloadGLB(glbBlob, metadata) {
    const filename = `${metadata.participant}_${metadata.scenario}.glb`;
    const url = URL.createObjectURL(glbBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Downloaded: ${filename}`);
  }

  /**
   * Validate recording data before export
   * @param {Object} recordingData
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateRecording(recordingData) {
    const errors = [];

    if (!recordingData) {
      errors.push('No recording data provided');
      return { valid: false, errors };
    }

    if (!recordingData.frames || recordingData.frames.length === 0) {
      errors.push('No frames recorded');
    } else if (recordingData.frames.length < 100) {
      errors.push(`Only ${recordingData.frames.length} frames (minimum 100 recommended)`);
    }

    if (!recordingData.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!recordingData.metadata.participant) errors.push('Missing participant ID');
      if (!recordingData.metadata.scenario) errors.push('Missing scenario');
      if (!recordingData.metadata.color) errors.push('Missing color');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default GLBExporter;
