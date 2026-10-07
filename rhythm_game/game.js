/**
 * Neon Beats - 4-Key Web Rhythm Action Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // UI Panels
  const selectionPanel = document.getElementById('selection-panel');
  const gamePanel = document.getElementById('game-panel');
  const resultModal = document.getElementById('result-modal');

  // Song & Diff Controls
  const songCards = document.querySelectorAll('.song-card');
  const mp3Upload = document.getElementById('mp3-upload');
  const mp3Name = document.getElementById('mp3-name');
  const diffBtns = document.querySelectorAll('.diff-btn');
  const startGameBtn = document.getElementById('start-game-btn');

  // Game HUD & Canvas
  const scoreText = document.getElementById('score-text');
  const accuracyText = document.getElementById('accuracy-text');
  const hpBarFill = document.getElementById('hp-bar-fill');
  const rhythmCanvas = document.getElementById('rhythm-canvas');
  const ctx = rhythmCanvas.getContext('2d');

  // Judge & Fever Overlays
  const judgeText = document.getElementById('judge-text');
  const comboContainer = document.getElementById('combo-container');
  const comboNum = document.getElementById('combo-num');
  const feverBanner = document.getElementById('fever-banner');
  const touchKeyBtns = document.querySelectorAll('.touch-key-btn');

  // Result Elements
  const resultRankBadge = document.getElementById('result-rank-badge');
  const resultTitle = document.getElementById('result-title');
  const resultSongName = document.getElementById('result-song-name');
  const resScore = document.getElementById('res-score');
  const resAcc = document.getElementById('res-acc');
  const resCombo = document.getElementById('res-combo');
  const resPerfect = document.getElementById('res-perfect');
  const resGreat = document.getElementById('res-great');
  const resMiss = document.getElementById('res-miss');
  const retryBtn = document.getElementById('retry-btn');
  const songSelectBtn = document.getElementById('song-select-btn');

  // State Variables
  let selectedSong = 'cyber'; // 'cyber', 'neon', 'chuseok', 'custom'
  let selectedDiff = 'normal'; // 'easy', 'normal', 'hard'
  let customAudioBuffer = null;
  let customFileName = '';

  let isPlaying = false;
  let animFrameId = null;
  let startTime = 0;
  let audioCtx = null;
  let songSourceNode = null;

  // Rhythm Settings
  const LANES = [
    { key: 'd', code: 'KeyD', label: 'D', color: '#38bdf8' },
    { key: 'f', code: 'KeyF', label: 'F', color: '#ec4899' },
    { key: 'j', code: 'KeyJ', label: 'J', color: '#a855f7' },
    { key: 'k', code: 'KeyK', label: 'K', color: '#fbbf24' }
  ];

  const LANE_WIDTH = 110;
  const TRACK_X_OFFSET = 20;
  const HIT_Y = 520;

  let noteSpeed = 5.0;
  let activeNotes = [];
  let particles = [];

  // Score & Stat Tracker
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let hp = 100;
  let perfectCount = 0;
  let greatCount = 0;
  let goodCount = 0;
  let missCount = 0;
  let isFever = false;

  // Key States
  const laneKeyPressed = [false, false, false, false];

  // 1. Audio Synthesizer & Web Audio API
  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Synthesize Chiptune / Synthwave Songs
  function createProceduralSong(songType) {
    initAudioContext();
    const duration = 45; // 45 seconds
    const sampleRate = audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let bpm = 130;
    if (songType === 'neon') bpm = 110;
    if (songType === 'chuseok') bpm = 128;

    const beatInterval = 60 / bpm;
    const totalBeats = Math.floor(duration / beatInterval);

    // Generate synth audio data into buffer
    for (let b = 0; b < totalBeats; b++) {
      const startSample = Math.floor(b * beatInterval * sampleRate);
      const beatLen = Math.floor(beatInterval * sampleRate);

      let freq = 220; // Default A3
      if (songType === 'cyber') {
        const scale = [220, 261.63, 293.66, 329.63, 392.00, 440.00];
        freq = scale[b % scale.length];
      } else if (songType === 'neon') {
        const scale = [261.63, 329.63, 392.00, 523.25, 440.00];
        freq = scale[b % scale.length];
      } else if (songType === 'chuseok') {
        // Pentatonic Korean style (G A C D E)
        const scale = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
        freq = scale[b % scale.length];
      }

      for (let i = 0; i < beatLen; i++) {
        if (startSample + i >= left.length) break;
        const t = i / sampleRate;

        // Bass synth wave
        let val = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3);
        // Kick/Drum noise on beat 0, 2
        if (b % 2 === 0 && i < sampleRate * 0.08) {
          val += (Math.random() * 2 - 1) * Math.exp(-t * 40);
        }

        left[startSample + i] += val * 0.3;
        right[startSample + i] += val * 0.3;
      }
    }

    return buffer;
  }

  // Play Sound Effect on Hit
  function playHitSound(quality) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (quality === 'perfect') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    } else if (quality === 'great') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    } else if (quality === 'good') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    } else if (quality === 'miss') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // 2. Note Chart Generator
  function generateChart(songType, diff) {
    const notes = [];
    let bpm = 130;
    if (songType === 'neon') bpm = 110;
    if (songType === 'chuseok') bpm = 128;
    if (songType === 'custom') bpm = 120;

    let totalDuration = 45; // seconds
    let speedMult = 1;
    if (diff === 'easy') speedMult = 0.7;
    if (diff === 'hard') speedMult = 1.4;

    const beatTime = (60 / bpm) / speedMult;
    const totalBeats = Math.floor(totalDuration / beatTime);

    for (let b = 4; b < totalBeats; b++) {
      const time = b * beatTime;

      // Select Lane
      let lane = (b * 3 + Math.floor(Math.sin(b) * 5)) % 4;
      if (lane < 0) lane += 4;

      notes.push({
        id: b,
        lane: lane,
        time: time,
        hit: false,
        missed: false
      });

      // Double note on Hard diff
      if (diff === 'hard' && b % 4 === 0) {
        const lane2 = (lane + 2) % 4;
        notes.push({
          id: b + 10000,
          lane: lane2,
          time: time,
          hit: false,
          missed: false
        });
      }
    }

    return notes;
  }

  // Parse Custom MP3 Beat Energy
  async function parseCustomMp3Buffer(file) {
    initAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    customAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  }

  // 3. UI Selection Event Listeners
  songCards.forEach(card => {
    card.addEventListener('click', () => {
      songCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedSong = card.dataset.song;
    });
  });

  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDiff = btn.dataset.diff;
    });
  });

  mp3Upload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      customFileName = file.name;
      mp3Name.textContent = `✅ 업로드됨: ${file.name}`;
      songCards.forEach(c => c.classList.remove('active'));
      selectedSong = 'custom';
      await parseCustomMp3Buffer(file);
    }
  });

  // Start Game
  startGameBtn.addEventListener('click', () => {
    initAudioContext();
    setupAndStartGame();
  });

  function setupAndStartGame() {
    // Reset Stats
    score = 0;
    combo = 0;
    maxCombo = 0;
    hp = 100;
    perfectCount = 0;
    greatCount = 0;
    goodCount = 0;
    missCount = 0;
    isFever = false;

    // Diff Speed
    if (selectedDiff === 'easy') noteSpeed = 3.8;
    else if (selectedDiff === 'normal') noteSpeed = 5.2;
    else if (selectedDiff === 'hard') noteSpeed = 6.8;

    // Chart & Audio
    activeNotes = generateChart(selectedSong, selectedDiff);

    // Audio Playback
    let buffer = customAudioBuffer;
    if (selectedSong !== 'custom' || !buffer) {
      buffer = createProceduralSong(selectedSong);
    }

    if (songSourceNode) {
      try { songSourceNode.stop(); } catch (err) {}
    }

    songSourceNode = audioCtx.createBufferSource();
    songSourceNode.buffer = buffer;
    songSourceNode.connect(audioCtx.destination);

    // Switch Screens
    selectionPanel.classList.add('hidden');
    gamePanel.classList.remove('hidden');
    resultModal.classList.add('hidden');

    updateHUD();

    // Start Clock
    startTime = audioCtx.currentTime;
    songSourceNode.start(0);
    isPlaying = true;

    // Start Loop
    cancelAnimationFrame(animFrameId);
    animLoop();
  }

  // 4. Input Controls (Keyboard & Touch)
  window.addEventListener('keydown', (e) => {
    if (!isPlaying) return;
    LANES.forEach((laneData, idx) => {
      if (e.code === laneData.code && !laneKeyPressed[idx]) {
        laneKeyPressed[idx] = true;
        handleKeyHit(idx);
        highlightTouchBtn(idx, true);
      }
    });
  });

  window.addEventListener('keyup', (e) => {
    LANES.forEach((laneData, idx) => {
      if (e.code === laneData.code) {
        laneKeyPressed[idx] = false;
        highlightTouchBtn(idx, false);
      }
    });
  });

  touchKeyBtns.forEach((btn, idx) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!isPlaying) return;
      laneKeyPressed[idx] = true;
      handleKeyHit(idx);
      highlightTouchBtn(idx, true);
    });
    btn.addEventListener('pointerup', () => {
      laneKeyPressed[idx] = false;
      highlightTouchBtn(idx, false);
    });
  });

  function highlightTouchBtn(idx, pressed) {
    if (touchKeyBtns[idx]) {
      if (pressed) touchKeyBtns[idx].classList.add('pressed');
      else touchKeyBtns[idx].classList.remove('pressed');
    }
  }

  // Hit Logic
  function handleKeyHit(laneIdx) {
    if (!isPlaying || !audioCtx) return;
    const currentTime = audioCtx.currentTime - startTime;

    // Find closest note in this lane
    const candidate = activeNotes.find(n => n.lane === laneIdx && !n.hit && !n.missed);
    if (!candidate) return;

    // Time difference in ms
    const diff = (candidate.time - currentTime) * 1000;
    const absDiff = Math.abs(diff);

    let judge = null;
    let pts = 0;

    if (absDiff <= 45) {
      judge = 'PERFECT';
      pts = 1000;
      perfectCount++;
    } else if (absDiff <= 90) {
      judge = 'GREAT';
      pts = 700;
      greatCount++;
    } else if (absDiff <= 135) {
      judge = 'GOOD';
      pts = 400;
      goodCount++;
    }

    if (judge) {
      candidate.hit = true;
      combo++;
      if (combo > maxCombo) maxCombo = combo;

      if (combo >= 20) isFever = true;
      const feverMult = isFever ? 2 : 1;

      score += pts * feverMult;
      hp = Math.min(100, hp + 3);

      playHitSound(judge.toLowerCase());
      showJudgement(judge);
      createParticles(laneIdx, HIT_Y);
      updateHUD();
    }
  }

  function showJudgement(type) {
    judgeText.textContent = type;
    judgeText.className = `judge-text ${type.toLowerCase()}`;

    comboNum.textContent = combo;
    if (combo >= 2) {
      comboContainer.classList.remove('hidden');
    }

    if (isFever) {
      feverBanner.classList.remove('hidden');
    } else {
      feverBanner.classList.add('hidden');
    }
  }

  // 5. Game Loop & Canvas Renderer
  function animLoop() {
    if (!isPlaying) return;

    const currentTime = audioCtx.currentTime - startTime;

    // Clear Canvas
    ctx.clearRect(0, 0, rhythmCanvas.width, rhythmCanvas.height);

    // Draw Lanes & Laser Line
    drawTracks();

    // Update & Draw Notes
    activeNotes.forEach(n => {
      if (n.hit) return;

      // Note Y position based on time remaining
      const timeDiff = n.time - currentTime;
      const y = HIT_Y - (timeDiff * noteSpeed * 100);

      // Miss check
      if (timeDiff < -0.15 && !n.missed && !n.hit) {
        n.missed = true;
        combo = 0;
        isFever = false;
        missCount++;
        hp -= 12;
        playHitSound('miss');
        showJudgement('MISS');
        updateHUD();

        if (hp <= 0) {
          endGame(false);
          return;
        }
      }

      // Draw Note if on screen
      if (y > -30 && y < rhythmCanvas.height + 30) {
        drawNote(n.lane, y);
      }
    });

    // Draw Particle Burst Effects
    updateAndDrawParticles();

    // Check End of Song
    if (currentTime >= 45) {
      endGame(true);
      return;
    }

    animFrameId = requestAnimationFrame(animLoop);
  }

  // Draw 4 Track Lanes
  function drawTracks() {
    for (let i = 0; i < 4; i++) {
      const x = TRACK_X_OFFSET + i * LANE_WIDTH;

      // Lane BG Glow if Key Pressed
      if (laneKeyPressed[i]) {
        const grad = ctx.createLinearGradient(0, 0, 0, rhythmCanvas.height);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.3)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, LANE_WIDTH, rhythmCanvas.height);
      }

      // Lane Border Dividers
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rhythmCanvas.height);
      ctx.stroke();
    }

    // Hit Line Beam
    ctx.strokeStyle = isFever ? '#f59e0b' : '#ec4899';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(TRACK_X_OFFSET, HIT_Y);
    ctx.lineTo(TRACK_X_OFFSET + 4 * LANE_WIDTH, HIT_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw Falling Neon Note Pill
  function drawNote(laneIdx, y) {
    const x = TRACK_X_OFFSET + laneIdx * LANE_WIDTH + 10;
    const w = LANE_WIDTH - 20;
    const h = 22;

    const color = LANES[laneIdx].color;

    ctx.fillStyle = color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;

    ctx.beginPath();
    ctx.roundRect(x, y - h / 2, w, h, 10);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  // Particle Explosions
  function createParticles(laneIdx, y) {
    const x = TRACK_X_OFFSET + laneIdx * LANE_WIDTH + LANE_WIDTH / 2;
    const color = LANES[laneIdx].color;

    for (let i = 0; i < 15; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 1.0,
        color: color
      });
    }
  }

  function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  function updateHUD() {
    scoreText.textContent = String(score).padStart(6, '0');
    hpBarFill.style.width = `${Math.max(0, hp)}%`;

    const totalHits = perfectCount + greatCount + goodCount + missCount;
    let acc = 100.0;
    if (totalHits > 0) {
      const weighted = (perfectCount * 1.0 + greatCount * 0.7 + goodCount * 0.4) / totalHits;
      acc = (weighted * 100).toFixed(1);
    }
    accuracyText.textContent = `${acc}%`;
  }

  // 6. End Game & Result Summary
  function endGame(isClear) {
    isPlaying = false;
    if (songSourceNode) {
      try { songSourceNode.stop(); } catch (e) {}
    }

    const totalHits = perfectCount + greatCount + goodCount + missCount;
    let accVal = 100;
    if (totalHits > 0) {
      accVal = (((perfectCount * 1.0 + greatCount * 0.7 + goodCount * 0.4) / totalHits) * 100).toFixed(1);
    }

    // Grade Rank Calculation
    let rank = 'SSS';
    if (!isClear || hp <= 0) rank = 'F';
    else if (accVal >= 98) rank = 'SSS';
    else if (accVal >= 95) rank = 'SS';
    else if (accVal >= 90) rank = 'S';
    else if (accVal >= 80) rank = 'A';
    else if (accVal >= 70) rank = 'B';
    else rank = 'C';

    resultRankBadge.textContent = rank;
    resultTitle.textContent = isClear ? '🎉 STAGE CLEAR!' : '💥 GAME OVER';
    resultSongName.textContent = selectedSong === 'custom' ? customFileName : `${selectedSong.toUpperCase()} - ${selectedDiff.toUpperCase()}`;

    resScore.textContent = score.toLocaleString();
    resAcc.textContent = `${accVal}%`;
    resCombo.textContent = maxCombo;
    resPerfect.textContent = perfectCount;
    resGreat.textContent = greatCount;
    resMiss.textContent = `${goodCount} / ${missCount}`;

    // Confetti on SSS/SS/S
    if (isClear && (rank === 'SSS' || rank === 'SS' || rank === 'S')) {
      if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
    }

    resultModal.classList.remove('hidden');
  }

  retryBtn.addEventListener('click', () => {
    setupAndStartGame();
  });

  songSelectBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    gamePanel.classList.add('hidden');
    selectionPanel.classList.remove('hidden');
  });
});
