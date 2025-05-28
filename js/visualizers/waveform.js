/**
 * Phonetic Visualizer - Waveform Visualization
 * Renders an audio waveform visualization using Web Audio API and Canvas
 * with pleasing "ding" sounds for each character
 */

import { animateTypewriter, generatePhoneticLayers, getFinalLayerText, getCanvasTransform } from '../utils.js';
import { getState, updateState, cancelAnimation } from '../state.js';

/**
 * Creates a reverb impulse response for the convolver node
 * @param {AudioContext} audioContext - The audio context to use
 * @param {number} duration - Duration of the impulse response in seconds
 * @param {number} decay - Decay factor (0-1)
 * @returns {AudioBuffer} The impulse response buffer
 */
function createReverbImpulse(audioContext, duration = 3.0, decay = 0.3) {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  const leftChannel = impulse.getChannelData(0);
  const rightChannel = impulse.getChannelData(1);
  
  // Fill the buffer with white noise that decays exponentially
  for (let i = 0; i < length; i++) {
    const n = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    leftChannel[i] = n;
    // Slightly different for stereo effect
    rightChannel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  
  return impulse;
}

/**
 * Creates a "ding" sound buffer with spacey reverberation
 * @param {AudioContext} audioContext - The audio context to use
 * @param {number} frequency - Base frequency for the ding sound
 * @param {string} type - Type of oscillator to use ('sine', 'triangle', etc.)
 * @returns {AudioBuffer} The created ding sound buffer
 */
function createDingSound(audioContext, frequency, type = 'sine') {
  // Create an offline audio context for rendering the sound
  const sampleRate = audioContext.sampleRate;
  const duration = 3.0; // 3 seconds to allow for longer reverb tail
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  
  // Create oscillator
  const oscillator = offlineCtx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  
  // Create gain node for envelope
  const gainNode = offlineCtx.createGain();
  
  // Create convolver for reverb
  const convolver = offlineCtx.createConvolver();
  convolver.buffer = createReverbImpulse(offlineCtx, 2.5, 0.4); // Longer, slower decay
  
  // Create a dry/wet mix
  const dryGain = offlineCtx.createGain();
  dryGain.gain.value = 0.4; // 40% dry signal
  
  const wetGain = offlineCtx.createGain();
  wetGain.gain.value = 0.6; // 60% wet (reverb) signal for more spacey sound
  
  // Set envelope (attack, decay, sustain, release)
  const now = offlineCtx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.7, now + 0.01); // Quick attack
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); // Longer decay for the main sound
  
  // Connect nodes for dry signal
  oscillator.connect(gainNode);
  gainNode.connect(dryGain);
  dryGain.connect(offlineCtx.destination);
  
  // Connect nodes for wet (reverb) signal
  gainNode.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(offlineCtx.destination);
  
  // Start and stop oscillator
  oscillator.start(now);
  oscillator.stop(now + 0.4); // Longer oscillator duration
  
  // Render audio
  return offlineCtx.startRendering();
}

/**
 * Renders a waveform visualization for the given word
 * @param {string} word - The word to visualize
 */
function renderWaveform(word) {
  if (!word) return;
  
  // First, perform a complete cleanup of previous resources
  // This is critical to prevent memory leaks and performance issues
  cleanupWaveformResources();
  
  // We no longer disable the input field by default since audio starts disabled
  // This allows users to type and change the word without having to toggle audio
  document.getElementById("wordInput").disabled = false;
  
  const canvas = document.getElementById("waveform");
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Make sure the canvas container is visible
  document.getElementById("waveformContainer").style.display = "block";
  
  // Generate phonetic layers
  const layers = generatePhoneticLayers(word, 3); // Support 3 levels for more recursiveness
  
  // Get the final layer for typewriter animation
  const finalText = getFinalLayerText(layers);
  
  // Animation duration
  const animationDuration = 8000; // 8 seconds for full animation cycle
  
  // Start typewriter animation
  animateTypewriter(finalText, animationDuration);
  
  // Create audio context if needed
  let audioContext = getState('waveform').audioContext;
  if (!audioContext) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      updateState('waveform', { audioContext });
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
      // Draw fallback message
      ctx.fillStyle = "#e94560";
      ctx.font = "24px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Web Audio API not supported in this browser", canvas.width / 2, canvas.height / 2);
      return;
    }
  }
  
  // Create new audio nodes
  const audioNodes = [];
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.3; // Moderate volume
  masterGain.connect(audioContext.destination);
  audioNodes.push(masterGain);
  
  // Create analyzer for visualization
  const analyzer = audioContext.createAnalyser();
  analyzer.fftSize = 2048;
  analyzer.connect(masterGain);
  audioNodes.push(analyzer);
  
  // Create sound buffers for each character
  const soundBuffers = [];
  // Use smoother oscillator types for all layers (no sawtooth)
  const oscillatorTypes = ['sine', 'triangle', 'sine', 'triangle'];
  
  // Create a promise for each sound buffer
  const bufferPromises = [];
  
  // Group characters by layer for even distribution
  const layerCharacters = {};
  
  // First pass: group characters by layer and track unique characters
  layers.forEach((layer, layerIndex) => {
    layerCharacters[layerIndex] = [];
    
    layer.forEach((char, charIndex) => {
      // Create a unique key for this character in this layer
      const charKey = `${char}-${layerIndex}`;
      
      // Only add unique characters to the layer
      if (!layerCharacters[layerIndex].some(item => item.key === charKey)) {
        layerCharacters[layerIndex].push({
          key: charKey,
          char,
          charIndex,
          frequency: charToFrequency(char)
        });
      }
    });
  });
  
  // Second pass: create sound buffers with evenly distributed angles
  Object.keys(layerCharacters).forEach(layerIndex => {
    layerIndex = parseInt(layerIndex);
    const characters = layerCharacters[layerIndex];
    const angleStep = (Math.PI * 2) / characters.length;
    
    characters.forEach((charInfo, index) => {
      const oscillatorType = oscillatorTypes[layerIndex % oscillatorTypes.length];
      
      // Create ding sound and add to promises
      const promise = createDingSound(audioContext, charInfo.frequency, oscillatorType)
        .then(buffer => {
          soundBuffers.push({
            buffer,
            char: charInfo.char,
            frequency: charInfo.frequency,
            layerIndex,
            charIndex: charInfo.charIndex,
            lastPlayedTime: 0, // Track when this sound was last played
            // Calculate orbit radius based on layer
            orbitRadius: 100 + layerIndex * 80,
            // Position characters with layer-dependent offset from the trigger line
            // Each layer starts half way closer to the trigger line than the previous layer
            // This creates a cascading effect where they reach the trigger line in sequence
            angle: (index * angleStep) - (Math.PI / 8) * Math.pow(0.5, layerIndex),
            // Each layer moves at half the speed of the previous layer
            // Layer 0 (innermost) has base speed of 0.5
            // Layer 1 has speed of 0.25, Layer 2 has speed of 0.125, etc.
            speed: 0.5 / Math.pow(2, layerIndex)
          });
        });
      
      bufferPromises.push(promise);
    });
  });
  
  // Wait for all sound buffers to be created
  Promise.all(bufferPromises).then(() => {
    // Create buffer for analyzer data
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Color palette for waveforms
    const colors = [
      "#ff6b6b", // Red for original word
      "#4ecdc4", // Teal for first phonetic level
      "#ffe66d", // Yellow for second phonetic level
      "#a78bfa"  // Purple for third phonetic level
    ];
    
    // Store state for zoom/pan and animation
    const isPlaying = false; // Start with sound disabled by default
    const dualTrigger = false; // Start with single trigger mode (right side only)
    updateState('waveform', {
      analyzer,
      dataArray,
      bufferLength,
      colors,
      soundBuffers,
      audioNodes,
      animationStartTime: Date.now(),
      animationDuration,
      isPlaying,
      dualTrigger,
      lastFrameTime: Date.now()
    });
    
    // Keep the input field enabled since audio is not playing by default
    document.getElementById("wordInput").disabled = isPlaying;
    
    // Hide the disabled message
    document.getElementById("inputDisabledMessage").style.display = isPlaying ? "block" : "none";
    
    // Cancel any existing animation
    cancelAnimation('waveform');
    
    // Add click handler for buttons
    canvas.onclick = function(event) {
      const buttonSize = 50;
      const clickX = event.offsetX;
      const clickY = event.offsetY;
      
      // Check if click is on the play/pause button
      const playButtonX = canvas.width - buttonSize - 20;
      const playButtonY = 20;
      
      const playDistance = Math.sqrt(
        Math.pow(clickX - (playButtonX + buttonSize/2), 2) + 
        Math.pow(clickY - (playButtonY + buttonSize/2), 2)
      );
      
      if (playDistance <= buttonSize/2) {
        toggleWaveformAudio();
        return;
      }
      
      // Check if click is on the dual trigger toggle button
      const dualButtonX = canvas.width - buttonSize - 20;
      const dualButtonY = 20 + buttonSize + 10; // Position below play button
      
      const dualDistance = Math.sqrt(
        Math.pow(clickX - (dualButtonX + buttonSize/2), 2) + 
        Math.pow(clickY - (dualButtonY + buttonSize/2), 2)
      );
      
      if (dualDistance <= buttonSize/2) {
        toggleDualTrigger();
      }
    };
    
    // Start animation
    function drawFrame() {
      // Calculate time-based animation
      const now = Date.now();
      const elapsedTime = now - getState('waveform').animationStartTime;
      const deltaTime = now - (getState('waveform').lastFrameTime || now);
      updateState('waveform', { 
        elapsedTime,
        lastFrameTime: now
      });
      
      // Draw using the redraw function
      redrawWaveform(deltaTime);
      
      // Continue animation
      const animationId = requestAnimationFrame(drawFrame);
      updateState('waveform', { animationId });
    }
    
    drawFrame();
  });
}

/**
 * Plays a ding sound for a character
 * @param {Object} soundInfo - Information about the sound to play
 */
function playDingSound(soundInfo) {
  const state = getState('waveform');
  if (!state.isPlaying) return;
  
  const audioContext = state.audioContext;
  const now = audioContext.currentTime;
  
  // Create source node
  const source = audioContext.createBufferSource();
  source.buffer = soundInfo.buffer;
  
  // Create gain node for this sound
  const gain = audioContext.createGain();
  
  // Set gain based on layer (lower gain for deeper layers)
  const layerGain = Math.pow(0.8, soundInfo.layerIndex);
  gain.gain.value = layerGain * 0.5;
  
  // Connect nodes
  source.connect(gain);
  gain.connect(state.analyzer);
  
  // Start playback
  source.start(now);
  
  // Update last played time
  soundInfo.lastPlayedTime = Date.now();
  
  // Add to audio nodes for cleanup
  state.audioNodes.push(source, gain);
}

/**
 * Toggles audio playback for the waveform visualization
 */
function toggleWaveformAudio() {
  const state = getState('waveform');
  if (!state.soundBuffers) return;
  
  const isPlaying = !state.isPlaying;
  updateState('waveform', { isPlaying });
  
  // Enable/disable the word input field based on audio playback state
  const wordInput = document.getElementById("wordInput");
  if (wordInput) {
    wordInput.disabled = isPlaying;
    
    // Show/hide the disabled message
    const disabledMessage = document.getElementById("inputDisabledMessage");
    if (disabledMessage) {
      disabledMessage.style.display = isPlaying ? "block" : "none";
    }
    
    // Add a visual indicator that the input is disabled
    if (isPlaying) {
      wordInput.title = "Input disabled while audio is playing. Click the pause button to enable.";
      wordInput.style.backgroundColor = "#f0f0f0";
    } else {
      wordInput.title = "";
      wordInput.style.backgroundColor = "";
    }
  }
}

/**
 * Toggles dual trigger mode for the waveform visualization
 * When enabled, sounds will be triggered when characters cross both the right (0°) and left (180°) sides
 * When disabled, sounds will only be triggered when characters cross the right side (0°)
 */
function toggleDualTrigger() {
  const state = getState('waveform');
  if (!state.soundBuffers) return;
  
  const dualTrigger = !state.dualTrigger;
  updateState('waveform', { dualTrigger });
}

/**
 * Performs a complete cleanup of all waveform visualization resources
 * This is essential to prevent memory leaks and performance issues
 * when changing words or navigating away from the visualization
 */
function cleanupWaveformResources() {
  const state = getState('waveform');
  
  // Cancel any ongoing animations
  cancelAnimation('waveform');
  
  // Stop and clean up audio resources
  if (state.audioNodes) {
    state.audioNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop(0);
        }
        node.disconnect();
      } catch (e) {
        // Node might already be disconnected or stopped
      }
    });
  }
  
  // Clear sound buffers
  if (state.soundBuffers) {
    state.soundBuffers = [];
  }
  
  // Reset animation state
  updateState('waveform', { 
    audioNodes: [],
    soundBuffers: [],
    isPlaying: false,
    animationId: null
  });
  
  // Re-enable the word input field
  document.getElementById("wordInput").disabled = false;
  
  // Hide the disabled message
  const disabledMessage = document.getElementById("inputDisabledMessage");
  if (disabledMessage) {
    disabledMessage.style.display = "none";
  }
}

/**
 * Stops all audio playback for the waveform visualization
 * This should be called when navigating away from the waveform visualization
 */
function stopWaveformAudio() {
  cleanupWaveformResources();
}

/**
 * Redraws the waveform visualization without recalculating
 * @param {number} deltaTime - Time since last frame in milliseconds
 */
function redrawWaveform(deltaTime = 16) {
  const state = getState('waveform');
  if (!state.analyzer) return;
  
  const canvas = document.getElementById("waveform");
  const ctx = canvas.getContext("2d");
  const transform = getCanvasTransform("waveform");
  const scale = transform.scale;
  const offsetX = transform.offsetX;
  const offsetY = transform.offsetY;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(1, "#16213e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Apply transform correctly
  ctx.save();
  ctx.translate(offsetX * scale, offsetY * scale);
  ctx.scale(scale, scale);
  
  const analyzer = state.analyzer;
  const dataArray = state.dataArray;
  const bufferLength = state.bufferLength;
  const colors = state.colors;
  const soundBuffers = state.soundBuffers || [];
  const elapsedTime = state.elapsedTime || 0;
  const isPlaying = state.isPlaying;
  
  // Get frequency data
  analyzer.getByteFrequencyData(dataArray);
  
  // Draw circular orbit paths
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Draw orbit paths
  const uniqueOrbits = new Set(soundBuffers.map(sound => sound.orbitRadius));
  [...uniqueOrbits].sort().forEach(radius => {
    ctx.strokeStyle = "#ffffff22"; // Very light orbit paths
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  
  // Draw waveform through the center
  const waveHeight = canvas.height / 5; // Increased height for more visibility
  
  // Get time domain data
  analyzer.getByteTimeDomainData(dataArray);
  
  // Draw time domain waveform
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff66"; // More visible white
  ctx.beginPath();
  
  const sliceWidth = (canvas.width * 1.0) / bufferLength;
  let x = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    // Normalize the data to -1 to 1 range and center it at centerY
    const v = (dataArray[i] / 128.0) - 1.0;
    const y = centerY + (v * waveHeight / 2);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  ctx.stroke();
  
  // Update and draw character markers in their orbits
  soundBuffers.forEach((sound, index) => {
    // Only update positions if audio is playing
    if (isPlaying) {
      // Store previous angle to detect crossing the trigger line
      const prevAngle = sound.angle;
      
      // Update angle based on speed and delta time
      sound.angle += sound.speed * (deltaTime / 1000);
      
      // Get the dual trigger state
      const dualTrigger = state.dualTrigger;
      
      // Check if we crossed the primary trigger line (right side of the circle, angle = 0)
      const crossedPrimaryTrigger = (prevAngle < 0 && sound.angle >= 0) || 
                                   (prevAngle < Math.PI * 2 && sound.angle >= Math.PI * 2);
      
      // Check if we crossed the secondary trigger line (left side of the circle, angle = π)
      // Only check this if dual trigger mode is enabled
      const crossedSecondaryTrigger = dualTrigger && 
                                     ((prevAngle < Math.PI && sound.angle >= Math.PI) ||
                                      (prevAngle > Math.PI && sound.angle < Math.PI));
      
      // Combine the triggers
      const crossedTriggerLine = crossedPrimaryTrigger || crossedSecondaryTrigger;
      
      // Reset angle if it exceeds 2π
      if (sound.angle >= Math.PI * 2) {
        sound.angle -= Math.PI * 2;
      }
      
      // If we crossed the trigger line, play the ding
      // Also ensure we don't play sounds too frequently (at least 300ms apart)
      if (crossedTriggerLine && Date.now() - sound.lastPlayedTime > 300) {
        playDingSound(sound);
        // Add a pulse flag when sound is triggered
        sound.pulsing = true;
        sound.pulseStartTime = Date.now();
      }
    }
    
    // Calculate position based on orbit
    const xPos = centerX + Math.cos(sound.angle) * sound.orbitRadius;
    const yPos = centerY + Math.sin(sound.angle) * sound.orbitRadius;
    
    // Draw character marker
    const markerSize = 24 - sound.layerIndex * 4;
    const color = colors[sound.layerIndex % colors.length];
    
    // Calculate pulse effect - only pulse when sound is triggered
    let pulseFactor = 1.0;
    if (sound.pulsing) {
      const timeSincePulse = Date.now() - sound.pulseStartTime;
      if (timeSincePulse < 500) { // Pulse for 500ms
        pulseFactor = 1.0 + 0.5 * Math.sin(timeSincePulse / 500 * Math.PI);
      } else {
        sound.pulsing = false;
      }
    }
    
    // Draw glow effect
    const glowSize = markerSize * 2 * pulseFactor;
    const glowGradient = ctx.createRadialGradient(
      xPos, yPos, 0,
      xPos, yPos, glowSize
    );
    
    // Make the glow brighter if the sound was recently played
    const timeSincePlay = Date.now() - sound.lastPlayedTime;
    const glowIntensity = Math.max(0.3, Math.min(0.9, 1 - timeSincePlay / 1000));
    
    glowGradient.addColorStop(0, color + Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')); 
    glowGradient.addColorStop(1, "rgba(0,0,0,0)");
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(xPos, yPos, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw character
    ctx.fillStyle = "#ffffff";
    ctx.font = `${markerSize * pulseFactor}px monospace`; // Increase font size during pulse
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sound.char, xPos, yPos);
    
    // Draw small trail behind the character
    const trailLength = 5;
    for (let i = 1; i <= trailLength; i++) {
      const trailAngle = sound.angle - (i * 0.1);
      const trailX = centerX + Math.cos(trailAngle) * sound.orbitRadius;
      const trailY = centerY + Math.sin(trailAngle) * sound.orbitRadius;
      const trailSize = markerSize * (1 - i/trailLength) * 0.5;
      
      ctx.fillStyle = color + Math.floor((1 - i/trailLength) * 128).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Draw play/pause indicator
  const buttonSize = 50;
  const playButtonX = canvas.width - buttonSize - 20;
  const playButtonY = 20;
  
  // Draw play/pause button
  ctx.fillStyle = "#16213e";
  ctx.strokeStyle = "#e94560";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(playButtonX + buttonSize/2, playButtonY + buttonSize/2, buttonSize/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  if (isPlaying) {
    // Draw pause icon
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(playButtonX + buttonSize/3, playButtonY + buttonSize/4, buttonSize/6, buttonSize/2);
    ctx.fillRect(playButtonX + buttonSize/2, playButtonY + buttonSize/4, buttonSize/6, buttonSize/2);
  } else {
    // Draw play icon
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(playButtonX + buttonSize/3, playButtonY + buttonSize/4);
    ctx.lineTo(playButtonX + buttonSize/3, playButtonY + buttonSize*3/4);
    ctx.lineTo(playButtonX + buttonSize*2/3, playButtonY + buttonSize/2);
    ctx.closePath();
    ctx.fill();
  }
  
  // Draw dual trigger toggle button
  const dualButtonX = canvas.width - buttonSize - 20;
  const dualButtonY = playButtonY + buttonSize + 10;
  
  ctx.fillStyle = "#16213e";
  ctx.strokeStyle = state.dualTrigger ? "#4ecdc4" : "#6c757d"; // Teal when active, gray when inactive
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(dualButtonX + buttonSize/2, dualButtonY + buttonSize/2, buttonSize/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Draw dual trigger icon (two vertical lines)
  ctx.fillStyle = state.dualTrigger ? "#ffffff" : "#aaaaaa"; // White when active, light gray when inactive
  ctx.fillRect(dualButtonX + buttonSize/3 - 5, dualButtonY + buttonSize/4, buttonSize/8, buttonSize/2);
  ctx.fillRect(dualButtonX + buttonSize*2/3 - 5, dualButtonY + buttonSize/4, buttonSize/8, buttonSize/2);
  
  // Draw instructions
  ctx.fillStyle = "#ffffff77"; // 50% opacity white
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  
  if (isPlaying) {
    ctx.fillText("Click top button to pause sound and enable editing", canvas.width / 2, canvas.height - 30);
  } else {
    ctx.fillText("Click top button to start animation and sound", canvas.width / 2, canvas.height - 30);
  }
  
  ctx.fillText("Click bottom button to toggle dual trigger mode", canvas.width / 2, canvas.height - 10);
  
  ctx.restore();
}

/**
 * Maps a character to a frequency based on its position in the alphabet
 * @param {string} char - The character to map
 * @returns {number} The frequency in Hz
 */
function charToFrequency(char) {
  const baseFrequency = 220; // A3
  const lowerChar = char.toLowerCase();
  
  if (lowerChar >= 'a' && lowerChar <= 'z') {
    const position = lowerChar.charCodeAt(0) - 'a'.charCodeAt(0);
    return baseFrequency * Math.pow(2, position / 12); // Equal temperament
  } else {
    // For non-alphabetic characters, use a default frequency
    return baseFrequency;
  }
}

export { renderWaveform, redrawWaveform, toggleWaveformAudio, toggleDualTrigger, stopWaveformAudio, cleanupWaveformResources };
