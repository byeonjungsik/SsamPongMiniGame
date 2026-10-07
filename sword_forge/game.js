/**
 * Sword Forge - 5th Grade Curriculum Idle & Typing Game Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const swordNameText = document.getElementById('sword-name-text');
  const atkText = document.getElementById('atk-text');
  const dmgText = document.getElementById('dmg-text');
  const goldText = document.getElementById('gold-text');
  const timerBarFill = document.getElementById('timer-bar-fill');

  const forgeCanvas = document.getElementById('forge-canvas');
  const ctx = forgeCanvas.getContext('2d');
  const btnManualHammer = document.getElementById('btn-manual-hammer');

  const monsterIcon = document.getElementById('monster-icon');
  const monsterName = document.getElementById('monster-name');
  const monsterHpFill = document.getElementById('monster-hp-fill');
  const monsterHpText = document.getElementById('monster-hp-text');
  const dungeonStage = document.getElementById('dungeon-stage');
  const slashEffect = document.getElementById('slash-effect');

  const upgradeTargetText = document.getElementById('upgrade-target-text');
  const sentenceCountText = document.getElementById('sentence-count-text');
  const sentenceProgressFill = document.getElementById('sentence-progress-fill');
  const conceptTipText = document.getElementById('concept-tip-text');

  const targetSentenceDisplay = document.getElementById('target-sentence-display');
  const typingInput = document.getElementById('typing-input');
  const typingStats = document.getElementById('typing-stats');

  const buyAutoSpeed = document.getElementById('buy-auto-speed');
  const autoSpeedDesc = document.getElementById('auto-speed-desc');
  const autoSpeedCost = document.getElementById('auto-speed-cost');

  const buyCritRate = document.getElementById('buy-crit-rate');
  const critRateDesc = document.getElementById('crit-rate-desc');
  const critRateCost = document.getElementById('crit-rate-cost');

  const buyGoldBoost = document.getElementById('buy-gold-boost');
  const goldBoostDesc = document.getElementById('gold-boost-desc');
  const goldBoostCost = document.getElementById('gold-boost-cost');

  const evolutionModal = document.getElementById('evolution-modal');
  const evoSwordIcon = document.getElementById('evo-sword-icon');
  const evoSwordName = document.getElementById('evo-sword-name');
  const evoDesc = document.getElementById('evo-desc');
  const evoAtkText = document.getElementById('evo-atk-text');
  const evoDmgText = document.getElementById('evo-dmg-text');
  const btnCloseEvo = document.getElementById('btn-close-evo');

  // Sword Evolution Levels Database (Required sentences: 10 -> 15 -> 30 -> 40 -> 50...)
  const SWORD_LEVELS = [
    { level: 1, name: '연습용 나무검', icon: '🗡️', reqSentences: 10, color: '#a8a29e', bonusAtk: 5 },
    { level: 2, name: '놋검 (Bronze Sword)', icon: '⚔️', reqSentences: 15, color: '#f97316', bonusAtk: 20 },
    { level: 3, name: '철검 (Iron Sword)', icon: '🗡️', reqSentences: 30, color: '#cbd5e1', bonusAtk: 50 },
    { level: 4, name: '은검 (Silver Blade)', icon: '✨', reqSentences: 40, color: '#38bdf8', bonusAtk: 120 },
    { level: 5, name: '화염검 (Flame Sword)', icon: '🔥', reqSentences: 50, color: '#ef4444', bonusAtk: 300 },
    { level: 6, name: '용살검 (Dragon Slayer)', icon: '🐉', reqSentences: 60, color: '#a855f7', bonusAtk: 800 },
    { level: 7, name: '엑스칼리버 (Excalibur)', icon: '👑', reqSentences: 75, color: '#fbbf24', bonusAtk: 2000 },
    { level: 8, name: '신의 성검 (Celestial Divine)', icon: '🌟', reqSentences: 100, color: '#22c55e', bonusAtk: 5000 }
  ];

  // 5th Grade Curriculum Integrated Sentences Pool
  const CURRICULUM_SENTENCES = [
    // History
    { text: "삼국을 통일한 나라는 신라이다.", concept: "📜 5학년 역사: 신라는 당과의 전쟁을 거쳐 삼국 통일을 완수했습니다." },
    { text: "훈민정음은 세종대왕이 백성을 위해 창제하였다.", concept: "📜 5학년 역사: 조선 세종대왕은 누구나 쉽게 배우는 한글을 창제했습니다." },
    { text: "고구려의 광개토대왕은 만주 영토를 크게 넓혔다.", concept: "📜 5학년 역사: 고구려 19대 광개토대왕은 영토를 대폭 확장한 성군입니다." },
    { text: "발해는 고구려를 계승하여 해동성국이라 불렸다.", concept: "📜 5학년 역사: 대조영이 건국한 발해는 융성하여 해동성국이라 칭했습니다." },
    { text: "고려 시대 팔만대장경은 몽골의 침입을 막고자 제작되었다.", concept: "📜 5학년 역사: 호국 불교 정신으로 팔만대장경판을 정성껏 조각했습니다." },
    { text: "독도는 동해에 위치한 우리나라의 고유 영토이다.", concept: "📜 5학년 사회: 독도는 역사적, 지리적으로 대한민국의 고유 영토입니다." },
    { text: "이순신 장군은 한산도 대첩에서 학익진으로 승리하였다.", concept: "📜 5학년 역사: 임진왜란 때 거북선과 학익진 전술로 대승을 거두었습니다." },
    // Science
    { text: "소금은 물에 녹아 용해된다.", concept: "🧪 5학년 과학: 어떤 물질이 다른 물질에 녹아 골고루 섞이는 현상을 용해라 합니다." },
    { text: "지구는 태양 둘레를 1년에 한 바퀴씩 공전한다.", concept: "🧪 5학년 과학: 지구의 공전으로 인해 계절의 변화가 일어납니다." },
    { text: "지구가 하루에 한 바퀴씩 자전하여 낮과 밤이 생긴다.", concept: "🧪 5학년 과학: 지구 자전축을 중심으로 한 자전이 낮과 밤을 만듭니다." },
    { text: "식물은 햇빛과 물을 이용해 광합성을 한다.", concept: "🧪 5학년 과학: 잎의 엽록체에서 빛에너지를 이용해 양분을 만듭니다." },
    { text: "온도가 높아지면 기체의 부피가 팽창한다.", concept: "🧪 5학년 과학: 온도가 상승하면 기체 분자의 운동이 활발해져 부피가 커집니다." },
    { text: "용질이 용매에 용해되면 용액이 된다.", concept: "🧪 5학년 과학: 소금(용질)이 물(용매)에 녹으면 소금물(용액)이 됩니다." },
    { text: "볼록 렌즈는 빛을 모아 물체를 크게 확대해 보인다.", concept: "🧪 5학년 과학: 렌즈의 두꺼운 부분이 빛을 굴절시켜 상을 맺게 합니다." },
    // Math
    { text: "분모가 다른 분수는 통분하여 계산한다.", concept: "📐 5학년 수학: 두 분수의 분모를 같게 만드는 것을 통분이라고 합니다." },
    { text: "분모와 분자를 공약수로 나누는 것을 약분이라 한다.", concept: "📐 5학년 수학: 더 이상 약분할 수 없는 분수를 기약분수라 합니다." },
    { text: "직육면체의 부피는 가로 곱하기 세로 곱하기 높이이다.", concept: "📐 5학년 수학: 부피의 기본 단위는 입방센티미터(cm³)를 사용합니다." },
    { text: "1과 자기 자신만을 약수로 가지는 수를 소수라 한다.", concept: "📐 5학년 수학: 2, 3, 5, 7 등은 1과 자신만을 약수로 갖는 소수입니다." },
    { text: "두 수의 공배수 중에서 가장 작은 수를 최소공배수라 한다.", concept: "📐 5학년 수학: 최소공배수는 두 분수의 통분 분모를 찾을 때 활용됩니다." },
    { text: "올림, 버림, 반올림을 이용해 어림수를 구한다.", concept: "📐 5학년 수학: 구하려는 자릿수 아래에서 5 이상이면 올리고 4 이하이면 버립니다." },
    // Social / Korean
    { text: "속담과 관용 표현을 상황에 맞게 사용한다.", concept: "🇰🇷 5학년 국어: 관용구와 속담을 활용하면 생각을 풍부하게 전달합니다." },
    { text: "우리나라 국토는 동쪽이 높고 서쪽이 낮은 동고서저 지형이다.", concept: "🇰🇷 5학년 사회: 태백산맥이 동쪽에 있어 서쪽으로 큰 하천이 흐릅니다." },
    { text: "글의 구조를 파악하며 알맞게 요약하며 읽는다.", concept: "🇰🇷 5학년 국어: 문단별 중심 문장을 찾아 글 전체의 핵심을 요약합니다." },
    { text: "자연재해에 대비하여 기상 특보와 안전 수칙을 확인한다.", concept: "🇰🇷 5학년 사회: 태풍과 가뭄 등 지형 및 기후 변화 대처법을 학습합니다." }
  ];

  // Monster Database
  const MONSTERS = [
    { name: '고블린 파수꾼', icon: '👺', hp: 50, gold: 15 },
    { name: '오크 전사', icon: '👹', hp: 150, gold: 40 },
    { name: '해골 기사', icon: '💀', hp: 400, gold: 100 },
    { name: '화염 엘리멘탈', icon: '🔥', hp: 1000, gold: 300 },
    { name: '암흑 드래곤', icon: '🐉', hp: 3000, gold: 1000 },
    { name: '마왕의 환영', icon: '👿', hp: 10000, gold: 3500 }
  ];

  // Game State
  let savedData = JSON.parse(localStorage.getItem('sword_forge_save')) || {};

  let currentLevelIdx = savedData.currentLevelIdx || 0;
  let atk = savedData.atk || 1;
  let dmg = savedData.dmg || 1;
  let gold = savedData.gold || 0;

  let completedSentences = savedData.completedSentences || 0;

  // Upgrades State
  let autoIntervalSec = savedData.autoIntervalSec || 3.0; // 3.0s base
  let autoSpeedLvl = savedData.autoSpeedLvl || 1;
  let critRate = savedData.critRate || 0.05; // 5%
  let critLvl = savedData.critLvl || 1;
  let goldMult = savedData.goldMult || 1.0;
  let goldLvl = savedData.goldLvl || 1;

  // Dungeon State
  let currentMonsterIdx = savedData.currentMonsterIdx || 0;
  let currentMonsterHp = savedData.currentMonsterHp || MONSTERS[0].hp;

  // Typing State
  let currentTargetSentence = '';
  let currentConceptTip = '';
  let typingStartTime = 0;

  // Animation Loop State
  let lastAutoTime = performance.now();
  let hammerAnim = 0; // 0 to 1
  let sparks = [];
  let embers = [];

  // Web Audio API Audio Engine
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playSound(type) {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'hammer') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'crit') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'evo') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.3, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.32);
      });
    } else if (type === 'monsterDie') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    }
  }

  // Pre-generate embers
  for (let i = 0; i < 25; i++) {
    embers.push({
      x: Math.random() * forgeCanvas.width,
      y: Math.random() * forgeCanvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 1.5 - 0.5,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.8 + 0.2
    });
  }

  // Save State
  function saveState() {
    const data = {
      currentLevelIdx,
      atk,
      dmg,
      gold,
      completedSentences,
      autoIntervalSec,
      autoSpeedLvl,
      critRate,
      critLvl,
      goldMult,
      goldLvl,
      currentMonsterIdx,
      currentMonsterHp
    };
    localStorage.setItem('sword_forge_save', JSON.stringify(data));
  }

  // 1. Hammer Strike Execution (+1 ATK & +1 DMG per hit)
  function strikeHammer(isManual = false) {
    hammerAnim = 1.0;

    let isCrit = Math.random() < critRate;
    let addVal = isCrit ? 2 : 1;

    atk += addVal;
    dmg += addVal;

    playSound(isCrit ? 'crit' : 'hammer');
    spawnSparks(270, 140, isCrit ? 30 : 15);

    dealMonsterDamage(dmg);

    updateHUD();
    saveState();
  }

  function spawnSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI / 2;
      const speed = Math.random() * 8 + 4;
      sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: Math.random() < 0.3 ? '#fbbf24' : '#ef4444'
      });
    }
  }

  // 2. Select New 5th Grade Curriculum Sentence (Automatic Mix)
  function selectNewTargetSentence() {
    const item = CURRICULUM_SENTENCES[Math.floor(Math.random() * CURRICULUM_SENTENCES.length)];
    currentTargetSentence = item.text;
    currentConceptTip = item.concept;

    conceptTipText.textContent = currentConceptTip;
    typingInput.value = '';
    typingStartTime = performance.now();
    renderSentenceDisplay();
  }

  function renderSentenceDisplay() {
    const inputVal = typingInput.value;
    let html = '';

    for (let i = 0; i < currentTargetSentence.length; i++) {
      const char = currentTargetSentence[i];
      if (i < inputVal.length) {
        if (inputVal[i] === char) {
          html += `<span class="char-correct">${escapeHtml(char)}</span>`;
        } else {
          html += `<span class="char-wrong">${escapeHtml(char)}</span>`;
        }
      } else {
        html += `<span class="char-pending">${escapeHtml(char)}</span>`;
      }
    }
    targetSentenceDisplay.innerHTML = html;

    if (inputVal.length > 0 && typingStartTime > 0) {
      const elapsedSec = (performance.now() - typingStartTime) / 1000;
      const cpm = Math.floor((inputVal.length / elapsedSec) * 60);

      let correctCount = 0;
      for (let i = 0; i < inputVal.length; i++) {
        if (inputVal[i] === currentTargetSentence[i]) correctCount++;
      }
      const acc = Math.floor((correctCount / inputVal.length) * 100);
      typingStats.textContent = `${cpm} CPM | ${acc}% Acc`;
    } else {
      typingStats.textContent = `0 CPM | 100% Acc`;
    }
  }

  typingInput.addEventListener('input', renderSentenceDisplay);

  typingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const inputVal = typingInput.value.trim();
      if (inputVal === currentTargetSentence) {
        completedSentences++;
        strikeHammer(true);

        const currentLvlInfo = SWORD_LEVELS[currentLevelIdx];

        if (completedSentences >= currentLvlInfo.reqSentences) {
          triggerSwordEvolution();
        } else {
          selectNewTargetSentence();
        }
        updateHUD();
      }
    }
  });

  // 3. Trigger Sword Evolution
  function triggerSwordEvolution() {
    if (currentLevelIdx < SWORD_LEVELS.length - 1) {
      currentLevelIdx++;
      completedSentences = 0;

      const newLvlInfo = SWORD_LEVELS[currentLevelIdx];

      atk += newLvlInfo.bonusAtk;
      dmg += newLvlInfo.bonusAtk;

      playSound('evo');

      if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }

      evoSwordIcon.textContent = newLvlInfo.icon;
      evoSwordName.textContent = `LV.${newLvlInfo.level} [${newLvlInfo.name}]`;
      evoDesc.textContent = `초등 5학년 교과 타자 목표 완수! 검이 새로운 등급으로 벼려졌습니다!`;
      evoAtkText.textContent = `+${newLvlInfo.bonusAtk} ATK`;
      evoDmgText.textContent = `+${newLvlInfo.bonusAtk} DMG`;

      evolutionModal.classList.remove('hidden');
      selectNewTargetSentence();
    }
    updateHUD();
    saveState();
  }

  btnCloseEvo.addEventListener('click', () => {
    evolutionModal.classList.add('hidden');
    typingInput.focus();
  });

  // 4. Monster Dungeon Battle Logic
  function dealMonsterDamage(amount) {
    currentMonsterHp -= amount;

    slashEffect.textContent = `💥 -${amount} DMG`;
    slashEffect.classList.remove('hidden');
    setTimeout(() => slashEffect.classList.add('hidden'), 300);

    if (currentMonsterHp <= 0) {
      const m = MONSTERS[currentMonsterIdx];
      const earnedGold = Math.floor(m.gold * goldMult);
      gold += earnedGold;

      playSound('monsterDie');

      currentMonsterIdx = (currentMonsterIdx + 1) % MONSTERS.length;
      currentMonsterHp = MONSTERS[currentMonsterIdx].hp;
    }

    updateMonsterUI();
  }

  function updateMonsterUI() {
    const m = MONSTERS[currentMonsterIdx];
    monsterIcon.textContent = m.icon;
    monsterName.textContent = `LV.${currentMonsterIdx + 1} ${m.name}`;
    dungeonStage.textContent = `STAGE ${currentMonsterIdx + 1}`;

    const hpPct = Math.max(0, (currentMonsterHp / m.hp) * 100);
    monsterHpFill.style.width = `${hpPct}%`;
    monsterHpText.textContent = `${Math.max(0, currentMonsterHp)} / ${m.hp} HP`;
  }

  // 5. Forge Shop Upgrades
  buyAutoSpeed.addEventListener('click', () => {
    const cost = Math.floor(50 * Math.pow(1.8, autoSpeedLvl - 1));
    if (gold >= cost && autoIntervalSec > 0.8) {
      gold -= cost;
      autoSpeedLvl++;
      autoIntervalSec = Math.max(0.8, autoIntervalSec - 0.4);
      updateHUD();
      saveState();
    }
  });

  buyCritRate.addEventListener('click', () => {
    const cost = Math.floor(100 * Math.pow(2.0, critLvl - 1));
    if (gold >= cost && critRate < 0.5) {
      gold -= cost;
      critLvl++;
      critRate += 0.05;
      updateHUD();
      saveState();
    }
  });

  buyGoldBoost.addEventListener('click', () => {
    const cost = Math.floor(200 * Math.pow(2.2, goldLvl - 1));
    if (gold >= cost) {
      gold -= cost;
      goldLvl++;
      goldMult += 0.5;
      updateHUD();
      saveState();
    }
  });

  // Manual Hammer Click
  btnManualHammer.addEventListener('click', () => {
    strikeHammer(true);
  });

  // 6. Update HUD Elements
  function updateHUD() {
    const currentLvlInfo = SWORD_LEVELS[currentLevelIdx];
    swordNameText.textContent = `LV.${currentLvlInfo.level} [${currentLvlInfo.name}]`;
    swordNameText.style.color = currentLvlInfo.color;

    atkText.textContent = atk.toLocaleString();
    dmgText.textContent = dmg.toLocaleString();
    goldText.textContent = `${gold.toLocaleString()} G`;

    // Upgrade Challenge Progress
    upgradeTargetText.textContent = (currentLevelIdx < SWORD_LEVELS.length - 1)
      ? `다음 진화: LV.${currentLvlInfo.level + 1} ${SWORD_LEVELS[currentLevelIdx + 1].name} (목표: ${currentLvlInfo.reqSentences}문장 완수)`
      : `최고 등급 달성! (신의 성검)`;

    const req = currentLvlInfo.reqSentences;
    sentenceCountText.textContent = `${completedSentences} / ${req} 문장 완료`;
    sentenceProgressFill.style.width = `${Math.min(100, (completedSentences / req) * 100)}%`;

    // Shop Prices
    const speedCost = Math.floor(50 * Math.pow(1.8, autoSpeedLvl - 1));
    autoSpeedDesc.textContent = `현재: ${autoIntervalSec.toFixed(1)}초 간격`;
    autoSpeedCost.textContent = `${speedCost} G`;

    const critCost = Math.floor(100 * Math.pow(2.0, critLvl - 1));
    critRateDesc.textContent = `현재: ${Math.round(critRate * 100)}% (ATK 2배)`;
    critRateCost.textContent = `${critCost} G`;

    const gCost = Math.floor(200 * Math.pow(2.2, goldLvl - 1));
    goldBoostDesc.textContent = `현재: x${goldMult.toFixed(1)} 배율`;
    goldBoostCost.textContent = `${gCost} G`;

    updateMonsterUI();
  }

  // 7. Canvas Blacksmith Forge Render Loop
  function animLoop(timestamp) {
    const dt = (timestamp - lastAutoTime) / 1000;

    if (dt >= autoIntervalSec) {
      lastAutoTime = timestamp;
      strikeHammer(false);
    }

    const timerPct = Math.min(100, (dt / autoIntervalSec) * 100);
    timerBarFill.style.width = `${timerPct}%`;

    renderForgeCanvas();

    requestAnimationFrame(animLoop);
  }

  function renderForgeCanvas() {
    const w = forgeCanvas.width;
    const h = forgeCanvas.height;

    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
    bgGrad.addColorStop(0, '#2d1814');
    bgGrad.addColorStop(1, '#0e090a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    embers.forEach(e => {
      e.y += e.vy;
      e.x += e.vx;
      if (e.y < 0) {
        e.y = h;
        e.x = Math.random() * w;
      }
      ctx.fillStyle = `rgba(249, 115, 22, ${e.alpha})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
    });

    const anvilX = w / 2 - 90;
    const anvilY = 140;

    ctx.fillStyle = '#334155';
    ctx.fillRect(anvilX, anvilY, 180, 45);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(anvilX + 35, anvilY + 45, 110, 35);
    ctx.fillRect(anvilX + 15, anvilY + 80, 150, 25);

    const swordX = w / 2 - 70;
    const swordY = anvilY - 8;

    const currentLvlInfo = SWORD_LEVELS[currentLevelIdx];

    ctx.shadowBlur = 15;
    ctx.shadowColor = currentLvlInfo.color;
    ctx.fillStyle = currentLvlInfo.color;

    ctx.beginPath();
    ctx.roundRect(swordX, swordY, 140, 12, 6);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(swordX - 10, swordY - 4, 12, 20);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(swordX - 25, swordY + 2, 16, 8);

    ctx.shadowBlur = 0;

    if (hammerAnim > 0) {
      hammerAnim -= 0.08;
      if (hammerAnim < 0) hammerAnim = 0;
    }

    const hammerAngle = -Math.PI / 4 + (1 - hammerAnim) * (Math.PI / 3);
    ctx.save();
    ctx.translate(w / 2 + 40, anvilY - 20);
    ctx.rotate(hammerAngle);

    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, -6, 80, 12);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(60, -20, 35, 40);

    ctx.restore();

    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= 0.04;

      if (p.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Initial Game Startup
  selectNewTargetSentence();
  updateHUD();
  requestAnimationFrame(animLoop);
});
