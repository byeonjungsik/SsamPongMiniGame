/**
 * Medieval Fantasy Minecraft Map Builder (Java Edition 26.1.2 / 1.20+ Compatible)
 * Features In-Game Datapack Role Selection (Princess vs Prince)
 */

document.addEventListener('DOMContentLoaded', () => {
  const roleCards = document.querySelectorAll('.role-card');
  const selectedRoleText = document.getElementById('selected-role-text');
  const downloadMapBtn = document.getElementById('download-map-btn');

  let selectedRole = 'princess'; // 'princess' | 'prince'

  // Role Selection Click Listeners
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedRole = card.getAttribute('data-role');

      if (selectedRole === 'princess') {
        selectedRoleText.textContent = '👑 공주 (Princess - 아리아 공주)';
      } else {
        selectedRoleText.textContent = '⚔️ 왕자 (Prince - 아서 왕자)';
      }
    });
  });

  // Generate World Thumbnail Icon (64x64 Canvas)
  function createWorldIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Dark Gold Castle Background
    ctx.fillStyle = '#1c130b';
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(4, 4, 56, 56);
    ctx.fillStyle = '#1c130b';
    ctx.fillRect(8, 8, 48, 48);

    // Draw Castle Crest
    ctx.fillStyle = '#d97706';
    ctx.fillRect(20, 20, 24, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(28, 12, 8, 12);
    ctx.fillRect(16, 16, 8, 8);
    ctx.fillRect(40, 16, 8, 8);

    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
  }

  // Compile & Download Minecraft Java Edition 26.1.2 / 1.20+ World Save (.zip)
  downloadMapBtn.addEventListener('click', async () => {
    const zip = new JSZip();
    const folderName = 'Medieval_Fantasy_Kingdom';
    const worldFolder = zip.folder(folderName);

    // 1. World Icon
    const iconBlob = await createWorldIcon();
    worldFolder.file('icon.png', iconBlob);

    // 2. Datapack: medieval_quest
    const datapackFolder = worldFolder.folder('datapacks/medieval_quest');

    // pack.mcmeta (pack_format 15 for Java 1.20+ / 26.1.2)
    const mcmeta = JSON.stringify({
      pack: {
        pack_format: 15,
        description: "Medieval Kingdom Role Selection Datapack (Java 26.1.2 / 1.20+)"
      }
    }, null, 2);
    datapackFolder.file('pack.mcmeta', mcmeta);

    // Tags
    const tagsLoad = JSON.stringify({ values: ["medieval:setup"] }, null, 2);
    datapackFolder.file('data/minecraft/tags/functions/load.json', tagsLoad);

    // Functions
    const setupFunction = [
      '# Medieval Kingdom Setup Function',
      'gamerule keepInventory true',
      'gamerule doDaylightCycle false',
      'time set day',
      'tp @a 0 100 0 0 0',
      'title @a title {"text":"🏰 에델가르드 왕국에 오신 것을 환영합니다!","color":"gold"}',
      `function medieval:select_${selectedRole}`
    ].join('\n');
    datapackFolder.file('data/medieval/functions/setup.mcfunction', setupFunction);

    // Princess Command Function
    const princessFunction = [
      '# Princess Aria Role Selection Command',
      'clear @p',
      'give @p diamond_helmet{Unbreaking:3,Protection:5,display:{Name:\'{"text":"👑 엘프의 왕관","color":"light_purple"}\'}} 1',
      'give @p blaze_rod{Unbreaking:3,Sharpness:5,Knockback:3,display:{Name:\'{"text":"🪄 성스러운 마법 지팡이","color":"aqua"}\'}} 1',
      'give @p elytra{Unbreaking:3,display:{Name:\'{"text":"🪶 엘프 날개 망토","color":"gold"}\'}} 1',
      'give @p golden_apple 32',
      'give @p fireworks 64',
      'title @p subtitle {"text":"🪄 마법과 순간이동 스킬이 부여되었습니다!","color":"aqua"}',
      'title @p title {"text":"👑 아리아 공주로 시작합니다!","color":"light_purple"}'
    ].join('\n');
    datapackFolder.file('data/medieval/functions/select_princess.mcfunction', princessFunction);

    // Prince Command Function
    const princeFunction = [
      '# Prince Arthur Role Selection Command',
      'clear @p',
      'give @p netherite_sword{Unbreaking:3,Sharpness:5,FireAspect:2,display:{Name:\'{"text":"🗡️ 엑스칼리버 대검","color":"gold"}\'}} 1',
      'give @p netherite_chestplate{Unbreaking:3,Protection:5,display:{Name:\'{"text":"🛡️ 국왕 기사 갑옷","color":"yellow"}\'}} 1',
      'give @p netherite_leggings{Unbreaking:3,Protection:5} 1',
      'give @p netherite_boots{Unbreaking:3,Protection:5} 1',
      'give @p shield{Unbreaking:3,display:{Name:\'{"text":"🐉 드래곤 방패","color":"red"}\'}} 1',
      'give @p cooked_beef 64',
      'title @p subtitle {"text":"⚔️ 엑스칼리버 대검과 드래곤 방패가 지급되었습니다!","color":"gold"}',
      'title @p title {"text":"⚔️ 아서 왕자로 시작합니다!","color":"yellow"}'
    ].join('\n');
    datapackFolder.file('data/medieval/functions/select_prince.mcfunction', princeFunction);

    // Generate Zip
    const roleNameKo = selectedRole === 'princess' ? '공주(아리아)' : '왕자(아서)';
    zip.generateAsync({ type: 'blob' }).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `마인크래프트_${roleNameKo}_중세판타지_맵_자바26.1.2.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`🎁 "마인크래프트_${roleNameKo}_중세판타지_맵_자바26.1.2.zip" 맵 파일 다운로드 완료!\n\n💡 적용 방법:\n1. 다운로드된 .zip 파일의 압축을 풉니다.\n2. 폴더를 %APPDATA%\\.minecraft\\saves\\ 위치에 넣습니다.\n3. 마인크래프트 자바 에디션 26.1.2 / 1.20+ 실행 후 싱글플레이에서 선택하세요!`);
    });
  });
});
