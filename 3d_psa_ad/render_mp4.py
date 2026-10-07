import os
import sys
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio

# Force UTF-8 output encoding for console prints
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def create_3d_psa_video(output_mp4_path, width=1080, height=1920, fps=30, duration_sec=15):
    is_vertical = height > width
    mode_name = "9:16 Vertical Shorts" if is_vertical else "16:9 Landscape HD"
    print(f"3D PSA Video Render Start [{mode_name}]... ({width}x{height}, {fps}fps, {duration_sec}s)")

    total_frames = int(fps * duration_sec)
    writer = imageio.get_writer(output_mp4_path, fps=fps, codec='libx264', quality=8)

    # Scale font sizes based on width/height
    scale_factor = height / 720.0

    font_title = None
    font_sub = None
    font_small = None
    font_large = None

    font_paths = ["C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/arial.ttf"]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font_title = ImageFont.truetype(fp, int(46 * scale_factor))
                font_sub = ImageFont.truetype(fp, int(24 * scale_factor))
                font_small = ImageFont.truetype(fp, int(18 * scale_factor))
                font_large = ImageFont.truetype(fp, int(60 * scale_factor))
                break
            except Exception:
                pass

    if font_title is None:
        font_title = font_sub = font_small = font_large = ImageFont.load_default()

    # Pre-generate stars
    stars = []
    for _ in range(200):
        sx = np.random.randint(0, width)
        sy = np.random.randint(0, height)
        sr = np.random.uniform(1, 4 * scale_factor)
        stars.append((sx, sy, sr))

    # Pre-generate particles
    particles = []
    for _ in range(100):
        px = np.random.uniform(0, width)
        py = np.random.uniform(0, height)
        ps = np.random.uniform(2, 6 * scale_factor)
        p_speed = np.random.uniform(1.0, 3.0 * scale_factor)
        particles.append({'x': px, 'y': py, 's': ps, 'speed': p_speed})

    for frame_idx in range(total_frames):
        t = frame_idx / fps  # Current timestamp in seconds

        # Create canvas background
        img = Image.new('RGB', (width, height), color=(10, 14, 26))
        draw = ImageDraw.Draw(img)

        # 1. Draw Starfield
        for sx, sy, sr in stars:
            twinkle = int(120 + 100 * math.sin(t * 3 + sx))
            draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(twinkle, twinkle, twinkle))

        # 2. Scene Timeline & 3D Render Logic
        if t < 3.5:
            # === SCENE 1: Dark Space & Warning 3D Earth ===
            cx, cy = width // 2, height // 2 + int(50 * scale_factor)
            radius = int(180 * scale_factor)

            # Draw Earth 3D Sphere gradient
            earth_angle = t * 0.8
            for r in range(radius, 0, -3):
                ratio = r / radius
                color = (
                    int(20 + 80 * (1 - ratio)),
                    int(40 + 100 * ratio),
                    int(80 + 140 * ratio)
                )
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

            # Draw 3D Continents simulation
            for i in range(5):
                ca = earth_angle + i * (math.pi * 2 / 5)
                c_x = cx + math.cos(ca) * (radius * 0.6)
                c_y = cy + math.sin(ca * 0.5) * (radius * 0.4)
                if math.sin(ca) > -0.3:
                    cw = int(35 * scale_factor)
                    ch = int(22 * scale_factor)
                    draw.ellipse([c_x - cw, c_y - ch, c_x + cw, c_y + ch], fill=(34, 139, 34))

            # Warning Red Particles
            for p in particles:
                p['y'] -= p['speed']
                if p['y'] < 0: p['y'] = height
                draw.ellipse([p['x']-p['s'], p['y']-p['s'], p['x']+p['s'], p['y']+p['s']], fill=(239, 68, 68))

            # Text Overlays (Shorts Style)
            fade = min(1.0, t * 1.5)
            alpha_col = (int(255 * fade), int(220 * fade), int(100 * fade))

            top_y = int(220 * scale_factor) if is_vertical else int(100 * scale_factor)
            draw.text((width // 2, top_y), "우리가 외면한 3초...", font=font_title, fill=alpha_col, anchor="mm")
            draw.text((width // 2, top_y + int(80 * scale_factor)), "매초마다 지구를 위협하는 온실가스", font=font_sub, fill=(200, 200, 220), anchor="mm")

        elif t < 7.5:
            # === SCENE 2: Smog City & Plastic Bottle in Pollution ===
            scene_t = t - 3.5

            # Draw Smog Sky Background Gradient
            for y_line in range(height):
                ratio = y_line / height
                r_c = int(30 + ratio * 40)
                g_c = int(25 + ratio * 30)
                b_c = int(35 + ratio * 35)
                draw.line([(0, y_line), (width, y_line)], fill=(r_c, g_c, b_c))

            # 3D City Skyscrapers silhouette
            b_width = width // 6
            for i in range(6):
                bx1 = i * b_width
                bx2 = bx1 + b_width - 5
                bh = int((250 + math.sin(i * 1.5) * 80) * scale_factor)
                by1 = height - bh
                draw.rectangle([bx1, by1, bx2, height], fill=(20, 25, 35))

                flash = int(120 + 135 * math.sin(t * 8 + bx1))
                lw = int(6 * scale_factor)
                draw.ellipse([bx1 + (bx2-bx1)//2 - lw, by1 - lw, bx1 + (bx2-bx1)//2 + lw, by1 + lw], fill=(flash, 30, 30))

            # Polluted Ocean & 3D Plastic Bottle
            ocean_y = height - int(250 * scale_factor)
            for oy in range(ocean_y, height):
                wave = math.sin(scene_t * 4 + oy * 0.03) * (8 * scale_factor)
                draw.line([(0, oy + wave), (width, oy + wave)], fill=(15, 35, 55))

            # 3D Floating Bottle
            bot_x = width // 2 + math.sin(scene_t * 2) * (50 * scale_factor)
            bot_y = ocean_y + int(60 * scale_factor) + math.cos(scene_t * 3) * (15 * scale_factor)
            bw = int(50 * scale_factor)
            bh = int(20 * scale_factor)
            draw.rectangle([bot_x - bw, bot_y - bh, bot_x + bw, bot_y + bh], fill=(180, 220, 240))
            draw.rectangle([bot_x + bw, bot_y - bh//2, bot_x + bw + int(15*scale_factor), bot_y + bh//2], fill=(50, 120, 220))

            top_y = int(220 * scale_factor) if is_vertical else int(90 * scale_factor)
            draw.text((width // 2, top_y), "기후 위기, 이미 시작되었습니다", font=font_title, fill=(248, 113, 113), anchor="mm")
            draw.text((width // 2, top_y + int(80 * scale_factor)), "매년 800만 톤의 플라스틱 해양 오염", font=font_sub, fill=(220, 220, 220), anchor="mm")

        elif t < 11.5:
            # === SCENE 3: Transformation - 3D Green Sprout & Hope ===
            scene_t = t - 7.5

            # Green Nature Sky Gradient
            for y_line in range(height):
                ratio = y_line / height
                r_c = int(10 + ratio * 20)
                g_c = int(40 + ratio * 80)
                b_c = int(30 + ratio * 70)
                draw.line([(0, y_line), (width, y_line)], fill=(r_c, g_c, b_c))

            # 3D Glowing Earth (Clean & Green)
            cx, cy = width // 2, height // 2 + int(60 * scale_factor)
            radius = int(200 * scale_factor)

            for r in range(radius, 0, -3):
                ratio = r / radius
                color = (
                    int(10 + 30 * ratio),
                    int(120 + 120 * ratio),
                    int(180 + 75 * ratio)
                )
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

            # Growing 3D Green Leaves
            growth = min(1.0, scene_t / 2.0)
            stem_h = int(140 * scale_factor * growth)
            draw.line([(cx, cy), (cx, cy - stem_h)], fill=(74, 222, 128), width=int(10 * scale_factor))
            if stem_h > 40 * scale_factor:
                lw = int(45 * scale_factor)
                lh = int(25 * scale_factor)
                draw.ellipse([cx - lw, cy - stem_h - lh, cx, cy - stem_h + lh//2], fill=(34, 197, 94))
                draw.ellipse([cx, cy - stem_h - lh, cx + lw, cy - stem_h + lh//2], fill=(34, 197, 94))

            # Rising Golden Energy Particles
            for p in particles:
                p['y'] -= p['speed'] * 2
                if p['y'] < 0: p['y'] = height
                draw.ellipse([p['x']-p['s'], p['y']-p['s'], p['x']+p['s'], p['y']+p['s']], fill=(251, 191, 36))

            top_y = int(220 * scale_factor) if is_vertical else int(90 * scale_factor)
            draw.text((width // 2, top_y), "작은 실천이 만드는 푸른 변화", font=font_title, fill=(134, 239, 172), anchor="mm")
            draw.text((width // 2, top_y + int(80 * scale_factor)), "지구를 살리는 우리의 행동, 지금 시작!", font=font_sub, fill=(240, 253, 244), anchor="mm")

        else:
            # === SCENE 4: Conclusion Slogan & Action Campaign ===
            scene_t = t - 11.5

            # Bright Cyber Green Dark BG
            draw.rectangle([0, 0, width, height], fill=(6, 15, 25))

            # 3D Glowing Eco Emblem
            cx = width // 2
            cy = int(450 * scale_factor) if is_vertical else int(200 * scale_factor)
            pulse = math.sin(scene_t * 4) * (10 * scale_factor)
            r = int((85 + pulse))
            draw.ellipse([cx - r - 15, cy - r - 15, cx + r + 15, cy + r + 15], fill=(34, 197, 94))
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(16, 185, 129))

            draw.text((cx, cy), "ECO 3D", font=font_large, fill=(255, 255, 255), anchor="mm")

            # Final Campaign Slogans
            slogan_y = cy + int(180 * scale_factor)
            draw.text((width // 2, slogan_y), "지구를 지키는 3가지 약속", font=font_title, fill=(251, 191, 36), anchor="mm")

            actions = [
                "1. ☕ 텀블러 사용하기",
                "2. 💡 안 쓰는 전등 끄기",
                "3. ♻️ 1회용 용기 줄이기"
            ]
            act_step = int(75 * scale_factor)
            for idx, act in enumerate(actions):
                draw.text((width // 2, slogan_y + int(90 * scale_factor) + idx * act_step), act, font=font_sub, fill=(240, 253, 244), anchor="mm")

            bot_y = height - int(100 * scale_factor)
            draw.text((width // 2, bot_y), "@Student_3D_PSA | 유튜브 쇼츠 3D 공익광고", font=font_small, fill=(148, 163, 184), anchor="mm")

        # Convert PIL Image to numpy array and write frame
        frame_np = np.array(img)
        writer.append_data(frame_np)

        if frame_idx % 90 == 0 or frame_idx == total_frames - 1:
            print(f"  Progress: {frame_idx + 1}/{total_frames} frames ({int((frame_idx+1)/total_frames*100)}%)")

    writer.close()
    print(f"3D PSA Video MP4 Completed: {output_mp4_path}")

if __name__ == "__main__":
    target_dir = r"c:\Users\yny\OneDrive\바탕 화면\선우(쌈뽕)\게임1\3d_psa_ad"
    os.makedirs(target_dir, exist_ok=True)

    # 1. Render 9:16 Vertical YouTube Shorts MP4 (1080x1920)
    shorts_mp4 = os.path.join(target_dir, "psa_3d_shorts.mp4")
    create_3d_psa_video(shorts_mp4, width=1080, height=1920, fps=30, duration_sec=15)

    # 2. Render 16:9 Landscape HD MP4 (1280x720)
    hd_mp4 = os.path.join(target_dir, "psa_3d_ad.mp4")
    create_3d_psa_video(hd_mp4, width=1280, height=720, fps=30, duration_sec=15)

    # Copy both to root workspace directory
    import shutil
    shutil.copy2(shorts_mp4, r"c:\Users\yny\OneDrive\바탕 화면\선우(쌈뽕)\게임1\psa_3d_shorts.mp4")
    shutil.copy2(hd_mp4, r"c:\Users\yny\OneDrive\바탕 화면\선우(쌈뽕)\게임1\psa_3d_ad.mp4")
    print("✅ All MP4 Video renders completed and copied to root workspace!")
