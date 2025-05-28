/**
 * Phonetic Visualizer - Waveform Visualization (Refactored)
 * Renders an audio waveform visualization using Web Audio API and Canvas
 * with pleasing "ding" sounds for each character.
 * Adapted to the generic visualizer system.
 */

import { getCanvasTransform } from '../utils.js'; // animateTypewriter, generatePhoneticLayers, getFinalLayerText are handled by visualizer-base
import { getState, updateState, cancelAnimation } from '../state.js'; // cancelAnimation is for the old system, visualizer-base handles its own
import { registerVisualizer } from '../visualizer-base.js';

let localAudioContext = null; // Store AudioContext locally to persist across renders if possible

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

  for (let i = 0; i < length; i++) {
    const n = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    leftChannel[i] = n;
    rightChannel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return impulse;
}

/**
 * Creates a "ding" sound buffer with spacey reverberation
 * @param {AudioContext} audioContext - The audio context to use
 * @param {number} frequency - Base frequency for the ding sound
 * @param {string} type - Type of oscillator to use ('sine', 'triangle', etc.)
 * @returns {Promise<AudioBuffer>} A promise that resolves with the created ding sound buffer
 */
function createDingSound(audioContext, frequency, type = 'sine') {
  const sampleRate = audioContext.sampleRate;
  const duration = 3.0;
  // OfflineAudioContext might not be available in all environments or might have issues.
  // For simplicity in refactoring, we'll assume it works as in the original.
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const oscillator = offlineCtx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const gainNode = offlineCtx.createGain();
  const convolver = offlineCtx.createConvolver();
  convolver.buffer = createReverbImpulse(offlineCtx, 2.5, 0.4);

  const dryGain = offlineCtx.createGain();
  dryGain.gain.value = 0.4;
  const wetGain = offlineCtx.createGain();
  wetGain.gain.value = 0.6;

  const now = offlineCtx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.7, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

  oscillator.connect(gainNode);
  gainNode.connect(dryGain);
  dryGain.connect(offlineCtx.destination);
  gainNode.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(offlineCtx.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.4);

  return offlineCtx.startRendering();
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
    return baseFrequency * Math.pow(2, position / 12);
  }
  return baseFrequency;
}

/**
 * Performs cleanup of audio-specific resources for the waveform visualization.
 * This should be called before setting up new audio resources.
 */
function cleanupWaveformAudioResources() {
  const state = getState('waveform');
  if (state && state.audioNodes) {
    state.audioNodes.forEach(node => {
      try {
        if (node.stop) node.stop(0);
        node.disconnect();
      } catch (e) { /* Node might already be disconnected or stopped */ }
    });
  }
  // Note: The visualizer-base calls resetState, which will clear
  // soundBuffers, audioNodes etc. based on the template.
  // We mainly need to ensure active audio sources are stopped and disconnected.
  // If localAudioContext is being managed and needs closing, it would happen here or at a higher level.
  // For now, we assume localAudioContext persists or is recreated safely.
}

/**
 * Plays a ding sound for a character
 * @param {Object} soundInfo - Information about the sound to play
 */
function playDingSound(soundInfo) {
  const state = getState('waveform');
  if (!state.isPlaying || !state.audioContext) return;

  const audioContext = state.audioContext;
  const now = audioContext.currentTime;

  const source = audioContext.createBufferSource();
  source.buffer = soundInfo.buffer;
  const gain = audioContext.createGain();
  const layerGain = Math.pow(0.8, soundInfo.layerIndex);
  gain.gain.value = layerGain * 0.5;

  source.connect(gain);
  gain.connect(state.analyzer);
  source.start(now);
  soundInfo.lastPlayedTime = Date.now();

  // Add to audio nodes for cleanup by cleanupWaveformAudioResources if needed,
  // though they are short-lived.
  if (state.audioNodes) {
      state.audioNodes.push(source, gain);
  } else {
      updateState('waveform', { audioNodes: [source, gain] });
  }
}

/**
 * Toggles audio playback for the waveform visualization
 */
function toggleWaveformAudio() {
  const state = getState('waveform');
  if (!state || !state.soundBuffers) return; // Check state exists

  const isPlaying = !state.isPlaying;
  updateState('waveform', { isPlaying });

  // TODO: Refactor global UI manipulation. For now, keep original behavior.
  const wordInput = document.getElementById("wordInput");
  if (wordInput) {
    wordInput.disabled = isPlaying;
    const disabledMessage = document.getElementById("inputDisabledMessage");
    if (disabledMessage) {
      disabledMessage.style.display = isPlaying ? "block" : "none";
    }
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
 */
function toggleDualTrigger() {
  const state = getState('waveform');
  if (!state || !state.soundBuffers) return; // Check state exists

  const dualTrigger = !state.dualTrigger;
  updateState('waveform', { dualTrigger });
}


const waveformStateTemplate = {
  layers: null, // Provided by visualizer-base
  word: "",     // Provided by visualizer-base (effectively)
  audioContext: null,
  analyzer: null,
  dataArray: null,
  bufferLength: 0,
  colors: ["#ff6b6b", "#4ecdc4", "#ffe66d", "#a78bfa"],
  soundBuffers: [],
  audioNodes: [], // For managing nodes that need explicit cleanup
  animationStartTime: 0,
  animationDuration: 8000, // Specific to waveform
  isPlaying: false,
  dualTrigger: false,
  lastFrameTime: 0,
  deltaTime: 0,
  animationId: null, // For the visualizer's internal animation loop
  // centerX and centerY will be set based on canvas dimensions
};

/**
 * Stops all audio playback and animation for the waveform visualization.
 * Also re-enables the word input field.
 */
function stopWaveformVisualization() {
  const state = getState('waveform');
  if (state) {
    if (state.animationId) {
      cancelAnimationFrame(state.animationId); // Stop its own animation loop
    }
    cleanupWaveformAudioResources(); // Stop audio nodes
    updateState('waveform', { 
      isPlaying: false, 
      animationId: null,
      // Reset other relevant parts of state if necessary, though visualizer-base's resetState handles much of it on next render.
      // Forcing isPlaying to false is key here.
      audioNodes: [] // Clear audio nodes as they are disconnected
    });
  }

  // Re-enable the word input field and hide the message
  const wordInput = document.getElementById("wordInput");
  if (wordInput) {
    wordInput.disabled = false;
    wordInput.title = "";
    wordInput.style.backgroundColor = "";
  }
  const disabledMessage = document.getElementById("inputDisabledMessage");
  if (disabledMessage) {
    disabledMessage.style.display = "none";
  }
  console.log("Waveform visualization stopped and input enabled.");
}

/**
 * Specific render function for Waveform visualization
 * @param {string} word - The word to visualize
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Array} layers - The phonetic layers (provided by visualizer-base)
 */
function renderWaveformSpecific(word, canvas, ctx, layers) {
  cleanupWaveformAudioResources(); // Clean up audio resources from previous run

  // Initialize AudioContext if it doesn't exist or was closed
  if (!localAudioContext || localAudioContext.state === 'closed') {
    try {
      const AudioContextGlobal = window.AudioContext || window.webkitAudioContext;
      localAudioContext = new AudioContextGlobal();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
      ctx.fillStyle = "#e94560";
      ctx.font = "24px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Web Audio API not supported", canvas.width / 2, canvas.height / 2);
      updateState('waveform', { audioContext: null });
      return;
    }
  }
  updateState('waveform', { audioContext: localAudioContext });


  const masterGain = localAudioContext.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(localAudioContext.destination);

  const analyzer = localAudioContext.createAnalyser();
  analyzer.fftSize = 2048;
  analyzer.connect(masterGain);
  
  const initialAudioNodes = [masterGain, analyzer];

  const soundBuffers = [];
  const oscillatorTypes = ['sine', 'triangle', 'sine', 'triangle'];
  const bufferPromises = [];
  const layerCharacters = {};

  layers.forEach((layer, layerIndex) => {
    layerCharacters[layerIndex] = [];
    layer.forEach((char, charIndex) => {
      const charKey = `${char}-${layerIndex}`;
      if (!layerCharacters[layerIndex].some(item => item.key === charKey)) {
        layerCharacters[layerIndex].push({
          key: charKey, char, charIndex, frequency: charToFrequency(char)
        });
      }
    });
  });

  Object.keys(layerCharacters).forEach(layerIndexStr => {
    const layerIndex = parseInt(layerIndexStr);
    const characters = layerCharacters[layerIndex];
    if (!characters || characters.length === 0) return;
    const angleStep = (Math.PI * 2) / characters.length;

    characters.forEach((charInfo, index) => {
      const oscillatorType = oscillatorTypes[layerIndex % oscillatorTypes.length];
      const promise = createDingSound(localAudioContext, charInfo.frequency, oscillatorType)
        .then(buffer => {
          soundBuffers.push({
            buffer, char: charInfo.char, frequency: charInfo.frequency,
            layerIndex, charIndex: charInfo.charIndex, lastPlayedTime: 0,
            orbitRadius: 100 + layerIndex * 80,
            angle: (index * angleStep) - (Math.PI / 8) * Math.pow(0.5, layerIndex),
            speed: 0.5 / Math.pow(2, layerIndex)
          });
        }).catch(err => console.error("Error creating ding sound:", err));
      bufferPromises.push(promise);
    });
  });

  Promise.all(bufferPromises).then(() => {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    updateState('waveform', {
      word, // Store word for reference if needed by redraw
      layers, // Store layers if needed by redraw
      analyzer, dataArray, bufferLength, soundBuffers,
      audioNodes: initialAudioNodes, // Start with masterGain and analyzer
      animationStartTime: Date.now(),
      // isPlaying and dualTrigger are already in template, default to false
      lastFrameTime: Date.now(),
      deltaTime: 0,
      // colors and animationDuration are in template
    });
    
    // Ensure wordInput is re-enabled if isPlaying is false (default)
    const currentWaveformState = getState('waveform');
    if (document.getElementById("wordInput")) {
        document.getElementById("wordInput").disabled = currentWaveformState.isPlaying;
    }
    if (document.getElementById("inputDisabledMessage")) {
        document.getElementById("inputDisabledMessage").style.display = currentWaveformState.isPlaying ? "block" : "none";
    }


    // Setup click handler for buttons on canvas
    // This needs to be managed carefully if canvas is recreated or event listeners stack up.
    // For now, assign directly. visualizer-base doesn't provide a hook for this.
    canvas.onclick = function(event) {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      const buttonSize = 50;
      // Play/Pause Button
      const playButtonX = canvas.width - buttonSize - 20;
      const playButtonY = 20;
      const playDistance = Math.sqrt(Math.pow(clickX - (playButtonX + buttonSize/2), 2) + Math.pow(clickY - (playButtonY + buttonSize/2), 2));
      if (playDistance <= buttonSize/2) {
        toggleWaveformAudio();
        return;
      }
      // Dual Trigger Button
      const dualButtonX = canvas.width - buttonSize - 20;
      const dualButtonY = 20 + buttonSize + 10;
      const dualDistance = Math.sqrt(Math.pow(clickX - (dualButtonX + buttonSize/2), 2) + Math.pow(clickY - (dualButtonY + buttonSize/2), 2));
      if (dualDistance <= buttonSize/2) {
        toggleDualTrigger();
      }
    };

    // Start animation loop
    function drawFrame() {
      const state = getState('waveform');
      // Ensure soundBuffers is available before proceeding, as it's central to animation
      if (!state || !state.soundBuffers) return; 

      const now = Date.now();
      const deltaTime = now - state.lastFrameTime;

      // Update animation state (angles, sound triggers, pulsing)
      if (state.isPlaying && deltaTime > 0) { // deltaTime > 0 to prevent issues if time is static
        state.soundBuffers.forEach(sound => {
          // Update angle
          const prevAngle = sound.angle;
          sound.angle += sound.speed * (deltaTime / 1000);
          if (sound.angle >= Math.PI * 2) sound.angle -= Math.PI * 2;

          // Check for sound triggers
          const crossedPrimaryTrigger = (prevAngle < 0 && sound.angle >= 0) || (prevAngle < Math.PI * 2 && sound.angle >= Math.PI * 2);
          const crossedSecondaryTrigger = state.dualTrigger && 
            ((prevAngle < Math.PI && sound.angle >= Math.PI) || (prevAngle >= Math.PI && sound.angle < Math.PI));

          if ((crossedPrimaryTrigger || crossedSecondaryTrigger) && now - sound.lastPlayedTime > 300) {
            playDingSound(sound); // playDingSound uses and updates state internally
            sound.pulsing = true;
            sound.pulseStartTime = now; // Use 'now' from drawFrame for consistency
          }

          // Update pulsing state for visual effect duration
          if (sound.pulsing) {
            const timeSincePulse = now - sound.pulseStartTime;
            if (timeSincePulse >= 500) { // Pulse visual effect lasts 500ms
              sound.pulsing = false;
            }
          }
        });
      }
      
      updateState('waveform', {
        elapsedTime: now - state.animationStartTime,
        lastFrameTime: now,
        deltaTime: deltaTime,
        soundBuffers: state.soundBuffers // Persist updated angles, lastPlayedTime (via playDingSound), and pulse states
      });
      
      // Get the fully updated state for rendering
      const currentState = getState('waveform'); 
      if (!currentState) return; // State could have been cleared by an async operation
      redrawWaveformSpecific(currentState, canvas, ctx);

      const animationId = requestAnimationFrame(drawFrame);
      updateState('waveform', { animationId });
    }
    drawFrame();

  }).catch(err => console.error("Error processing sound buffers:", err));
}

/**
 * Specific redraw function for Waveform visualization (now only renders, does not update animation state)
 * @param {Object} state - The current state for 'waveform'
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 */
function redrawWaveformSpecific(state, canvas, ctx) {
  // state.analyzer might not be present if audioContext failed.
  // state itself could be null if cleared asynchronously.
  if (!state || !state.analyzer || !state.soundBuffers) return;

  const transform = getCanvasTransform(canvas.id); // canvas.id is correct here
  const scale = transform.scale || 1;
  const offsetX = transform.offsetX || 0;
  const offsetY = transform.offsetY || 0;

  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(1, "#16213e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(offsetX, offsetY); // Apply pan
  ctx.scale(scale, scale);       // Apply zoom

  // deltaTime is primarily used in drawFrame for animation updates.
  // It's available in state if needed for purely visual, time-dependent effects in redraw itself,
  // but not for core animation logic like angle updates.
  const { analyzer, dataArray, bufferLength, colors, soundBuffers = [], isPlaying, dualTrigger } = state;
  
  analyzer.getByteFrequencyData(dataArray); // For potential future use, original drew time domain

  const centerX = canvas.width / (2 * scale); // Adjust center for zoom
  const centerY = canvas.height / (2 * scale);


  const uniqueOrbits = new Set(soundBuffers.map(sound => sound.orbitRadius));
  [...uniqueOrbits].sort((a,b) => a-b).forEach(radius => {
    ctx.strokeStyle = "#ffffff22";
    ctx.lineWidth = 1 / scale; // Adjust line width for zoom
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  analyzer.getByteTimeDomainData(dataArray);
  ctx.lineWidth = 2 / scale;
  ctx.strokeStyle = "#ffffff66";
  ctx.beginPath();
  const sliceWidth = (canvas.width / scale) / bufferLength;
  let x = 0;
  const waveHeight = (canvas.height / scale) / 5;

  for (let i = 0; i < bufferLength; i++) {
    const v = (dataArray[i] / 128.0) - 1.0;
    const y = centerY + (v * waveHeight / 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.stroke();

  soundBuffers.forEach(sound => {
    // Animation logic (angle update, sound triggering, pulsing state) is now handled in drawFrame.
    // This function just draws based on the current state of 'sound'.

    const xPos = centerX + Math.cos(sound.angle) * sound.orbitRadius;
    const yPos = centerY + Math.sin(sound.angle) * sound.orbitRadius;
    const markerSize = (24 - sound.layerIndex * 4) / scale;
    const color = colors[sound.layerIndex % colors.length];
    let pulseFactor = 1.0;

    if (sound.pulsing) {
      // sound.pulsing is true if drawFrame determined we are within the 0-500ms pulse window.
      // Calculate visual pulse factor based on current time.
      const timeSincePulse = Date.now() - sound.pulseStartTime;
      if (timeSincePulse >= 0 && timeSincePulse < 500) { // Ensure timeSincePulse is positive
        pulseFactor = 1.0 + 0.5 * Math.sin(timeSincePulse / 500 * Math.PI);
      } else {
        // If sound.pulsing is true but timeSincePulse is outside expected range (e.g., due to lag),
        // default to no visual pulse or end of pulse.
        pulseFactor = 1.0; 
      }
    }

    const glowSize = markerSize * 2 * pulseFactor;
    const glowGradient = ctx.createRadialGradient(xPos, yPos, 0, xPos, yPos, glowSize);
    const timeSincePlay = Date.now() - sound.lastPlayedTime;
    const glowIntensity = Math.max(0.3, Math.min(0.9, 1 - timeSincePlay / 1000));
    glowGradient.addColorStop(0, color + Math.floor(glowIntensity * 255).toString(16).padStart(2, '0'));
    glowGradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(xPos, yPos, glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${markerSize * pulseFactor}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sound.char, xPos, yPos);

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

  // Draw UI elements (buttons, text) - these should not scale with zoom
  ctx.restore(); // Restore to pre-zoom/pan state for UI
  ctx.save();    // Save clean state for UI

  const buttonSize = 50;
  const playButtonX = canvas.width - buttonSize - 20;
  const playButtonY = 20;

  ctx.fillStyle = "#16213e";
  ctx.strokeStyle = "#e94560";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(playButtonX + buttonSize/2, playButtonY + buttonSize/2, buttonSize/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  if (isPlaying) {
    ctx.fillRect(playButtonX + buttonSize/3, playButtonY + buttonSize/4, buttonSize/6, buttonSize/2);
    ctx.fillRect(playButtonX + buttonSize/2, playButtonY + buttonSize/4, buttonSize/6, buttonSize/2);
  } else {
    ctx.beginPath();
    ctx.moveTo(playButtonX + buttonSize/3, playButtonY + buttonSize/4);
    ctx.lineTo(playButtonX + buttonSize/3, playButtonY + buttonSize*3/4);
    ctx.lineTo(playButtonX + buttonSize*2/3, playButtonY + buttonSize/2);
    ctx.closePath();
    ctx.fill();
  }

  const dualButtonX = canvas.width - buttonSize - 20;
  const dualButtonY = playButtonY + buttonSize + 10;
  ctx.fillStyle = "#16213e";
  ctx.strokeStyle = state.dualTrigger ? "#4ecdc4" : "#6c757d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(dualButtonX + buttonSize/2, dualButtonY + buttonSize/2, buttonSize/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = state.dualTrigger ? "#ffffff" : "#aaaaaa";
  ctx.fillRect(dualButtonX + buttonSize/3 - 5, dualButtonY + buttonSize/4, buttonSize/8, buttonSize/2);
  ctx.fillRect(dualButtonX + buttonSize*2/3 - 5, dualButtonY + buttonSize/4, buttonSize/8, buttonSize/2);

  ctx.fillStyle = "#ffffff77";
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  const textY1 = canvas.height - 30;
  const textY2 = canvas.height - 10;
  if (isPlaying) {
    ctx.fillText("Click top button to pause sound and enable editing", canvas.width / 2, textY1);
  } else {
    ctx.fillText("Click top button to start animation and sound", canvas.width / 2, textY1);
  }
  ctx.fillText("Click bottom button to toggle dual trigger mode", canvas.width / 2, textY2);
  
  ctx.restore(); // Restore to whatever state was before UI drawing
}

// Register the waveform visualizer
registerVisualizer('waveform', {
  displayName: 'Waveform Audio',
  canvasId: 'waveform', // Keep original canvas ID
  containerId: 'waveformContainer', // Keep original container ID
  renderFunction: renderWaveformSpecific,
  redrawFunction: redrawWaveformSpecific,
  stateTemplate: waveformStateTemplate,
  animationConfig: { // Passed to generatePhoneticLayers and animateTypewriter by visualizer-base
    layerDepth: 3,
    duration: 8000
  }
});

// Export stop function for use by main.js
export { stopWaveformVisualization };

// The old stopWaveformAudio and cleanupWaveformResources are effectively replaced
// by the new structure and cleanupWaveformAudioResources being called internally by render or stop.
