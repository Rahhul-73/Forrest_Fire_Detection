# 🌲 FireSense Command Center

**FireSense Command Center** is an autonomous, full-stack Forest Fire Early Warning & Incident Command System. It combines computer vision (**Ultralytics YOLOv8**), temporal false alarm reduction (**3/5 sliding window filter**), surface fire physics simulation (**Rothermel 1972 model**), and an 868 MHz **LoRa sensor mesh telemetry panel**.

---

## 📋 Table of Contents
- [Prerequisites](#-prerequisites)
- [Backend Setup](#-backend-setup)
- [Frontend Setup](#-frontend-setup)
- [Feature Walkthrough](#-feature-walkthrough)
- [Swapping in a Real Fire-Trained YOLOv8 Model](#-swapping-in-a-real-fire-trained-yolov8-model)
- [Connecting a Real LoRa Gateway](#-connecting-a-real-lora-gateway)
- [Troubleshooting](#-troubleshooting)

---

## ⚙️ Prerequisites

Ensure your system meets the following version requirements:

- **Python**: `3.10` or higher (`python3 --version`)
- **Node.js**: `18.0.0` or higher (`node -v`)
- **npm**: `9.0.0` or higher (`npm -v`)
- **OS**: macOS, Linux, or Windows (PowerShell / Git Bash)

---

## 🐍 Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment**:
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
   - **Windows (PowerShell / Command Prompt)**:
     ```cmd
     venv\Scripts\activate
     ```

4. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the FastAPI backend server**:
   ```bash
   uvicorn app:app --reload --port 8000
   ```
   *The API server will run at `http://localhost:8000` with interactive OpenAPI docs at `http://localhost:8000/docs`.*

---

## ⚛️ Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Launch Vite development server**:
   ```bash
   npm run dev
   ```
   *The application opens automatically at `http://localhost:5173`.*

---

## 🚀 Feature Walkthrough

| Panel Component | Primary Function | Technical Details |
| :--- | :--- | :--- |
| **Header Toolbar** | Command center status, WS connection indicator, and emergency action | Sticky glassmorphic top bar (`#0a0e14`), live pulsing status pill (`● LIVE`), LoRa online count, clock, and emergency broadcast dispatch button. |
| **YOLOv8 Detection Feed** | Real-time optical/thermal surveillance stream | SVG viewport (640x480) with animated bounding box overlays (`fire`, `smoke`), confidence bars, and **3/5 temporal filter** false alarm status. |
| **Tactical Risk Map** | Spatial risk zone grid and ignition locator | Leaflet map with CartoDB Dark Matter tiles. Displays color-coded risk circles (Low `#00d9a5`, Moderate `#ffb020`, High `#ff6b35`, Extreme `#ff2d55`). |
| **Spread Simulation** | Rothermel fire spread physics predictor | Physics controls (Wind speed, direction vector, slope incline). Renders interactive skewed ellipse previews for $T+0.5\text{h}, 1\text{h}, 3\text{h}, 6\text{h}$. |
| **Alerts Incident Feed** | Real-time incident logs & dispatch | Framer Motion animated alert cards, relative timestamps (`2m ago`), severity badges, and **LoRa TX** broadcast trigger buttons (`✓ delivered` / `✗ failed`). |
| **LoRa Mesh Status** | 868 MHz ISM sensor gateway telemetry | 8 simulated sensor node cards with battery levels, RSSI ($\text{dBm}$), gateway heartbeat status, total airtime, and store-and-forward message log. |

---

## 🔥 Swapping in a Real Fire-Trained YOLOv8 Model

To replace the default `yolov8n.pt` model with a custom model trained on forest fire datasets (e.g. **D-Fire** dataset):

1. **Train your YOLOv8 model using Ultralytics**:
   ```python
   from ultralytics import YOLO

   # Load pretrained YOLOv8 nano backbone
   model = YOLO('yolov8n.pt')

   # Train on D-Fire dataset
   model.train(
       data='d-fire.yaml',
       epochs=50,
       imgsz=640,
       batch=16,
       project='fire_models',
       name='fire_yolov8_custom'
   )
   ```

2. **Export best weights**:
   After training completes, locate your best model file at `fire_models/fire_yolov8_custom/weights/best.pt`.

3. **Replace model weights in backend**:
   - Copy `best.pt` into the `backend/` directory.
   - Rename `best.pt` to `yolov8n.pt` OR update line 10 in `backend/detector.py`:
     ```python
     class FireDetector:
         def __init__(self, model_path: str = "best.pt"):
             self.history = deque(maxlen=5)
             self._load_model(model_path)
     ```

4. **Restart backend server**:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

---

## 📡 Connecting a Real LoRa Gateway

To connect physical LoRa sensor hardware (e.g., **Dragino LG308 / LPS8** gateway + **SX1276** nodes):

1. **Configure Gateway MQTT Forwarding**:
   - Log into the Dragino LG308 web console (`http://192.168.255.1`).
   - Navigate to **MQTT Settings** and point to your broker host:
     - **Server**: `localhost` (or your backend IP)
     - **Port**: `1883`
     - **Publish Topic**: `application/lora/+/rx`

2. **Integrate MQTT Listener into `backend/lora_service.py`**:
   Uncomment or add the `paho-mqtt` subscriber loop inside `backend/lora_service.py`:
   ```python
   import paho.mqtt.client as mqtt
   import json

   def on_message(client, userdata, msg):
       payload = json.loads(msg.payload.decode('utf-8'))
       dev_eui = payload.get('devEUI')
       rssi = payload.get('rxInfo', [{}])[0].get('rssi', -80)
       snr = payload.get('rxInfo', [{}])[0].get('snr', 8.0)
       
       # Update in-memory node telemetry state
       if dev_eui in lora_service.nodes:
           lora_service.nodes[dev_eui]['rssi'] = rssi
           lora_service.nodes[dev_eui]['snr'] = snr
           lora_service.nodes[dev_eui]['online'] = True

   client = mqtt.Client()
   client.on_message = on_message
   client.connect("localhost", 1883, 60)
   client.subscribe("application/lora/+/rx")
   client.loop_start()
   ```

---

## ❓ Troubleshooting

### 1. `ModuleNotFoundError: No module named 'fastapi'`
- **Fix**: Ensure your virtual environment is active (`source venv/bin/activate` or `venv\Scripts\activate`) and re-run:
  ```bash
  pip install -r requirements.txt
  ```

### 2. `WebSocket Connection Failed`
- **Fix**: Verify backend is running on `http://localhost:8000`. If running on a different port or remote host, update proxy targets in `frontend/vite.config.js`.

### 3. `Leaflet Map Not Rendering Tiles`
- **Fix**: Ensure `index.html` includes the Leaflet CSS CDN tag and your internet connection permits loading CartoDB tiles (`https://{s}.basemaps.cartocdn.com`).

### 4. `PostCSS Plugin Error during npm run build`
- **Fix**: Verify `@tailwindcss/postcss` is installed in `frontend/package.json` and `postcss.config.js` exports:
  ```javascript
  export default {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  }
  ```

---

## 📜 License

MIT License © FireSense Command Center Team
