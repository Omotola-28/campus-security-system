import cv2
from ultralytics import YOLO
from supabase import create_client, Client
import time
from datetime import datetime

# --- 1. Supabase Configuration ---
SUPABASE_URL = "https://hlinmryajtmebgbjhlgi.supabase.co"
SUPABASE_KEY = "sb_publishable_4qVlWP9Lb0eRQZASi0DMCg_JfFY5j_B"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


NODE_ID = "bb8c6be8-2530-4e9a-8992-d36f0e577f6e"

print("Loading YOLO model...")
model = YOLO('yolov8n.pt') 

THREAT_CLASSES = [67] 
CONFIDENCE_THRESHOLD = 0.65

# --- 3. Camera Setup ---
print("Searching for webcam...")
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Camera 0 blocked/unavailable. Trying Camera 1...")
    cap = cv2.VideoCapture(1)
    
if not cap.isOpened():
    print("CRITICAL ERROR: No webcam found!")
    print("1. Check Windows Settings -> Privacy & Security -> Camera (Turn ON 'Let desktop apps access your camera')")
    print("2. Check if your laptop has a physical camera slider/shutter or an F-key (like F8) that disables the camera.")
    exit()

# Cooldown timer to prevent spamming Supabase with 30 alerts a second
last_alert_time = 0
ALERT_COOLDOWN = 10 # seconds

print("Starting Edge AI Surveillance...")

while True:
    ret, frame = cap.read()
    if not ret:
        print("\nCRITICAL ERROR: Camera connected, but Windows blocked the video feed!")
        print("-> Go to Windows Settings > Privacy & security > Camera.")
        print("-> Ensure 'Camera access' is ON.")
        print("-> Scroll down and ensure 'Let desktop apps access your camera' is ON.")
        break

    # Run inference on the current frame
    results = model(frame, stream=True, verbose=False)

    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])

            # If the detected object is a threat and confidence is high enough
            if cls in THREAT_CLASSES and conf > CONFIDENCE_THRESHOLD:
                
                # Draw a red box on the screen for visual confirmation
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, f"THREAT DETECTED: {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

                current_time = time.time()
                # Check cooldown to avoid spamming the database
                if (current_time - last_alert_time) > ALERT_COOLDOWN:
                    print(f"[{datetime.now()}] ALARM TRIGGERED! Sending metadata to Cloud...")
                    
                    # Construct the JSON payload
                    payload = {
                        "node_id": NODE_ID,
                        "threat_classification": "Simulated_Weapon",
                        "confidence_score": conf
                    }

                    # Push to Supabase!
                    try:
                        supabase.table('incidents').insert(payload).execute()
                        print("Alert successfully routed to Supabase!")
                        last_alert_time = current_time
                    except Exception as e:
                        print(f"Failed to send alert: {e}")

    # Display the camera feed locally
    cv2.imshow("Campus Security - Edge Node", frame)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()