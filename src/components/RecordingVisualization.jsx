import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import recordingManager from '../utils/RecordingManager';

/**
 * RecordingVisualization - Renders position points and hit points during recording
 * Shows gaze origin (position) and gaze focus (lookAt) as visual markers
 */
export function RecordingVisualization({ showVisualization }) {
  const { scene } = useThree();
  const groupRef = useRef(null);
  const positionPointsRef = useRef(null);
  const lookAtPointsRef = useRef(null);
  const lineRef = useRef(null);
  const lastFrameCountRef = useRef(0);

  // Create visualization geometries
  useEffect(() => {
    if (!showVisualization) {
      // Hide visualization if disabled
      if (groupRef.current) {
        groupRef.current.visible = false;
      }
      return;
    }

    // Create group to hold visualization elements
    if (!groupRef.current) {
      groupRef.current = new THREE.Group();
      groupRef.current.name = 'recording-visualization';
      scene.add(groupRef.current);
    }

    groupRef.current.visible = true;

    // Create position points (gaze origin) - Blue spheres
    if (!positionPointsRef.current) {
      const positionGeometry = new THREE.BufferGeometry();
      const positionMaterial = new THREE.PointsMaterial({
        color: 0x3399ff,
        size: 0.05,
        sizeAttenuation: true,
      });
      positionPointsRef.current = new THREE.Points(positionGeometry, positionMaterial);
      positionPointsRef.current.name = 'position-points';
      groupRef.current.add(positionPointsRef.current);
    }

    // Create lookAt points (gaze focus) - Red spheres
    if (!lookAtPointsRef.current) {
      const lookAtGeometry = new THREE.BufferGeometry();
      const lookAtMaterial = new THREE.PointsMaterial({
        color: 0xff3366,
        size: 0.05,
        sizeAttenuation: true,
      });
      lookAtPointsRef.current = new THREE.Points(lookAtGeometry, lookAtMaterial);
      lookAtPointsRef.current.name = 'lookat-points';
      groupRef.current.add(lookAtPointsRef.current);
    }

    // Create line geometry for gaze direction
    if (!lineRef.current) {
      const lineGeometry = new THREE.BufferGeometry();
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffaa00,
        linewidth: 1,
        transparent: true,
        opacity: 0.3,
      });
      lineRef.current = new THREE.LineSegments(lineGeometry, lineMaterial);
      lineRef.current.name = 'gaze-lines';
      groupRef.current.add(lineRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (groupRef.current && scene.children.includes(groupRef.current)) {
        scene.remove(groupRef.current);
        groupRef.current = null;
      }
    };
  }, [showVisualization, scene]);

  // Update visualization with new frames
  useEffect(() => {
    if (!showVisualization || !groupRef.current) return;

    const updateVisualization = () => {
      const frames = recordingManager.getFrames();
      const currentFrameCount = frames.length;

      // Only update if new frames were added
      if (currentFrameCount === lastFrameCountRef.current) {
        return;
      }
      lastFrameCountRef.current = currentFrameCount;

      if (currentFrameCount === 0) {
        // Clear all geometries if no frames
        if (positionPointsRef.current?.geometry) {
          positionPointsRef.current.geometry.dispose();
          positionPointsRef.current.geometry = new THREE.BufferGeometry();
        }
        if (lookAtPointsRef.current?.geometry) {
          lookAtPointsRef.current.geometry.dispose();
          lookAtPointsRef.current.geometry = new THREE.BufferGeometry();
        }
        if (lineRef.current?.geometry) {
          lineRef.current.geometry.dispose();
          lineRef.current.geometry = new THREE.BufferGeometry();
        }
        return;
      }

      // Build position points array
      const positionArray = new Float32Array(currentFrameCount * 3);
      const lookAtArray = new Float32Array(currentFrameCount * 3);
      const lineArray = [];

      frames.forEach((frame, index) => {
        // Position points
        positionArray[index * 3] = frame.position.x;
        positionArray[index * 3 + 1] = frame.position.y;
        positionArray[index * 3 + 2] = frame.position.z;

        // LookAt points
        lookAtArray[index * 3] = frame.lookAt.x;
        lookAtArray[index * 3 + 1] = frame.lookAt.y;
        lookAtArray[index * 3 + 2] = frame.lookAt.z;

        // Gaze direction lines (from position to lookAt)
        lineArray.push(
          frame.position.x,
          frame.position.y,
          frame.position.z,
          frame.lookAt.x,
          frame.lookAt.y,
          frame.lookAt.z
        );
      });

      // Update position points
      if (positionPointsRef.current) {
        positionPointsRef.current.geometry.dispose();
        const positionGeometry = new THREE.BufferGeometry();
        positionGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
        positionPointsRef.current.geometry = positionGeometry;
      }

      // Update lookAt points
      if (lookAtPointsRef.current) {
        lookAtPointsRef.current.geometry.dispose();
        const lookAtGeometry = new THREE.BufferGeometry();
        lookAtGeometry.setAttribute('position', new THREE.BufferAttribute(lookAtArray, 3));
        lookAtPointsRef.current.geometry = lookAtGeometry;
      }

      // Update gaze direction lines
      if (lineRef.current && lineArray.length > 0) {
        lineRef.current.geometry.dispose();
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineArray), 3));
        lineRef.current.geometry = lineGeometry;
      }
    };

    const interval = setInterval(updateVisualization, 100); // Update every 100ms
    updateVisualization(); // Initial update

    return () => clearInterval(interval);
  }, [showVisualization]);

  return null; // Visualization is rendered directly in Three.js scene
}

export default RecordingVisualization;
