/**
 * Android Mobile Camera URL Scanner & App Launcher Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('webcam-video');
  const canvas = document.getElementById('scan-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  const camToggleBtn = document.getElementById('cam-toggle-btn');
  const cameraStatus = document.getElementById('camera-status');
  
  const urlTextEl = document.getElementById('url-text');
  const autoOpenCb = document.getElementById('auto-open-cb');
  const openUrlBtn = document.getElementById('open-url-btn');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  
  const historyListEl = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  let currentStream = null;
  let facingMode = 'environment'; // Default to Android Rear/Back Camera
  let currentDetectedUrl = null;
  let lastScannedUrl = null;
  let lastScanTime = 0;
  let isScanning = false;

  // History State
  let history = localStorage.getItem('camera_url_history') ? JSON.parse(localStorage.getItem('camera_url_history')) : [];

  renderHistory();

  // Initialize Camera Stream
  async function initCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    cameraStatus.textContent = '카메라 연결 중...';

    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    try {
      currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = currentStream;
      video.setAttribute('playsinline', true);
      video.play();

      cameraStatus.textContent = '카메라 활성화 완료 (QR/URL 스캔 중)';
      isScanning = true;
      requestAnimationFrame(scanFrame);
    } catch (err) {
      console.error('카메라 접근 에러:', err);
      cameraStatus.textContent = '❌ 카메라 권한 거부 또는 카메라 없음';
    }
  }

  // Camera Facing Toggle (Rear <-> Front)
  camToggleBtn.addEventListener('click', () => {
    facingMode = (facingMode === 'environment') ? 'user' : 'environment';
    initCamera();
  });

  // Continuous Video Scan Frame Loop
  function scanFrame() {
    if (!isScanning || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Perform high-speed QR / URL code detection
    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        const detectedData = code.data.trim();
        handleDetectedCode(detectedData);
      }
    }

    requestAnimationFrame(scanFrame);
  }

  // Handle Detected QR Code or URL
  function handleDetectedCode(data) {
    const now = Date.now();
    // Cooldown 2 seconds for identical URLs
    if (data === lastScannedUrl && now - lastScanTime < 2000) {
      return;
    }

    lastScannedUrl = data;
    lastScanTime = now;

    // Validate if data is a URL or app intent
    let validUrl = data;
    if (!/^https?:\/\//i.test(validUrl) && !/^[a-z0-9+\-.]+:\/\//i.test(validUrl)) {
      if (/^[a-z0-9\-]+\.[a-z]{2,}/i.test(validUrl)) {
        validUrl = 'https://' + validUrl;
      }
    }

    currentDetectedUrl = validUrl;

    // Haptic Vibration Feedback on Mobile
    if (navigator.vibrate) {
      navigator.vibrate(150);
    }

    // Update UI
    urlTextEl.textContent = validUrl;
    urlTextEl.classList.remove('placeholder');
    openUrlBtn.disabled = false;
    copyUrlBtn.disabled = false;

    addToHistory(validUrl);

    // Auto open if checkbox checked
    if (autoOpenCb.checked) {
      openUrlInAssociatedApp(validUrl);
    }
  }

  // Open URL using Android System Intent / Associated Program
  function openUrlInAssociatedApp(url) {
    if (!url) return;
    
    // Launching URL triggers Android's system "Open with" (연결 프로그램) dialog
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  openUrlBtn.addEventListener('click', () => {
    if (currentDetectedUrl) {
      openUrlInAssociatedApp(currentDetectedUrl);
    }
  });

  copyUrlBtn.addEventListener('click', async () => {
    if (currentDetectedUrl) {
      try {
        await navigator.clipboard.writeText(currentDetectedUrl);
        alert('📋 URL이 클립보드에 복사되었습니다!');
      } catch (err) {
        alert('복사 실패');
      }
    }
  });

  // History Management
  function addToHistory(url) {
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Avoid immediate duplicates
    if (history.length > 0 && history[0].url === url) return;

    history.unshift({ url, time: timeStr });
    if (history.length > 20) history.pop();

    localStorage.setItem('camera_url_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyListEl.innerHTML = '<li class="empty-msg">인식된 스캔 기록이 없습니다.</li>';
      return;
    }

    historyListEl.innerHTML = history.map((item) => `
      <li class="history-item" data-url="${escapeHtml(item.url)}">
        <a href="${escapeHtml(item.url)}" target="_blank" class="link">${escapeHtml(item.url)}</a>
        <span class="time">${item.time}</span>
      </li>
    `).join('');

    // Click item to open
    document.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const url = el.getAttribute('data-url');
        if (url) openUrlInAssociatedApp(url);
      });
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('camera_url_history');
    renderHistory();
  });

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Start Camera
  initCamera();
});
