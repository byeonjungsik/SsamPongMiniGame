/**
 * Direct Minecraft Folder (%APPDATA%\.minecraft) Opener Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const folderBtns = document.querySelectorAll('.folder-btn');
  const downloadBatBtn = document.getElementById('download-bat-btn');
  const winCmdText = document.getElementById('win-cmd-text');
  const copyCmdBtn = document.getElementById('copy-cmd-btn');

  // Helper to generate & trigger .bat download for Windows File Explorer
  function downloadFolderLauncherBat(subFolder = '') {
    const targetPath = subFolder ? `%APPDATA%\\.minecraft\\${subFolder}` : '%APPDATA%\\.minecraft';
    const folderLabel = subFolder ? subFolder : '메인';

    const batLines = [
      '@echo off',
      'chcp 65001 >nul',
      'echo ========================================================',
      `echo [마인크래프트 ${folderLabel} 폴더 탐색기를 열고 있습니다...]`,
      'echo ========================================================',
      'echo.',
      `if not exist "${targetPath}" mkdir "${targetPath}"`,
      `start "" explorer "${targetPath}"`,
      'echo 윈도우 파일 탐색기에서 마인크래프트 폴더가 성공적으로 열렸습니다!'
    ];

    const batContent = batLines.join('\r\n');
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = subFolder ? `마인크래프트_${subFolder}_폴더열기.bat` : '마인크래프트_폴더_열기.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Folder Buttons Event Handlers
  folderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subFolder = btn.getAttribute('data-folder');
      const targetPath = subFolder ? `%APPDATA%\\.minecraft\\${subFolder}` : '%APPDATA%\\.minecraft';
      winCmdText.textContent = `explorer ${targetPath}`;

      downloadFolderLauncherBat(subFolder);

      alert(`📁 마인크래프트 ${subFolder || '메인'} 폴더 바로가기 (.bat) 파일이 다운로드되었습니다!\n\n💡 사용법:\n다운로드받은 배치 파일을 더블클릭하면 1초 만에 윈도우 파일 탐색기로 ${targetPath} 폴더가 열립니다!`);
    });
  });

  // Main Download Button Handler
  downloadBatBtn.addEventListener('click', () => {
    downloadFolderLauncherBat('');
    alert('📁 "마인크래프트_폴더_열기.bat" 파일이 다운로드되었습니다!\n\n💡 더블클릭하시면 1초 만에 윈도우 탐색기로 %APPDATA%\\.minecraft 폴더가 켜집니다!');
  });

  // Copy CMD Command
  copyCmdBtn.addEventListener('click', async () => {
    const cmd = winCmdText.textContent;
    try {
      await navigator.clipboard.writeText(cmd);
      alert(`📋 윈도우 명령어 복사 완료:\n${cmd}\n\n[Windows키 + R]을 누른 후 붙여넣고 엔터를 치면 파일 탐색기로 즉시 들어갑니다!`);
    } catch (e) {
      alert(`명령어: ${cmd}`);
    }
  });
});
