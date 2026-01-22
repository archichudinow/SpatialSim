/**
 * RecordingManager - Captures position and lookAt (hit point) data in real-time
 * Stores frames with timestamps for GLB export
 */

export class RecordingManager {
  constructor() {
    this.isRecording = false;
    this.frames = [];
    this.startTime = null;
    this.metadata = {
      participant: 'P1',
      scenario: 'S1',
      color: '#FF5733',
    };
  }

  /**
   * Initialize recording session
   * @param {Object} metadata - { participant, scenario, color }
   */
  startRecording(metadata = {}) {
    if (this.isRecording) {
      console.warn('Recording already in progress');
      return;
    }

    this.frames = [];
    this.startTime = Date.now();
    this.isRecording = true;
    this.metadata = {
      participant: metadata.participant || 'P1',
      scenario: metadata.scenario || 'S1',
      color: metadata.color || '#FF5733',
    };

    console.log('Recording started:', this.metadata);
  }

  /**
   * Add a frame to the recording
   * @param {THREE.Vector3} position - Gaze origin (eye position)
   * @param {THREE.Vector3} lookAt - Gaze focus point (where looking)
   *                                  - If hits mesh: intersection point
   *                                  - If looking at sky: 100m away in gaze direction
   */
  recordFrame(position, lookAt) {
    if (!this.isRecording) return;

    const elapsedTime = (Date.now() - this.startTime) / 1000; // Convert to seconds

    this.frames.push({
      time: elapsedTime,
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      lookAt: {
        x: lookAt.x,
        y: lookAt.y,
        z: lookAt.z,
      },
    });
  }

  /**
   * Stop recording and return the captured data
   * @returns {Object} Recording data with frames and metadata
   */
  stopRecording() {
    if (!this.isRecording) {
      console.warn('No recording in progress');
      return null;
    }

    this.isRecording = false;

    if (this.frames.length === 0) {
      console.warn('No frames recorded');
      return null;
    }

    const data = {
      metadata: this.metadata,
      frames: this.frames,
      length: this.frames.length,
      duration: this.frames[this.frames.length - 1].time,
    };

    console.log('Recording stopped:', {
      frames: data.length,
      duration: data.duration,
      ...data.metadata,
    });

    return data;
  }

  /**
   * Get current recording status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      frameCount: this.frames.length,
      duration: this.isRecording ? (Date.now() - this.startTime) / 1000 : 0,
      metadata: this.metadata,
    };
  }

  /**
   * Get all captured frames for visualization
   */
  getFrames() {
    return this.frames;
  }

  /**
   * Clear current recording data
   */
  clear() {
    this.frames = [];
    this.startTime = null;
    this.isRecording = false;
  }

  /**
   * Export raw frame data as JSON (for debugging/validation)
   */
  exportJSON() {
    return {
      metadata: this.metadata,
      frames: this.frames,
    };
  }
}

export default new RecordingManager();
