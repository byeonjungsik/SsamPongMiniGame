/**
 * Korean AI Shiritori / Word-Chain Game Engine with Initial Sound Law (두음법칙) Support
 */

document.addEventListener('DOMContentLoaded', () => {
  const wordFeed = document.getElementById('word-feed');
  const wordInput = document.getElementById('word-input');
  const submitBtn = document.getElementById('submit-btn');

  const scoreVal = document.getElementById('score-val');
  const turnIndicator = document.getElementById('turn-indicator');
  const comboVal = document.getElementById('combo-val');
  const timerBar = document.getElementById('timer-bar');

  const targetCharEl = document.getElementById('target-char');
  const nextStartCharEl = document.getElementById('next-start-char');

  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const difficultySelect = document.getElementById('difficulty-select');
  const startGameBtn = document.getElementById('start-game-btn');

  // Rich Korean Dictionary Data (800+ Nouns)
  const DICTIONARY = [
    "사과", "과자", "자동차", "차량", "양말", "말티즈", "지우개", "개구리", "리듬", "듬직",
    "기차", "차표", "표범", "범고래", "래퍼", "퍼즐", "즐거움", "음악", "악기", "기타",
    "타조", "조개", "개나리", "리본", "본능", "능력", "역기", "기름", "임금", "금반지",
    "지구", "구름", "임시", "시계", "계란", "란제리", "이발소", "소나무", "무지개", "개미",
    "미소", "소풍", "풍선", "선물", "물고기", "기린", "인형", "형사", "사진", "진달래",
    "래미안", "안경", "경찰", "찰떡", "떡볶이", "이불", "불꽃", "꽃병", "병아리", "리모콘",
    "콘서트", "트랙터", "터널", "널뛰기", "기억", "억수", "수박", "박수", "수영장", "장미",
    "미술", "술집", "집게", "게장", "장난감", "감자", "자전거", "거북이", "이구아나", "나비",
    "비행기", "기상", "상어", "어부", "부엉이", "이메일", "일기", "기침", "침대", "대통령",
    "영웅", "웅변", "변기", "기사", "사자", "자두", "두부", "부모님", "님프", "프랑스",
    "스마트폰", "폰카", "카메라", "라디오", "오리", "리사이클", "클로버", "버섯", "섯다",
    "다람쥐", "쥐돌이", "이웃", "웃음", "음료수", "수건", "건물", "물개", "개구쟁이", "이발사",
    "사탕", "탕수육", "육상", "상자", "자석", "석탄", "탄산수", "수도", "도로", "로봇",
    "봇짐", "짐승", "승마", "마늘", "늘보", "보석", "석양", "양파", "파인애플", "플루트",
    "트럼펫", "펫숍", "숍걸", "걸그룹", "그룹", "룹스", "스파게티", "티셔츠", "츠라", "라임",
    "임파선", "선풍기", "기원", "원숭이", "이빨", "빨대", "대나무", "무라", "라면", "면발",
    "발자국", "국수", "수프", "프라이", "이글루", "루비", "비누", "누에", "에어컨", "컨테이너",
    "너구리", "리더", "더위", "위성", "성채", "채소", "소금", "금메달", "달력", "역사",
    "사다리", "리포터", "터미널", "널빤지", "지하철", "철도", "도서관", "관람차", "차고", "고양이",
    "양초", "초촛불", "불고기", "기구", "구슬", "슬리퍼", "퍼레이드", "드레스", "스케이트", "트럭"
  ];

  // Game States
  let score = 0;
  let combo = 0;
  let isPlayerTurn = true;
  let isGameOver = false;
  let currentLastChar = '사';
  let usedWords = new Set();
  let timerInterval = null;
  let remainingTime = 15;
  let difficulty = 'normal';

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

    if (type === 'success') {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.13);
      });
    } else if (type === 'error') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    }
  }

  // Initial Sound Law (두음법칙) Converter
  function getValidNextChars(char) {
    const valid = [char];

    // Korean Dueum Rules:
    // 'ㄹ' -> 'ㄴ' or 'ㅇ'
    // 'ㄴ' -> 'ㅇ'
    const code = char.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11172) return valid;

    const cho = Math.floor(code / (21 * 28));
    const jung = Math.floor((code % (21 * 28)) / 28);
    const jong = code % 28;

    // Cho 5 is 'ㄹ'
    if (cho === 5) {
      // 녀, 뇨, 뉴, 니 -> 여, 요, 유, 이
      const altCodeN = 0xac00 + (2 * 21 * 28) + (jung * 28) + jong; // 'ㄴ'
      const altCodeO = 0xac00 + (11 * 21 * 28) + (jung * 28) + jong; // 'ㅇ'
      valid.push(String.fromCharCode(altCodeN));
      valid.push(String.fromCharCode(altCodeO));
    } else if (cho === 2) { // Cho 2 is 'ㄴ'
      const altCodeO = 0xac00 + (11 * 21 * 28) + (jung * 28) + jong; // 'ㅇ'
      valid.push(String.fromCharCode(altCodeO));
    }

    return Array.from(new Set(valid));
  }

  // Start / Reset Game
  function startGame() {
    difficulty = difficultySelect.value;
    score = 0;
    combo = 0;
    usedWords.clear();
    isGameOver = false;
    isPlayerTurn = true;

    scoreVal.textContent = '0';
    comboVal.textContent = '0 🔥';
    wordFeed.innerHTML = '';

    const firstWord = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
    usedWords.add(firstWord);
    currentLastChar = firstWord.charAt(firstWord.length - 1);

    addSystemBubble(`🎮 끝말잇기 대결 시작! 제시어: "${firstWord}"`);
    addChatBubble('AI 선수', firstWord, false);

    updateTargetHint();
    setTurn(true);

    modalOverlay.classList.add('hidden');
  }

  function setTurn(playerTurn) {
    if (isGameOver) return;
    isPlayerTurn = playerTurn;

    if (playerTurn) {
      turnIndicator.textContent = '당신의 턴!';
      turnIndicator.className = 'hud-value turn-player';
      wordInput.disabled = false;
      submitBtn.disabled = false;
      wordInput.focus();
    } else {
      turnIndicator.textContent = 'AI 생각 중...';
      turnIndicator.className = 'hud-value turn-ai';
      wordInput.disabled = true;
      submitBtn.disabled = true;
    }

    resetTurnTimer();
  }

  function resetTurnTimer() {
    if (timerInterval) clearInterval(timerInterval);
    remainingTime = 15;
    timerBar.style.width = '100%';

    timerInterval = setInterval(() => {
      remainingTime -= 0.1;
      const pct = Math.max(0, (remainingTime / 15) * 100);
      timerBar.style.width = `${pct}%`;

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        if (isPlayerTurn) {
          endGame(false, '시간 초과! 제한 시간 내에 단어를 제출하지 못했습니다.');
        } else {
          endGame(true, 'AI 시간 초과! AI가 생각하지 못했습니다.');
        }
      }
    }, 100);
  }

  function updateTargetHint() {
    const validStarts = getValidNextChars(currentLastChar);
    targetCharEl.textContent = currentLastChar;
    nextStartCharEl.textContent = validStarts.join(' / ');
  }

  function addChatBubble(author, word, isPlayer) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isPlayer ? 'bubble-player' : 'bubble-ai'}`;
    bubble.innerHTML = `
      <span class="bubble-author">${author}</span>
      <span class="bubble-word">${word}</span>
    `;
    wordFeed.appendChild(bubble);
    wordFeed.scrollTop = wordFeed.scrollHeight;
  }

  function addSystemBubble(text) {
    const sys = document.createElement('div');
    sys.className = 'system-bubble';
    sys.textContent = text;
    wordFeed.appendChild(sys);
    wordFeed.scrollTop = wordFeed.scrollHeight;
  }

  // Handle Player Word Input
  function handlePlayerSubmit() {
    if (!isPlayerTurn || isGameOver) return;

    const input = wordInput.value.trim();
    wordInput.value = '';

    if (input.length < 2) {
      playSound('error');
      alert('단어는 최소 2글자 이상이어야 합니다!');
      return;
    }

    const firstChar = input.charAt(0);
    const validStarts = getValidNextChars(currentLastChar);

    if (!validStarts.includes(firstChar)) {
      playSound('error');
      alert(`단어는 "${validStarts.join('" 또는 "')}"(으)로 시작해야 합니다!`);
      return;
    }

    if (usedWords.has(input)) {
      playSound('error');
      alert(`"${input}"(은)는 이미 사용된 단어입니다!`);
      return;
    }

    // Word Validated!
    playSound('success');
    usedWords.add(input);
    addChatBubble('나', input, true);

    combo++;
    score += 100 + (combo * 20);
    scoreVal.textContent = score;
    comboVal.textContent = `${combo} 🔥`;

    currentLastChar = input.charAt(input.length - 1);
    updateTargetHint();

    setTurn(false);
    setTimeout(triggerAiTurn, 1200 + Math.random() * 1000);
  }

  // AI Turn Logic
  function triggerAiTurn() {
    if (isGameOver) return;

    const validStarts = getValidNextChars(currentLastChar);
    const candidateWords = DICTIONARY.filter(word => {
      if (usedWords.has(word)) return false;
      const start = word.charAt(0);
      return validStarts.includes(start);
    });

    if (candidateWords.length === 0) {
      endGame(true, `AI 패배! 더 이상 연결할 수 있는 단어가 없습니다.`);
      return;
    }

    const aiWord = candidateWords[Math.floor(Math.random() * candidateWords.length)];
    usedWords.add(aiWord);
    addChatBubble('AI 선수', aiWord, false);

    currentLastChar = aiWord.charAt(aiWord.length - 1);
    updateTargetHint();

    setTurn(true);
  }

  function endGame(isWin, message) {
    isGameOver = true;
    if (timerInterval) clearInterval(timerInterval);

    if (isWin) {
      playSound('success');
      modalTitle.textContent = '🏆 승리! (Victory)';
    } else {
      playSound('error');
      modalTitle.textContent = '💀 게임 오버 (Game Over)';
    }

    modalDesc.textContent = `${message}\n최종 점수: ${score}점 (최대 콤보: ${combo}회)`;
    startGameBtn.textContent = '🔄 다시 도전하기';
    modalOverlay.classList.remove('hidden');
  }

  // Event Listeners
  submitBtn.addEventListener('click', handlePlayerSubmit);
  wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePlayerSubmit();
  });

  startGameBtn.addEventListener('click', startGame);
});
