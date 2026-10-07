/**
 * PC Shutdown & Auto-Close Timer Engine with Windows Batch Downloader & Sound Alerts
 */

document.addEventListener('DOMContentLoaded', () => {
  const clockDisplay = document.getElementById('clock-display');
  const clockSubtext = document.getElementById('clock-subtext');
  const statusText = document.getElementById('shutdown-status-text');

  const presetBtns = document.querySelectorAll('.preset-btn');
  const customTimeInput = document.getElementById('custom-time-input');
  const timeUnitSelect = document.getElementById('time-unit-select');

  const startTimerBtn = document.getElementById('start-timer-btn');
  const shutdownNowBtn = document.getElementById('shutdown-now-btn');
  const cancelShutdownBtn = document.getElementById('cancel-shutdown-btn');

  const cmdPreviewText = document.getElementById('cmd-preview-text');
  const copyCmdBtn = document.getElementById('copy-cmd-btn');
  const downloadBatBtn = document.getElementById('download-bat-btn');

  // Modal Elements
  const confirmModal = document.getElementById('confirm-modal');
  const modalShutdownNow = document.getElementById('modal-shutdown-now');
  const modalSetTimer = document.getElementById('modal-set-timer');
  const modalCancel = document.getElementById('modal-cancel');

  let timerInterval = null;
  let remainingSeconds = 0;
  let isTimerActive = false;

  // Web Audio API Beep Synth for Countdown Alert
  let audioCtx = null;

  function playAlertBeep(pitch = 880, duration = 0.15) {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  // Format Seconds to HH:MM:SS
  function formatTime(totalSec) {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  function updateCmdPreview(sec) {
    if (sec <= 0) {
      cmdPreviewText.textContent = 'shutdown /s /t 0';
    } else {
      cmdPreviewText.textContent = `shutdown /s /t ${sec}`;
    }
  }

  // Start Shutdown Countdown
  function startShutdownTimer(seconds) {
    if (timerInterval) clearInterval(timerInterval);

    remainingSeconds = seconds;
    isTimerActive = true;
    updateCmdPreview(seconds);

    statusText.textContent = `⏱️ 컴퓨터 종료 예약 됨 (${seconds}초 후)`;
    statusText.classList.add('active');

    clockDisplay.textContent = formatTime(remainingSeconds);
    clockSubtext.textContent = `남은 시간 후 Windows 컴퓨터가 종료됩니다. 취소하려면 [예약 취소]를 누르세요.`;

    timerInterval = setInterval(() => {
      remainingSeconds--;

      if (remainingSeconds <= 5 && remainingSeconds > 0) {
        playAlertBeep(1000, 0.2); // High warning beep
      }

      clockDisplay.textContent = formatTime(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        isTimerActive = false;
        playAlertBeep(440, 0.8);
        statusText.textContent = '🛑 컴퓨터 종료 실행 중...';
        clockSubtext.textContent = '컴퓨터 종료 명령어(shutdown /s /t 0)가 전달되었습니다.';
      }
    }, 1000);
  }

  // Cancel Shutdown
  function cancelShutdown() {
    if (timerInterval) clearInterval(timerInterval);
    isTimerActive = false;
    remainingSeconds = 0;

    clockDisplay.textContent = '00:00:00';
    statusText.textContent = '대기 중 (컴퓨터 끄기 예약 취소됨)';
    statusText.classList.remove('active');
    clockSubtext.textContent = '종료 예약이 취소되었습니다. 원하시는 시간에 다시 설정하세요.';
    cmdPreviewText.textContent = 'shutdown /a';
  }

  // Preset Buttons Event Listeners
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = parseInt(btn.getAttribute('data-sec'), 10);
      startShutdownTimer(sec);
    });
  });

  // Calculate Custom Input Seconds
  function getCustomInputSeconds() {
    const val = parseFloat(customTimeInput.value) || 1;
    const unit = timeUnitSelect.value;

    if (unit === 'sec') return Math.round(val);
    if (unit === 'min') return Math.round(val * 60);
    if (unit === 'hour') return Math.round(val * 3600);
    return Math.round(val * 60);
  }

  startTimerBtn.addEventListener('click', () => {
    const sec = getCustomInputSeconds();
    startShutdownTimer(sec);
  });

  shutdownNowBtn.addEventListener('click', () => {
    if (confirm('정말로 지금 바로 컴퓨터를 끄시겠습니까? (0초 즉시 종료)')) {
      startShutdownTimer(0);
    }
  });

  cancelShutdownBtn.addEventListener('click', cancelShutdown);

  // Copy CMD Command
  copyCmdBtn.addEventListener('click', async () => {
    const cmd = cmdPreviewText.textContent;
    try {
      await navigator.clipboard.writeText(cmd);
      alert(`📋 CMD 명령어 복사 완료:\n${cmd}\n\n[Windows키 + R] 후 붙여넣고 엔터를 치면 실행됩니다!`);
    } catch (e) {
      alert(`명령어: ${cmd}`);
    }
  });

  // Download .bat Batch File
  downloadBatBtn.addEventListener('click', () => {
    const sec = isTimerActive ? remainingSeconds : getCustomInputSeconds();
    const batContent = `@echo off\r\nchcp 65001 >nul\r\necho [Windows PC Shutdown Timer]\r\necho ${sec}초 후 컴퓨터가 자동으로 종료됩니다...\r\nshutdown /s /t ${sec}\r\npause\r\n`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `PC_종료_${sec}초후.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Modal Handlers (Open Ask Modal on Launch)
  confirmModal.classList.remove('hidden');

  modalShutdownNow.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    startShutdownTimer(0);
  });

  modalSetTimer.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    const secInput = prompt('컴퓨터를 끄기 전 남길 시간을 초(sec) 또는 분(min) 단위로 입력하세요.\n예: 300 (5분 후) 또는 60 (1분 후)', '300');
    if (secInput !== null) {
      let sec = parseInt(secInput, 10);
      if (isNaN(sec) || sec <= 0) sec = 60;
      startShutdownTimer(sec);
    }
  });

  modalCancel.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
  });
});
