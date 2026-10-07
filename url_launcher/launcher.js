/**
 * URL Quick Launcher Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url-input');
  const clearInputBtn = document.getElementById('clear-input-btn');
  const pasteBtn = document.getElementById('paste-btn');
  const launchBtn = document.getElementById('launch-btn');

  const previewCard = document.getElementById('preview-card');
  const faviconImg = document.getElementById('favicon-img');
  const previewDomain = document.getElementById('preview-domain');
  const previewFullUrl = document.getElementById('preview-full-url');

  const bookmarksGrid = document.getElementById('bookmarks-grid');
  const addBookmarkBtn = document.getElementById('add-bookmark-btn');

  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // Local Storage Data
  let history = localStorage.getItem('url_launcher_history')
    ? JSON.parse(localStorage.getItem('url_launcher_history'))
    : [];

  let customBookmarks = localStorage.getItem('url_launcher_bookmarks')
    ? JSON.parse(localStorage.getItem('url_launcher_bookmarks'))
    : [
        { name: '네이버', url: 'https://naver.com', icon: '🟢' },
        { name: '구글', url: 'https://google.com', icon: '🌐' },
        { name: '유튜브', url: 'https://youtube.com', icon: '▶️' },
        { name: '깃허브', url: 'https://github.com', icon: '🐙' }
      ];

  renderBookmarks();
  renderHistory();

  // Smart URL Formatter
  function formatUrl(rawInput) {
    let url = rawInput.trim();
    if (!url) return '';

    if (!/^https?:\/\//i.test(url) && !/^[a-z0-9+\-.]+:\/\//i.test(url)) {
      if (/^[a-z0-9\-]+\.[a-z]{2,}/i.test(url) || url.includes('/')) {
        url = 'https://' + url;
      } else {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
      }
    }
    return url;
  }

  function getDomain(urlStr) {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname;
    } catch (e) {
      return urlStr;
    }
  }

  // Update Live Preview Card
  function updatePreview() {
    const raw = urlInput.value.trim();
    if (!raw) {
      previewCard.classList.add('hidden');
      clearInputBtn.classList.add('hidden');
      return;
    }

    clearInputBtn.classList.remove('hidden');
    const formatted = formatUrl(raw);
    const domain = getDomain(formatted);

    previewDomain.textContent = domain;
    previewFullUrl.textContent = formatted;

    faviconImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    previewCard.classList.remove('hidden');
  }

  urlInput.addEventListener('input', updatePreview);

  clearInputBtn.addEventListener('click', () => {
    urlInput.value = '';
    updatePreview();
    urlInput.focus();
  });

  // Paste from Clipboard
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        updatePreview();
      }
    } catch (err) {
      alert('클립보드 접근 권한이 필요합니다. 주소창에 직접 붙여넣어 주세요.');
    }
  });

  // Launch Site Handler
  function launchSite(targetUrl) {
    const url = formatUrl(targetUrl || urlInput.value);
    if (!url) {
      alert('이동할 URL 주소를 입력해 주세요.');
      return;
    }

    addToHistory(url);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  launchBtn.addEventListener('click', () => launchSite());

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      launchSite();
    }
  });

  // Bookmark Management
  function renderBookmarks() {
    bookmarksGrid.innerHTML = customBookmarks.map(bm => `
      <div class="bookmark-item" data-url="${escapeHtml(bm.url)}">
        <span class="bookmark-icon">${bm.icon || '🔗'}</span>
        <span class="bookmark-name">${escapeHtml(bm.name)}</span>
      </div>
    `).join('');

    document.querySelectorAll('.bookmark-item').forEach(el => {
      el.addEventListener('click', () => {
        const url = el.getAttribute('data-url');
        if (url) launchSite(url);
      });
    });
  }

  addBookmarkBtn.addEventListener('click', () => {
    const name = prompt('즐겨찾기 이름을 입력하세요 (예: 다음, 멜론):');
    if (!name) return;
    const url = prompt('웹사이트 주소를 입력하세요 (예: daum.net):');
    if (!url) return;

    const formatted = formatUrl(url);
    customBookmarks.push({ name: name.trim(), url: formatted, icon: '⭐' });
    localStorage.setItem('url_launcher_bookmarks', JSON.stringify(customBookmarks));
    renderBookmarks();
  });

  // History Management
  function addToHistory(url) {
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (history.length > 0 && history[0].url === url) return;

    history.unshift({ url, time: timeStr });
    if (history.length > 30) history.pop();

    localStorage.setItem('url_launcher_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<li class="empty-msg">아직 이동한 기록이 없습니다.</li>';
      return;
    }

    historyList.innerHTML = history.map(item => `
      <li class="history-item" data-url="${escapeHtml(item.url)}">
        <span class="history-url">${escapeHtml(item.url)}</span>
        <span class="history-time">${item.time}</span>
      </li>
    `).join('');

    document.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const url = el.getAttribute('data-url');
        if (url) launchSite(url);
      });
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('url_launcher_history');
    renderHistory();
  });

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
});
