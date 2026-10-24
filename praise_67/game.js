/**
 * 전설의 숫자 67 찬양 연구소 (Number 67 Praise Simulator)
 */

(function () {
  'use strict';

  // DOM Elements
  const praiseCounter = document.getElementById('praise-counter');
  const rankTitle = document.getElementById('rank-title');
  const autoRate = document.getElementById('auto-rate');
  const sphere67 = document.getElementById('sphere-67');
  const btnPraise = document.getElementById('btn-praise');
  const triviaText = document.getElementById('trivia-text');

  const upClick = document.getElementById('up-click');
  const costClick = document.getElementById('cost-click');
  const upAuto1 = document.getElementById('up-auto1');
  const costAuto1 = document.getElementById('cost-auto1');
  const upAuto2 = document.getElementById('up-auto2');
  const costAuto2 = document.getElementById('cost-auto2');
  const upFever = document.getElementById('up-fever');
  const costFever = document.getElementById('cost-fever');

  // State Variables
  let praises = 0;
  let clickPower = 1;
  let autoPower = 0;

  let clickUpgradeCost = 10;
  let auto1Cost = 50;
  let auto2Cost = 200;
  let feverCost = 670;

  // Funny 67 Trivia Pool
  const TRIVIA_LIST = [
    "67은 19번째 소수(Prime Number)입니다. 19에 3을 곱하고 10을 더하면 67이 됩니다! (아무 상관없음)",
    "컴퓨터 키보드를 보면 숫자 6과 7은 사이좋게 나란히 붙어있습니다. 이것은 필연입니다.",
    "67을 거꾸로 뒤집으면 76이 됩니다. 놀랍게도 아무 일도 일어나지 않았습니다.",
    "7 × 9 = 63입니다. 여기에 4를 더하면 기적처럼 67이 완성됩니다!",
    "67도 각도로 인사를 하면 가장 정중하고 수학적인 인사가 된다는 소문이 있습니다.",
    "오늘 당신이 67을 숭배한 횟수만큼 우주의 엔트로피가 0.000067% 재정렬됩니다.",
    "체온이 67도가 되면 위험하지만, 67을 향한 열정의 온도는 항상 67도입니다.",
    "옛 선현들은 말씀하셨습니다: '인생의 해답이 42라면, 67은 그보다 25만큼 더 위대하다.'",
    "지하철 6호선과 7호선이 만나는 역에서는 67의 기운이 증폭된다고 합니다.",
    "동전의 앞면과 뒷면의 확률은 50:50이지만, 마음속 67의 확률은 100%입니다."
  ];

  // Audio Context (Web Audio API)
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

  function playPraiseSound(pitchMultiplier = 1) {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    const baseFreq = 440 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  function playSpecialChime() {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.2, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.21);
    });
  }

  // Floating text effect
  function createFloatingText(e, text) {
    const floatEl = document.createElement('div');
    floatEl.className = 'float-text';
    floatEl.textContent = text;

    const rect = sphere67.getBoundingClientRect();
    const x = e ? (e.clientX || rect.left + rect.width / 2) : (rect.left + rect.width / 2);
    const y = e ? (e.clientY || rect.top + rect.height / 2) : (rect.top + rect.height / 2);

    floatEl.style.left = `${x - 20 + (Math.random() - 0.5) * 40}px`;
    floatEl.style.top = `${y - 30}px`;
    floatEl.style.position = 'fixed';

    document.body.appendChild(floatEl);

    setTimeout(() => {
      floatEl.remove();
    }, 800);
  }

  // Click Handler
  function handlePraise(e) {
    initAudio();
    const prevPraises = praises;
    praises += clickPower;

    playPraiseSound(1 + (clickPower * 0.05));
    createFloatingText(e, `+${clickPower} 숭배!`);

    // Check 67 milestone celebration
    if (Math.floor(praises / 67) > Math.floor(prevPraises / 67)) {
      playSpecialChime();
      if (window.confetti) {
        window.confetti({
          particleCount: 67,
          spread: 67,
          origin: { y: 0.6 }
        });
      }
    }

    // Change trivia randomly occasionally
    if (Math.random() < 0.2) {
      const randIdx = Math.floor(Math.random() * TRIVIA_LIST.length);
      triviaText.textContent = `"${TRIVIA_LIST[randIdx]}"`;
    }

    updateUI();
  }

  sphere67.addEventListener('click', handlePraise);
  btnPraise.addEventListener('click', handlePraise);

  // Upgrades
  upClick.addEventListener('click', () => {
    if (praises >= clickUpgradeCost) {
      praises -= clickUpgradeCost;
      clickPower += 1;
      clickUpgradeCost = Math.floor(clickUpgradeCost * 1.67);
      playSpecialChime();
      updateUI();
    }
  });

  upAuto1.addEventListener('click', () => {
    if (praises >= auto1Cost) {
      praises -= auto1Cost;
      autoPower += 1;
      auto1Cost = Math.floor(auto1Cost * 1.67);
      playSpecialChime();
      updateUI();
    }
  });

  upAuto2.addEventListener('click', () => {
    if (praises >= auto2Cost) {
      praises -= auto2Cost;
      autoPower += 7;
      auto2Cost = Math.floor(auto2Cost * 1.67);
      playSpecialChime();
      updateUI();
    }
  });

  upFever.addEventListener('click', () => {
    if (praises >= feverCost) {
      praises -= feverCost;
      autoPower += 67;
      feverCost = Math.floor(feverCost * 1.67);
      playSpecialChime();
      updateUI();
    }
  });

  // Rank Title Update
  function getRankTitle(count) {
    if (count >= 67000) return '🌌 67 그 자체 (우주의 화신)';
    if (count >= 6700) return '👑 67 우주 대원수';
    if (count >= 2000) return '💎 67 명예 연구소장';
    if (count >= 670) return '🥇 67 수석 찬양사';
    if (count >= 200) return '🥈 67 열혈 신봉자';
    if (count >= 67) return '🥉 67 견습 수습생';
    return '🌱 67 초심자';
  }

  // Update UI Elements
  function updateUI() {
    praiseCounter.textContent = praises.toLocaleString();
    rankTitle.textContent = getRankTitle(praises);
    autoRate.textContent = `${autoPower.toLocaleString()} /초`;
    btnPraise.textContent = `🙏 위대한 67 칭송하기 (+${clickPower})`;

    costClick.textContent = `${clickUpgradeCost.toLocaleString()} 숭배`;
    costAuto1.textContent = `${auto1Cost.toLocaleString()} 숭배`;
    costAuto2.textContent = `${auto2Cost.toLocaleString()} 숭배`;
    costFever.textContent = `${feverCost.toLocaleString()} 숭배`;

    upClick.disabled = praises < clickUpgradeCost;
    upAuto1.disabled = praises < auto1Cost;
    upAuto2.disabled = praises < auto2Cost;
    upFever.disabled = praises < feverCost;
  }

  // Auto Praise Tick (1 second interval)
  setInterval(() => {
    if (autoPower > 0) {
      const prev = praises;
      praises += autoPower;

      // Celebrate 67 milestone on auto too
      if (Math.floor(praises / 67) > Math.floor(prev / 67)) {
        if (window.confetti) {
          window.confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
        }
      }
      updateUI();
    }
  }, 1000);

  updateUI();
})();
