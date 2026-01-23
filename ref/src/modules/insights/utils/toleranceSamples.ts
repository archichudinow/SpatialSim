/**
 * Sample Event Generator for Tolerance Testing
 * Generates synthetic event data with various patterns to test tolerance algorithms
 */

interface SampleEvent {
  start_time: number;
  end_time: number;
}

/**
 * Generate synthetic event data for preview
 * Mix of long/short events and high/low frequency patterns with lots of noise
 * 
 * @param _maxTime - Maximum time in seconds (currently unused, events generated up to ~30s)
 * @returns Array of events sorted by start_time
 */
export function generateSampleEvents(_maxTime = 30): SampleEvent[] {
  const events: SampleEvent[] = [];
  let time = 0;
  
  // Pattern 1: Short noise events (should be filtered out)
  time = 1.5;
  for (let i = 0; i < 5; i++) {
    const noiseDuration = [0.033, 0.067, 0.1][i % 3]; // Vary between 33ms, 67ms, 100ms
    events.push({ start_time: time, end_time: time + noiseDuration });
    time += 0.167;
  }
  
  // More noise scattered at the beginning
  time = 0.3;
  for (let i = 0; i < 8; i++) {
    const noiseDuration = (i % 3) * 0.033; // 0, 33ms, 67ms durations
    events.push({ start_time: time, end_time: time + noiseDuration });
    time += 0.1;
  }
  
  // Pattern 2: Long duration event (should stay)
  time = 4.5;
  events.push({ start_time: time, end_time: time + 4.0 }); // 4 seconds
  
  // Noise during long event (overlapping)
  time = 5.4;
  for (let i = 0; i < 6; i++) {
    const noiseDuration = 0.033 + (i % 2) * 0.067; // 33ms or 100ms
    events.push({ start_time: time, end_time: time + noiseDuration });
    time += 0.267;
  }
  
  // Pattern 3: Flickering (should merge into one)
  time = 9;
  for (let i = 0; i < 8; i++) {
    events.push({ start_time: time, end_time: time + 0.167 });
    time += 0.233; // Small gaps that should merge
  }
  
  // Pattern 4: Medium duration events with good spacing (should stay separate)
  time = 12;
  events.push({ start_time: time, end_time: time + 1.0 });
  time += 2.0;
  events.push({ start_time: time, end_time: time + 0.83 });
  time += 2.33;
  events.push({ start_time: time, end_time: time + 1.33 });
  
  // Pattern 5: Very short noise spikes (instant, should be filtered)
  time = 19.5;
  for (let i = 0; i < 10; i++) {
    events.push({ start_time: time, end_time: time });
    time += 0.1;
  }
  
  // More scattered noise
  time = 18;
  for (let i = 0; i < 12; i++) {
    const noiseDuration = [0.033, 0.067, 0.1][i % 3]; // Cycle through 33ms, 67ms, 100ms
    events.push({ start_time: time, end_time: time + noiseDuration });
    time += 0.133;
  }
  
  // Pattern 6: High frequency short events (some should filter, some should merge)
  time = 21;
  for (let i = 0; i < 6; i++) {
    events.push({ start_time: time, end_time: time + 0.1 });
    time += 0.133; // Very close together
  }
  
  // More noise near the end
  time = 23.1;
  for (let i = 0; i < 15; i++) {
    events.push({ start_time: time, end_time: time + Math.random() * 0.067 });
    time += 0.067 + Math.random() * 0.1;
  }
  
  // Pattern 7: Long event at the end
  time = 25.5;
  events.push({ start_time: time, end_time: time + 3.33 });
  
  // Final noise burst
  time = 28.8;
  for (let i = 0; i < 8; i++) {
    events.push({ start_time: time, end_time: time });
    time += 0.067;
  }
  
  return events.sort((a, b) => a.start_time - b.start_time);
}
