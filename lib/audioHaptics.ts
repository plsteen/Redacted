/**
 * Audio and haptic feedback for different game events
 */

type TaskIndex = number;

// Type for webkit prefixed AudioContext
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Create an audio context and generate a sound for a specific task
 * Different frequencies for each task create a scale-like progression
 */
export function playTaskSound(taskIdx: TaskIndex) {
  try {
    // Only works on user interaction or after a user gesture
    const win = window as WindowWithWebkit;
    const AudioContextClass = window.AudioContext || win.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    
    // Generate frequency based on task index (ascending scale)
    // Base frequency 440Hz (A4), each task adds semitones
    const baseFreq = 440;
    const semitones = taskIdx * 2; // 2 semitones per task
    const frequency = baseFreq * Math.pow(2, semitones / 12);
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Create envelope: quick attack, quick decay
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    console.warn("[Audio] Could not play sound:", e);
  }
}

/**
 * Play a triumphant sound when all tasks are completed
 */
export function playVictorySound() {
  try {
    const win = window as WindowWithWebkit;
    const AudioContextClass = window.AudioContext || win.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    
    // Play a chord: C (260Hz), E (330Hz), G (392Hz)
    const notes = [260, 330, 392];
    
    for (const freq of notes) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    }
  } catch (e) {
    console.warn("[Audio] Could not play victory sound:", e);
  }
}

/**
 * Haptic feedback (vibration) for task completion
 * Different patterns for different events
 */
export function triggerHaptic(pattern: 'success' | 'completion' | 'error' = 'success') {
  // Check if vibration API is available
  if (!navigator.vibrate) {
    return;
  }
  
  switch (pattern) {
    case 'success':
      // Short double tap: 20ms vibrate, 20ms pause, 20ms vibrate
      navigator.vibrate([20, 20, 20]);
      break;
    case 'completion':
      // Longer pattern for game completion: 100ms, pause, 100ms, pause, 150ms
      navigator.vibrate([100, 50, 100, 50, 150]);
      break;
    case 'error':
      // Longer single vibrate: 200ms
      navigator.vibrate(200);
      break;
  }
}

/**
 * Play sound and haptic for task completed
 */
export function notifyTaskCompleted(taskIdx: TaskIndex) {
  playTaskSound(taskIdx);
  triggerHaptic('success');
}

/**
 * Play sound and haptic for game completed
 */
export function notifyGameCompleted() {
  playVictorySound();
  triggerHaptic('completion');
}
