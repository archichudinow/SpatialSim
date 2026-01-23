import { supabase, BUCKETS } from './supabaseClient';

/**
 * Storage service for managing files in Supabase Storage
 */
export class StorageService {
  /**
   * Upload a file to Supabase Storage
   * @param {string} bucket - Bucket name (e.g., 'models' or 'recordings')
   * @param {string} path - File path within the bucket
   * @param {File|Blob} file - File to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with public URL
   */
  static async uploadFile(bucket, path, file, options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
          ...options,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
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
   * Upload a model file (GLB)
   * @param {string} projectId - Project UUID
   * @param {string} modelType - Type of model ('context', 'project', or 'heatmap')
   * @param {File|Blob} file - Model file
   * @returns {Promise<Object>} Upload result
   */
  static async uploadModel(projectId, modelType, file) {
    const path = `${projectId}/${modelType}.glb`;
    return await this.uploadFile(BUCKETS.MODELS, path, file, { upsert: true });
  }

  /**
   * Upload a recording file
   * @param {string} projectId - Project UUID
   * @param {string} recordingId - Recording identifier
   * @param {File|Blob} file - Recording data (JSON or binary)
   * @param {string} format - File format extension (e.g., 'json')
   * @returns {Promise<Object>} Upload result
   */
  static async uploadRecording(projectId, recordingId, file, format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `${projectId}/${recordingId}_${timestamp}.${format}`;
    return await this.uploadFile(BUCKETS.RECORDINGS, path, file);
  }

  /**
   * Download a file from storage
   * @param {string} bucket - Bucket name
   * @param {string} path - File path within the bucket
   * @returns {Promise<Object>} File blob
   */
  static async downloadFile(bucket, path) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
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
   * @param {string} bucket - Bucket name
   * @param {string} path - File path within the bucket
   * @returns {string} Public URL
   */
  static getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * List files in a bucket path
   * @param {string} bucket - Bucket name
   * @param {string} path - Folder path to list
   * @returns {Promise<Object>} List of files
   */
  static async listFiles(bucket, path = '') {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
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
   * @param {string} bucket - Bucket name
   * @param {string} path - File path within the bucket
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteFile(bucket, path) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete all files in a project folder
   * @param {string} projectId - Project UUID
   * @param {string} bucket - Bucket name
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteProjectFiles(projectId, bucket) {
    try {
      // List all files for the project
      const { data: files, error: listError } = await this.listFiles(bucket, projectId);
      if (listError) throw listError;

      if (!files || files.length === 0) {
        return { data: true, error: null };
      }

      // Delete all files
      const filePaths = files.map(file => `${projectId}/${file.name}`);
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(filePaths);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting project files:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a signed URL for temporary access to a private file
   * @param {string} bucket - Bucket name
   * @param {string} path - File path within the bucket
   * @param {number} expiresIn - Expiration time in seconds (default: 60)
   * @returns {Promise<Object>} Signed URL
   */
  static async createSignedUrl(bucket, path, expiresIn = 60) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return { data: null, error };
    }
  }
}

export default StorageService;
