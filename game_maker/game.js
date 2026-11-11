/**
 * 🎮 쌈뽕 게임 메이커 (SsamPong Game Maker)
 * Sandbox Platformer Game Builder & Community Player
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const GRID_COLS = 75; // Map width in tiles
  const GRID_ROWS = 16; // Map height in tiles
  const TILE_SIZE = 40; // Pixels per tile
  const MAP_WIDTH = GRID_COLS * TILE_SIZE;
  const MAP_HEIGHT = GRID_ROWS * TILE_SIZE;

  // Tile Types
  const TILE = {
    EMPTY: 0,
    GROUND: 1,
    JUMP_PAD: 2,
    SPIKE: 3,
    ICE: 4,
    BRICK: 5,
    COIN: 6,
    GEM: 7,
    GOAL: 8
  };

  // --- DOM Elements ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const viewportContainer = document.getElementById('viewport-container');

  const btnModeEdit = document.getElementById('btn-mode-edit');
  const btnModePlay = document.getElementById('btn-mode-play');
  const paletteSidebar = document.getElementById('palette-sidebar');
  const toolButtons = document.querySelectorAll('.tool-btn');
  const btnClearMap = document.getElementById('btn-clear-map');
  const selectCharSkin = document.getElementById('select-char-skin');
  const selectTheme = document.getElementById('select-theme');
  const sliderGravity = document.getElementById('slider-gravity');
  const gravVal = document.getElementById('grav-val');

  // In-Game HUD
  const gameHud = document.getElementById('game-hud');
  const hudCoins = document.getElementById('hud-coins');
  const hudScore = document.getElementById('hud-score');
  const hudLives = document.getElementById('hud-lives');
  const hudTimer = document.getElementById('hud-timer');
  const btnHudRestart = document.getElementById('btn-hud-restart');
  const btnHudEdit = document.getElementById('btn-hud-edit');
  const editorGuideBanner = document.getElementById('editor-guide-banner');
  const toastPopup = document.getElementById('toast-popup');

  // Modals
  const publishModal = document.getElementById('publish-modal');
  const btnPublishOpen = document.getElementById('btn-publish-open');
  const btnClosePublish = document.getElementById('btn-close-publish');
  const btnSubmitGame = document.getElementById('btn-submit-game');
  const pubTitleInput = document.getElementById('pub-title');
  const pubAuthorInput = document.getElementById('pub-author');
  const pubDescInput = document.getElementById('pub-desc');
  const shareResultBox = document.getElementById('share-result-box');
  const pubShareUrlInput = document.getElementById('pub-share-url');
  const btnCopyShareUrl = document.getElementById('btn-copy-share-url');
  const btnDownloadJson = document.getElementById('btn-download-json');

  const galleryModal = document.getElementById('gallery-modal');
  const btnGalleryOpen = document.getElementById('btn-gallery-open');
  const btnCloseGallery = document.getElementById('btn-close-gallery');
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryTabs = document.querySelectorAll('.gallery-tab');

  const clearModal = document.getElementById('clear-modal');
  const clearCoins = document.getElementById('clear-coins');
  const clearTime = document.getElementById('clear-time');
  const clearScore = document.getElementById('clear-score');
  const btnClearReplay = document.getElementById('btn-clear-replay');
  const btnClearEdit = document.getElementById('btn-clear-edit');
  const btnClearGallery = document.getElementById('btn-clear-gallery');

  // --- Audio Synthesizer (Web Audio API) ---
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.2, freqEnd = null) {
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (freqEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch (e) {}
  }

  const SOUNDS = {
    jump: () => playTone(300, 'square', 0.15, 0.2, 600),
    superJump: () => {
      playTone(250, 'triangle', 0.35, 0.35, 1200);
      setTimeout(() => playTone(600, 'sine', 0.25, 0.2, 1400), 60);
    },
    coin: () => {
      playTone(987.77, 'sine', 0.08, 0.25);
      setTimeout(() => playTone(1318.51, 'sine', 0.2, 0.25), 80);
    },
    gem: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => playTone(f, 'triangle', 0.15, 0.2), i * 50);
      });
    },
    stomp: () => playTone(180, 'square', 0.12, 0.3, 60),
    hit: () => playTone(120, 'sawtooth', 0.25, 0.35, 40),
    clear: () => {
      [523, 659, 784, 1046, 1318].forEach((f, i) => {
        setTimeout(() => playTone(f, 'sine', 0.3, 0.3), i * 100);
      });
    }
  };

  // --- Game State ---
  let isPlayMode = false;
  let currentTool = 'ground'; // 'ground', 'jump_pad', 'spike', 'ice', 'brick', 'player', 'goal', 'coin', 'gem', 'patrol', 'flyer', 'chaser', 'eraser'
  let charSkin = 'hero';
  let mapTheme = 'neon';
  let gravityMultiplier = 1.0;

  // Grid Data [row][col]
  let mapGrid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(TILE.EMPTY));
  let playerSpawn = { col: 3, row: 12 };
  let enemySpawns = []; // { type: 'patrol'|'flyer'|'chaser', col, row }

  // Camera viewport
  let cameraX = 0;
  let cameraY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panCameraStartX = 0;

  // Mouse Painting State
  let isMouseDown = false;
  let mouseButton = 0; // 0: left, 2: right

  // Active Play Session
  let player = null;
  let activeEnemies = [];
  let activeCoins = [];
  let activeGems = [];
  let activeBricks = [];
  let collectedCoins = 0;
  let currentScore = 0;
  let lives = 3;
  let playStartTime = 0;
  let playElapsedTime = 0;
  let isGameOver = false;
  let isStageCleared = false;

  // Keyboard input state for gameplay
  const keys = {
    left: false,
    right: false,
    jump: false,
    action: false
  };

  // --- Built-in Featured Community Maps ---
  const FEATURED_MAPS = [
    {
      id: 'featured_1',
      title: '🌟 쌈뽕 튜토리얼 어드벤처',
      author: '선우(쌈뽕)',
      desc: '기본 점프와 슈퍼 점프대를 마스터하고 깃발에 도달하는 튜토리얼 맵!',
      theme: 'neon',
      gravity: 1.0,
      skin: 'hero',
      generator: buildTutorialMap
    },
    {
      id: 'featured_2',
      title: '🚀 슈퍼 점프 익스트림',
      author: '점프장인',
      desc: '스프링 점프 블록을 연속으로 밟고 하늘을 날아오르는 고공 점프 맵!',
      theme: 'dungeon',
      gravity: 1.0,
      skin: 'ninja',
      generator: buildSuperJumpMap
    },
    {
      id: 'featured_3',
      title: '👾 몬스터 던전 대탈출',
      author: '던전마스터',
      desc: '순찰 슬라임과 비행 박쥐들을 밟고 돌파하며 탈출하는 액션 런!',
      theme: 'volcano',
      gravity: 1.1,
      skin: 'cyborg',
      generator: buildMonsterDungeonMap
    }
  ];

  // User submitted maps saved in localStorage
  let userSubmittedMaps = [];
  function loadUserMaps() {
    try {
      const data = localStorage.getItem('ssampong_community_maps');
      if (data) {
        userSubmittedMaps = JSON.parse(data);
      }
    } catch (e) {}
  }
  function saveUserMaps() {
    try {
      localStorage.setItem('ssampong_community_maps', JSON.stringify(userSubmittedMaps));
    } catch (e) {}
  }

  // --- Map Generator Helpers ---
  function buildTutorialMap() {
    const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(TILE.EMPTY));
    // Ground base
    for (let c = 0; c < 20; c++) grid[14][c] = TILE.GROUND;
    // Step platform
    for (let c = 12; c < 16; c++) grid[11][c] = TILE.GROUND;
    // Super Jump Pad
    grid[14][22] = TILE.JUMP_PAD;
    // High floating island
    for (let c = 24; c < 34; c++) grid[7][c] = TILE.GROUND;
    grid[6][26] = TILE.COIN;
    grid[6][28] = TILE.COIN;
    grid[6][30] = TILE.GEM;

    // Spikes under high island
    for (let c = 23; c < 35; c++) grid[15][c] = TILE.SPIKE;

    // Next landing
    for (let c = 36; c < 48; c++) grid[14][c] = TILE.GROUND;
    grid[13][40] = TILE.ICE;
    grid[13][41] = TILE.ICE;
    grid[13][42] = TILE.ICE;

    // Final stretch & Goal
    for (let c = 50; c < 65; c++) grid[14][c] = TILE.GROUND;
    grid[13][60] = TILE.GOAL;

    return {
      grid,
      playerSpawn: { col: 3, row: 13 },
      enemySpawns: [
        { type: 'patrol', col: 44, row: 13 }
      ]
    };
  }

  function buildSuperJumpMap() {
    const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(TILE.EMPTY));
    for (let c = 0; c < 10; c++) grid[14][c] = TILE.GROUND;

    // Consecutive jump pads
    grid[14][8] = TILE.JUMP_PAD;
    grid[14][18] = TILE.JUMP_PAD;
    grid[14][28] = TILE.JUMP_PAD;
    grid[14][38] = TILE.JUMP_PAD;

    // Floating challenge blocks
    for (let c = 12; c < 15; c++) grid[6][c] = TILE.BRICK;
    grid[5][13] = TILE.GEM;

    for (let c = 22; c < 25; c++) grid[5][c] = TILE.BRICK;
    grid[4][23] = TILE.GEM;

    for (let c = 32; c < 35; c++) grid[4][c] = TILE.BRICK;
    grid[3][33] = TILE.GEM;

    // Spikes pit
    for (let c = 10; c < 45; c++) {
      if (grid[14][c] === TILE.EMPTY) grid[15][c] = TILE.SPIKE;
    }

    // Landing goal island
    for (let c = 48; c < 60; c++) grid[14][c] = TILE.GROUND;
    grid[13][54] = TILE.GOAL;

    return {
      grid,
      playerSpawn: { col: 2, row: 13 },
      enemySpawns: [
        { type: 'flyer', col: 20, row: 7 },
        { type: 'flyer', col: 30, row: 6 }
      ]
    };
  }

  function buildMonsterDungeonMap() {
    const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(TILE.EMPTY));
    for (let c = 0; c < 15; c++) grid[14][c] = TILE.GROUND;

    // Platform layers
    for (let c = 18; c < 28; c++) grid[14][c] = TILE.GROUND;
    for (let c = 20; c < 26; c++) grid[10][c] = TILE.GROUND;
    for (let c = 30; c < 42; c++) grid[14][c] = TILE.GROUND;
    for (let c = 33; c < 39; c++) grid[9][c] = TILE.GROUND;

    grid[14][44] = TILE.JUMP_PAD;
    for (let c = 48; c < 64; c++) grid[14][c] = TILE.GROUND;
    grid[13][58] = TILE.GOAL;

    return {
      grid,
      playerSpawn: { col: 2, row: 13 },
      enemySpawns: [
        { type: 'patrol', col: 22, row: 13 },
        { type: 'patrol', col: 23, row: 9 },
        { type: 'flyer', col: 29, row: 8 },
        { type: 'patrol', col: 35, row: 13 },
        { type: 'chaser', col: 52, row: 13 }
      ]
    };
  }

  // --- Canvas Resizing ---
  function resizeCanvas() {
    canvas.width = viewportContainer.clientWidth;
    canvas.height = viewportContainer.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);

  // --- Palette & Tool Selection ---
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
    });
  });

  selectCharSkin.addEventListener('change', (e) => {
    charSkin = e.target.value;
    showToast(`캐릭터가 [${getSkinName(charSkin)}] (으)로 변경되었습니다!`);
  });

  selectTheme.addEventListener('change', (e) => {
    mapTheme = e.target.value;
  });

  sliderGravity.addEventListener('input', (e) => {
    gravityMultiplier = parseFloat(e.target.value);
    gravVal.textContent = `${gravityMultiplier.toFixed(1)}x`;
  });

  btnClearMap.addEventListener('click', () => {
    if (confirm('정말로 맵을 완전히 비우시겠습니까?')) {
      mapGrid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(TILE.EMPTY));
      // Base floor at bottom
      for (let c = 0; c < 15; c++) mapGrid[14][c] = TILE.GROUND;
      enemySpawns = [];
      playerSpawn = { col: 3, row: 13 };
      mapGrid[13][12] = TILE.GOAL;
      showToast('맵이 초기화되었습니다.');
    }
  });

  function getSkinName(s) {
    if (s === 'ninja') return '🥷 섀도우 닌자';
    if (s === 'cyborg') return '🤖 네온 사이보그';
    if (s === 'cat') return '🐱 냥이';
    return '🏃 쌈뽕 기사';
  }

  function showToast(msg) {
    toastPopup.textContent = msg;
    toastPopup.classList.add('show');
    setTimeout(() => {
      toastPopup.classList.remove('show');
    }, 2000);
  }

  // --- Editor Painting Logic ---
  function getTileUnderCursor(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const worldX = screenX + cameraX;
    const worldY = screenY + cameraY;

    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);

    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      return { col, row };
    }
    return null;
  }

  function applyToolAt(col, row, isErase = false) {
    if (isErase || currentTool === 'eraser') {
      mapGrid[row][col] = TILE.EMPTY;
      // Also remove enemies at this spot
      enemySpawns = enemySpawns.filter(e => !(e.col === col && e.row === row));
      return;
    }

    // Special items / entities
    if (currentTool === 'player') {
      playerSpawn = { col, row };
      mapGrid[row][col] = TILE.EMPTY;
      showToast('플레이어 시작 위치가 설정되었습니다!');
      return;
    }

    if (currentTool === 'patrol' || currentTool === 'flyer' || currentTool === 'chaser') {
      mapGrid[row][col] = TILE.EMPTY;
      // Replace existing enemy at spot or push
      enemySpawns = enemySpawns.filter(e => !(e.col === col && e.row === row));
      enemySpawns.push({ type: currentTool, col, row });
      return;
    }

    // Standard tiles
    let tileType = TILE.EMPTY;
    switch (currentTool) {
      case 'ground': tileType = TILE.GROUND; break;
      case 'jump_pad': tileType = TILE.JUMP_PAD; break;
      case 'spike': tileType = TILE.SPIKE; break;
      case 'ice': tileType = TILE.ICE; break;
      case 'brick': tileType = TILE.BRICK; break;
      case 'coin': tileType = TILE.COIN; break;
      case 'gem': tileType = TILE.GEM; break;
      case 'goal': tileType = TILE.GOAL; break;
    }

    // Clear any enemy at this tile
    enemySpawns = enemySpawns.filter(e => !(e.col === col && e.row === row));
    mapGrid[row][col] = tileType;
  }

  // Canvas Mouse & Touch Events
  canvas.addEventListener('mousedown', (e) => {
    if (isPlayMode) return;
    initAudio();

    if (e.button === 1 || e.shiftKey) { // Middle click or shift: pan camera
      isPanning = true;
      panStartX = e.clientX;
      panCameraStartX = cameraX;
      return;
    }

    isMouseDown = true;
    mouseButton = e.button;
    const tile = getTileUnderCursor(e.clientX, e.clientY);
    if (tile) {
      applyToolAt(tile.col, tile.row, e.button === 2);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPlayMode) return;

    if (isPanning) {
      const dx = e.clientX - panStartX;
      cameraX = Math.max(0, Math.min(MAP_WIDTH - canvas.width, panCameraStartX - dx));
      return;
    }

    if (isMouseDown) {
      const tile = getTileUnderCursor(e.clientX, e.clientY);
      if (tile) {
        applyToolAt(tile.col, tile.row, mouseButton === 2);
      }
    }
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
    isPanning = false;
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Mouse Wheel Pan
  canvas.addEventListener('wheel', (e) => {
    if (isPlayMode) return;
    cameraX = Math.max(0, Math.min(MAP_WIDTH - canvas.width, cameraX + e.deltaY));
    e.preventDefault();
  }, { passive: false });

  // Touch Support for Editor
  canvas.addEventListener('touchstart', (e) => {
    if (isPlayMode) return;
    initAudio();
    if (e.touches.length === 1) {
      isMouseDown = true;
      mouseButton = 0;
      const t = e.touches[0];
      const tile = getTileUnderCursor(t.clientX, t.clientY);
      if (tile) applyToolAt(tile.col, tile.row, false);
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (isPlayMode) return;
    if (isMouseDown && e.touches.length === 1) {
      const t = e.touches[0];
      const tile = getTileUnderCursor(t.clientX, t.clientY);
      if (tile) applyToolAt(tile.col, tile.row, false);
    }
  });

  canvas.addEventListener('touchend', () => {
    isMouseDown = false;
  });

  // --- Mode Switching (Edit vs Play) ---
  btnModeEdit.addEventListener('click', () => setMode(false));
  btnModePlay.addEventListener('click', () => setMode(true));
  btnHudEdit.addEventListener('click', () => setMode(false));
  btnHudRestart.addEventListener('click', () => restartPlaySession());

  function setMode(play) {
    if (isPlayMode === play) return;
    isPlayMode = play;

    if (isPlayMode) {
      // Validate map has player and goal
      let hasGoal = false;
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (mapGrid[r][c] === TILE.GOAL) hasGoal = true;
        }
      }
      if (!hasGoal) {
        showToast('⚠️ 골인 깃발(🚩)을 먼저 맵에 설치해 주세요!');
        isPlayMode = false;
        return;
      }

      btnModePlay.classList.add('active');
      btnModeEdit.classList.remove('active');
      gameHud.classList.remove('hidden');
      editorGuideBanner.classList.add('hidden');
      paletteSidebar.style.display = 'none';

      startPlaySession();
      showToast('▶️ 플레이 테스트 시작! (A/D 이동, W/스페이스 점프)');
    } else {
      btnModeEdit.classList.add('active');
      btnModePlay.classList.remove('active');
      gameHud.classList.add('hidden');
      editorGuideBanner.classList.remove('hidden');
      paletteSidebar.style.display = 'flex';
      clearModal.classList.add('hidden');
      showToast('🛠️ 만들기 모드로 전환되었습니다.');
    }
  }

  // --- Gameplay Physics Engine ---
  function startPlaySession() {
    isGameOver = false;
    isStageCleared = false;
    collectedCoins = 0;
    currentScore = 0;
    lives = 3;
    playStartTime = Date.now();

    // Spawn Player
    const pX = playerSpawn.col * TILE_SIZE + 4;
    const pY = playerSpawn.row * TILE_SIZE;

    player = {
      x: pX,
      y: pY,
      width: 30,
      height: 38,
      vx: 0,
      vy: 0,
      speed: charSkin === 'cyborg' ? 6.5 : 5.2,
      jumpForce: -12.5,
      grounded: false,
      jumpsLeft: charSkin === 'ninja' ? 2 : 1,
      maxJumps: charSkin === 'ninja' ? 2 : 1,
      facing: 'right',
      invulnerableTimer: 0,
      isClimbing: false
    };

    // Instantiate dynamic entities from map
    activeCoins = [];
    activeGems = [];
    activeBricks = [];

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const t = mapGrid[r][c];
        if (t === TILE.COIN) {
          activeCoins.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE + 8, width: 24, height: 24, collected: false });
        } else if (t === TILE.GEM) {
          activeGems.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE + 8, width: 24, height: 24, collected: false });
        } else if (t === TILE.BRICK) {
          activeBricks.push({ col: c, row: r, intact: true });
        }
      }
    }

    // Instantiate Enemies
    activeEnemies = enemySpawns.map(e => ({
      type: e.type,
      x: e.col * TILE_SIZE,
      y: e.row * TILE_SIZE,
      width: 32,
      height: 32,
      vx: e.type === 'patrol' ? 1.8 : (e.type === 'chaser' ? 2.2 : 0),
      vy: e.type === 'flyer' ? 1.5 : 0,
      startY: e.row * TILE_SIZE,
      alive: true
    }));

    updateHUD();
  }

  function restartPlaySession() {
    startPlaySession();
    clearModal.classList.add('hidden');
    showToast('스테이지가 재시작되었습니다.');
  }

  function updateHUD() {
    hudCoins.textContent = collectedCoins;
    hudScore.textContent = currentScore;
    hudLives.textContent = lives;

    if (isPlayMode && !isGameOver && !isStageCleared) {
      const elapsedSec = Math.floor((Date.now() - playStartTime) / 1000);
      const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const ss = String(elapsedSec % 60).padStart(2, '0');
      hudTimer.textContent = `${mm}:${ss}`;
    }
  }

  // Platform collision box check
  function isSolidTile(t) {
    return t === TILE.GROUND || t === TILE.ICE || t === TILE.JUMP_PAD || t === TILE.BRICK;
  }

  function checkTileAt(col, row) {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return TILE.EMPTY;
    // Check if brick was broken
    if (mapGrid[row][col] === TILE.BRICK) {
      const b = activeBricks.find(br => br.col === col && br.row === row);
      if (b && !b.intact) return TILE.EMPTY;
    }
    return mapGrid[row][col];
  }

  function updatePhysics() {
    if (!isPlayMode || isGameOver || isStageCleared || !player) return;

    const gravity = 0.55 * gravityMultiplier;

    // 1. Horizontal Input & Movement
    let targetVx = 0;
    if (keys.left) {
      targetVx = -player.speed;
      player.facing = 'left';
    } else if (keys.right) {
      targetVx = player.speed;
      player.facing = 'right';
    }

    // Ice tile slipping friction check
    const bottomCol = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    const bottomRow = Math.floor((player.y + player.height + 2) / TILE_SIZE);
    const tileBelow = checkTileAt(bottomCol, bottomRow);

    if (tileBelow === TILE.ICE) {
      player.vx += (targetVx - player.vx) * 0.08; // Slippery acceleration
    } else {
      player.vx = targetVx;
    }

    player.x += player.vx;

    // Horizontal Tile Collisions
    const minC = Math.floor(player.x / TILE_SIZE);
    const maxC = Math.floor((player.x + player.width) / TILE_SIZE);
    const minR = Math.floor(player.y / TILE_SIZE);
    const maxR = Math.floor((player.y + player.height - 1) / TILE_SIZE);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const t = checkTileAt(c, r);
        if (isSolidTile(t)) {
          if (player.vx > 0) { // Moving right
            player.x = c * TILE_SIZE - player.width;
          } else if (player.vx < 0) { // Moving left
            player.x = (c + 1) * TILE_SIZE;
          }
        }
      }
    }

    // 2. Vertical Movement & Gravity
    player.vy += gravity;
    if (player.vy > 16) player.vy = 16;
    player.y += player.vy;
    player.grounded = false;

    // Vertical Tile Collisions
    const newMinC = Math.floor(player.x / TILE_SIZE);
    const newMaxC = Math.floor((player.x + player.width) / TILE_SIZE);
    const newMinR = Math.floor(player.y / TILE_SIZE);
    const newMaxR = Math.floor((player.y + player.height) / TILE_SIZE);

    for (let r = newMinR; r <= newMaxR; r++) {
      for (let c = newMinC; c <= newMaxC; c++) {
        const t = checkTileAt(c, r);

        if (isSolidTile(t)) {
          if (player.vy > 0) { // Landing on top of tile
            player.y = r * TILE_SIZE - player.height;
            player.vy = 0;
            player.grounded = true;
            player.jumpsLeft = player.maxJumps;

            // SUPER JUMP PAD BOUNCE!
            if (t === TILE.JUMP_PAD) {
              player.vy = -21 * Math.sqrt(gravityMultiplier); // 2.5x launch!
              player.grounded = false;
              SOUNDS.superJump();
              showToast('🚀 SUPER JUMP!');
            }
          } else if (player.vy < 0) { // Hitting head on ceiling
            player.y = (r + 1) * TILE_SIZE;
            player.vy = 0;

            // Break brick if hitting ceiling
            if (t === TILE.BRICK) {
              const b = activeBricks.find(br => br.col === c && br.row === r);
              if (b && b.intact) {
                b.intact = false;
                currentScore += 50;
                SOUNDS.stomp();
              }
            }
          }
        }
      }
    }

    // 3. Spikes and Hazards Check
    for (let r = newMinR; r <= newMaxR; r++) {
      for (let c = newMinC; c <= newMaxC; c++) {
        const t = checkTileAt(c, r);
        if (t === TILE.SPIKE) {
          handlePlayerDeath('가시 함정에 찔렸습니다!');
          return;
        }
      }
    }

    // 4. Fell off map
    if (player.y > MAP_HEIGHT) {
      handlePlayerDeath('낭떠러지로 추락했습니다!');
      return;
    }

    // 5. Coin & Gem Collection
    activeCoins.forEach(coin => {
      if (!coin.collected && checkOverlap(player, coin)) {
        coin.collected = true;
        collectedCoins++;
        currentScore += 100;
        SOUNDS.coin();
        updateHUD();
      }
    });

    activeGems.forEach(gem => {
      if (!gem.collected && checkOverlap(player, gem)) {
        gem.collected = true;
        currentScore += 500;
        SOUNDS.gem();
        updateHUD();
        showToast('💎 희귀 루비 보석 획득! (+500)');
      }
    });

    // 6. Goal Flag Check
    const centerC = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    const centerR = Math.floor((player.y + player.height / 2) / TILE_SIZE);
    if (checkTileAt(centerC, centerR) === TILE.GOAL) {
      handleStageClear();
      return;
    }

    // 7. Update Enemies
    activeEnemies.forEach(e => {
      if (!e.alive) return;

      if (e.type === 'patrol') {
        e.x += e.vx;
        // Turn around on block collision or hole
        const nextCol = Math.floor((e.x + (e.vx > 0 ? e.width + 2 : -2)) / TILE_SIZE);
        const curRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
        const bottomRow = Math.floor((e.y + e.height + 4) / TILE_SIZE);

        if (isSolidTile(checkTileAt(nextCol, curRow)) || !isSolidTile(checkTileAt(nextCol, bottomRow))) {
          e.vx = -e.vx;
        }
      } else if (e.type === 'flyer') {
        e.y += e.vy;
        if (Math.abs(e.y - e.startY) > 60) e.vy = -e.vy;
      } else if (e.type === 'chaser') {
        // Track player horizontally if close
        const dist = player.x - e.x;
        if (Math.abs(dist) < 280) {
          e.x += Math.sign(dist) * 1.8;
        }
      }

      // Check collision with player
      if (checkOverlap(player, e)) {
        // Did player stomp on top of enemy?
        if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 12) {
          e.alive = false;
          player.vy = -10; // Bounce off enemy
          currentScore += 200;
          SOUNDS.stomp();
          showToast('👾 몬스터 처치! (+200)');
          updateHUD();
        } else {
          handlePlayerDeath('몬스터에게 공격당했습니다!');
        }
      }
    });

    // 8. Camera Smooth Tracking on Player
    const targetCamX = player.x - canvas.width * 0.4;
    cameraX += (targetCamX - cameraX) * 0.12;
    cameraX = Math.max(0, Math.min(MAP_WIDTH - canvas.width, cameraX));

    // Invulnerability timer
    if (player.invulnerableTimer > 0) player.invulnerableTimer--;

    updateHUD();
  }

  function checkOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function handlePlayerDeath(msg) {
    SOUNDS.hit();
    lives--;
    updateHUD();

    if (lives <= 0) {
      showToast(`💥 게임 오버! (${msg})`);
      setTimeout(() => {
        restartPlaySession();
      }, 1000);
    } else {
      showToast(`⚠️ ${msg} (남은 목숨: ${lives})`);
      // Respawn at spawn point
      player.x = playerSpawn.col * TILE_SIZE + 4;
      player.y = playerSpawn.row * TILE_SIZE;
      player.vx = 0;
      player.vy = 0;
      player.invulnerableTimer = 60;
    }
  }

  function handleStageClear() {
    isStageCleared = true;
    SOUNDS.clear();
    if (window.confetti) {
      window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    const elapsedSec = Math.floor((Date.now() - playStartTime) / 1000);
    const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
    const ss = String(elapsedSec % 60).padStart(2, '0');

    clearCoins.textContent = collectedCoins;
    clearTime.textContent = `${mm}:${ss}`;
    clearScore.textContent = currentScore;

    setTimeout(() => {
      clearModal.classList.remove('hidden');
    }, 400);
  }

  // --- Keyboard Listeners ---
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    // Toggle mode with Space or E/P in non-input contexts
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'KeyE') setMode(false);
    if (e.code === 'KeyP') setMode(true);
    if (e.code === 'KeyR' && isPlayMode) restartPlaySession();
    if (e.code === 'Escape' && isPlayMode) setMode(false);

    if (e.code === 'Space' && !isPlayMode) {
      setMode(true);
      return;
    }

    // Gameplay keys
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;

    if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
      if (isPlayMode && player) {
        if (player.grounded || player.jumpsLeft > 0) {
          player.vy = player.jumpForce;
          player.grounded = false;
          player.jumpsLeft--;
          SOUNDS.jump();
        }
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  });

  // --- Rendering Loop ---
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background Theme
    drawBackground();

    ctx.save();
    ctx.translate(-Math.floor(cameraX), 0);

    // 2. Draw Editor Grid in Edit Mode
    if (!isPlayMode) {
      drawEditorGrid();
    }

    // 3. Draw Tiles
    drawTiles();

    // 4. Draw Collectibles & Bricks
    drawCollectibles();

    // 5. Draw Enemies
    drawEnemies();

    // 6. Draw Player (in play mode) or Spawn Marker (in edit mode)
    if (isPlayMode && player) {
      drawPlayer();
    } else {
      drawSpawnMarkers();
    }

    ctx.restore();

    // Update Physics if Playing
    if (isPlayMode) {
      updatePhysics();
    }

    requestAnimationFrame(render);
  }

  // Draw Themed Background
  function drawBackground() {
    let grad;
    if (mapTheme === 'neon') {
      grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#1e1b4b');
    } else if (mapTheme === 'dungeon') {
      grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(1, '#292524');
    } else if (mapTheme === 'volcano') {
      grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#450a0a');
      grad.addColorStop(1, '#7f1d1d');
    } else { // candy
      grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#312e81');
      grad.addColorStop(1, '#701a75');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw Grid lines in Editor
  function drawEditorGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let c = 0; c <= GRID_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * TILE_SIZE, 0);
      ctx.lineTo(c * TILE_SIZE, MAP_HEIGHT);
      ctx.stroke();
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * TILE_SIZE);
      ctx.lineTo(MAP_WIDTH, r * TILE_SIZE);
      ctx.stroke();
    }
  }

  // Draw All Tiles
  function drawTiles() {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const t = mapGrid[r][c];

        if (t === TILE.GROUND) {
          ctx.fillStyle = mapTheme === 'dungeon' ? '#57534e' : (mapTheme === 'volcano' ? '#78350f' : '#2563eb');
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (t === TILE.JUMP_PAD) {
          // Super Jump Pad
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(x, y + 15, TILE_SIZE, TILE_SIZE - 15);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + 15, 12, 0, Math.PI, true);
          ctx.fill();
          ctx.font = '16px monospace';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText('⬆️', x + TILE_SIZE / 2, y + 32);
        } else if (t === TILE.SPIKE) {
          // Spike Hazard
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(x + 5, y + TILE_SIZE);
          ctx.lineTo(x + TILE_SIZE / 2, y + 8);
          ctx.lineTo(x + TILE_SIZE - 5, y + TILE_SIZE);
          ctx.closePath();
          ctx.fill();
        } else if (t === TILE.ICE) {
          // Slippery Ice
          ctx.fillStyle = '#67e8f9';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#cffafe';
          ctx.fillRect(x, y, TILE_SIZE, 6);
        } else if (t === TILE.BRICK) {
          if (!isPlayMode || activeBricks.some(b => b.col === c && b.row === r && b.intact)) {
            ctx.fillStyle = '#b45309';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#d97706';
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          }
        } else if (t === TILE.GOAL) {
          // Goal Flagpole
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 12, y + TILE_SIZE);
          ctx.lineTo(x + 12, y + 4);
          ctx.stroke();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(x + 12, y + 4);
          ctx.lineTo(x + 36, y + 14);
          ctx.lineTo(x + 12, y + 24);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }

  // Draw Collectibles
  function drawCollectibles() {
    if (isPlayMode) {
      activeCoins.forEach(coin => {
        if (!coin.collected) {
          drawCoinAt(coin.x, coin.y);
        }
      });
      activeGems.forEach(gem => {
        if (!gem.collected) {
          drawGemAt(gem.x, gem.y);
        }
      });
    } else {
      // In editor mode, draw static coins/gems from mapGrid
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const t = mapGrid[r][c];
          if (t === TILE.COIN) drawCoinAt(c * TILE_SIZE + 8, r * TILE_SIZE + 8);
          if (t === TILE.GEM) drawGemAt(c * TILE_SIZE + 8, r * TILE_SIZE + 8);
        }
      }
    }
  }

  function drawCoinAt(x, y) {
    ctx.save();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + 12, y + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'center';
    ctx.fillText('$', x + 12, y + 15);
    ctx.restore();
  }

  function drawGemAt(x, y) {
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💎', x + 12, y + 20);
  }

  // Draw Enemies
  function drawEnemies() {
    const list = isPlayMode ? activeEnemies : enemySpawns;
    list.forEach(e => {
      if (isPlayMode && !e.alive) return;
      const x = isPlayMode ? e.x : e.col * TILE_SIZE;
      const y = isPlayMode ? e.y : e.row * TILE_SIZE;

      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      if (e.type === 'patrol') ctx.fillText('👾', x + 16, y + 26);
      else if (e.type === 'flyer') ctx.fillText('🦇', x + 16, y + 26);
      else if (e.type === 'chaser') ctx.fillText('😈', x + 16, y + 26);
    });
  }

  // Draw Spawn Markers in Edit Mode
  function drawSpawnMarkers() {
    const sx = playerSpawn.col * TILE_SIZE;
    const sy = playerSpawn.row * TILE_SIZE;

    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(getSkinEmoji(charSkin), sx + TILE_SIZE / 2, sy + TILE_SIZE * 0.75);
    ctx.restore();
  }

  // Draw Player Character
  function drawPlayer() {
    ctx.save();
    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    const px = player.x;
    const py = player.y;

    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';

    ctx.save();
    ctx.translate(px + player.width / 2, py + player.height / 2 + 8);
    if (player.facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.fillText(getSkinEmoji(charSkin), 0, 0);
    ctx.restore();

    ctx.restore();
  }

  function getSkinEmoji(skin) {
    if (skin === 'ninja') return '🥷';
    if (skin === 'cyborg') return '🤖';
    if (skin === 'cat') return '🐱';
    return '🏃';
  }

  // --- Publish & Sharing System ---
  btnPublishOpen.addEventListener('click', () => {
    publishModal.classList.remove('hidden');
    shareResultBox.classList.add('hidden');
  });

  btnClosePublish.addEventListener('click', () => {
    publishModal.classList.add('hidden');
  });

  btnSubmitGame.addEventListener('click', () => {
    const title = pubTitleInput.value.trim() || '나만의 쌈뽕 점프 맵';
    const author = pubAuthorInput.value.trim() || '익명의 메이커';
    const desc = pubDescInput.value.trim() || '도전해 보세요!';

    // Verify map has goal
    let hasGoal = false;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (mapGrid[r][c] === TILE.GOAL) hasGoal = true;
      }
    }
    if (!hasGoal) {
      alert('⚠️ 골인 깃발(🚩)이 없습니다! 맵에 골인 깃발을 먼저 설치해 주세요.');
      return;
    }

    // Package Map Data
    const mapPackage = {
      id: 'user_' + Date.now(),
      title,
      author,
      desc,
      theme: mapTheme,
      gravity: gravityMultiplier,
      skin: charSkin,
      playerSpawn,
      enemySpawns,
      grid: mapGrid
    };

    // Save to userSubmittedMaps in localStorage
    userSubmittedMaps.unshift(mapPackage);
    saveUserMaps();

    // Generate Shareable URL query
    const jsonStr = JSON.stringify(mapPackage);
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?map=${encoded}`;

    pubShareUrlInput.value = shareUrl;
    shareResultBox.classList.remove('hidden');
    SOUNDS.clear();
    showToast('🎉 게임이 성공적으로 등록되었습니다!');
  });

  btnCopyShareUrl.addEventListener('click', () => {
    pubShareUrlInput.select();
    navigator.clipboard.writeText(pubShareUrlInput.value).then(() => {
      showToast('📋 공유 링크가 클립보드에 복사되었습니다!');
    });
  });

  btnDownloadJson.addEventListener('click', () => {
    const mapPackage = {
      title: pubTitleInput.value.trim() || 'custom_map',
      author: pubAuthorInput.value.trim() || 'author',
      theme: mapTheme,
      gravity: gravityMultiplier,
      skin: charSkin,
      playerSpawn,
      enemySpawns,
      grid: mapGrid
    };
    const blob = new Blob([JSON.stringify(mapPackage, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${mapPackage.title}.json`;
    a.click();
  });

  // --- Community Gallery System ---
  btnGalleryOpen.addEventListener('click', () => {
    galleryModal.classList.remove('hidden');
    renderGallery('all');
  });

  btnCloseGallery.addEventListener('click', () => {
    galleryModal.classList.add('hidden');
  });

  galleryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      galleryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderGallery(tab.dataset.filter);
    });
  });

  function renderGallery(filter = 'all') {
    galleryGrid.innerHTML = '';
    let mapsToShow = [];

    if (filter === 'all' || filter === 'featured') {
      mapsToShow = mapsToShow.concat(FEATURED_MAPS.map(m => ({ ...m, isFeatured: true })));
    }
    if (filter === 'all' || filter === 'user') {
      mapsToShow = mapsToShow.concat(userSubmittedMaps.map(m => ({ ...m, isFeatured: false })));
    }

    if (mapsToShow.length === 0) {
      galleryGrid.innerHTML = '<div style="color:#94a3b8; padding:30px; grid-column:1/-1; text-align:center;">아직 등록된 맵이 없습니다. 첫 게임을 직접 만들어 제출해보세요!</div>';
      return;
    }

    mapsToShow.forEach(mapItem => {
      const card = document.createElement('div');
      card.className = 'map-card';
      card.innerHTML = `
        <span class="map-card-badge">${mapItem.isFeatured ? '⭐ 공식 추천' : '👤 유저 창작'}</span>
        <h4 class="map-card-title">${escapeHtml(mapItem.title)}</h4>
        <div class="map-card-meta">제작: <strong>${escapeHtml(mapItem.author)}</strong> | 테마: ${mapItem.theme}</div>
        <p class="map-card-desc">${escapeHtml(mapItem.desc || '신나는 모험 맵')}</p>
        <div class="map-card-actions">
          <button class="map-btn-play">▶️ 플레이</button>
          <button class="map-btn-edit">🛠️ 수정하기</button>
        </div>
      `;

      card.querySelector('.map-btn-play').addEventListener('click', () => {
        loadMapData(mapItem);
        galleryModal.classList.add('hidden');
        setMode(true);
      });

      card.querySelector('.map-btn-edit').addEventListener('click', () => {
        loadMapData(mapItem);
        galleryModal.classList.add('hidden');
        setMode(false);
      });

      galleryGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadMapData(mapItem) {
    if (typeof mapItem.generator === 'function') {
      const generated = mapItem.generator();
      mapGrid = generated.grid;
      playerSpawn = generated.playerSpawn;
      enemySpawns = generated.enemySpawns || [];
    } else {
      mapGrid = mapItem.grid;
      playerSpawn = mapItem.playerSpawn || { col: 3, row: 13 };
      enemySpawns = mapItem.enemySpawns || [];
    }

    mapTheme = mapItem.theme || 'neon';
    selectTheme.value = mapTheme;

    gravityMultiplier = mapItem.gravity || 1.0;
    sliderGravity.value = gravityMultiplier;
    gravVal.textContent = `${gravityMultiplier.toFixed(1)}x`;

    charSkin = mapItem.skin || 'hero';
    selectCharSkin.value = charSkin;

    cameraX = 0;
    showToast(`'${mapItem.title}' 맵을 불러왔습니다!`);
  }

  // --- Load Shared Map From URL Query ---
  function checkUrlMapParam() {
    const params = new URLSearchParams(window.location.search);
    const mapEncoded = params.get('map');
    if (mapEncoded) {
      try {
        const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(mapEncoded))));
        const parsed = JSON.parse(jsonStr);
        loadMapData(parsed);
        // Start in play mode immediately
        setTimeout(() => {
          setMode(true);
          showToast(`공유받은 게임 [${parsed.title}] 을 시작합니다!`);
        }, 300);
      } catch (e) {
        console.error('URL map parse error:', e);
      }
    }
  }

  // Clear modal button handlers
  btnClearReplay.addEventListener('click', () => {
    restartPlaySession();
  });
  btnClearEdit.addEventListener('click', () => {
    setMode(false);
  });
  btnClearGallery.addEventListener('click', () => {
    clearModal.classList.add('hidden');
    galleryModal.classList.remove('hidden');
    renderGallery('all');
  });

  // --- Initialization ---
  loadUserMaps();
  resizeCanvas();

  // Load default tutorial map into editor
  loadMapData(FEATURED_MAPS[0]);

  // Check if loaded from a friend's share link
  checkUrlMapParam();

  // Start Rendering Engine
  render();
})();
