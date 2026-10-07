/**
 * YouTube Shorts Style 3D Public Service Announcement (PSA) Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const playerFrame = document.getElementById('player-frame');
  const videoPlayer = document.getElementById('psa-video-player');
  const videoSrc = document.getElementById('video-src');

  const btnViewShorts = document.getElementById('btn-view-shorts');
  const btnViewHd = document.getElementById('btn-view-hd');
  const sceneBtns = document.querySelectorAll('.btn-scene');

  const captionTitle = document.getElementById('caption-title');
  const captionSub = document.getElementById('caption-sub');

  // Captions database
  const CAPTIONS = [
    { start: 0, title: '우리가 외면한 3초... 🌿', sub: '#학생3D공익광고 #지구온난화 #Shorts' },
    { start: 3.5, title: '기후 위기, 이미 시작되었습니다 🚨', sub: '#해양플라스틱 #환경오염 #3D애니메이션' },
    { start: 7.5, title: '작은 실천이 만드는 푸른 변화 🌳', sub: '#탄소중립 #환경보호 #희망' },
    { start: 11.5, title: '지구를 지키는 3가지 약속 ☕💡♻️', sub: '#텀블러사용 #에너지절약 #플라스틱줄이기' }
  ];

  function updateCaptions(t) {
    let current = CAPTIONS[0];
    for (let i = CAPTIONS.length - 1; i >= 0; i--) {
      if (t >= CAPTIONS[i].start) {
        current = CAPTIONS[i];
        break;
      }
    }
    captionTitle.textContent = current.title;
    captionSub.textContent = current.sub;
  }

  // 9:16 Shorts vs 16:9 HD Switcher
  btnViewShorts.addEventListener('click', () => {
    btnViewShorts.classList.add('active');
    btnViewHd.classList.remove('active');
    playerFrame.className = 'player-container shorts-mode';

    const currTime = videoPlayer.currentTime;
    videoSrc.src = 'psa_3d_shorts.mp4';
    videoPlayer.load();
    videoPlayer.currentTime = currTime;
    videoPlayer.play().catch(() => {});
  });

  btnViewHd.addEventListener('click', () => {
    btnViewHd.classList.add('active');
    btnViewShorts.classList.remove('active');
    playerFrame.className = 'player-container hd-mode';

    const currTime = videoPlayer.currentTime;
    videoSrc.src = 'psa_3d_ad.mp4';
    videoPlayer.load();
    videoPlayer.currentTime = currTime;
    videoPlayer.play().catch(() => {});
  });

  // Time update event
  videoPlayer.addEventListener('timeupdate', () => {
    updateCaptions(videoPlayer.currentTime);
  });

  // Scene Jump Buttons
  sceneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSec = parseFloat(btn.dataset.time);
      videoPlayer.currentTime = targetSec;
      videoPlayer.play().catch(() => {});
    });
  });

  // Auto-play attempt
  videoPlayer.play().catch(() => {
    console.log('Autoplay muted requirement');
  });
});
