/**
 * Minecraft Custom Resourcepack Creator & 16x16 Pixel Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const pixelCanvas = document.getElementById('pixel-canvas');
  const ctx = pixelCanvas.getContext('2d');

  const textureTargetSelect = document.getElementById('texture-target');
  const toolPencil = document.getElementById('tool-pencil');
  const toolEraser = document.getElementById('tool-eraser');
  const toolPipette = document.getElementById('tool-pipette');
  const resetCanvasBtn = document.getElementById('reset-canvas-btn');

  const colorPicker = document.getElementById('color-picker');
  const paletteSwatches = document.querySelectorAll('.palette-swatch');

  const packNameInput = document.getElementById('pack-name');
  const packDescInput = document.getElementById('pack-desc');
  const packVersionSelect = document.getElementById('pack-version');
  const downloadPackBtn = document.getElementById('download-pack-btn');

  // Tool Modes: 'pencil' | 'eraser' | 'pipette'
  let currentTool = 'pencil';
  let currentColor = '#22c55e';
  let isDrawing = false;

  const targets = ['grass', 'dirt', 'diamond_ore', 'diamond_sword', 'tnt', 'golden_apple', 'pack_icon'];
  const textureStores = {};

  // Initialize 16x16 Canvases for each Target
  targets.forEach(key => {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    textureStores[key] = c;
    drawDefaultTemplate(key, c);
  });

  let currentKey = 'grass';
  loadTextureToEditor(currentKey);

  // Default Texture Templates (16x16 Procedural Pixel Art)
  function drawDefaultTemplate(key, targetCanvas) {
    const cctx = targetCanvas.getContext('2d');
    cctx.clearRect(0, 0, 16, 16);

    if (key === 'grass') {
      cctx.fillStyle = '#15803d';
      cctx.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        cctx.fillStyle = Math.random() > 0.5 ? '#22c55e' : '#166534';
        cctx.fillRect(x, y, 1, 1);
      }
    } else if (key === 'dirt') {
      cctx.fillStyle = '#78350f';
      cctx.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        cctx.fillStyle = Math.random() > 0.5 ? '#92400e' : '#451a03';
        cctx.fillRect(x, y, 1, 1);
      }
    } else if (key === 'diamond_ore') {
      cctx.fillStyle = '#6b7280';
      cctx.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 35; i++) {
        const x = Math.floor(Math.random() * 16);
        const y = Math.floor(Math.random() * 16);
        cctx.fillStyle = Math.random() > 0.5 ? '#4b5563' : '#9ca3af';
        cctx.fillRect(x, y, 1, 1);
      }
      // Diamond flecks
      cctx.fillStyle = '#38bdf8';
      [[3, 4], [4, 4], [4, 5], [10, 3], [11, 4], [11, 5], [6, 11], [7, 11], [7, 12]].forEach(([x, y]) => {
        cctx.fillRect(x, y, 1, 1);
      });
    } else if (key === 'tnt') {
      cctx.fillStyle = '#dc2626';
      cctx.fillRect(0, 0, 16, 16);
      // White stripe
      cctx.fillStyle = '#ffffff';
      cctx.fillRect(0, 5, 16, 6);
      // TNT Text
      cctx.fillStyle = '#000000';
      cctx.fillRect(2, 7, 3, 2); cctx.fillRect(7, 7, 2, 2); cctx.fillRect(11, 7, 3, 2);
    } else if (key === 'diamond_sword') {
      cctx.fillStyle = '#38bdf8';
      for (let i = 0; i < 10; i++) {
        cctx.fillRect(14 - i, 1 + i, 1, 1);
        cctx.fillRect(13 - i, 1 + i, 1, 1);
      }
      cctx.fillStyle = '#78350f';
      cctx.fillRect(2, 13, 2, 2);
      cctx.fillStyle = '#fbbf24';
      cctx.fillRect(4, 11, 2, 2);
    } else if (key === 'golden_apple') {
      cctx.fillStyle = '#fbbf24';
      cctx.beginPath();
      cctx.arc(8, 9, 6, 0, Math.PI * 2);
      cctx.fill();
      cctx.fillStyle = '#15803d';
      cctx.fillRect(8, 2, 2, 2);
    } else if (key === 'pack_icon') {
      cctx.fillStyle = '#166534';
      cctx.fillRect(0, 0, 16, 16);
      cctx.fillStyle = '#38bdf8';
      cctx.fillRect(4, 4, 8, 8);
    }
  }

  function loadTextureToEditor(key) {
    currentKey = key;
    const store = textureStores[key];
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 16, 16);
    ctx.drawImage(store, 0, 0);
    updateAllThumbnails();
  }

  function saveEditorToStore() {
    const store = textureStores[currentKey];
    const sctx = store.getContext('2d');
    sctx.clearRect(0, 0, 16, 16);
    sctx.drawImage(pixelCanvas, 0, 0);
    updateThumbnail(currentKey);
  }

  function updateThumbnail(key) {
    const thumbCanvas = document.getElementById(`thumb-${key}`);
    if (!thumbCanvas) return;
    const tctx = thumbCanvas.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    tctx.clearRect(0, 0, 32, 32);
    tctx.drawImage(textureStores[key], 0, 0, 32, 32);
  }

  function updateAllThumbnails() {
    targets.forEach(key => updateThumbnail(key));
  }

  // Pixel Painting Handlers
  function getPixelCoords(e) {
    const rect = pixelCanvas.getBoundingClientRect();
    const scale = 16 / rect.width;
    const x = Math.floor((e.clientX - rect.left) * scale);
    const y = Math.floor((e.clientY - rect.top) * scale);
    return { x: Math.max(0, Math.min(15, x)), y: Math.max(0, Math.min(15, y)) };
  }

  function paintPixel(e) {
    const { x, y } = getPixelCoords(e);

    if (currentTool === 'pencil') {
      ctx.fillStyle = currentColor;
      ctx.fillRect(x, y, 1, 1);
      saveEditorToStore();
    } else if (currentTool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
      saveEditorToStore();
    } else if (currentTool === 'pipette') {
      const p = ctx.getImageData(x, y, 1, 1).data;
      if (p[3] > 0) {
        const hex = '#' + [p[0], p[1], p[2]].map(x => x.toString(16).padStart(2, '0')).join('');
        currentColor = hex;
        colorPicker.value = hex;
      }
    }
  }

  pixelCanvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    paintPixel(e);
  });

  pixelCanvas.addEventListener('pointermove', (e) => {
    if (isDrawing) paintPixel(e);
  });

  window.addEventListener('pointerup', () => { isDrawing = false; });

  // Tool Selectors
  toolPencil.addEventListener('click', () => setTool('pencil'));
  toolEraser.addEventListener('click', () => setTool('eraser'));
  toolPipette.addEventListener('click', () => setTool('pipette'));

  function setTool(tool) {
    currentTool = tool;
    [toolPencil, toolEraser, toolPipette].forEach(btn => btn.classList.remove('active'));
    if (tool === 'pencil') toolPencil.classList.add('active');
    if (tool === 'eraser') toolEraser.classList.add('active');
    if (tool === 'pipette') toolPipette.classList.add('active');
  }

  colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
  });

  paletteSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      currentColor = swatch.getAttribute('data-color');
      colorPicker.value = currentColor;
    });
  });

  textureTargetSelect.addEventListener('change', (e) => {
    loadTextureToEditor(e.target.value);
  });

  resetCanvasBtn.addEventListener('click', () => {
    drawDefaultTemplate(currentKey, textureStores[currentKey]);
    loadTextureToEditor(currentKey);
  });

  // Export Canvas to PNG Blob
  function canvasToBlob(canvas, scale = 1) {
    return new Promise((resolve) => {
      let exportCanvas = canvas;
      if (scale > 1) {
        exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width * scale;
        exportCanvas.height = canvas.height * scale;
        const ectx = exportCanvas.getContext('2d');
        ectx.imageSmoothingEnabled = false;
        ectx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
      }
      exportCanvas.toBlob(blob => resolve(blob), 'image/png');
    });
  }

  // Package & Download Minecraft Resourcepack .zip via JSZip
  downloadPackBtn.addEventListener('click', async () => {
    const zip = new JSZip();

    const packFormat = parseInt(packVersionSelect.value, 10);
    const packDesc = packDescInput.value.trim() || 'Custom Minecraft Resourcepack';

    // 1. Generate pack.mcmeta
    const mcmetaContent = JSON.stringify({
      pack: {
        pack_format: packFormat,
        description: packDesc
      }
    }, null, 2);

    zip.file('pack.mcmeta', mcmetaContent);

    // 2. Generate pack.png (Icon)
    const packIconBlob = await canvasToBlob(textureStores['pack_icon'], 4); // 64x64 icon
    zip.file('pack.png', packIconBlob);

    // 3. Add Textures to assets/minecraft/textures/
    const blockFolder = zip.folder('assets/minecraft/textures/block');
    const itemFolder = zip.folder('assets/minecraft/textures/item');

    blockFolder.file('grass_block_top.png', await canvasToBlob(textureStores['grass']));
    blockFolder.file('dirt.png', await canvasToBlob(textureStores['dirt']));
    blockFolder.file('diamond_ore.png', await canvasToBlob(textureStores['diamond_ore']));
    blockFolder.file('tnt_side.png', await canvasToBlob(textureStores['tnt']));

    itemFolder.file('diamond_sword.png', await canvasToBlob(textureStores['diamond_sword']));
    itemFolder.file('golden_apple.png', await canvasToBlob(textureStores['golden_apple']));

    // 4. Compress & Download Zip
    const packName = (packNameInput.value.trim() || 'MyCustomPack').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    
    zip.generateAsync({ type: 'blob' }).then(content => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${packName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`🎁 "${packName}.zip" 커스텀 마인크래프트 리소스팩 다운로드 완료!\n\n💡 적용 방법:\n다운로드된 ${packName}.zip 파일을 %APPDATA%\\.minecraft\\resourcepacks 폴더에 넣고 마인크래프트 설정 -> 리소스팩 목록에서 선택하세요!`);
    });
  });

  updateAllThumbnails();
});
