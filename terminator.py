import serial
import time
import cv2
import pyttsx3
import google.generativeai as genai
from PIL import Image
import os
from dotenv import load_dotenv
import pygame

# ==========================================
# 1. CONFIGURATION
# ==========================================
# Load the variables from the .env file securely
load_dotenv()

# Fetch the Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("[FATAL ERROR] Gemini API key not found. Check your .env file.")
    exit()

# Hardware connections (Update these if necessary)
ARDUINO_PORT = "COM4"  # Change to your actual COM port (check Arduino IDE)
CAMERA_INDEX = 1       # 0 is usually built-in webcam, 1 is usually external USB (EMEET)

# ==========================================
# 2. INITIALIZATION
# ==========================================
print("[SYSTEM] Booting up Skynet...")

# Setup Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash') 

# Setup Text-to-Speech (The Voice of Arnold)
engine = pyttsx3.init()
engine.setProperty('rate', 150) # Slowed down slightly to sound more deliberate/robotic

# Setup Audio Mixer for the Bark
pygame.mixer.init() # <--- ADD THIS LINE

# Setup Serial Connection to the Arduino Nano
try:
    arduino = serial.Serial(ARDUINO_PORT, 9600, timeout=1)
    time.sleep(2) # Give Arduino time to reset after opening serial port
    print(f"[SYSTEM] Connected to Arduino on {ARDUINO_PORT}")
except Exception as e:
    print(f"[ERROR] Could not connect to Arduino: {e}")
    print("[TIP] Is the Arduino IDE Serial Monitor open? If so, close it.")
    exit()

    # Create a folder to save the audio files
if not os.path.exists("roasts"):
    os.makedirs("roasts")
    print("[SYSTEM] Created 'roasts' directory for audio logs.")

# Setup Camera (EMEET)
cam = cv2.VideoCapture(CAMERA_INDEX)
if not cam.isOpened():
    print(f"[ERROR] Could not open camera at index {CAMERA_INDEX}. Try changing CAMERA_INDEX to 0.")
    exit()

print("[SYSTEM] Terminator Online. Waiting for targets...")

# ==========================================
# 3. MAIN LOOP
# ==========================================
while True:
    try:
        # Check if the Arduino sent anything over the USB cable
        if arduino.in_waiting > 0:
            message = arduino.readline().decode('utf-8').strip()
            
            # If the ultrasonic sensor tripped, the Arduino yells "TRIGGER"
            if message == "TRIGGER":
                print("\n[ACTION] Target acquired! Snapping photo...")
                
                # Snap a frame from the camera
                ret, frame = cam.read()
                if not ret:
                    print("[ERROR] Failed to grab frame.")
                    continue
                
                # OpenCV uses BGR colors, but Gemini needs standard RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)

                print("[ACTION] Analyzing target weaknesses via Gemini API...")
                
                # The Prompt: Force short, Arnold-style insults to fit the 20x4 LCD
                prompt = (
                    "Look at this person. Roast their appearance, posture, or what they are wearing in exactly one short sentence. "
                    "You MUST speak in the style of Arnold Schwarzenegger's Terminator. Use his catchphrases. "
                    "Keep it under 75 characters maximum so it fits on a tiny screen."
                )

                try:
                    # Send image and prompt to Gemini
                    response = model.generate_content([prompt, pil_img])
                    
                    # Clean up the text
                    insult = response.text.replace('\n', ' ').replace('*', '').strip()
                    print(f"[TERMINATOR]: {insult}")
                    
                    # Send text down the USB cable to the Arduino LCD
                    arduino.write((insult + '\n').encode('utf-8'))
                    
                    # --- NEW: SAVE MP3 AND SPEAK ---
                    # Generate a unique filename using the current time
                    timestamp = time.strftime("%Y%m%d_%H%M%S")
                    audio_filename = f"roasts/roast_{timestamp}.mp3"
                    
                    # Queue both the save command and the speak command
                    engine.save_to_file(insult, audio_filename)
                    engine.say(insult)
                    
                    # This executes BOTH the speaking and saving simultaneously
                    engine.runAndWait() 
                    print(f"[SYSTEM] Roast audio archived as {audio_filename}")
                    # -------------------------------
                    
                    # Play the Brian Griffin bark
                    print("[ACTION] Releasing the dog...")
                    pygame.mixer.music.load("bark.mp3") 
                    pygame.mixer.music.play()
                    
                    while pygame.mixer.music.get_busy():
                        pygame.time.Clock().tick(10)
                        
                except Exception as e:
                    print(f"[API ERROR] {e}")
                    
    except KeyboardInterrupt:
        # Graceful shutdown if you press Ctrl+C
        print("\n[SYSTEM] Shutting down...")
        break

# Cleanup resources before exiting
cam.release()
arduino.close()