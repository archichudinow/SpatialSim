/**
 * RecordingManager - Captures position and lookAt (hit point) data in real-time
 * Stores frames with timestamps for GLB export and saves to new database schema
 */

import StorageService from './storageService';
import DatabaseService from './databaseService';
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
    return {
      metadata: {
        projectId: this.projectId,
        optionName: this.selectedOption?.name,
        scenarioName: this.selectedScenario?.name,
        timestamp: new Date().toISOString(),
      },
      frames: this.frames,
    };
  }

  /**
   * Save recording to Supabase storage and database using new schema
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
      // Calculate duration in milliseconds
      const durationMs = Math.round(
        (this.frames[this.frames.length - 1]?.time || 0) * 1000
      );

      // Generate file name: optionName_scenarioName_uniqueId
      const optionName = this.selectedOption.name.replace(/[^a-zA-Z0-9]/g, '_');
      const scenarioName = this.selectedScenario.name.replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueId = Date.now();
      const baseFileName = `${optionName}_${scenarioName}_${uniqueId}`;

      // Create recording data object for GLB export
      const recordingData = {
        metadata: {
          projectId: this.projectId,
          optionId: this.selectedOption.id,
          optionName: this.selectedOption.name,
          scenarioId: this.selectedScenario.id,
          scenarioName: this.selectedScenario.name,
          timestamp: new Date().toISOString(),
          fileName: baseFileName,
        },
        frames: this.frames,
      };

      // Export to GLB blob
      console.log('Exporting to GLB...');
      const glbBlob = await GLBExporter.exportToGLB(recordingData);
      const glbFileName = `${baseFileName}.glb`;

      // Upload GLB to storage
      console.log('Uploading GLB to storage...');
      const { data: glbData, error: glbError } = await StorageService.uploadRecording(
        this.projectId,
        glbFileName,
        glbBlob
      );

      if (glbError) {
        throw new Error(`GLB upload failed: ${glbError.message}`);
      }

      console.log('GLB uploaded:', glbData.publicUrl);

      // Optional: Upload raw CSV data
      let rawUrl = null;
      try {
        const csvData = this.framesToCSV();
        const csvBlob = new Blob([csvData], { type: 'text/csv' });
        const csvFileName = `${baseFileName}.csv`;
        
        const { data: csvData_result, error: csvError } = await StorageService.uploadRawData(
          this.projectId,
          csvFileName,
          csvBlob
        );

        if (!csvError) {
          rawUrl = csvData_result.publicUrl;
          console.log('CSV uploaded:', rawUrl);
        }
      } catch (csvErr) {
        console.warn('CSV upload failed (non-critical):', csvErr);
      }

      // Create record in database
      console.log('Creating database record...');
      const { data: record, error: dbError } = await DatabaseService.createRecord({
        project_id: this.projectId,
        option_id: this.selectedOption.id,
        scenario_id: this.selectedScenario.id,
        record_url: glbData.publicUrl,
        raw_url: rawUrl,
        length_ms: durationMs,
        device_type: this.deviceType,
      });

      if (dbError) {
        throw new Error(`Database record creation failed: ${dbError.message}`);
      }

      console.log('Record created in database:', record.id);

      return { 
        success: true, 
        record,
        glbUrl: glbData.publicUrl,
        rawUrl 
      };
    } catch (error) {
      console.error('Error saving recording to Supabase:', error);
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
