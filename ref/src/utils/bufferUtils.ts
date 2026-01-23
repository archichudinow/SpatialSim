/**
 * Buffer Utilities
 * Reusable business logic for managing Float32Array buffers
 */

/**
 * Create a Float32Array buffer for positions (x, y, z per item)
 * @param count - Number of items
 * @returns Float32Array of size count * 3
 */
export function createPositionBuffer(count: number): Float32Array {
  return new Float32Array(count * 3);
}

/**
 * Create a Float32Array buffer for colors (r, g, b per item)
 * @param count - Number of items
 * @returns Float32Array of size count * 3
 */
export function createColorBuffer(count: number): Float32Array {
  return new Float32Array(count * 3);
}

/**
 * Cull old entries from history array based on cutoff time
 * @param history - Array of objects with time/timestamp property
 * @param cutoffTime - Time before which entries should be removed
 * @param timeKey - Property name for time (default: 'timestamp')
 */
export function cullHistoryByTime<T extends Record<string, any>>(
  history: T[],
  cutoffTime: number,
  timeKey: keyof T = 'timestamp' as keyof T
): void {
  while (history.length > 0 && (history[0][timeKey] || 0) < cutoffTime) {
    history.shift();
  }
}

/**
 * Calculate maximum capacity for point cloud based on duration and sample rate
 * @param duration - Duration in seconds
 * @param sampleInterval - Sample interval in seconds
 * @returns Maximum number of points
 */
export function calculateMaxPoints(duration: number, sampleInterval: number): number {
  return Math.ceil(duration / sampleInterval);
}

/**
 * Initialize buffer array with a specific value
 * @param buffer - Float32Array to initialize
 * @param value - Value to fill (default: 0)
 */
export function initializeBuffer(buffer: Float32Array, value: number = 0): void {
  buffer.fill(value);
}

/**
 * Clear history arrays for multiple agents
 * @param histories - Array of history arrays
 */
export function clearAllHistories<T>(histories: T[][]): void {
  histories.forEach(history => {
    history.length = 0;
  });
}
