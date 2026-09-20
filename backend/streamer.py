import os
import math
import time
import random
import numpy as np
import cv2

class ForestStreamer:
    def __init__(self, source=None, yt_url=None):
        self.source = source
        self.yt_url = yt_url
        self.cap = None
        self.mode = "synthetic"
        self.frame_counter = 0
        
        # Fixed mid-ground trees setup (x, y, radius, color)
        random.seed(42)
        self.mid_trees = []
        for i in range(25):
            tx = random.randint(20, 620)
            ty = random.randint(270, 370)
            tr = random.randint(35, 60)
            gc = (
                random.randint(18, 30),
                random.randint(45, 65),
                random.randint(15, 25)
            )
            self.mid_trees.append({'x': tx, 'y': ty, 'r': tr, 'color': gc, 'idx': i})

        # Foreground trees (6 thick trunks)
        self.fore_trees = []
        for i in range(6):
            fx = 50 + i * 110 + random.randint(-15, 15)
            fw = random.randint(20, 35)
            self.fore_trees.append({'x': fx, 'w': fw})

        # Precompute vignette mask
        self._vignette_mask = self._create_vignette_mask(640, 480)
        random.seed()

    def _create_vignette_mask(self, width, height):
        X = np.linspace(-1, 1, width)
        Y = np.linspace(-1, 1, height)
        mesh_x, mesh_y = np.meshgrid(X, Y)
        radius = np.sqrt(mesh_x**2 + mesh_y**2)
        vignette = 1.0 - np.clip(radius - 0.5, 0, 1) * 0.6
        return np.dstack([vignette] * 3)

    def open(self) -> bool:
        if self.source and str(self.source).strip():
            src_str = str(self.source).strip()
            try:
                cap = cv2.VideoCapture(src_str)
                if cap.isOpened():
                    ret, _ = cap.read()
                    if ret:
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        self.cap = cap
                        self.mode = "real"
                        print(f"[ForestStreamer] Custom source opened: {src_str}")
                        return True
            except Exception as e:
                print(f"[ForestStreamer] Custom source failed ({src_str}): {e}")

        local_video_paths = [
            os.path.join(os.path.dirname(__file__), "videos", "forest.mp4"),
            "videos/forest.mp4",
            "backend/videos/forest.mp4"
        ]
        for vpath in local_video_paths:
            if os.path.exists(vpath):
                try:
                    cap = cv2.VideoCapture(vpath)
                    if cap.isOpened():
                        ret, _ = cap.read()
                        if ret:
                            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            self.cap = cap
                            self.mode = "real"
                            print(f"[ForestStreamer] Local video opened: {vpath}")
                            return True
                except Exception as e:
                    print(f"[ForestStreamer] Local video error ({vpath}): {e}")

        if self.yt_url and str(self.yt_url).strip():
            try:
                import yt_dlp
                ydl_opts = {'format': 'best[ext=mp4]/best', 'quiet': True}
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(self.yt_url.strip(), download=False)
                    stream_url = info.get('url')
                    if stream_url:
                        cap = cv2.VideoCapture(stream_url)
                        if cap.isOpened():
                            self.cap = cap
                            self.mode = "real"
                            return True
            except Exception as e:
                print(f"[ForestStreamer] yt-dlp failed: {e}")

        self.mode = "synthetic"
        print("[ForestStreamer] Operating in synthetic drone/thermal forest mode.")
        return False

    def read_frame(self):
        self.frame_counter += 1

        if self.mode == "real" and self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret or frame is None:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()

            if ret and frame is not None:
                if frame.shape[1] != 640 or frame.shape[0] != 480:
                    frame = cv2.resize(frame, (640, 480))
                return frame, 15, "real"

        synth = self._generate_synthetic_frame()
        return synth, 15, "synthetic"

    def _generate_synthetic_frame(self) -> np.ndarray:
        h, w = 480, 640
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        t = self.frame_counter * 0.1

        # LAYER 0 — Sky gradient (top 40% = y: 0 -> 192)
        sky_h = int(h * 0.40)
        for y in range(sky_h):
            ratio = y / max(1, sky_h)
            # BGR: Top dark blue (60, 40, 20) -> Horizon (110, 90, 60)
            b = int(60 + ratio * 50)
            g = int(40 + ratio * 50)
            r = int(20 + ratio * 40)
            frame[y, :] = (b, g, r)

        # Sky cloud puffs (white-ish ellipses with alpha)
        cloud_overlay = frame.copy()
        for i in range(4):
            cx = int((i * 180 + t * 5) % (w + 100)) - 50
            cy = 40 + i * 25
            cv2.ellipse(cloud_overlay, (cx, cy), (70, 25), 0, 0, 360, (200, 190, 180), -1)
            cv2.ellipse(cloud_overlay, (cx + 30, cy - 10), (50, 20), 0, 0, 360, (210, 200, 190), -1)
        cv2.addWeighted(cloud_overlay, 0.15, frame, 0.85, 0, frame)

        # LAYER 1 — Distant hills (40% - 55% height: y = 192 to 264)
        hills_pts1 = []
        hills_pts2 = []
        for x in range(0, w + 10, 10):
            y1 = int(192 + 25 * math.sin(x * 0.015 + 0.5))
            y2 = int(215 + 20 * math.sin(x * 0.02 + 1.5))
            hills_pts1.append([x, y1])
            hills_pts2.append([x, y2])

        # Fill Distant Hill 1
        pts1 = np.array(hills_pts1 + [[w, h], [0, h]], np.int32)
        cv2.fillPoly(frame, [pts1], (40, 60, 30))

        # Fill Distant Hill 2
        pts2 = np.array(hills_pts2 + [[w, h], [0, h]], np.int32)
        cv2.fillPoly(frame, [pts2], (30, 50, 25))

        # LAYER 2 — Mid-ground forest (55% - 80% height: y = 264 to 384)
        for tree in self.mid_trees:
            sway_x = int(3 * math.sin(t * 0.5 + tree['idx']))
            tx = tree['x'] + sway_x
            ty = tree['y']
            tr = tree['r']
            cv2.circle(frame, (tx, ty), tr, tree['color'], -1)

        # LAYER 3 — Foreground trees (80% - 100% height: y = 384 to 480)
        for tree in self.fore_trees:
            tx = tree['x']
            tw = tree['w']
            # Trunk
            cv2.rectangle(frame, (tx, 350), (tx + tw, 480), (10, 22, 12), -1)
            # Canopy blob
            cv2.ellipse(frame, (tx + tw // 2, 350), (tw + 25, 45), 0, 0, 360, (15, 35, 10), -1)

        # LAYER 5 — Fire & Smoke Effects
        fire_shift_idx = (self.frame_counter // 40) % 3
        fire_offset_x = [-40, 20, 50][fire_shift_idx]
        fire_base_x = 320 + fire_offset_x
        fire_base_y = 390

        # Pulsing fire size
        pulse = math.sin(t * 3.0)
        outer_w = int(45 + pulse * 8)
        outer_h = int(35 + pulse * 5)
        inner_w = int(25 + pulse * 5)
        inner_h = int(20 + pulse * 3)

        # Fire Outer Glow (Alpha 0.5)
        fire_overlay = frame.copy()
        cv2.ellipse(fire_overlay, (fire_base_x, fire_base_y), (outer_w, outer_h), 0, 0, 360, (0, 140, 255), -1)
        cv2.addWeighted(fire_overlay, 0.5, frame, 0.5, 0, frame)

        # Fire Inner Core (Alpha 0.9)
        fire_core = frame.copy()
        cv2.ellipse(fire_core, (fire_base_x, fire_base_y), (inner_w, inner_h), 0, 0, 360, (0, 220, 255), -1)
        cv2.addWeighted(fire_core, 0.9, frame, 0.1, 0, frame)

        # Flickering Sparks
        for _ in range(6):
            sp_x = fire_base_x + random.randint(-40, 40)
            sp_y = fire_base_y - random.randint(10, 50)
            cv2.circle(frame, (sp_x, sp_y), random.randint(1, 3), (0, 200, 255), -1)

        # 2-3 Rising Smoke Plumes
        smoke_overlay = frame.copy()
        for s in range(3):
            s_time = (t * 2 + s * 1.5) % 4.0
            smoke_y = int(fire_base_y - 20 - s_time * 40)
            smoke_x = int(fire_base_x + math.sin(s_time + s) * 20)
            smoke_radius = int(25 + s_time * 12)
            cv2.ellipse(smoke_overlay, (smoke_x, smoke_y), (smoke_radius, int(smoke_radius * 0.7)), 0, 0, 360, (200, 200, 200), -1)
        cv2.addWeighted(smoke_overlay, 0.35, frame, 0.65, 0, frame)

        # LAYER 4 — Sensor Overlays & Vignette
        frame = (frame * self._vignette_mask).astype(np.uint8)

        # Thin green scan line moving down
        scan_y = int((self.frame_counter * 3) % h)
        cv2.line(frame, (0, scan_y), (w, scan_y), (0, 217, 165), 1)

        # HUD Text top-left
        time_str = time.strftime("%H:%M:%S")
        cv2.putText(frame, "CAM-01 [OPTICAL-THERMAL]", (15, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 217, 165), 1, cv2.LINE_AA)
        cv2.putText(frame, f"TIME: {time_str}", (15, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 217, 165), 1, cv2.LINE_AA)

        # Frame counter bottom-right
        cv2.putText(frame, f"FRAME: {self.frame_counter:06d}", (w - 140, h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 180, 160), 1, cv2.LINE_AA)

        return frame

    def release(self):
        if self.cap and self.cap.isOpened():
            try:
                self.cap.release()
            except Exception:
                pass
        self.cap = None
