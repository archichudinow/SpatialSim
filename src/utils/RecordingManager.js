/**
 * RecordingManager - Captures position and lookAt (hit point) data in real-time
 * Uses Supabase Edge Functions for secure uploads with hierarchical storage structure
 * 
 * Storage structure: projects/{project_name}_{project_id}/records/...
 * All uploads go through Edge Functions (no direct storage access)
 */

import GLBExporter from './GLBExporter';

export class RecordingManager {
  constructor() {
    this.isRecording = false;
    this.frames = [];
    this.startTime = null;
    this.projectId = null;
    this.selectedOption = null;
    this.selectedScenario = null;
    this.deviceType = 'pc'; // Default to PC
  }

  /**
   * Set the current project info for saving recordings
   * @param {string} projectId - Project UUID
   * @param {Object} selectedOption - Selected option object
   * @param {Object} selectedScenario - Selected scenario object
   */
  setProjectInfo(projectId, selectedOption, selectedScenario) {
    this.projectId = projectId;
    this.selectedOption = selectedOption;
    this.selectedScenario = selectedScenario;
  }

  /**
   * Set the device type (VR or PC)
   * @param {string} deviceType - 'vr' or 'pc'
   */
  setDeviceType(deviceType) {
    this.deviceType = deviceType;
  }

  /**
   * Initialize recording session
   */
  startRecording() {
    if (this.isRecording) {
      console.warn('Recording already in progress');
      return;
    }

    this.frames = [];
    this.startTime = Date.now();
    this.isRecording = true;

    console.log('Recording started for:', {
      project: this.projectId,
      option: this.selectedOption?.name,
      scenario: this.selectedScenario?.name,
    });
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
   * @returns {Object} Recording data with frames
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
      frames: this.frames,
      length: this.frames.length,
      duration: this.frames[this.frames.length - 1].time,
    };

    console.log('Recording stopped:', {
      frames: data.length,
      duration: data.duration,
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
    const optionName = this.selectedOption?.name || 'Unknown_Option';
    const scenarioName = this.selectedScenario?.name || 'Unknown_Scenario';
    
    return {
      metadata: {
        projectId: this.projectId,
        optionName: this.selectedOption?.name,
        scenarioName: this.selectedScenario?.name,
        timestamp: new Date().toISOString(),
        // Required by GLBExporter
        participant: optionName.replace(/[^a-zA-Z0-9]/g, '_'),
        scenario: scenarioName.replace(/[^a-zA-Z0-9]/g, '_'),
        color: '#3b82f6', // Default blue color
      },
      frames: this.frames,
      length: this.frames.length,
    };
  }

  /**
   * Save recording using Supabase Edge Function
   * Uploads via Edge Function which handles hierarchical storage paths automatically
   * @returns {Promise<Object>} Result with success status and record data or error
   */
  async saveToSupabase() {
    if (!this.projectId || !this.selectedOption || !this.selectedScenario) {
      console.error('Missing project, option, or scenario info');
      return { 
        success: false, 
        error: 'Missing project, option, or scenario information' 
      };
    }

    if (this.frames.length === 0) {
      console.error('No frames to save');
      return { success: false, error: 'No frames recorded' };
    }

    try {
      const durationMs = Math.round(
        (this.frames[this.frames.length - 1]?.time || 0) * 1000
      );

      // Generate file names
      const optionName = this.selectedOption.name.replace(/[^a-zA-Z0-9]/g, '_');
      const scenarioName = this.selectedScenario.name.replace(/[^a-zA-Z0-9]/g, '_');

      // Create recording data object for GLB export
      const recordingData = {
        metadata: {
          projectId: this.projectId,
          optionId: this.selectedOption.id,
          optionName: this.selectedOption.name,
          scenarioId: this.selectedScenario.id,
          scenarioName: this.selectedScenario.name,
          timestamp: new Date().toISOString(),
          participant: optionName,
          scenario: scenarioName,
          color: '#3b82f6', // Default color
        },
        frames: this.frames,
        length: this.frames.length,
      };

      // Export to GLB blob (client-side using Three.js)
      console.log('Exporting to GLB...');
      const glbBlob = await GLBExporter.exportToGLB(recordingData);

      // Generate CSV blob
      const csvData = this.framesToCSV();
      const csvBlob = new Blob([csvData], { type: 'text/csv' });

      // Prepare FormData for Edge Function
      const formData = new FormData();
      formData.append('projectId', this.projectId);
      formData.append('optionId', this.selectedOption.id);
      formData.append('scenarioId', this.selectedScenario.id);
      formData.append('optionName', this.selectedOption.name);
      formData.append('scenarioName', this.selectedScenario.name);
      formData.append('deviceType', this.deviceType);
      formData.append('durationMs', durationMs.toString());
      formData.append('glbFile', glbBlob, 'recording.glb');
      formData.append('csvFile', csvBlob, 'recording.csv');

      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Call Edge Function (handles hierarchical path generation and upload)
      console.log('Calling Edge Function for hierarchical storage upload...');
      const response = await fetch(
        `${supabaseUrl}/functions/v1/save-recording-with-glb`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Edge Function request failed');
      }

      console.log('Recording saved successfully:', result.record.id);

      return {
        success: true,
        record: result.record,
        glbUrl: result.glbUrl,
        rawUrl: result.rawUrl,
      };

    } catch (error) {
      console.error('Error saving recording:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert frames to CSV format
   * @returns {string} CSV data
   */
  framesToCSV() {
    const header = 'time,position_x,position_y,position_z,lookAt_x,lookAt_y,lookAt_z\n';
    const rows = this.frames.map(frame => {
      return `${frame.time},${frame.position.x},${frame.position.y},${frame.position.z},${frame.lookAt.x},${frame.lookAt.y},${frame.lookAt.z}`;
    }).join('\n');
    return header + rows;
  }
}

export default new RecordingManager();
