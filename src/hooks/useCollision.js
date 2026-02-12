import { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Shared collision detection hook
 * Provides raycasting utilities for ground detection and wall collision
 */
export function useCollision(modelRef, contextModelRef) {
  const raycasterRef = useRef(new THREE.Raycaster());
  const allMeshesRef = useRef([]);
  const meshCacheCompleteRef = useRef(false);

  // Configure raycaster for collision detection
  useEffect(() => {
    const raycaster = raycasterRef.current;
    raycaster.far = 10; // Only check nearby geometry
    raycaster.firstHitOnly = true; // BVH optimization
  }, []);

  // Cache all collision meshes
  useEffect(() => {
    const updateMeshCache = () => {
      if (meshCacheCompleteRef.current) return;

      const meshes = [];

      // Collect all meshes from both models
      [modelRef?.current, contextModelRef?.current].forEach(model => {
        if (model) {
          model.traverse((obj) => {
            if (obj.isMesh && obj.geometry) {
              // Ensure BVH is computed for fast raycasting
              if (!obj.geometry.boundsTree) {
                obj.geometry.computeBoundsTree();
              }
              meshes.push(obj);
            }
          });
        }
      });

      if (meshes.length > 0) {
        allMeshesRef.current = meshes;
        meshCacheCompleteRef.current = true;
      }
    };

    updateMeshCache();
    const interval = setInterval(() => {
      if (!meshCacheCompleteRef.current) updateMeshCache();
    }, 500);

    return () => clearInterval(interval);
  }, [modelRef, contextModelRef]);

  /**
   * Check ground height at a given XZ position
   * @param {number} x - X position
   * @param {number} z - Z position
   * @param {number} maxCheckHeight - Height to start raycast from
   * @returns {number|null} Ground Y position, or null if no ground found
   */
  const getGroundHeight = (x, z, maxCheckHeight = 50) => {
    if (!meshCacheCompleteRef.current || allMeshesRef.current.length === 0) {
      return null;
    }

    const raycaster = raycasterRef.current;
    raycaster.ray.origin.set(x, maxCheckHeight, z);
    raycaster.ray.direction.set(0, -1, 0);

    const intersects = raycaster.intersectObjects(allMeshesRef.current, false);
    
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    return null;
  };

  /**
   * Check if movement in a direction would collide with geometry
   * @param {THREE.Vector3} from - Start position
   * @param {THREE.Vector3} direction - Movement direction (normalized)
   * @param {number} distance - Distance to check
   * @returns {boolean} True if collision detected
   */
  const checkCollision = (from, direction, distance) => {
    if (!meshCacheCompleteRef.current || allMeshesRef.current.length === 0) {
      return false;
    }

    const raycaster = raycasterRef.current;
    raycaster.ray.origin.copy(from);
    raycaster.ray.direction.copy(direction).normalize();
    raycaster.far = distance;

    const intersects = raycaster.intersectObjects(allMeshesRef.current, false);
    
    return intersects.length > 0 && intersects[0].distance < distance;
  };

  /**
   * Wall collision check that allows ramps/slopes
   * @param {THREE.Vector3} currentPos - Current player position (eye level)
   * @param {THREE.Vector3} movement - Movement vector  
   * @returns {boolean} True if blocked by wall
   */
  const checkWallCollision = (currentPos, movement) => {
    if (!meshCacheCompleteRef.current || allMeshesRef.current.length === 0) {
      return false;
    }

    // Calculate destination position
    const destPos = currentPos.clone().add(movement);
    
    // Get ground heights at current and destination
    const currentGroundY = getGroundHeight(currentPos.x, currentPos.z);
    const destGroundY = getGroundHeight(destPos.x, destPos.z);
    
    // If we can measure both ground heights, check if it's a climbable slope
    if (currentGroundY !== null && destGroundY !== null) {
      const heightDiff = destGroundY - currentGroundY;
      
      // Allow movement if it's a walkable slope (up to 0.5m height difference)
      // This allows ramps and gentle slopes
      if (heightDiff <= 0.5 && heightDiff >= -1.0) {
        return false; // Path is clear - it's a ramp/slope
      }
      
      // If height difference is too large, it's a wall - block it
      if (heightDiff > 0.5) {
        return true; // Blocked by steep wall
      }
    }
    
    // Additional check: raycast at chest height to catch overhangs/ceilings
    const normalized = movement.clone().normalize();
    const chestOffset = -0.7; // 1.0m above ground
    const testPos = currentPos.clone().add(new THREE.Vector3(0, chestOffset, 0));
    
    if (checkCollision(testPos, normalized, 0.3)) {
      // Hit something at chest height - check if it's the same surface as ground
      // If ground heights were ok, this is likely just edge detection on ramp
      if (currentGroundY !== null && destGroundY !== null) {
        const heightDiff = destGroundY - currentGroundY;
        if (heightDiff <= 0.5 && heightDiff >= -1.0) {
          return false; // It's a ramp surface, allow movement
        }
      }
      return true; // Real wall/obstacle at chest height
    }
    
    return false; // Path is clear
  };

  return {
    getGroundHeight,
    checkCollision,
    checkWallCollision,
    isReady: meshCacheCompleteRef.current,
  };
}
