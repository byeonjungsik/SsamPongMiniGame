/**
 * Minecraft Shader, Mod, and Map Auto-Installer Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');
  const fileCountEl = document.getElementById('file-count');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const downloadBtn = document.getElementById('download-installer-btn');

  let detectedFiles = [];

  // Drag & Drop Event Handlers
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFiles(files);
    }
  });

  // Smart File Type Detection Algorithm
  function detectCategory(fileName) {
    const nameLower = fileName.toLowerCase();

    if (nameLower.endsWith('.jar')) {
      return { type: 'MOD', label: '📦 모드', folder: 'mods', badgeClass: 'badge-mod' };
    }
    if (nameLower.endsWith('.mcworld')) {
      return { type: 'MAP', label: '🗺️ 세이브 맵', folder: 'saves', badgeClass: 'badge-map' };
    }

    // Zip file analysis
    if (nameLower.endsWith('.zip') || nameLower.endsWith('.rar')) {
      if (/shader|bsl|complementary|sildur|optifine|iris|seus|chocapic|nostalgia|voxels/i.test(nameLower)) {
        return { type: 'SHADER', label: '🌈 쉐이더팩', folder: 'shaderpacks', badgeClass: 'badge-shader' };
      }
      if (/map|world|save|survival|adventure|parkour|escape|skyblock/i.test(nameLower)) {
        return { type: 'MAP', label: '🗺️ 세이브 맵', folder: 'saves', badgeClass: 'badge-map' };
      }
      if (/resource|texture|pack|32x|64x|128x|faithful|sphax/i.test(nameLower)) {
        return { type: 'RESOURCE', label: '🎨 리소스팩', folder: 'resourcepacks', badgeClass: 'badge-resource' };
      }
      // Default zip to Shaderpack
      return { type: 'SHADER', label: '🌈 쉐이더팩', folder: 'shaderpacks', badgeClass: 'badge-shader' };
    }

    return { type: 'UNKNOWN', label: '📄 기타 파일', folder: 'mods', badgeClass: 'badge-mod' };
  }

  function processFiles(files) {
    files.forEach(file => {
      const category = detectCategory(file.name);
      detectedFiles.push({
        fileObj: file,
        name: file.name,
        size: formatBytes(file.size),
        category: category
      });
    });

    renderFileList();
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function renderFileList() {
    fileCountEl.textContent = detectedFiles.length;

    if (detectedFiles.length === 0) {
      fileList.innerHTML = '<div class="empty-msg">아직 추가된 파일이 없습니다. 쉐이더, 모드, 맵 파일을 위 박스에 드롭하세요!</div>';
      downloadBtn.disabled = true;
      return;
    }

    downloadBtn.disabled = false;

    fileList.innerHTML = detectedFiles.map((item, index) => `
      <div class="file-item">
        <div class="file-info">
          <span class="type-badge ${item.category.badgeClass}">${item.category.label}</span>
          <span class="file-name">${escapeHtml(item.name)}</span>
          <span class="file-size">(${item.size})</span>
        </div>
        <button class="remove-file-btn" data-index="${index}" title="목록에서 삭제">✕</button>
      </div>
    `).join('');

    document.querySelectorAll('.remove-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        detectedFiles.splice(idx, 1);
        renderFileList();
      });
    });
  }

  clearAllBtn.addEventListener('click', () => {
    detectedFiles = [];
    renderFileList();
  });

  // Windows Batch File Generator & Downloader (.bat)
  downloadBtn.addEventListener('click', () => {
    if (detectedFiles.length === 0) return;

    let batLines = [
      '@echo off',
      'chcp 65001 >nul',
      'echo ========================================================',
      'echo [마인크래프트 쉐이더 · 모드 · 맵 원클릭 자동 적용 스크립트]',
      'echo ========================================================',
      'echo.',
      'set "MC_PATH=%APPDATA%\\.minecraft"',
      'echo 마인크래프트 경로 감지: %MC_PATH%',
      'echo.',
      'if not exist "%MC_PATH%\\mods" mkdir "%MC_PATH%\\mods"',
      'if not exist "%MC_PATH%\\shaderpacks" mkdir "%MC_PATH%\\shaderpacks"',
      'if not exist "%MC_PATH%\\saves" mkdir "%MC_PATH%\\saves"',
      'if not exist "%MC_PATH%\\resourcepacks" mkdir "%MC_PATH%\\resourcepacks"',
      'echo.'
    ];

    detectedFiles.forEach(item => {
      const folder = item.category.folder;
      batLines.push(`echo [적용 중] ${item.name} -> .minecraft\\${folder}\\`);
      batLines.push(`if exist "%~dp0${item.name}" (`);
      batLines.push(`  copy /Y "%~dp0${item.name}" "%MC_PATH%\\${folder}\\" >nul`);
      batLines.push(`  echo   ✔ 성공적으로 복사 완료!`);
      batLines.push(`) else (`);
      batLines.push(`  echo   ⚠ 경고: 스크립트와 동일한 폴더에 "${item.name}" 파일이 존재해야 합니다.`);
      batLines.push(`)`);
      batLines.push('echo.');
    });

    batLines.push('echo ========================================================');
    batLines.push('echo 모든 마인크래프트 쉐이더, 모드, 맵 파일 적용이 완료되었습니다!');
    batLines.push('echo 마인크래프트를 실행하여 확인해 보세요!');
    batLines.push('echo ========================================================');
    batLines.push('pause');

    const batContent = batLines.join('\r\n');
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = '마인크래프트_원클릭_자동적용.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ "마인크래프트_원클릭_자동적용.bat" 파일이 다운로드되었습니다!\n\n💡 사용법:\n다운로드받은 .bat 파일과 방금 올리신 쉐이더/모드/맵 파일들을 한 폴더에 두고 .bat을 더블클릭하면 1초 만에 마인크래프트에 자동 적용됩니다!');
  });

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
});
