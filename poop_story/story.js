/**
 * Diarrhea Survival Choice-Based Story Engine
 * Supports 3 Genders (Male, Female, Genderless) and Branching Decisions
 */

document.addEventListener('DOMContentLoaded', () => {
  const genderScreen = document.getElementById('gender-screen');
  const gameScreen = document.getElementById('game-screen');
  const genderBtns = document.querySelectorAll('.gender-btn');

  const charAvatar = document.getElementById('char-avatar');
  const charName = document.getElementById('char-name');
  const charLocation = document.getElementById('char-location');

  const hpText = document.getElementById('hp-text');
  const hpBar = document.getElementById('hp-bar');
  const pressureText = document.getElementById('pressure-text');
  const pressureBar = document.getElementById('pressure-bar');

  const situationIcon = document.getElementById('situation-icon');
  const storyTitle = document.getElementById('story-title');
  const storyBody = document.getElementById('story-body');

  const choiceABtn = document.getElementById('choice-a-btn');
  const choiceAText = document.getElementById('choice-a-text');
  const choiceBBtn = document.getElementById('choice-b-btn');
  const choiceBText = document.getElementById('choice-b-text');

  const endingModal = document.getElementById('ending-modal');
  const endingIcon = document.getElementById('ending-icon');
  const endingTitle = document.getElementById('ending-title');
  const endingDesc = document.getElementById('ending-desc');
  const finalHp = document.getElementById('final-hp');
  const restartBtn = document.getElementById('restart-btn');

  const appContainer = document.getElementById('app-container');

  // Game State Variables
  let selectedGender = 'male'; // 'male' | 'female' | 'neutral'
  let playerMeta = { name: '김설사', avatar: '👨', restroom: '남성용 화장실' };
  let hp = 100;
  let pressure = 80;
  let currentNodeKey = 'START';

  // Web Audio API Sound Synth
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

    if (type === 'rumble') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 1.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.21);
    } else if (type === 'flush') {
      const bufferSize = audioCtx.sampleRate * 1.5;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 1.5);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 1.51);
    } else if (type === 'explode') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.61);
    }
  }

  function triggerStomachShake() {
    playSound('rumble');
    appContainer.classList.add('rumble-shake');
    setTimeout(() => appContainer.classList.remove('rumble-shake'), 400);
  }

  // Branching Story Tree Data
  const STORY_TREE = {
    START: {
      icon: '🌩️',
      title: '쿠르릉! 장내 대폭발의 징조',
      location: '🚇 지하철 2호선 차내',
      text: (p) => `매운 불닭볶음면에 유통기한 지난 우유를 마신 ${p.name}... 만원 지하철 한복판에서 장내 수압(9.81 m/s²)이 폭발적으로 상승하기 시작합니다! 식은땀이 쏟아지고 배에서 천둥 쿠르릉 소리가 요동칩니다!`,
      choiceA: { text: '지하철에서 내려서 역내 화장실로 맹렬히 달린다!', next: 'STATION_RUN', hpDelta: -5, pressureDelta: 5 },
      choiceB: { text: '괄약근에 모든 신경을 집약하고 한 정거장 더 참는다!', next: 'ENDURE_TRAIN', hpDelta: -25, pressureDelta: 15 }
    },
    ENDURE_TRAIN: {
      icon: '💦',
      title: '한계에 다다른 괄약근',
      location: '🚇 지하철 2호선 차내',
      text: (p) => `괄약근에 온 신경을集(집)약했지만 지하철이 덜컹거릴 때마다 유체가 폭발 직전까지 차오릅니다! 아차 하는 순간 모든 것을 잃을 수도 있습니다!`,
      choiceA: { text: '기둥을 잡고 살짝 쪼그려 앉아 수압을 분산한다!', next: 'STATION_RUN', hpDelta: -15, pressureDelta: 10 },
      choiceB: { text: '이 악물고 눈을 감은 채 꼿꼿이 서 있는다.', next: 'BAD_TRAIN_EXPLODE', hpDelta: -60, pressureDelta: 20 }
    },
    STATION_RUN: {
      icon: '🏃',
      title: '지하철 탈출 및 맹렬 질주',
      location: '🚉 지하철역 대합실',
      text: (p) => `문이 열리자마자 ${p.name}(은/는) 튀어나왔습니다! 멀리 계단과 에스컬레이터, 그리고 화장실 표지판이 보입니다.`,
      choiceA: { text: '2단 계단 뛰어오르기로 화장실을 향해 전속력 질주!', next: 'STAIRS_SPRINT', hpDelta: -10, pressureDelta: 5 },
      choiceB: { text: '양 다리를 모으고 게걸음으로 조심스럽게 이동한다.', next: 'RESTROOM_ARRIVE', hpDelta: -5, pressureDelta: 5 }
    },
    STAIRS_SPRINT: {
      icon: '🪜',
      title: '계단 2단 뛰기와 괄약근 충격파',
      location: '🪜 지하철 계단구간',
      text: (p) => `계단을 뛰어오르던 순간! 덜컹! 괄약근에 물리적 충격파가 전달되었습니다! 식은땀이 눈 앞을 가립니다!`,
      choiceA: { text: '식은땀을 닦으며 빠르게 화장실 입구로 직진한다!', next: 'RESTROOM_ARRIVE', hpDelta: -10, pressureDelta: 5 },
      choiceB: { text: '잠시 벽에 기대어 3초간 숨을 고른다.', next: 'RESTROOM_ARRIVE', hpDelta: -5, pressureDelta: 5 }
    },
    RESTROOM_ARRIVE: {
      icon: '🚽',
      title: '구원의 화장실 입구 도착',
      location: `🚽 역내 ${playerMeta.restroom}`,
      text: (p) => `드디어 구원의 ${p.restroom} 입구 도착! 비어있는 맨 안쪽 칸 문이 보입니다!`,
      choiceA: { text: '비어있는 맨 안쪽 칸 문을 냅다 박차고 들어간다!', next: 'STALL_ENTER', hpDelta: 0, pressureDelta: 0 },
      choiceB: { text: '휴지 자판기에서 휴지가 있나 먼저 확인한다.', next: 'CHECK_PAPER', hpDelta: -10, pressureDelta: 0 }
    },
    CHECK_PAPER: {
      icon: '🧻',
      title: '휴지 자판기 고장 비상사태',
      location: `🚽 ${playerMeta.restroom} 입구`,
      text: (p) => `아뿔사! 휴지 자판기가 비어있습니다! 하지만 지금 칸 안으로 들어가지 않으면 0.5초 안에 대폭발이 일어납니다!`,
      choiceA: { text: '일단 빈 칸으로 돌진하여 변기에 앉는다!', next: 'SIT_NO_PAPER', hpDelta: 0, pressureDelta: 0 },
      choiceB: { text: '호주머니 속 지하철 영수증과 영수증지를 챙겨 칸으로 간다!', next: 'SIT_PAPER_READY', hpDelta: 0, pressureDelta: 0 }
    },
    STALL_ENTER: {
      icon: '🪑',
      title: '변기 안착 성공... 그러나?!',
      location: '🚽 화장실 맨 안쪽 칸',
      text: (p) => `바지를 내리고 변기에 털썩 앉았습니다! 쿠르릉 폭풍 물설사를 비워냈지만... 휴지걸이에 휴지가 없습니다!`,
      choiceA: { text: '호주머니 속 지하철 영수증과 메모지를 사용하여 해결한다!', next: 'HAPPY_SURVIVAL', hpDelta: 0, pressureDelta: 0 },
      choiceB: { text: '왼쪽 양말 한 짝을 희생하여 깔끔히 마무리한다!', next: 'HAPPY_LEGEND', hpDelta: 0, pressureDelta: 0 }
    },
    SIT_PAPER_READY: {
      icon: '🎉',
      title: '완벽한 준비와 쾌변의 전설',
      location: '🚽 화장실 맨 안쪽 칸',
      text: (p) => `미리 챙긴 영수증과 종이를 손에 쥐고 변기에 앉아 시원하게 폭풍 설사를 쏟아냅니다! 완벽한 승리!`,
      choiceA: { text: '회오리 물을 내리고 시원하게 밖으로 나간다.', next: 'HAPPY_SURVIVAL', hpDelta: 0, pressureDelta: 0 },
      choiceB: { text: '양말까지 활용해 영혼까지 깨끗하게 마무리를 짓는다.', next: 'HAPPY_LEGEND', hpDelta: 0, pressureDelta: 0 }
    },
    SIT_NO_PAPER: {
      icon: '😱',
      title: '휴지가 없는 절대 위기',
      location: '🚽 화장실 맨 안쪽 칸',
      text: (p) => `변기 비우기에는 성공했지만 휴지가 전혀 없습니다! 밖에서 아무도 도와주지 않습니다!`,
      choiceA: { text: '호주머니 영수증으로 조심스럽게 닦는다.', next: 'HAPPY_SURVIVAL', hpDelta: 0, pressureDelta: 0 },
      choiceB: { text: '소리 질러 도움을 요청해본다.', next: 'BAD_NO_PAPER', hpDelta: 0, pressureDelta: 0 }
    },

    // ========================================================
    // Endings (Happy & Bad Endings)
    // ========================================================
    HAPPY_SURVIVAL: {
      isEnding: true,
      win: true,
      icon: '🏆',
      title: 'HAPPY END: 시원한 구원과 생존!',
      desc: (p) => `${p.name}(은/는) 영수증을 활용해 깨끗이 마무리하고 회오리 물을 내렸습니다! 괄약근을 지켜내고 무사히 생존하셨습니다!`
    },
    HAPPY_LEGEND: {
      isEnding: true,
      win: true,
      icon: '👑',
      title: 'HAPPY END: 전설의 쾌변왕!',
      desc: (p) => `양말 한 짝의 장렬한 희생으로 최고의 쾌변과 함께 평화를 찾았습니다! 전설의 쾌변왕 칭호를 획득하셨습니다!`
    },
    BAD_TRAIN_EXPLODE: {
      isEnding: true,
      win: false,
      icon: '💥',
      title: 'BAD END: 지하철 대폭발의 비극',
      desc: (p) => `참지 못한 괄약근 내구도가 0%가 되며 지하철 차내에서 폭발하고 말았습니다... 안타깝습니다.`
    },
    BAD_NO_PAPER: {
      isEnding: true,
      win: false,
      icon: '🚽',
      title: 'BAD END: 휴지 부재 아포칼립스',
      desc: (p) => `아무도 휴지를 가져다주지 않아 화장실 칸 안에 갇혀 나오지 못했습니다...`
    }
  };

  // Gender Selection Listener
  genderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedGender = btn.getAttribute('data-gender');

      if (selectedGender === 'male') {
        playerMeta = { name: '김설사', avatar: '👨', restroom: '남성용 화장실' };
      } else if (selectedGender === 'female') {
        playerMeta = { name: '이지림', avatar: '👩', restroom: '여성용 화장실' };
      } else {
        playerMeta = { name: '설사봇-9000', avatar: '🤖', restroom: '로봇 세척구역' };
      }

      charAvatar.textContent = playerMeta.avatar;
      charName.textContent = playerMeta.name;

      genderScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden');

      startStoryGame();
    });
  });

  function startStoryGame() {
    hp = 100;
    pressure = 75;
    currentNodeKey = 'START';
    endingModal.classList.add('hidden');

    updateGauges();
    renderStoryNode(currentNodeKey);
  }

  function updateGauges() {
    hp = Math.max(0, Math.min(100, hp));
    pressure = Math.max(0, Math.min(100, pressure));

    hpText.textContent = `${hp}%`;
    hpBar.style.width = `${hp}%`;

    pressureText.textContent = `${pressure}%`;
    pressureBar.style.width = `${pressure}%`;
  }

  function renderStoryNode(nodeKey) {
    const node = STORY_TREE[nodeKey];
    if (!node) return;

    if (node.isEnding) {
      showEnding(node);
      return;
    }

    triggerStomachShake();

    situationIcon.textContent = node.icon;
    storyTitle.textContent = node.title;
    charLocation.textContent = node.location;
    storyBody.textContent = typeof node.text === 'function' ? node.text(playerMeta) : node.text;

    choiceAText.textContent = node.choiceA.text;
    choiceBText.textContent = node.choiceB.text;

    choiceABtn.onclick = () => handleChoice(node.choiceA);
    choiceBBtn.onclick = () => handleChoice(node.choiceB);
  }

  function handleChoice(choiceData) {
    hp += choiceData.hpDelta;
    pressure += choiceData.pressureDelta;
    updateGauges();

    if (hp <= 0) {
      showEnding(STORY_TREE['BAD_TRAIN_EXPLODE']);
      return;
    }

    currentNodeKey = choiceData.next;
    renderStoryNode(currentNodeKey);
  }

  function showEnding(endingNode) {
    if (endingNode.win) {
      playSound('flush');
    } else {
      playSound('explode');
    }

    endingIcon.textContent = endingNode.icon;
    endingTitle.textContent = endingNode.title;
    endingDesc.textContent = typeof endingNode.desc === 'function' ? endingNode.desc(playerMeta) : endingNode.desc;
    finalHp.textContent = `${hp}%`;

    endingModal.classList.remove('hidden');
  }

  restartBtn.addEventListener('click', () => {
    endingModal.classList.add('hidden');
    gameScreen.classList.add('hidden');
    genderScreen.classList.remove('hidden');
  });
});
