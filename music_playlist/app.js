/**
 * My Modern Music Playlist App Engine (YouTube & MP3 Audio Supported)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const trackNameInput = document.getElementById('track-name-input');
  const trackUrlInput = document.getElementById('track-url-input');
  const trackEmojiSelect = document.getElementById('track-emoji-select');
  const btnAddTrack = document.getElementById('btn-add-track');

  const totalTracksCount = document.getElementById('total-tracks-count');
  const searchInput = document.getElementById('search-input');
  const btnLoadDemo = document.getElementById('btn-load-demo');
  const btnClearAll = document.getElementById('btn-clear-all');
  const trackListEl = document.getElementById('track-list');

  // Player Elements
  const audioElement = document.getElementById('audio-element');
  const albumCover = document.getElementById('album-cover');
  const albumEmoji = document.getElementById('album-emoji');
  const nowPlayingTitle = document.getElementById('now-playing-title');
  const nowPlayingSub = document.getElementById('now-playing-sub');

  const btnShuffle = document.getElementById('btn-shuffle');
  const btnPrev = document.getElementById('btn-prev');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnNext = document.getElementById('btn-next');
  const btnRepeat = document.getElementById('btn-repeat');

  const currTimeEl = document.getElementById('curr-time');
  const durTimeEl = document.getElementById('dur-time');
  const seekBarBg = document.getElementById('seek-bar-bg');
  const seekBarFill = document.getElementById('seek-bar-fill');

  const visualizerCanvas = document.getElementById('visualizer-canvas');
  const vizCtx = visualizerCanvas.getContext('2d');
  const volumeSlider = document.getElementById('volume-slider');
  const volIcon = document.getElementById('vol-icon');

  // Default Demo Tracks (Includes YouTube Shorts / Music Demo)
  const DEMO_TRACKS = [
    {
      id: 'demo_yt_1',
      title: '🎬 학생 3D 공익광고 Shorts (YouTube)',
      url: 'https://www.youtube.com/shorts/gK4gON8hvLc',
      emoji: '🔴',
      isYouTube: true,
      ytVideoId: 'gK4gON8hvLc',
      domain: 'youtube.com'
    },
    {
      id: 'demo_1',
      title: '🌙 Midnight Lofi Chill Beat',
      url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
      emoji: '🌙',
      isYouTube: false,
      domain: 'pixabay.com'
    },
    {
      id: 'demo_2',
      title: '☕ Cozy Coffee Shop Piano',
      url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3',
      emoji: '☕',
      isYouTube: false,
      domain: 'pixabay.com'
    },
    {
      id: 'demo_3',
      title: '🚗 Sunset Synthwave Drive',
      url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=synthwave-80s-110045.mp3',
      emoji: '🚗',
      isYouTube: false,
      domain: 'pixabay.com'
    }
  ];

  // App State
  let tracks = JSON.parse(localStorage.getItem('my_music_playlist')) || DEMO_TRACKS;
  let currentTrackIdx = -1;
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = 'none'; // 'none', 'one', 'all'
  let filterText = '';

  // YouTube IFrame Player State
  let ytPlayer = null;
  let isYtReady = false;
  let ytProgressTimer = null;

  // Web Audio API Visualizer Setup (for MP3 audio)
  let audioCtx = null;
  let analyserNode = null;
  let sourceNode = null;

  function initWebAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;

      sourceNode = audioCtx.createMediaElementSource(audioElement);
      sourceNode.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);

      drawVisualizer();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    vizCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    if (analyserNode && isPlaying && tracks[currentTrackIdx] && !tracks[currentTrackIdx].isYouTube) {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      const barWidth = (visualizerCanvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * visualizerCanvas.height;

        const grad = vizCtx.createLinearGradient(0, visualizerCanvas.height, 0, 0);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#a855f7');

        vizCtx.fillStyle = grad;
        vizCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    } else if (isPlaying) {
      // Fake wave for YouTube audio
      const barCount = 12;
      const barWidth = visualizerCanvas.width / barCount;
      const now = performance.now() / 200;

      for (let i = 0; i < barCount; i++) {
        const h = Math.abs(Math.sin(now + i)) * visualizerCanvas.height * 0.8;
        const grad = vizCtx.createLinearGradient(0, visualizerCanvas.height, 0, 0);
        grad.addColorStop(0, '#ff0000');
        grad.addColorStop(1, '#f97316');
        vizCtx.fillStyle = grad;
        vizCtx.fillRect(i * barWidth, visualizerCanvas.height - h, barWidth - 2, h);
      }
    }
  }

  // YouTube URL Helper & Video ID Extractor
  function extractYouTubeVideoId(urlStr) {
    if (!urlStr) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = urlStr.match(regExp);
    return match ? match[1] : null;
  }

  function getDomain(urlStr) {
    if (extractYouTubeVideoId(urlStr)) return 'youtube.com';
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace('www.', '');
    } catch (e) {
      return 'audio-source';
    }
  }

  // Auto-Fetch YouTube Video Title using oEmbed API
  trackUrlInput.addEventListener('change', async () => {
    const url = trackUrlInput.value.trim();
    const ytId = extractYouTubeVideoId(url);
    if (ytId) {
      trackEmojiSelect.value = '🔴';
      try {
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data && data.title && !trackNameInput.value.trim()) {
          trackNameInput.value = data.title;
        }
      } catch (err) {
        console.log('YouTube title fetch failed:', err);
      }
    }
  });

  // Save State to LocalStorage
  function saveTracks() {
    localStorage.setItem('my_music_playlist', JSON.stringify(tracks));
  }

  // Render Track List UI
  function renderPlaylist() {
    totalTracksCount.textContent = tracks.length;

    const filtered = tracks.filter(t => t.title.toLowerCase().includes(filterText.toLowerCase()));

    if (filtered.length === 0) {
      trackListEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🎵</span>
          <p>${tracks.length === 0 ? '플리에 곡이 없습니다.' : '검색 결과가 없습니다.'}</p>
          <span class="empty-sub">상단에서 유튜브 URL 또는 MP3 링크를 입력하여 등록해 보세요!</span>
        </div>
      `;
      return;
    }

    trackListEl.innerHTML = filtered.map((t, idx) => {
      const isCurrent = (currentTrackIdx >= 0 && tracks[currentTrackIdx] && tracks[currentTrackIdx].id === t.id);
      const playingClass = isCurrent ? 'playing' : '';
      const ytClass = t.isYouTube ? 'is-youtube' : '';
      const playIcon = isCurrent && isPlaying ? '⏸️' : '▶️';

      const soundWaveHtml = (isCurrent && isPlaying) ? `
        <div class="sound-wave">
          <span></span><span></span><span></span>
        </div>
      ` : '';

      const badgeHtml = t.isYouTube ? '<span class="yt-badge">🔴 YOUTUBE</span>' : '';

      return `
        <div class="track-item ${playingClass} ${ytClass}" onclick="window.playTrackById('${t.id}')">
          <div class="track-left">
            <span class="track-num">${idx + 1}</span>
            <div class="track-emoji">${t.emoji || (t.isYouTube ? '🔴' : '🎵')}</div>
            <div class="track-info">
              <span class="track-title">${escapeHtml(t.title)}</span>
              <span class="track-url-domain">🔗 ${t.domain || getDomain(t.url)} ${badgeHtml}</span>
            </div>
          </div>

          <div class="track-right">
            ${soundWaveHtml}
            <button class="btn-play-item" onclick="event.stopPropagation(); window.playTrackById('${t.id}')">
              ${playIcon}
            </button>
            <button class="btn-delete-item" onclick="event.stopPropagation(); window.deleteTrackById('${t.id}')" title="삭제">
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Play Track by ID
  window.playTrackById = (id) => {
    initWebAudio();
    const idx = tracks.findIndex(t => t.id === id);
    if (idx < 0) return;

    if (currentTrackIdx === idx) {
      // Toggle play/pause
      togglePlayPause();
    } else {
      currentTrackIdx = idx;
      loadAndPlayCurrentTrack();
    }
  };

  // Delete Track by ID
  window.deleteTrackById = (id) => {
    const idx = tracks.findIndex(t => t.id === id);
    if (idx >= 0) {
      if (currentTrackIdx === idx) {
        stopAllPlayback();
        currentTrackIdx = -1;
        resetPlayerUI();
      } else if (currentTrackIdx > idx) {
        currentTrackIdx--;
      }
      tracks.splice(idx, 1);
      saveTracks();
      renderPlaylist();
    }
  };

  // Load and Play Current Track (Hybrid Audio + YouTube)
  function loadAndPlayCurrentTrack() {
    if (currentTrackIdx < 0 || currentTrackIdx >= tracks.length) return;
    const track = tracks[currentTrackIdx];

    // Stop current playback sources
    stopAllPlayback();

    nowPlayingTitle.textContent = track.title;
    nowPlayingSub.textContent = track.isYouTube ? '🔴 YouTube Audio Stream' : `🔗 ${track.domain || getDomain(track.url)}`;
    albumEmoji.textContent = track.emoji || (track.isYouTube ? '🔴' : '🎵');

    if (track.isYouTube && track.ytVideoId) {
      // Play via YouTube Player
      playYouTubeTrack(track.ytVideoId);
    } else {
      // Play via HTML5 Audio
      playMp3Track(track.url);
    }
  }

  function playMp3Track(url) {
    audioElement.src = url;
    audioElement.volume = parseFloat(volumeSlider.value);
    audioElement.play().then(() => {
      isPlaying = true;
      updatePlayPauseUI();
      renderPlaylist();
    }).catch(err => {
      alert(`⚠️ 음원 재생 오류!\nURL: ${url}\n\n유효한 MP3/오디오 주소인지 확인해 주세요.`);
      isPlaying = false;
      updatePlayPauseUI();
    });
  }

  function playYouTubeTrack(videoId) {
    if (!ytPlayer || !isYtReady) {
      // Initialize YT Player if not ready yet
      initYouTubePlayer(videoId);
      return;
    }
    ytPlayer.loadVideoById(videoId);
    ytPlayer.setVolume(parseFloat(volumeSlider.value) * 100);
    ytPlayer.playVideo();
    isPlaying = true;
    updatePlayPauseUI();
    startYouTubeProgressTimer();
    renderPlaylist();
  }

  function initYouTubePlayer(initialVideoId) {
    if (window.YT && window.YT.Player) {
      ytPlayer = new window.YT.Player('yt-player', {
        height: '1',
        width: '1',
        videoId: initialVideoId || 'gK4gON8hvLc',
        playerVars: {
          autoplay: 1,
          controls: 0
        },
        events: {
          onReady: (e) => {
            isYtReady = true;
            if (initialVideoId) {
              e.target.loadVideoById(initialVideoId);
              e.target.setVolume(parseFloat(volumeSlider.value) * 100);
              e.target.playVideo();
              isPlaying = true;
              updatePlayPauseUI();
              startYouTubeProgressTimer();
              renderPlaylist();
            }
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              isPlaying = true;
              updatePlayPauseUI();
              startYouTubeProgressTimer();
              renderPlaylist();
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              isPlaying = false;
              updatePlayPauseUI();
              renderPlaylist();
            } else if (e.data === window.YT.PlayerState.ENDED) {
              if (repeatMode === 'one') {
                ytPlayer.playVideo();
              } else {
                playNextTrack();
              }
            }
          }
        }
      });
    }
  }

  window.onYouTubeIframeAPIReady = () => {
    isYtReady = true;
  };

  function stopAllPlayback() {
    audioElement.pause();
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      try { ytPlayer.pauseVideo(); } catch (e) {}
    }
    clearInterval(ytProgressTimer);
  }

  function togglePlayPause() {
    const track = tracks[currentTrackIdx];
    if (!track) return;

    if (track.isYouTube && ytPlayer) {
      if (isPlaying) ytPlayer.pauseVideo();
      else ytPlayer.playVideo();
    } else {
      if (isPlaying) audioElement.pause();
      else audioElement.play();
    }
  }

  function startYouTubeProgressTimer() {
    clearInterval(ytProgressTimer);
    ytProgressTimer = setInterval(() => {
      if (!ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;
      const cur = ytPlayer.getCurrentTime() || 0;
      const dur = ytPlayer.getDuration() || 0;

      currTimeEl.textContent = formatTime(cur);
      durTimeEl.textContent = formatTime(dur);
      if (dur > 0) {
        seekBarFill.style.width = `${(cur / dur) * 100}%`;
      }
    }, 250);
  }

  function resetPlayerUI() {
    nowPlayingTitle.textContent = '재생 중인 곡 없음';
    nowPlayingSub.textContent = '곡을 선택해 재생하세요';
    albumEmoji.textContent = '🎵';
    currTimeEl.textContent = '0:00';
    durTimeEl.textContent = '0:00';
    seekBarFill.style.width = '0%';
    isPlaying = false;
    updatePlayPauseUI();
  }

  function updatePlayPauseUI() {
    btnPlayPause.textContent = isPlaying ? '⏸️' : '▶️';
    if (isPlaying) {
      albumCover.classList.add('spinning');
    } else {
      albumCover.classList.remove('spinning');
    }
  }

  // Audio Event Listeners (for MP3)
  audioElement.addEventListener('play', () => {
    isPlaying = true;
    updatePlayPauseUI();
    renderPlaylist();
  });

  audioElement.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayPauseUI();
    renderPlaylist();
  });

  audioElement.addEventListener('timeupdate', () => {
    if (tracks[currentTrackIdx] && tracks[currentTrackIdx].isYouTube) return;
    if (!audioElement.duration) return;
    const cur = audioElement.currentTime;
    const dur = audioElement.duration;

    currTimeEl.textContent = formatTime(cur);
    durTimeEl.textContent = formatTime(dur);
    seekBarFill.style.width = `${(cur / dur) * 100}%`;
  });

  audioElement.addEventListener('ended', () => {
    if (repeatMode === 'one') {
      audioElement.currentTime = 0;
      audioElement.play();
    } else {
      playNextTrack();
    }
  });

  function playNextTrack() {
    if (tracks.length === 0) return;

    if (isShuffle) {
      let randIdx = Math.floor(Math.random() * tracks.length);
      if (randIdx === currentTrackIdx && tracks.length > 1) {
        randIdx = (randIdx + 1) % tracks.length;
      }
      currentTrackIdx = randIdx;
    } else {
      currentTrackIdx = (currentTrackIdx + 1) % tracks.length;
    }
    loadAndPlayCurrentTrack();
  }

  function playPrevTrack() {
    if (tracks.length === 0) return;
    const track = tracks[currentTrackIdx];
    if (track && !track.isYouTube && audioElement.currentTime > 3) {
      audioElement.currentTime = 0;
      return;
    }

    currentTrackIdx = (currentTrackIdx - 1 + tracks.length) % tracks.length;
    loadAndPlayCurrentTrack();
  }

  // Buttons & Controls
  btnPlayPause.addEventListener('click', () => {
    if (currentTrackIdx < 0) {
      if (tracks.length > 0) {
        currentTrackIdx = 0;
        loadAndPlayCurrentTrack();
      }
      return;
    }
    togglePlayPause();
  });

  btnNext.addEventListener('click', playNextTrack);
  btnPrev.addEventListener('click', playPrevTrack);

  btnShuffle.addEventListener('click', () => {
    isShuffle = !isShuffle;
    btnShuffle.classList.toggle('active', isShuffle);
  });

  btnRepeat.addEventListener('click', () => {
    if (repeatMode === 'none') {
      repeatMode = 'all';
      btnRepeat.textContent = '🔁';
      btnRepeat.classList.add('active');
    } else if (repeatMode === 'all') {
      repeatMode = 'one';
      btnRepeat.textContent = '🔂';
      btnRepeat.classList.add('active');
    } else {
      repeatMode = 'none';
      btnRepeat.textContent = '🔁';
      btnRepeat.classList.remove('active');
    }
  });

  // Seek Bar Scrubbing
  seekBarBg.addEventListener('click', (e) => {
    const rect = seekBarBg.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;

    const track = tracks[currentTrackIdx];
    if (track && track.isYouTube && ytPlayer && typeof ytPlayer.getDuration === 'function') {
      const dur = ytPlayer.getDuration();
      if (dur) ytPlayer.seekTo(pos * dur, true);
    } else if (audioElement.duration) {
      audioElement.currentTime = pos * audioElement.duration;
    }
  });

  // Volume Slider
  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audioElement.volume = val;
    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(val * 100);
    }
    volIcon.textContent = val === 0 ? '🔇' : val < 0.5 ? '🔉' : '🔊';
  });

  // Add Track Form (Supports YouTube & MP3)
  btnAddTrack.addEventListener('click', () => {
    const url = trackUrlInput.value.trim();
    let title = trackNameInput.value.trim();
    const emoji = trackEmojiSelect.value;

    if (!url) {
      alert('음원 또는 유튜브 URL 주소를 입력해 주세요!');
      trackUrlInput.focus();
      return;
    }

    const ytId = extractYouTubeVideoId(url);
    const isYt = !!ytId;

    if (!title) {
      title = isYt ? '🔴 YouTube 음악 트랙' : '🎵 커스텀 오디오 트랙';
    }

    const newTrack = {
      id: 'track_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: title,
      url: url,
      emoji: isYt ? '🔴' : emoji,
      isYouTube: isYt,
      ytVideoId: ytId,
      domain: isYt ? 'youtube.com' : getDomain(url)
    };

    tracks.push(newTrack);
    saveTracks();
    renderPlaylist();

    trackNameInput.value = '';
    trackUrlInput.value = '';

    // Auto-play newly added track if no track is playing
    if (currentTrackIdx < 0) {
      currentTrackIdx = tracks.length - 1;
      loadAndPlayCurrentTrack();
    }
  });

  // Demo Track Loader
  btnLoadDemo.addEventListener('click', () => {
    tracks = [...DEMO_TRACKS];
    saveTracks();
    renderPlaylist();
    alert('⚡ 유튜브 & MP3 샘플 곡들이 플레이리스트에 장착되었습니다!');
  });

  // Clear All
  btnClearAll.addEventListener('click', () => {
    if (confirm('플레이리스트의 모든 곡을 삭제하시겠습니까?')) {
      stopAllPlayback();
      currentTrackIdx = -1;
      tracks = [];
      saveTracks();
      resetPlayerUI();
      renderPlaylist();
    }
  });

  // Search Filter
  searchInput.addEventListener('input', (e) => {
    filterText = e.target.value;
    renderPlaylist();
  });

  // Helpers
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // Initial Render
  renderPlaylist();
});
