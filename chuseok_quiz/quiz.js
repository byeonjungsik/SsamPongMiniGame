/**
 * Chuseok Quiz Presentation & Live Scoreboard Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const slideNumEl = document.getElementById('slide-num');
  const totalSlidesEl = document.getElementById('total-slides');
  const participantCountBadge = document.getElementById('participant-count-badge');

  const categoryBadge = document.getElementById('category-badge');
  const pointsBadge = document.getElementById('points-badge');

  const quizIcon = document.getElementById('quiz-icon');
  const quizQuestion = document.getElementById('quiz-question');
  const quizHint = document.getElementById('quiz-hint');

  const answerBox = document.getElementById('answer-box');
  const answerText = document.getElementById('answer-text');
  const answerExplanation = document.getElementById('answer-explanation');

  const revealAnswerBtn = document.getElementById('reveal-answer-btn');
  const prevSlideBtn = document.getElementById('prev-slide-btn');
  const nextSlideBtn = document.getElementById('next-slide-btn');

  const toggleScoreboardBtn = document.getElementById('toggle-scoreboard-btn');
  const scoreboardDrawer = document.getElementById('scoreboard-drawer');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');

  const participantNameInput = document.getElementById('participant-name-input');
  const addParticipantBtn = document.getElementById('add-participant-btn');
  const participantList = document.getElementById('participant-list');
  const announceWinnerBtn = document.getElementById('announce-winner-btn');

  const winnerModal = document.getElementById('winner-modal');
  const podiumDisplay = document.getElementById('podium-display');
  const closeWinnerModalBtn = document.getElementById('close-winner-modal-btn');

  // Quiz Database (12 Presentation Slides)
  const QUIZ_SLIDES = [
    {
      category: '🌾 추석 풍속 & 문화',
      points: 10,
      icon: '🥟',
      question: '추석에 온 가족이 함께 빚어 먹는 대표적인 반달 모양의 떡은 무엇일까요?',
      hint: '💡 힌트: 솔잎을 시루에 까서 쪄냅니다.',
      answer: '송편',
      explanation: '송편은 앞으로 더 가득 찰 반달 모양으로 빚어 수확과 번영을 기원하는 떡입니다.'
    },
    {
      category: '🌾 추석 풍속 & 문화',
      points: 10,
      icon: '🌕',
      question: '추석날 밤 여성들이 손을 잡고 동그랗게 원을 만들며 춤추고 노래하는 놀이는 무엇일까요?',
      hint: '💡 힌트: 임진왜란 당시 이순신 장군이 의병술로도 활용했습니다.',
      answer: '강강술래 (강강수월래)',
      explanation: '풍요와 다만을 기원하며 풍물에 맞춰 동그랗게 둘러서서 노래 부르고 춤추는 전통 놀이입니다.'
    },
    {
      category: '🍲 추석 음식 퀴즈',
      points: 20,
      icon: '🌲',
      question: '송편을 찔 때 찜기에 솔잎을 넣어서 찌는 가장 중요한 이유는 무엇일까요?',
      hint: '💡 힌트: 떡이 서로 붙지 않게 하고 은은한 향과 함께 떡이 쉽게 쉼(부패)을 방지합니다.',
      answer: '떡이 엉겨 붙지 않고 방부 효과(쉽게 쉬지 않음)를 내기 위해',
      explanation: '솔잎의 피톤치드 성분이 세균 번식을 막아 떡이 쉽게 쇠거나 부패하는 것을 막아줍니다.'
    },
    {
      category: '🍲 추석 음식 퀴즈',
      points: 20,
      icon: '🥣',
      question: '추석 차례상이나 절식으로 올리는 흙속의 알이라 불리는 뿌리채소 국은 무엇일까요?',
      hint: '💡 힌트: 흙 토(土) 자와 알 란(卵) 자를 씁니다.',
      answer: '토란국',
      explanation: '토란은 추석 무렵이 제철이며 소화를 돕고 밤낮 일교차가 큰 가을철 건강을 지켜줍니다.'
    },
    {
      category: '🍲 추석 차례상 퀴즈',
      points: 20,
      icon: '🐟',
      question: '차례상에 생선을 올릴 때 생선의 머리는 동쪽, 꼬리는 서쪽으로 놓는 사자성어는 무엇일까요?',
      hint: '💡 힌트: 두0미0 (머리 두, 꼬리 미)',
      answer: '두동미서 (頭東尾西)',
      explanation: '생선의 머리는 동쪽(해가 뜨는 방향), 꼬리는 서쪽으로 배향하는 정통 차례상 진설법입니다.'
    },
    {
      category: '🌕 추석 속담 퀴즈',
      points: 20,
      icon: '🌾',
      question: '추석의 풍요로움을 기원하는 대표적인 속담 "더도 말고 더도 말고 OOO만 같아라"에 들어갈 말은?',
      hint: '💡 힌트: 추석을 뜻하는 한국 순우리말 고유어입니다.',
      answer: '한가위',
      explanation: '오곡백과가 풍성한 추석 한가위처럼 언제나 배부르고 행복하기를 바라는 최고의 속담입니다.'
    },
    {
      category: '🌕 추석 전래동화',
      points: 20,
      icon: '🐇',
      question: '전래동화 속 보름달에서 옥토끼 두 마리가 쿵덕쿵덕 찧고 있는 것은 무엇일까요?',
      hint: '💡 힌트: 떡 또는 늙지 않는 불로초 약입니다.',
      answer: '달떡 (또는 불로초/불사약)',
      explanation: '동양 전설 속 달에 사는 달토끼는 계수나무 아래에서 절구로 달떡이나 영약(불로초)을 찧는다고 합니다.'
    },
    {
      category: '🧠 초성 퀴즈 (쉬움)',
      points: 10,
      icon: '🎁',
      question: '다음 초성에 해당하는 추석 대표 음식은 무엇일까요?\n\n[ ㅅ ㅍ ]',
      hint: '💡 힌트: 콩, 깨, 팥 소를 넣어 빚는 떡',
      answer: '송편',
      explanation: '추석하면 가장 먼저 떠오르는 1등 대표 음식 송편입니다.'
    },
    {
      category: '🧠 초성 퀴즈 (보통)',
      points: 20,
      icon: '🌕',
      question: '다음 초성에 해당하는 추석의 다른 순우리말 명칭은 무엇일까요?\n\n[ ㅎ ㄱ ㅇ ]',
      hint: '💡 힌트: 8월 한가운데의 큰 날',
      answer: '한가위',
      explanation: '한(크다) + 가위(가운데) = 8월 한가운데의 큰 명절이란 뜻입니다.'
    },
    {
      category: '🧠 초성 퀴즈 (고수)',
      points: 30,
      icon: '💃',
      question: '다음 초성에 해당하는 추석 민속놀이는 무엇일까요?\n\n[ ㄱ ㄱ ㅅ ㄹ ]',
      hint: '💡 힌트: 보름달 아래서 손을 잡고 돕니다.',
      answer: '강강술래',
      explanation: '유네스코 인류무형문화유산으로 지정된 한국 전통 민속놀이 강강술래입니다.'
    },
    {
      category: '🏆 추석 왕중왕 퀴즈',
      points: 30,
      icon: '📜',
      question: '신라시대 유리이사금 때 왕녀들이 두 편으로 나눠 베짜기 내기를 한 데서 유래한 추석의 한자 명칭은?',
      hint: '💡 힌트: 8월 15일 가배(嘉俳) 또는 중0절',
      answer: '가배 (또는 중추절)',
      explanation: '신라 베짜기 내기 후 진편이 이긴 편에게 음식을 대접하며 "가배야!" 즐거워한 데서 유래했습니다.'
    },
    {
      category: '🏆 골든벨 최종 퀴즈',
      points: 30,
      icon: '🎆',
      question: '추석(秋夕)의 한자 뜻 글자 그대로의 번역 의미는 무엇일까요?',
      hint: '💡 힌트: 가을 추(秋), 저녁 석(夕)',
      answer: '가을 저녁 (가을의 달빛이 가장 좋은 밤)',
      explanation: '추석(秋夕)은 가을 저녁, 즉 가을 달빛이 가장 맑고 아름다운 밤이라는 뜻입니다.'
    }
  ];

  // Game & Scoreboard State
  let currentSlideIdx = 0;
  let isAnswerRevealed = false;

  const initialDefaultParticipants = [
    { id: 'dad', name: '👨‍👩‍👦 아빠', score: 0 },
    { id: 'mom', name: '👩‍👩‍👦 엄마', score: 0 }
  ];

  let storedParticipants = localStorage.getItem('chuseok_participants');
  let participants = storedParticipants ? JSON.parse(storedParticipants) : initialDefaultParticipants;
  if (!Array.isArray(participants) || participants.length === 0) {
    participants = initialDefaultParticipants;
  }

  const quickScoreboardList = document.getElementById('quick-scoreboard-list');

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

    if (type === 'reveal') {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.13);
      });
    } else if (type === 'point') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'fanfare') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.3, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.26);
      });
    }
  }

  // Render Slide Function
  function renderSlide(idx) {
    currentSlideIdx = idx;
    isAnswerRevealed = false;

    const data = QUIZ_SLIDES[idx];

    slideNumEl.textContent = idx + 1;
    totalSlidesEl.textContent = QUIZ_SLIDES.length;

    categoryBadge.textContent = data.category;
    pointsBadge.textContent = `+${data.points}점`;

    quizIcon.textContent = data.icon;
    quizQuestion.textContent = data.question;
    quizHint.textContent = data.hint;

    answerText.textContent = data.answer;
    answerExplanation.textContent = data.explanation;

    answerBox.classList.add('hidden');
    revealAnswerBtn.classList.remove('hidden');

    prevSlideBtn.disabled = idx === 0;
    nextSlideBtn.textContent = idx === QUIZ_SLIDES.length - 1 ? '🏁 최종 시상식 ▶' : '다음 슬라이드 ▶';

    renderParticipantList();
  }

  revealAnswerBtn.addEventListener('click', () => {
    isAnswerRevealed = true;
    answerBox.classList.remove('hidden');
    revealAnswerBtn.classList.add('hidden');
    playSound('reveal');
  });

  prevSlideBtn.addEventListener('click', () => {
    if (currentSlideIdx > 0) renderSlide(currentSlideIdx - 1);
  });

  nextSlideBtn.addEventListener('click', () => {
    if (currentSlideIdx < QUIZ_SLIDES.length - 1) {
      renderSlide(currentSlideIdx + 1);
    } else {
      showWinnerModal();
    }
  });

  // Scoreboard Drawer Handlers
  toggleScoreboardBtn.addEventListener('click', () => {
    scoreboardDrawer.classList.toggle('hidden');
  });

  closeDrawerBtn.addEventListener('click', () => {
    scoreboardDrawer.classList.add('hidden');
  });

  // Participant Management
  function addParticipant(name) {
    if (!name.trim()) return;
    const p = {
      id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: name.trim(),
      score: 0
    };
    participants.push(p);
    saveParticipants();
    renderParticipantList();
  }

  function addPoints(id, pts) {
    const p = participants.find(item => String(item.id) === String(id));
    if (p) {
      p.score += pts;
      playSound('point');
      saveParticipants();
      renderParticipantList();
    }
  }

  function saveParticipants() {
    localStorage.setItem('chuseok_participants', JSON.stringify(participants));
  }

  function renderParticipantList() {
    participantCountBadge.textContent = participants.length;

    const currentSlidePts = QUIZ_SLIDES[currentSlideIdx] ? QUIZ_SLIDES[currentSlideIdx].points : 10;

    // 1. Top Quick Scoreboard Bar (Instant click for 아빠, 엄마)
    if (quickScoreboardList) {
      quickScoreboardList.innerHTML = participants.map(p => `
        <button class="quick-score-btn" onclick="window.addPointsHandler('${p.id}', ${currentSlidePts})" title="${p.name}에게 +${currentSlidePts}점 부여">
          <span class="name">${escapeHtml(p.name)}</span>
          <span class="score-badge">${p.score}점 (+${currentSlidePts})</span>
        </button>
      `).join('') + `
        <button class="btn-pt" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(255,255,255,0.1); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.2);" onclick="document.getElementById('toggle-scoreboard-btn').click();">+ 참가자 관리</button>
      `;
    }

    // 2. Side Drawer Leaderboard
    const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

    if (sortedParticipants.length === 0) {
      participantList.innerHTML = '<div class="empty-msg">아직 참가자가 없습니다. 위에 이름을 추가하세요!</div>';
      return;
    }

    participantList.innerHTML = sortedParticipants.map((p, idx) => {
      let rankIcon = `${idx + 1}위`;
      if (idx === 0) rankIcon = '🥇';
      else if (idx === 1) rankIcon = '🥈';
      else if (idx === 2) rankIcon = '🥉';

      return `
        <div class="participant-card">
          <div class="participant-info">
            <span class="participant-rank">${rankIcon}</span>
            <span class="participant-name">${escapeHtml(p.name)}</span>
            <span class="participant-score">${p.score}점</span>
          </div>

          <div class="point-btn-group">
            <button class="btn-pt" onclick="window.addPointsHandler('${p.id}', ${currentSlidePts})">+${currentSlidePts}점(맞춤!)</button>
            <button class="btn-pt" onclick="window.addPointsHandler('${p.id}', 10)">+10점</button>
            <button class="btn-pt" onclick="window.addPointsHandler('${p.id}', -10)">-10점</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.addPointsHandler = (id, pts) => {
    addPoints(id, pts);
  };

  addParticipantBtn.addEventListener('click', () => {
    addParticipant(participantNameInput.value);
    participantNameInput.value = '';
  });

  participantNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addParticipant(participantNameInput.value);
      participantNameInput.value = '';
    }
  });

  // Winner Celebration Modal & Confetti
  function showWinnerModal() {
    scoreboardDrawer.classList.add('hidden');
    participants.sort((a, b) => b.score - a.score);

    if (participants.length === 0) {
      alert('등록된 참가자가 없습니다. 스코어보드에서 참가자 이름을 먼저 추가해 주세요!');
      scoreboardDrawer.classList.remove('hidden');
      return;
    }

    playSound('fanfare');

    // Confetti Fireworks
    if (typeof confetti === 'function') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 } }), 300);
    }

    const podiums = [
      { rank: '1위 🥇 (최종 우승)', class: 'podium-1st', p: participants[0] },
      { rank: '2위 🥈', class: 'podium-2nd', p: participants[1] },
      { rank: '3위 🥉', class: 'podium-3rd', p: participants[2] }
    ];

    podiumDisplay.innerHTML = podiums.filter(item => item.p).map(item => `
      <div class="podium-box ${item.class}">
        <span class="podium-medal">${item.rank.split(' ')[1]}</span>
        <span class="podium-name">${escapeHtml(item.p.name)}</span>
        <span class="podium-pts">${item.p.score}점</span>
      </div>
    `).join('');

    winnerModal.classList.remove('hidden');
  }

  announceWinnerBtn.addEventListener('click', showWinnerModal);

  closeWinnerModalBtn.addEventListener('click', () => {
    winnerModal.classList.add('hidden');
    renderSlide(0);
  });

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Start App
  renderSlide(0);
  renderParticipantList();
});
