import { supabase, BUCKETS } from './supabaseClient';

/**
 * Storage service for managing files in Supabase Storage
 * All files are stored in the 'projects' bucket with the structure:
 * projects/{project_id}/models/{files}
 * projects/{project_id}/records/{files}
 */
export class StorageService {
  /**
   * Upload a file to Supabase Storage
   * @param {string} path - File path within the bucket
   * @param {File|Blob} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with public URL
   */
  static async uploadFile(path, file, options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKETS.PROJECTS)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
          ...options,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKETS.PROJECTS)
        .getPublicUrl(path);

      return {
        data: {
          ...data,
          publicUrl: urlData.publicUrl,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { data: null, error };
    }
  }

  /**
   * Upload a model file (GLB) for a project
   * @param {string} projectId - Project UUID
   * @param {string} modelType - Type of model ('context', 'option', or 'heatmap')
   * @param {File|Blob} file - Model file
   * @param {string} [fileName] - Optional custom file name
   * @returns {Promise<Object>} Upload result
   */
  static async uploadModel(projectId, modelType, file, fileName = null) {
    const name = fileName || `${modelType}_model.glb`;
    const path = `${projectId}/models/${name}`;
    return await this.uploadFile(path, file, { upsert: true });
  }

  /**
   * Upload a recording file to storage
   * @param {string} projectId - Project UUID
   * @param {string} fileName - File name (should follow format: optionName_scenarioName_uniqueId.glb)
   * @param {File|Blob} file - Recording GLB file
   * @returns {Promise<Object>} Upload result
   */
  static async uploadRecording(projectId, fileName, file) {
    const path = `${projectId}/records/${fileName}`;
    return await this.uploadFile(path, file);
  }

  /**
   * Upload raw data file (CSV) for a recording
   * @param {string} projectId - Project UUID
   * @param {string} fileName - File name (should follow format: optionName_scenarioName_uniqueId.csv)
   * @param {File|Blob} file - Raw data CSV file
   * @returns {Promise<Object>} Upload result
   */
  static async uploadRawData(projectId, fileName, file) {
    const path = `${projectId}/records/${fileName}`;
    return await this.uploadFile(path, file);
  }

  /**
   * Upload raw data file (CSV) for a recording
   * @param {string} projectId - Project UUID
   * @param {string} fileName - File name (should follow format: optionName_scenarioName_uniqueId.csv)
   * @param {File|Blob} file - Raw data CSV file
   * @returns {Promise<Object>} Upload result
   */
  static async uploadRawData(projectId, fileName, file) {
    const path = `${projectId}/records/${fileName}`;
    return await this.uploadFile(path, file);
  }

  /**
   * Download a file from storage
   * @param {string} path - File path within the bucket
   * @returns {Promise<Object>} File blob
   */
  static async downloadFile(path) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKETS.PROJECTS)
        .download(path);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error downloading file:', error);
      return { data: null, error };
    }
  }

  /**
   * Get public URL for a file
   * @param {string} path - File path within the bucket
   * @returns {string} Public URL
   */
  static getPublicUrl(path) {
    const { data } = supabase.storage
      .from(BUCKETS.PROJECTS)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * List files in a project folder
   * @param {string} projectId - Project UUID
   * @param {string} folder - Folder name ('models' or 'records')
   * @returns {Promise<Object>} List of files
   */
  static async listFiles(projectId, folder = 'records') {
    try {
      const path = `${projectId}/${folder}`;
      const { data, error } = await supabase.storage
        .from(BUCKETS.PROJECTS)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error listing files:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a file from storage
   * @param {string} path - File path within the bucket
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteFile(path) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKETS.PROJECTS)
        .remove([path]);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { data: null, error };
    }
  }
}

export default StorageService;
