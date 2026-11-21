/**
 * 🔥❄️ 정통 얼불춤 (A Dance of Fire and Ice) - PRO EDITION
 * Web Rhythm Game Engine (스팀 정품 공식 물리 & Web Audio BGM 신디사이저 완벽 구현)
 *
 * 핵심 구현:
 * 1. 1박자 = 180도(π rad) 공식 회전 물리 (기존 2배속 버그 완전 수정)
 * 2. 3박 시각/청각 카운트다운 ("3, 2, 1, GO!") 선행 연출로 시작 즉시 폭사 방지
 * 3. 넉넉하고 찰진 판정 윈도우 (PERFECT ±45ms, GREAT ±85ms, EARLY/LATE ±140ms, 오버턴 90도)
 * 4. 노멀 모드 (체력 100 라이프바) vs 하드코어 모드 (1-Hit 즉사 스팀 정품 룰)
 * 5. Web Audio API 기반 실시간 EDM/신스웨이브 BGM (킥, 스네어, 하이햇, 베이스, 신스 아르페지오 완벽 싱크)
 * 6. 공식 .adofai 커스텀 맵 파서 (pathData 24방향 각도 & Twirl & SetSpeed 지원)
 * 7. 프로젝트 내 '쌈뽕_얼불춤_신규맵.adofai' 원클릭 로드 및 커스텀 파일 드래그앤드롭
 */

(function () {
  'use strict';

  // --- ADOFAI 24-DIRECTION ANGLE LOOKUP ---
  const ADOFAI_ANGLES = {
    'R': 0,    'p': 15,   'J': 30,   'E': 45,   'T': 60,   'h': 75,
    'U': 90,   'q': 105,  'C': 120,  'y': 135,  'A': 150,  'k': 165,
    'L': 180,  's': 195,  'Z': 210,  'G': 225,  'b': 240,  'W': 255,
    'D': 270,  'x': 285,  'N': 300,  'V': 315,  'm': 330,  'u': 345,
    '!': null // Midspin
  };

  // --- BUILT-IN BACKUP .ADOFAI DATA (CORS/file:// 프로토콜 대비 안전 임베딩) ---
  const BUILTIN_SSAMPONG_ADOFAI = {
    pathData: "RRRRRRRRRRRRRRRRURURURURDLDLDLDLERERCRCRZLZLQLQLLLLLLLLLUUUUDDDDRRUULLDDRRUULLDDRRRRRRRRRRRRRRRRRRRRRR",
    settings: {
      song: "쌈뽕 얼불춤 익스트림 (SsamPong Extreme)",
      artist: "SsamPong Studio",
      author: "Antigravity & 선우",
      bpm: 150,
      difficulty: 5
    },
    actions: [
      { floor: 16, eventType: "Twirl" },
      { floor: 32, eventType: "SetSpeed", speedType: "Bpm", beatsPerMinute: 175 },
      { floor: 64, eventType: "SetSpeed", speedType: "Bpm", beatsPerMinute: 200 },
      { floor: 80, eventType: "Twirl" },
      { floor: 88, eventType: "SetSpeed", speedType: "Bpm", beatsPerMinute: 230 }
    ]
  };

  // --- OFFICIAL PRESET STAGES ---
  const PRESET_STAGES = [
    {
      id: 0,
      name: "1. 불과 얼음의 서곡",
      badge: "EASY",
      bpm: 110,
      desc: "180° 직진 & 90° 기본 회전 | BPM 110",
      angles: [
        0, 0, 0, 0, 90, 90, 0, 0, 270, 270, 0, 0, 0,
        90, 90, 180, 180, 270, 270, 0, 0, 90, 0, 0, 0,
        270, 270, 180, 180, 270, 0, 0, 90, 0, 0, 0
      ]
    },
    {
      id: 1,
      name: "2. 네온 펄스 비트",
      badge: "NORMAL",
      bpm: 135,
      desc: "U턴 & 연속 90° 복합 리듬 | BPM 135",
      angles: [
        0, 0, 90, 180, 180, 270, 0, 0, 90, 90, 180, 270,
        270, 0, 90, 0, 90, 180, 180, 90, 0, 0, 270, 270,
        0, 90, 180, 180, 270, 0, 0, 90, 90, 0, 0, 270, 270,
        0, 0, 0, 0
      ]
    },
    {
      id: 2,
      name: "3. 광란의 45° 나선",
      badge: "HARD",
      bpm: 155,
      desc: "45° 사선 대각선 스파이럴 트랙 | BPM 155",
      angles: [
        0, 45, 90, 135, 180, 225, 270, 315, 0, 0,
        45, 45, 90, 90, 135, 180, 225, 270, 315, 0,
        0, 45, 90, 45, 0, 315, 270, 225, 180, 135, 90,
        45, 0, 0, 45, 90, 135, 180, 225, 270, 315, 0, 0, 0
      ]
    },
    {
      id: 3,
      name: "4. 쌈뽕 익스트림 (신규 공식 맵)",
      badge: "OFFICIAL .ADOFAI",
      bpm: 150,
      desc: "저장소 수록 정통 .adofai 맵 파싱 트랙 | BPM 150 -> 230",
      isAdofaiFormat: true,
      adofaiData: BUILTIN_SSAMPONG_ADOFAI
    },
    {
      id: 4,
      name: "5. 쌈뽕 질주 롤러코스터",
      badge: "INSANE",
      bpm: 170,
      desc: "신나는 지그재그 질주 & 변속 루프 | BPM 170",
      angles: [
        0, 0, 90, 0, 90, 0, 270, 0, 270, 0, 90, 90,
        180, 270, 0, 0, 90, 180, 180, 270, 0, 0, 90, 0,
        90, 180, 270, 270, 0, 0, 90, 0, 45, 90, 45, 0,
        315, 270, 315, 0, 0, 90, 180, 270, 0, 0, 0, 0
      ]
    },
    {
      id: 5,
      name: "6. 갓 오브 파이어앤아이스",
      badge: "GOD",
      bpm: 200,
      desc: "얼불춤 마스터를 위한 초고속 극한 피벗 | BPM 200",
      angles: [
        0, 45, 90, 135, 180, 225, 270, 315, 0, 90,
        180, 270, 0, 45, 90, 135, 180, 270, 0, 0,
        270, 180, 90, 0, 45, 90, 135, 180, 225, 270,
        315, 0, 0, 90, 180, 270, 0, 45, 90, 180,
        270, 0, 45, 90, 135, 180, 225, 270, 315, 0, 0, 0
      ]
    }
  ];

  // =========================================================================
  // 1. WEB AUDIO SYNTHESIZER & REAL-TIME BGM ENGINE
  // =========================================================================
  class WebAudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.isMuted = false;
      this.bgmTimer = null;
      this.nextNoteTime = 0;
      this.currentBeat = 0;
      this.bpm = 120;
      this.speedMultiplier = 1.0;
      this.isPlayingBgm = false;
      this.bassNotes = [55, 55, 62, 58, 55, 55, 65, 62]; // Bass midi pitches
      this.leadNotes = [69, 72, 76, 79, 76, 72, 79, 81]; // Arpeggio melody
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // --- COUNTDOWN AUDIO TICK ---
    playCountTick(number) {
      if (!this.ctx) this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (number > 0) {
        // "3", "2", "1" -> crisp woodblock ping (880Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.08);

        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      } else {
        // "GO!" -> bright energetic chord ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1320, t);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.15);

        gain.gain.setValueAtTime(0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      }

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + (number > 0 ? 0.1 : 0.22));
    }

    // --- HIT SOUNDS ---
    playHitSound(judgment) {
      if (!this.ctx) this.init();
      const t = this.ctx.currentTime;

      if (judgment === 'PERFECT') {
        // Crisp woodblock click + golden shimmer
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.045);
        gain.gain.setValueAtTime(0.95, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        // Shimmer
        const bell = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(2400, t);
        bellGain.gain.setValueAtTime(0.3, t);
        bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        bell.connect(bellGain);
        bellGain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.06);
        bell.start(t);
        bell.stop(t + 0.12);
      } else if (judgment === 'GREAT') {
        // Clean woodblock click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, t);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.05);
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
      } else if (judgment === 'EARLY' || judgment === 'LATE') {
        // Dull wood tap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.07);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.08);
      } else if (judgment === 'MISS') {
        // Low metallic buzz / error thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.22);
      }
    }

    // --- STAGE CLEAR JINGLE ---
    playVictoryJingle() {
      if (!this.ctx) this.init();
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + idx * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    }

    // --- REAL-TIME EDM BGM SYNTHESIS ---
    startBgm(bpm, speedMultiplier) {
      this.init();
      this.stopBgm();
      this.bpm = bpm;
      this.speedMultiplier = speedMultiplier || 1.0;
      this.isPlayingBgm = true;
      this.currentBeat = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.05;

      this.bgmTimer = setInterval(() => {
        if (!this.isPlayingBgm || !this.ctx) return;
        const effectiveBpm = this.bpm * this.speedMultiplier;
        const secondsPerBeat = 60.0 / effectiveBpm;
        const secondsPer16th = secondsPerBeat / 4.0;
        const lookahead = 0.15;

        while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
          this.scheduleBeat(this.currentBeat, this.nextNoteTime, secondsPer16th);
          this.nextNoteTime += secondsPer16th;
          this.currentBeat = (this.currentBeat + 1) % 64; // 4-bar loop (16 * 4)
        }
      }, 25);
    }

    updateBgmSpeed(bpm, speedMultiplier) {
      this.bpm = bpm;
      this.speedMultiplier = speedMultiplier || 1.0;
    }

    scheduleBeat(beat16th, time, stepDuration) {
      if (!this.ctx || !this.isPlayingBgm) return;
      const beatInBar = beat16th % 16;
      const beatNumber = Math.floor(beatInBar / 4); // 0, 1, 2, 3

      // 1. Punchy EDM Kick Drum (on beats 0, 1, 2, 3 = four-on-the-floor)
      if (beatInBar % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, time);
        kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

        kickGain.gain.setValueAtTime(0.75, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(time);
        kickOsc.stop(time + 0.13);
      }

      // 2. Snare / Clap (on beats 2 and 4, i.e. beatInBar === 4 and 12)
      if (beatInBar === 4 || beatInBar === 12) {
        this.playSnare(time);
      }

      // 3. Hi-Hat (on every 16th or off-beat)
      if (beatInBar % 2 === 0) {
        const isOffbeat = beatInBar % 4 === 2;
        this.playHiHat(time, isOffbeat ? 0.35 : 0.18, isOffbeat ? 0.07 : 0.03);
      }

      // 4. Synth Bassline (Driving 16th sub-bass)
      if (beatInBar % 2 === 0) {
        const bassPitch = this.bassNotes[Math.floor(beat16th / 8) % this.bassNotes.length];
        this.playBassNote(time, bassPitch, stepDuration * 1.6);
      }

      // 5. Synth Arpeggio Lead (Sparkling melodies)
      if (beat16th % 2 === 1) {
        const leadPitch = this.leadNotes[(beat16th + 3) % this.leadNotes.length];
        this.playLeadNote(time, leadPitch, stepDuration * 1.2);
      }
    }

    playSnare(time) {
      // Noise burst for snare
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.09);
    }

    playHiHat(time, volume, duration) {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + duration);
    }

    playBassNote(time, midiNote, duration) {
      const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + duration);

      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + duration);
    }

    playLeadNote(time, midiNote, duration) {
      const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + duration);
    }

    stopBgm() {
      this.isPlayingBgm = false;
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  // =========================================================================
  // 2. OFFICIAL .ADOFAI PARSER
  // =========================================================================
  function parseAdofaiContent(fileContent) {
    let data;
    try {
      // Clean possible trailing commas or comments if any
      const cleaned = fileContent.replace(/,\s*([\]}])/g, '$1');
      data = JSON.parse(cleaned);
    } catch (err) {
      console.warn("Direct JSON.parse failed, attempting tolerant extraction:", err);
      // Fallback: extract pathData with regex
      const pathMatch = fileContent.match(/"pathData"\s*:\s*"([A-Za-z!]+)"/);
      const bpmMatch = fileContent.match(/"bpm"\s*:\s*([0-9.]+)/);
      const songMatch = fileContent.match(/"song"\s*:\s*"([^"]+)"/);
      if (!pathMatch) {
        throw new Error("올바른 .adofai 포맷 파일이 아닙니다 (pathData 없음).");
      }
      data = {
        pathData: pathMatch[1],
        settings: {
          bpm: bpmMatch ? parseFloat(bpmMatch[1]) : 140,
          song: songMatch ? songMatch[1] : "커스텀 .adofai 맵"
        },
        actions: []
      };
    }

    const pathData = data.pathData || "";
    const angles = [];
    for (let i = 0; i < pathData.length; i++) {
      const char = pathData[i];
      if (ADOFAI_ANGLES.hasOwnProperty(char)) {
        const ang = ADOFAI_ANGLES[char];
        if (ang !== null) angles.push(ang);
      }
    }

    if (angles.length === 0 && Array.isArray(data.angleData)) {
      angles.push(...data.angleData);
    }

    if (angles.length === 0) {
      throw new Error(".adofai 파일에 인식 가능한 타일 경로 데이터가 없습니다.");
    }

    return {
      song: (data.settings && data.settings.song) || "커스텀 .adofai 맵",
      artist: (data.settings && data.settings.artist) || "Custom Artist",
      author: (data.settings && data.settings.author) || "Custom Author",
      bpm: (data.settings && data.settings.bpm) || 150,
      angles: angles,
      actions: data.actions || []
    };
  }

  // =========================================================================
  // 3. PARTICLE SYSTEM & VISUAL EFFECTS
  // =========================================================================
  class Particle {
    constructor(x, y, color, size, speed, isIce) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size || 3;
      this.life = 1.0;
      this.decay = 0.025 + Math.random() * 0.035;
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 2 + 1) * (speed || 1);
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd;
      this.isIce = isIce;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.size = Math.max(0, this.size - 0.05);
      this.rotation += this.rotSpeed;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;

      if (this.isIce) {
        // Diamond ice crystal
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 1.5);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size * 1.5);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Fire flare spark
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // 4. MAIN ADOFAI GAME ENGINE
  // =========================================================================
  class AdofaiGame {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.audio = new WebAudioEngine();

      // UI Elements
      this.countinOverlay = document.getElementById('countin-overlay');
      this.countinText = document.getElementById('countin-text');
      this.countinSub = document.getElementById('countin-sub');
      this.hud = document.getElementById('game-hud');
      this.hudStageName = document.getElementById('hud-stage-name');
      this.hudProgressBar = document.getElementById('hud-progress-bar');
      this.hudPercent = document.getElementById('hud-percent');
      this.hudCombo = document.getElementById('hud-combo');
      this.hudAccuracy = document.getElementById('hud-accuracy');
      this.hudScore = document.getElementById('hud-score');
      this.hitFeedback = document.getElementById('hit-feedback');
      this.hudLifeWrapper = document.getElementById('hud-life-wrapper');
      this.lifeBarFill = document.getElementById('life-bar-fill');

      this.stageMenu = document.getElementById('stage-menu');
      this.editorMenu = document.getElementById('editor-menu');
      this.resultMenu = document.getElementById('result-menu');

      // Mode & Game State
      this.gameMode = localStorage.getItem('adofai_mode') || 'normal'; // 'normal' | 'hardcore'
      this.state = 'MENU'; // 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'CLEAR'
      this.currentStageIndex = 0;
      this.currentStageData = null;
      this.speedMultiplier = 1.0;
      this.audioOffsetMs = 0;

      // Track & Grid Physics
      this.tileSpacing = 88; // Distance in pixels between consecutive tiles
      this.tiles = [];       // [{ x, y, angleDeg, canvasAngle, twirl, bpm }]
      this.currentTileIdx = 0;

      // Planets (Orbs)
      // orbPivot: 0 = Fire is stationary pivot, Ice is revolving; 1 = Ice is pivot, Fire revolves
      this.orbPivot = 0;
      this.fireOrb = { x: 0, y: 0, color: '#ff3d00', glow: '#ff7700' };
      this.iceOrb = { x: 0, y: 0, color: '#00f0ff', glow: '#00ffff' };

      // Rotation Dynamics (Accurate 1 Beat = 180° = π rad)
      this.rotDirection = 1;     // 1: Clockwise in screen coordinates, -1: Counter-Clockwise
      this.currentRotAngle = 0;  // Current absolute rotation angle (radians)
      this.startRotAngle = 0;    // Angle when current tile traversal began
      this.targetRotAngle = 0;   // Target angle of next tile
      this.sweepAngle = Math.PI; // Total angle to cover for this step (radians)
      this.tileDuration = 0.5;   // Expected duration in seconds for this step
      this.tileElapsed = 0;      // Elapsed time in seconds since this step began
      this.stepBpm = 120;        // Current effective BPM

      // Countdown State (3, 2, 1, GO!)
      this.countdownBeat = 3;    // 3 -> 2 -> 1 -> 0(GO)
      this.countdownTimer = 0;
      this.countdownBeatDuration = 0.5;

      // Gameplay Stats & Life
      this.life = 100;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.totalHits = 0;
      this.weightedScore = 0;
      this.counts = { perfect: 0, great: 0, earlyLate: 0, miss: 0 };

      // Visuals & Camera
      this.particles = [];
      this.screenShake = 0;
      this.camX = 0;
      this.camY = 0;
      this.lastTimestamp = 0;
      this.feedbackTimeout = null;

      // Custom Editor State
      this.customSequence = [0, 0, 90, 90, 180, 270, 0, 0];
      this.customBpm = 130;

      // High Scores array
      this.highScores = JSON.parse(localStorage.getItem('adofai_highscores_v2') || '{}');

      this.initWindow();
      this.initEvents();
      this.applyModeUI();
      this.updateHighScoreDisplay();
    }

    initWindow() {
      const resize = () => {
        if (!this.canvas.parentElement) return;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
      };
      window.addEventListener('resize', resize);
      resize();
    }

    applyModeUI() {
      const normalBtn = document.getElementById('mode-normal-btn');
      const hardcoreBtn = document.getElementById('mode-hardcore-btn');

      if (this.gameMode === 'hardcore') {
        normalBtn.classList.remove('active');
        hardcoreBtn.classList.add('active');
        if (this.hudLifeWrapper) {
          this.hudLifeWrapper.style.opacity = '0.5';
          this.hudLifeWrapper.querySelector('.life-label').innerText = '⚡ 1-HIT HARDCORE';
        }
      } else {
        hardcoreBtn.classList.remove('active');
        normalBtn.classList.add('active');
        if (this.hudLifeWrapper) {
          this.hudLifeWrapper.style.opacity = '1';
          this.hudLifeWrapper.querySelector('.life-label').innerText = '❤️ LIFE';
        }
      }
      localStorage.setItem('adofai_mode', this.gameMode);
    }

    updateLifeBar() {
      if (!this.lifeBarFill) return;
      this.life = Math.max(0, Math.min(100, this.life));
      this.lifeBarFill.style.width = `${this.life}%`;

      if (this.life > 50) {
        this.lifeBarFill.style.background = 'linear-gradient(90deg, #00f0ff, #00ff88)';
      } else if (this.life > 25) {
        this.lifeBarFill.style.background = 'linear-gradient(90deg, #ffcc00, #ff8800)';
      } else {
        this.lifeBarFill.style.background = 'linear-gradient(90deg, #ff3366, #ff0033)';
      }
    }

    initEvents() {
      // 1. Mode Buttons
      document.getElementById('mode-normal-btn').addEventListener('click', () => {
        this.gameMode = 'normal';
        this.applyModeUI();
      });
      document.getElementById('mode-hardcore-btn').addEventListener('click', () => {
        this.gameMode = 'hardcore';
        this.applyModeUI();
      });

      // 2. Keyboard Hits & Controls
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;

        // Any Rhythm Hit Keys
        const hitKeys = ['Space', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyS', 'KeyL', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (hitKeys.includes(e.code)) {
          if (this.state === 'PLAYING') {
            e.preventDefault();
            this.handlePlayerHit();
          } else if (this.state === 'COUNTDOWN') {
            e.preventDefault();
            // Optional practice click during countdown
            this.audio.playHitSound('PERFECT');
          } else if (this.state === 'MENU' && e.code === 'Space') {
            this.startSelectedStage();
          }
        }

        // Pause with Esc
        if (e.code === 'Escape') {
          if (this.state === 'PLAYING' || this.state === 'PAUSED') {
            this.togglePause();
          }
        }
      });

      // 3. Pointer / Touch / Click Hit Input
      this.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.init();
        if (this.state === 'PLAYING') {
          this.handlePlayerHit();
        } else if (this.state === 'COUNTDOWN') {
          this.audio.playHitSound('PERFECT');
        }
      });

      // 4. Stage Select Cards
      const stageCards = document.querySelectorAll('.stage-card');
      stageCards.forEach((card) => {
        card.addEventListener('click', () => {
          stageCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.currentStageIndex = parseInt(card.getAttribute('data-stage'), 10);
        });
      });

      // 5. Options (Speed & Audio Offset)
      const speedSelect = document.getElementById('speed-select');
      speedSelect.addEventListener('change', (e) => {
        this.speedMultiplier = parseFloat(e.target.value);
        if (this.state === 'PLAYING') {
          this.audio.updateBgmSpeed(this.stepBpm, this.speedMultiplier);
        }
      });

      const offsetInput = document.getElementById('offset-input');
      const offsetVal = document.getElementById('offset-val');
      offsetInput.addEventListener('input', (e) => {
        this.audioOffsetMs = parseInt(e.target.value, 10);
        offsetVal.innerText = `${this.audioOffsetMs}ms`;
      });

      // 6. Stage Menu Buttons
      document.getElementById('start-stage-btn').addEventListener('click', () => {
        this.startSelectedStage();
      });

      document.getElementById('open-editor-btn').addEventListener('click', () => {
        this.stageMenu.classList.add('hidden');
        this.editorMenu.classList.remove('hidden');
        this.syncEditorInputs();
      });

      // 7. Custom .adofai File Loader
      const fileInput = document.getElementById('adofai-file-input');
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          this.loadCustomAdofaiText(event.target.result, file.name);
        };
        reader.readAsText(file);
      });

      // Built-in .adofai Quick Load Button
      document.getElementById('load-builtin-adofai-btn').addEventListener('click', () => {
        // Fetch or load the built-in map
        fetch('쌈뽕_얼불춤_신규맵.adofai')
          .then(res => res.text())
          .then(text => this.loadCustomAdofaiText(text, "쌈뽕_얼불춤_신규맵.adofai"))
          .catch(() => {
            // Fallback to embedded data if fetch blocked by file:// protocol
            this.loadCustomAdofaiText(JSON.stringify(BUILTIN_SSAMPONG_ADOFAI), "쌈뽕_얼불춤_신규맵.adofai");
          });
      });

      // Drag and Drop .adofai file onto canvas
      window.addEventListener('dragover', (e) => e.preventDefault());
      window.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            this.loadCustomAdofaiText(event.target.result, file.name);
          };
          reader.readAsText(file);
        }
      });

      // 8. Editor Controls
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.loadEditorPreset(e.target.getAttribute('data-preset'));
        });
      });

      document.querySelectorAll('.dir-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const dir = parseInt(e.target.getAttribute('data-dir'), 10);
          this.customSequence.push(dir);
          this.syncEditorInputs();
        });
      });

      document.getElementById('apply-sequence-btn').addEventListener('click', () => {
        const raw = document.getElementById('tile-sequence').value;
        const parsed = raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (parsed.length > 0) {
          this.customSequence = parsed;
          alert(`총 ${parsed.length}개 타일 시퀀스가 성공적으로 적용되었습니다!`);
        }
      });

      document.getElementById('clear-tiles-btn').addEventListener('click', () => {
        this.customSequence = [0];
        this.syncEditorInputs();
      });

      document.getElementById('play-custom-btn').addEventListener('click', () => {
        const customBpmInput = parseInt(document.getElementById('custom-bpm').value, 10) || 130;
        this.customBpm = customBpmInput;
        this.editorMenu.classList.add('hidden');
        this.startStage({
          id: 'custom',
          name: "🎨 커스텀 창작 트랙",
          bpm: this.customBpm,
          angles: this.customSequence
        });
      });

      document.getElementById('close-editor-btn').addEventListener('click', () => {
        this.editorMenu.classList.add('hidden');
        this.stageMenu.classList.remove('hidden');
      });

      // 9. Pause & Result Buttons
      document.getElementById('pause-btn').addEventListener('click', () => {
        this.togglePause();
      });

      document.getElementById('retry-btn').addEventListener('click', () => {
        this.resultMenu.classList.add('hidden');
        if (this.currentStageData) {
          this.startStage(this.currentStageData);
        } else {
          this.startSelectedStage();
        }
      });

      document.getElementById('next-stage-btn').addEventListener('click', () => {
        this.resultMenu.classList.add('hidden');
        this.currentStageIndex = (this.currentStageIndex + 1) % PRESET_STAGES.length;
        const stageCards = document.querySelectorAll('.stage-card');
        stageCards.forEach((c, idx) => {
          c.classList.toggle('active', idx === this.currentStageIndex);
        });
        this.startSelectedStage();
      });

      document.getElementById('result-menu-btn').addEventListener('click', () => {
        this.resultMenu.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.stageMenu.classList.remove('hidden');
        this.state = 'MENU';
      });
    }

    syncEditorInputs() {
      document.getElementById('tile-sequence').value = this.customSequence.join(', ');
      document.getElementById('custom-bpm').value = this.customBpm;
    }

    loadEditorPreset(preset) {
      if (preset === 'sprint') {
        this.customSequence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.customBpm = 160;
      } else if (preset === 'zigzag') {
        this.customSequence = [0, 90, 0, 90, 0, 270, 0, 270, 0, 90, 0, 90, 180, 270, 0, 0];
        this.customBpm = 135;
      } else if (preset === 'spiral') {
        this.customSequence = [0, 45, 90, 135, 180, 225, 270, 315, 0, 45, 90, 135, 180, 225, 270, 315, 0];
        this.customBpm = 145;
      } else if (preset === 'roller') {
        this.customSequence = [0, 0, 45, 90, 45, 0, 315, 270, 315, 0, 0, 90, 180, 270, 0, 0];
        this.customBpm = 150;
      } else if (preset === 'star') {
        this.customSequence = [0, 75, 150, 225, 300, 15, 90, 165, 240, 315, 30, 105, 180, 0];
        this.customBpm = 120;
      }
      this.syncEditorInputs();
    }

    loadCustomAdofaiText(text, filename) {
      try {
        const parsed = parseAdofaiContent(text);
        alert(`🎉 공식 .adofai 맵 로드 성공!\n\n곡명: ${parsed.song}\nBPM: ${parsed.bpm}\n총 타일 수: ${parsed.angles.length + 1}개`);

        const customStage = {
          id: 'adofai_file',
          name: `📁 ${parsed.song || filename}`,
          bpm: parsed.bpm || 150,
          angles: parsed.angles,
          actions: parsed.actions,
          isAdofaiFormat: true
        };

        this.stageMenu.classList.add('hidden');
        this.editorMenu.classList.add('hidden');
        this.startStage(customStage);
      } catch (err) {
        alert(`❌ .adofai 파싱 오류:\n${err.message}`);
      }
    }

    startSelectedStage() {
      const stage = PRESET_STAGES[this.currentStageIndex];
      if (!stage) return;

      if (stage.isAdofaiFormat && stage.adofaiData) {
        const parsed = parseAdofaiContent(JSON.stringify(stage.adofaiData));
        this.startStage({
          id: stage.id,
          name: stage.name,
          bpm: parsed.bpm,
          angles: parsed.angles,
          actions: parsed.actions
        });
      } else {
        this.startStage(stage);
      }
    }

    // =========================================================================
    // 5. STAGE GENERATION & PHYSICS SETUP
    // =========================================================================
    startStage(stageData) {
      this.currentStageData = stageData;
      this.stepBpm = stageData.bpm || 130;
      this.speedMultiplier = parseFloat(document.getElementById('speed-select').value) || 1.0;

      // Build Tiles Coordinates
      this.buildTrack(stageData.angles, stageData.actions);

      // Reset Stats & Life
      this.currentTileIdx = 0;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.totalHits = 0;
      this.weightedScore = 0;
      this.counts = { perfect: 0, great: 0, earlyLate: 0, miss: 0 };
      this.life = 100;
      this.particles = [];
      this.screenShake = 0;

      // Setup First Pivot (Tile 0)
      this.orbPivot = 0; // Fire is anchored at Tile 0, Ice orbits
      this.rotDirection = 1; // Default Clockwise

      const tile0 = this.tiles[0];
      const tile1 = this.tiles[1];

      this.fireOrb.x = tile0.x;
      this.fireOrb.y = tile0.y;

      // Calculate initial angles
      // Target canvas angle to tile 1
      const targetAngle = tile0.nextCanvasAngle;
      // Start 180° (1 beat) behind target in direction of rotation
      const startAngle = targetAngle - this.rotDirection * Math.PI;

      this.startRotAngle = startAngle;
      this.targetRotAngle = targetAngle;
      this.currentRotAngle = startAngle;
      this.sweepAngle = Math.PI; // 1 beat
      this.tileDuration = 60.0 / (this.stepBpm * this.speedMultiplier);
      this.tileElapsed = 0;

      this.iceOrb.x = tile0.x + Math.cos(startAngle) * this.tileSpacing;
      this.iceOrb.y = tile0.y + Math.sin(startAngle) * this.tileSpacing;

      // Camera positioned at Tile 0
      this.camX = tile0.x;
      this.camY = tile0.y;

      // UI Prep
      this.stageMenu.classList.add('hidden');
      this.editorMenu.classList.add('hidden');
      this.resultMenu.classList.add('hidden');
      this.hud.classList.remove('hidden');

      this.hudStageName.innerText = stageData.name || `STAGE ${this.currentStageIndex + 1}`;
      this.updateLifeBar();
      this.updateHUD();

      // Begin 3-Beat Visual Countdown Lead-In ("3, 2, 1, GO!")
      this.startCountdown();

      // Start Animation Loop
      this.lastTimestamp = performance.now();
      requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    buildTrack(angles, actions) {
      this.tiles = [];
      // Tile 0 at origin (0, 0)
      let curX = 0;
      let curY = 0;

      // Map actions by floor index
      const actionsMap = {};
      if (Array.isArray(actions)) {
        actions.forEach(a => {
          if (typeof a.floor === 'number') {
            if (!actionsMap[a.floor]) actionsMap[a.floor] = [];
            actionsMap[a.floor].push(a);
          }
        });
      }

      // Add Tile 0
      this.tiles.push({
        index: 0,
        x: curX,
        y: curY,
        angleDeg: angles[0] !== undefined ? angles[0] : 0,
        canvasAngle: 0,
        nextCanvasAngle: 0,
        actions: actionsMap[0] || []
      });

      // Build subsequent tiles
      for (let i = 0; i < angles.length; i++) {
        const deg = angles[i];
        // Standard ADOFAI coordinates:
        // 0° = Right (+x, 0)
        // 90° = Up (0, -y)
        // 180° = Left (-x, 0)
        // 270° = Down (0, +y)
        const rad = (deg * Math.PI) / 180;
        const dx = Math.cos(rad) * this.tileSpacing;
        const dy = -Math.sin(rad) * this.tileSpacing;

        curX += dx;
        curY += dy;

        // Canvas angle φ where dx = S cos φ, dy = S sin φ
        const canvasAngle = Math.atan2(dy, dx);

        // Update previous tile's next angle
        this.tiles[i].nextCanvasAngle = canvasAngle;

        this.tiles.push({
          index: i + 1,
          x: curX,
          y: curY,
          angleDeg: deg,
          canvasAngle: canvasAngle,
          nextCanvasAngle: canvasAngle,
          actions: actionsMap[i + 1] || []
        });
      }

      // Set final tile next angle to continue in same direction
      this.tiles[this.tiles.length - 1].nextCanvasAngle = this.tiles[this.tiles.length - 2].nextCanvasAngle;
    }

    // =========================================================================
    // 6. COUNTDOWN LEAD-IN ("3, 2, 1, GO!")
    // =========================================================================
    startCountdown() {
      this.state = 'COUNTDOWN';
      this.countdownBeat = 3;
      this.countdownBeatDuration = 60.0 / (this.stepBpm * this.speedMultiplier);
      this.countdownTimer = 0;

      this.countinOverlay.classList.remove('hidden');
      this.showCountdownBeat(3);

      // Play audio tick for 3
      this.audio.playCountTick(3);
    }

    showCountdownBeat(beat) {
      if (!this.countinText) return;
      if (beat === 3) {
        this.countinText.innerText = "3";
        this.countinText.style.color = "#00f0ff";
        this.countinSub.innerText = "박자에 맞춰 호흡을 가다듬으세요!";
      } else if (beat === 2) {
        this.countinText.innerText = "2";
        this.countinText.style.color = "#ffcc00";
        this.countinSub.innerText = "첫 번째 타일이 다가옵니다!";
      } else if (beat === 1) {
        this.countinText.innerText = "1";
        this.countinText.style.color = "#ff4500";
        this.countinSub.innerText = "준비하시고...";
      } else if (beat === 0) {
        this.countinText.innerText = "GO!";
        this.countinText.style.color = "#00ff88";
        this.countinSub.innerText = "START!";
      }

      // Trigger pulse animation
      this.countinText.style.animation = 'none';
      void this.countinText.offsetWidth; // trigger reflow
      this.countinText.style.animation = 'countin-pulse 0.45s ease-out';
    }

    // =========================================================================
    // 7. GAME LOOP & UPDATE PHYSICS
    // =========================================================================
    gameLoop(timestamp) {
      if (this.state !== 'PLAYING' && this.state !== 'COUNTDOWN') {
        if (this.state === 'PAUSED') {
          // Render static frame when paused
          this.render();
        }
        return;
      }

      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05); // cap dt at 50ms to prevent huge jumps
      this.lastTimestamp = timestamp;

      if (this.state === 'COUNTDOWN') {
        this.updateCountdown(dt);
      } else if (this.state === 'PLAYING') {
        this.updateGameplay(dt);
      }

      this.updateVisualEffects(dt);
      this.render();

      requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    updateCountdown(dt) {
      this.countdownTimer += dt;
      // In countdown, let the orbiting planet rotate smoothly around tile 0 so player feels the tempo
      const omega = ((Math.PI * this.stepBpm * this.speedMultiplier) / 60) * this.rotDirection;
      this.currentRotAngle += omega * dt;

      const pivotTile = this.tiles[0];
      const orbitX = pivotTile.x + Math.cos(this.currentRotAngle) * this.tileSpacing;
      const orbitY = pivotTile.y + Math.sin(this.currentRotAngle) * this.tileSpacing;

      if (this.orbPivot === 0) {
        this.fireOrb.x = pivotTile.x;
        this.fireOrb.y = pivotTile.y;
        this.iceOrb.x = orbitX;
        this.iceOrb.y = orbitY;
      } else {
        this.iceOrb.x = pivotTile.x;
        this.iceOrb.y = pivotTile.y;
        this.fireOrb.x = orbitX;
        this.fireOrb.y = orbitY;
      }

      // Check beat transition
      if (this.countdownTimer >= this.countdownBeatDuration) {
        this.countdownTimer -= this.countdownBeatDuration;
        this.countdownBeat--;

        if (this.countdownBeat >= 0) {
          this.showCountdownBeat(this.countdownBeat);
          this.audio.playCountTick(this.countdownBeat);
        } else {
          // Countdown Finished -> Transition to PLAYING!
          this.countinOverlay.classList.add('hidden');
          this.state = 'PLAYING';

          // Start Synchronized Real-Time Synth BGM!
          this.audio.startBgm(this.stepBpm, this.speedMultiplier);

          // Reset rotation for Tile 0 -> Tile 1 hit
          this.prepareTileStep(0);
        }
      }
    }

    prepareTileStep(tileIndex) {
      this.currentTileIdx = tileIndex;
      if (tileIndex >= this.tiles.length - 1) {
        this.triggerStageClear();
        return;
      }

      const curTile = this.tiles[tileIndex];
      const nextTile = this.tiles[tileIndex + 1];

      // Check actions on this tile (Twirl / SetSpeed)
      if (curTile.actions && curTile.actions.length > 0) {
        curTile.actions.forEach(act => {
          if (act.eventType === 'Twirl') {
            this.rotDirection *= -1; // Flip rotation direction!
          } else if (act.eventType === 'SetSpeed') {
            if (act.beatsPerMinute) {
              this.stepBpm = act.beatsPerMinute;
              this.audio.updateBgmSpeed(this.stepBpm, this.speedMultiplier);
            }
          }
        });
      }

      // Anchor the pivot planet
      let pivotX = curTile.x;
      let pivotY = curTile.y;

      if (this.orbPivot === 0) {
        this.fireOrb.x = pivotX;
        this.fireOrb.y = pivotY;
      } else {
        this.iceOrb.x = pivotX;
        this.iceOrb.y = pivotY;
      }

      // Start angle of orbiting planet
      let startAngle;
      if (tileIndex === 0) {
        startAngle = curTile.nextCanvasAngle - this.rotDirection * Math.PI;
      } else {
        // Enters from the previous tile direction + 180°
        const prevTile = this.tiles[tileIndex - 1];
        const entryAngle = Math.atan2(curTile.y - prevTile.y, curTile.x - prevTile.x);
        startAngle = entryAngle + Math.PI;
      }

      // Target angle towards next tile
      const targetAngle = Math.atan2(nextTile.y - curTile.y, nextTile.x - curTile.x);

      // Sweep angle Δφ in the current rotation direction
      let deltaAngle = 0;
      if (this.rotDirection === 1) {
        // Clockwise in canvas coords (increasing angle)
        deltaAngle = targetAngle - startAngle;
        while (deltaAngle <= 0.0001) deltaAngle += Math.PI * 2;
      } else {
        // Counter-Clockwise in canvas coords (decreasing angle)
        deltaAngle = startAngle - targetAngle;
        while (deltaAngle <= 0.0001) deltaAngle += Math.PI * 2;
      }

      this.startRotAngle = startAngle;
      this.targetRotAngle = targetAngle;
      this.currentRotAngle = startAngle;
      this.sweepAngle = deltaAngle;

      // 1 beat = 180° = π rad
      const beats = deltaAngle / Math.PI;
      this.tileDuration = beats * (60.0 / (this.stepBpm * this.speedMultiplier));
      this.tileElapsed = 0;

      // Position orbiting planet at start
      const orbitX = pivotX + Math.cos(startAngle) * this.tileSpacing;
      const orbitY = pivotY + Math.sin(startAngle) * this.tileSpacing;

      if (this.orbPivot === 0) {
        this.iceOrb.x = orbitX;
        this.iceOrb.y = orbitY;
      } else {
        this.fireOrb.x = orbitX;
        this.fireOrb.y = orbitY;
      }
    }

    updateGameplay(dt) {
      if (this.currentTileIdx >= this.tiles.length - 1) return;

      this.tileElapsed += dt;

      // Constant angular velocity: 1 beat = 180° (π rad) in (60 / BPM) sec
      const omega = ((Math.PI * this.stepBpm * this.speedMultiplier) / 60);
      this.currentRotAngle += omega * dt * this.rotDirection;

      const pivotTile = this.tiles[this.currentTileIdx];
      const orbitX = pivotTile.x + Math.cos(this.currentRotAngle) * this.tileSpacing;
      const orbitY = pivotTile.y + Math.sin(this.currentRotAngle) * this.tileSpacing;

      if (this.orbPivot === 0) {
        this.iceOrb.x = orbitX;
        this.iceOrb.y = orbitY;
        // Ice particle trail
        if (Math.random() < 0.6) {
          this.particles.push(new Particle(orbitX, orbitY, '#00f0ff', 2.5, 1.2, true));
        }
      } else {
        this.fireOrb.x = orbitX;
        this.fireOrb.y = orbitY;
        // Fire particle trail
        if (Math.random() < 0.6) {
          this.particles.push(new Particle(orbitX, orbitY, '#ff4500', 3, 1.5, false));
        }
      }

      // OVER-ROTATION CHECK (Miss due to late reaction)
      // Check if orb overshot target angle by more than 90° (π/2 rad = 0.5 beat)
      let overAngle = 0;
      if (this.rotDirection === 1) {
        overAngle = this.currentRotAngle - this.targetRotAngle;
        while (overAngle < -Math.PI) overAngle += Math.PI * 2;
        while (overAngle > Math.PI) overAngle -= Math.PI * 2;
      } else {
        overAngle = this.targetRotAngle - this.currentRotAngle;
        while (overAngle < -Math.PI) overAngle += Math.PI * 2;
        while (overAngle > Math.PI) overAngle -= Math.PI * 2;
      }

      // If over-rotated past target by >= 90 degrees (1.57 rad)
      if (overAngle > 1.57 && this.tileElapsed > this.tileDuration + 0.12) {
        this.handleMissOverRotation();
      }
    }

    // =========================================================================
    // 8. PLAYER HIT & TIMING EVALUATION
    // =========================================================================
    handlePlayerHit() {
      if (this.state !== 'PLAYING') return;
      if (this.currentTileIdx >= this.tiles.length - 1) return;

      // Timing error in seconds: negative = early, positive = late
      // Apply user audio offset
      const timeError = (this.tileElapsed - this.tileDuration) - (this.audioOffsetMs / 1000);
      const absError = Math.abs(timeError);

      let judgment = '';
      let scoreAdd = 0;
      let lifeDelta = 0;

      // Authentic rhythm game timing window
      if (absError <= 0.045) {
        // PERFECT (within ±45ms)
        judgment = 'PERFECT';
        scoreAdd = 1000;
        lifeDelta = 4;
        this.counts.perfect++;
        this.combo++;
        this.weightedScore += 1.0;
      } else if (absError <= 0.085) {
        // GREAT (within ±85ms)
        judgment = 'GREAT';
        scoreAdd = 750;
        lifeDelta = 2;
        this.counts.great++;
        this.combo++;
        this.weightedScore += 0.8;
      } else if (absError <= 0.140) {
        // EARLY / LATE (within ±140ms)
        judgment = timeError < 0 ? 'EARLY' : 'LATE';
        scoreAdd = 350;
        lifeDelta = this.gameMode === 'hardcore' ? -100 : -6;
        this.counts.earlyLate++;
        this.combo++; // Keep combo in casual or broken? In ADOFAI early/late keeps combo
        this.weightedScore += 0.5;
      } else {
        // Too early or too late to be a valid hit on current tile
        // If it's way too early, ignore to prevent accidental misfires
        if (timeError < -0.22) {
          return;
        }
        // Count as stray tap / early miss
        judgment = 'MISS';
        scoreAdd = 0;
        lifeDelta = this.gameMode === 'hardcore' ? -100 : -20;
        this.counts.miss++;
        this.combo = 0;
      }

      this.totalHits++;
      this.score += scoreAdd + Math.min(this.combo * 10, 500);
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      // Play sound
      this.audio.playHitSound(judgment);

      // Show Feedback
      this.showHitFeedback(judgment);

      // Apply Life
      this.life += lifeDelta;
      this.updateLifeBar();

      // Check Game Over
      if (this.life <= 0 || (this.gameMode === 'hardcore' && judgment === 'MISS')) {
        this.triggerFailure('GAME OVER');
        return;
      }

      // Create Hit FX Burst
      const targetTile = this.tiles[this.currentTileIdx + 1];
      this.spawnHitBurst(targetTile.x, targetTile.y, judgment);

      // Advance to next tile!
      this.advanceToNextTile();
    }

    handleMissOverRotation() {
      this.counts.miss++;
      this.combo = 0;
      this.totalHits++;

      this.audio.playHitSound('MISS');
      this.showHitFeedback('MISS');
      this.screenShake = 12;

      const penalty = this.gameMode === 'hardcore' ? 100 : 25;
      this.life -= penalty;
      this.updateLifeBar();

      if (this.life <= 0 || this.gameMode === 'hardcore') {
        this.triggerFailure('TOO LATE');
        return;
      }

      // Auto-advance so player can continue in normal mode
      this.advanceToNextTile();
    }

    advanceToNextTile() {
      // Swap pivot role!
      this.orbPivot = this.orbPivot === 0 ? 1 : 0;
      this.prepareTileStep(this.currentTileIdx + 1);
      this.updateHUD();
    }

    showHitFeedback(judgment) {
      if (!this.hitFeedback) return;
      this.hitFeedback.innerText = judgment;
      this.hitFeedback.className = `hit-feedback ${judgment.toLowerCase()}`;

      if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
      this.feedbackTimeout = setTimeout(() => {
        if (this.hitFeedback) this.hitFeedback.className = 'hit-feedback';
      }, 700);
    }

    spawnHitBurst(x, y, judgment) {
      const count = judgment === 'PERFECT' ? 22 : judgment === 'GREAT' ? 14 : 8;
      const color = judgment === 'PERFECT' ? '#ffd700' : judgment === 'GREAT' ? '#00f0ff' : '#ff4500';
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(x, y, color, 3.5, 2.5, false));
      }
    }

    updateVisualEffects(dt) {
      // Smooth camera follow midpoint of orbs
      const targetCamX = (this.fireOrb.x + this.iceOrb.x) / 2;
      const targetCamY = (this.fireOrb.y + this.iceOrb.y) / 2;
      this.camX += (targetCamX - this.camX) * 0.12;
      this.camY += (targetCamY - this.camY) * 0.12;

      // Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update();
        if (this.particles[i].life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Screen shake decay
      if (this.screenShake > 0) {
        this.screenShake *= 0.88;
        if (this.screenShake < 0.1) this.screenShake = 0;
      }
    }

    updateHUD() {
      const pct = Math.floor((this.currentTileIdx / Math.max(1, this.tiles.length - 1)) * 100);
      this.hudProgressBar.style.width = `${pct}%`;
      this.hudPercent.innerText = `${pct}%`;
      this.hudCombo.innerText = this.combo;
      this.hudScore.innerText = this.score.toLocaleString();

      const acc = this.totalHits > 0 ? (this.weightedScore / this.totalHits) * 100 : 100;
      this.hudAccuracy.innerText = `${acc.toFixed(1)}%`;
    }

    // =========================================================================
    // 9. STAGE CLEAR & GAME OVER
    // =========================================================================
    triggerStageClear() {
      this.state = 'CLEAR';
      this.audio.stopBgm();
      this.audio.playVictoryJingle();

      // Confetti Celebration
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.6 }
        });
      }

      // Save High Score
      const acc = this.totalHits > 0 ? (this.weightedScore / this.totalHits) * 100 : 100;
      this.saveHighScore(this.currentStageData.id, this.score, acc);

      // Show Result Panel
      this.showResultScreen(true, acc);
    }

    triggerFailure(reason) {
      this.state = 'GAMEOVER';
      this.audio.stopBgm();
      this.audio.playHitSound('MISS');
      this.screenShake = 20;

      const acc = this.totalHits > 0 ? (this.weightedScore / this.totalHits) * 100 : 0;
      this.showResultScreen(false, acc, reason);
    }

    showResultScreen(isClear, acc, failReason) {
      this.hud.classList.add('hidden');
      this.countinOverlay.classList.add('hidden');
      this.resultMenu.classList.remove('hidden');

      const trophy = document.getElementById('result-trophy');
      const title = document.getElementById('result-title');
      const rank = document.getElementById('result-rank');
      const nextBtn = document.getElementById('next-stage-btn');

      if (isClear) {
        trophy.innerText = '🏆';
        title.innerText = 'STAGE CLEAR!';
        title.style.color = '#00ff88';

        if (acc >= 98 && this.counts.miss === 0) rank.innerText = 'S+';
        else if (acc >= 95) rank.innerText = 'S';
        else if (acc >= 88) rank.innerText = 'A';
        else if (acc >= 75) rank.innerText = 'B';
        else rank.innerText = 'C';

        rank.style.background = 'linear-gradient(135deg, #00f0ff, #00ff88)';
        nextBtn.style.display = 'inline-block';
      } else {
        trophy.innerText = '💥';
        title.innerText = failReason || 'GAME OVER';
        title.style.color = '#ff3366';
        rank.innerText = 'F';
        rank.style.background = 'linear-gradient(135deg, #ff3366, #ff0033)';
        nextBtn.style.display = 'none';
      }

      document.getElementById('res-score').innerText = this.score.toLocaleString();
      document.getElementById('res-accuracy').innerText = `${acc.toFixed(1)}%`;
      document.getElementById('res-maxcombo').innerText = this.maxCombo;
      document.getElementById('res-perfect').innerText = this.counts.perfect;
      document.getElementById('res-great').innerText = this.counts.great;
      document.getElementById('res-earlylate').innerText = this.counts.earlyLate;
      document.getElementById('res-miss').innerText = this.counts.miss;

      this.updateHighScoreDisplay();
    }

    saveHighScore(stageId, score, acc) {
      if (stageId === undefined || stageId === 'custom' || stageId === 'adofai_file') return;
      const prev = this.highScores[stageId] || { score: 0, acc: 0 };
      if (score > prev.score) {
        this.highScores[stageId] = { score, acc: Math.max(prev.acc, acc) };
        localStorage.setItem('adofai_highscores_v2', JSON.stringify(this.highScores));
      }
    }

    updateHighScoreDisplay() {
      for (let i = 0; i < 6; i++) {
        const el = document.getElementById(`hs-${i}`);
        if (el) {
          const record = this.highScores[i];
          if (record && record.score > 0) {
            el.innerText = `${record.score.toLocaleString()}점 (${record.acc.toFixed(1)}%)`;
          } else {
            el.innerText = '기록 없음';
          }
        }
      }
    }

    togglePause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.audio.stopBgm();
        document.getElementById('pause-btn').innerText = '▶️';
      } else if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        this.lastTimestamp = performance.now();
        this.audio.startBgm(this.stepBpm, this.speedMultiplier);
        document.getElementById('pause-btn').innerText = '⏸️';
        requestAnimationFrame((ts) => this.gameLoop(ts));
      }
    }

    // =========================================================================
    // 10. CANVAS RENDERING
    // =========================================================================
    render() {
      const width = this.canvas.width;
      const height = this.canvas.height;

      this.ctx.save();
      this.ctx.clearRect(0, 0, width, height);

      // Screen Shake
      if (this.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * this.screenShake;
        const shakeY = (Math.random() - 0.5) * this.screenShake;
        this.ctx.translate(shakeX, shakeY);
      }

      // Camera Centered
      this.ctx.translate(width / 2 - this.camX, height / 2 - this.camY);

      // 1. Cyberpunk Grid & Stars
      this.drawBackgroundGrid();

      // 2. Track & Tiles
      this.drawTrack();

      // 3. Particle Effects
      this.particles.forEach(p => p.draw(this.ctx));

      // 4. Fire & Ice Orbs + Orbit Line
      this.drawOrbs();

      this.ctx.restore();
    }

    drawBackgroundGrid() {
      const step = 140;
      const startX = Math.floor((this.camX - this.canvas.width) / step) * step;
      const endX = Math.ceil((this.camX + this.canvas.width) / step) * step;
      const startY = Math.floor((this.camY - this.canvas.height) / step) * step;
      const endY = Math.ceil((this.camY + this.canvas.height) / step) * step;

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      for (let x = startX; x <= endX; x += step) {
        this.ctx.moveTo(x, startY);
        this.ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += step) {
        this.ctx.moveTo(startX, y);
        this.ctx.lineTo(endX, y);
      }
      this.ctx.stroke();
    }

    drawTrack() {
      const total = this.tiles.length;
      if (total === 0) return;

      // 1. Connecting Track Glow Line
      this.ctx.lineWidth = 14;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      // Outer glow
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      this.ctx.beginPath();
      this.ctx.moveTo(this.tiles[0].x, this.tiles[0].y);
      for (let i = 1; i < total; i++) {
        this.ctx.lineTo(this.tiles[i].x, this.tiles[i].y);
      }
      this.ctx.stroke();

      // Inner core path
      this.ctx.lineWidth = 6;
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      this.ctx.stroke();

      // 2. Individual Tiles
      for (let i = 0; i < total; i++) {
        const tile = this.tiles[i];
        const isPassed = i < this.currentTileIdx;
        const isCurrent = i === this.currentTileIdx;
        const isTarget = i === this.currentTileIdx + 1;

        this.ctx.save();
        this.ctx.translate(tile.x, tile.y);

        // Tile Radius
        const r = 24;

        if (isPassed) {
          // Completed tile: dimmed neon
          this.ctx.fillStyle = 'rgba(15, 28, 48, 0.85)';
          this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
          this.ctx.lineWidth = 2;
        } else if (isCurrent) {
          // Active Pivot Tile: vibrant glow
          this.ctx.fillStyle = 'rgba(255, 69, 0, 0.25)';
          this.ctx.strokeStyle = '#ff4500';
          this.ctx.shadowColor = '#ff4500';
          this.ctx.shadowBlur = 18;
          this.ctx.lineWidth = 3.5;
        } else if (isTarget) {
          // Incoming Target Tile: pulsating gold
          const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.08;
          this.ctx.scale(pulse, pulse);
          this.ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
          this.ctx.strokeStyle = '#ffd700';
          this.ctx.shadowColor = '#ffd700';
          this.ctx.shadowBlur = 20;
          this.ctx.lineWidth = 4;
        } else {
          // Upcoming tile
          this.ctx.fillStyle = 'rgba(20, 32, 54, 0.7)';
          this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
          this.ctx.lineWidth = 2;
        }

        // Rounded diamond tile
        this.ctx.beginPath();
        this.ctx.roundRect(-r / 2, -r / 2, r, r, 6);
        this.ctx.fill();
        this.ctx.stroke();

        // Tile Number or Marker
        if (i % 5 === 0 || i === total - 1 || isTarget) {
          this.ctx.fillStyle = isTarget ? '#ffd700' : 'rgba(255, 255, 255, 0.6)';
          this.ctx.font = '10px "Pretendard", sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(i.toString(), 0, 0);
        }

        this.ctx.restore();
      }
    }

    drawOrbs() {
      const pivotTile = this.tiles[this.currentTileIdx];
      if (!pivotTile) return;

      // 1. Draw Orbit Ring
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([6, 6]);
      this.ctx.beginPath();
      this.ctx.arc(pivotTile.x, pivotTile.y, this.tileSpacing, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      // 2. Draw Arc from Start to Current
      this.ctx.save();
      this.ctx.strokeStyle = this.orbPivot === 0 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 69, 0, 0.45)';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      if (this.rotDirection === 1) {
        this.ctx.arc(pivotTile.x, pivotTile.y, this.tileSpacing, this.startRotAngle, this.currentRotAngle, false);
      } else {
        this.ctx.arc(pivotTile.x, pivotTile.y, this.tileSpacing, this.startRotAngle, this.currentRotAngle, true);
      }
      this.ctx.stroke();
      this.ctx.restore();

      // 3. Draw Fire Orb
      this.drawPlanet(this.fireOrb.x, this.fireOrb.y, '#ff3300', '#ff8800', '#ffffff', false);

      // 4. Draw Ice Orb
      this.drawPlanet(this.iceOrb.x, this.iceOrb.y, '#00d0ff', '#88ffff', '#ffffff', true);
    }

    drawPlanet(x, y, primaryColor, glowColor, coreColor, isIce) {
      this.ctx.save();
      this.ctx.translate(x, y);

      const radius = 18;

      // Outer Corona Glow
      const grad = this.ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius * 2.2);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(0.5, primaryColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
      this.ctx.fill();

      // Planet Body
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 22;
      this.ctx.fillStyle = primaryColor;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Core Highlight
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = coreColor;
      this.ctx.beginPath();
      this.ctx.arc(-radius * 0.25, -radius * 0.25, radius * 0.45, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  // --- INITIALIZE GAME ON DOM READY ---
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new AdofaiGame();
  });

})();
