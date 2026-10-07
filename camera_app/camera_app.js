/**
 * Camera URL Scanner & App Launcher Engine with Native BarcodeDetector + jsQR Dual Decoder
 */

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('webcam-feed');
  const canvas = document.getElementById('scan-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  const statusText = document.getElementById('status-text');
  const statusDot = document.getElementById('status-dot');
  const restartCamBtn = document.getElementById('restart-cam-btn');
  const switchCamBtn = document.getElementById('switch-cam-btn');

  const resultCard = document.getElementById('result-card');
  const scannedUrlEl = document.getElementById('scanned-url');
  const launchAppBtn = document.getElementById('launch-app-btn');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  const autoOpenToggle = document.getElementById('auto-open-toggle');

  const photoFileInput = document.getElementById('photo-file-input');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  let currentStream = null;
  let facingMode = 'environment';
  let isScanning = false;
  let currentDetectedUrl = null;
  let lastScannedUrl = null;
  let lastScanTime = 0;

  // Check Native BarcodeDetector API Support
  const hasNativeBarcodeDetector = 'BarcodeDetector' in window;
  let barcodeDetector = null;
  if (hasNativeBarcodeDetector) {
    try {
      barcodeDetector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
    } catch (e) {
      console.log('BarcodeDetector init error:', e);
    }
  }

  let history = localStorage.getItem('camera_url_history') 
    ? JSON.parse(localStorage.getItem('camera_url_history')) 
    : [];

  renderHistory();

  // Initialize Camera Stream
  async function initCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    statusText.textContent = '카메라 연결 중...';
    statusDot.className = 'dot searching';

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
      await video.play();

      statusText.textContent = '카메라 활성화 완료 (QR / URL 스캔 중)';
      statusDot.style.background = '#4ade80';
      isScanning = true;
      requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      console.error('카메라 접근 권한/연결 실패:', err);
      statusText.textContent = '💡 카메라 권한 미허용 시 아래 📁 사진 선택으로 QR을 스캔하세요';
      statusDot.style.background = '#ef4444';
      isScanning = false;
    }
  }

  // Continuous Video Scan Frame Loop
  async function scanVideoFrame() {
    if (!isScanning || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (isScanning) requestAnimationFrame(scanVideoFrame);
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (vw > 0 && vh > 0) {
      // 1. Try Native BarcodeDetector first (Super Fast & Accurate)
      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            handleDetectedCode(barcodes[0].rawValue.trim());
            requestAnimationFrame(scanVideoFrame);
            return;
          }
        } catch (e) {
          // Fallback to jsQR
        }
      }

      // 2. jsQR Fallback Decoder
      canvas.width = vw;
      canvas.height = vh;
      ctx.drawImage(video, 0, 0, vw, vh);
      const imageData = ctx.getImageData(0, 0, vw, vh);

      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleDetectedCode(code.data.trim());
        }
      }
    }

    if (isScanning) {
      requestAnimationFrame(scanVideoFrame);
    }
  }

  // Photo File Input Scanner (Downscales high-res photos & decodes via jsQR + BarcodeDetector)
  photoFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusText.textContent = '사진 스캔 및 해석 중...';

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      // Downscale photo if larger than 900px to guarantee fast & accurate decoding!
      const maxDim = 900;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      let detectedData = null;

      // 1. Try Native BarcodeDetector
      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            detectedData = barcodes[0].rawValue.trim();
          }
        } catch (err) {
          console.log('Native detect error:', err);
        }
      }

      // 2. Try jsQR Decoder
      if (!detectedData && typeof jsQR !== 'undefined') {
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          detectedData = code.data.trim();
        }
      }

      URL.revokeObjectURL(objectUrl);

      if (detectedData) {
        statusText.textContent = '✅ 사진에서 주소가 성공적으로 인식되었습니다!';
        handleDetectedCode(detectedData);
      } else {
        statusText.textContent = '❌ 사진에서 인식 가능한 QR/URL을 찾지 못했습니다.';
        alert('선택하신 사진에서 인식 가능한 QR 코드나 URL 주소를 찾을 수 없습니다.\n다른 선명한 QR 사진을 선택해 주세요.');
      }
    };

    img.onerror = () => {
      alert('이미지 파일을 불러오는데 실패했습니다.');
    };

    img.src = objectUrl;
  });

  // Handle Detected Code & URLs
  function handleDetectedCode(data) {
    const now = Date.now();
    if (data === lastScannedUrl && now - lastScanTime < 2000) {
      return;
    }

    lastScannedUrl = data;
    lastScanTime = now;

    let validUrl = data;
    if (!/^https?:\/\//i.test(validUrl) && !/^[a-z0-9+\-.]+:\/\//i.test(validUrl)) {
      if (/^[a-z0-9\-]+\.[a-z]{2,}/i.test(validUrl)) {
        validUrl = 'https://' + validUrl;
      }
    }

    currentDetectedUrl = validUrl;

    if (navigator.vibrate) {
      navigator.vibrate(150);
    }

    scannedUrlEl.textContent = validUrl;
    resultCard.classList.remove('hidden');

    addToHistory(validUrl);

    if (autoOpenToggle.checked) {
      openAssociatedApp(validUrl);
    }
  }

  // Open URL using System App Chooser / Associated Program
  function openAssociatedApp(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  launchAppBtn.addEventListener('click', () => {
    if (currentDetectedUrl) {
      openAssociatedApp(currentDetectedUrl);
    }
  });

  copyUrlBtn.addEventListener('click', async () => {
    if (currentDetectedUrl) {
      try {
        await navigator.clipboard.writeText(currentDetectedUrl);
        alert('📋 URL 주소가 클립보드에 복사되었습니다!');
      } catch (err) {
        alert('복사 실패');
      }
    }
  });

  restartCamBtn.addEventListener('click', initCamera);
  switchCamBtn.addEventListener('click', () => {
    facingMode = (facingMode === 'environment') ? 'user' : 'environment';
    initCamera();
  });

  // History Management
  function addToHistory(url) {
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (history.length > 0 && history[0].url === url) return;

    history.unshift({ url, time: timeStr });
    if (history.length > 20) history.pop();

    localStorage.setItem('camera_url_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<li class="empty-msg">아직 스캔된 기록이 없습니다.</li>';
      return;
    }

    historyList.innerHTML = history.map((item) => `
      <li class="history-item" data-url="${escapeHtml(item.url)}">
        <a href="${escapeHtml(item.url)}" target="_blank" class="link">${escapeHtml(item.url)}</a>
        <span class="time">${item.time}</span>
      </li>
    `).join('');

    document.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const url = el.getAttribute('data-url');
        if (url) openAssociatedApp(url);
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
