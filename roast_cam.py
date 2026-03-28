import cv2
import os
import time
import threading
import asyncio
import edge_tts
import pygame
import numpy as np
import mss
import keyboard  # <--- THE NEW GLOBAL HOTKEY LIBRARY
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

pygame.mixer.init()

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("Error: Missing GEMINI_API_KEY in your .env file!")
    exit()

genai.configure(api_key=API_KEY)

is_roasting = False
roast_count = 0
MAX_ROASTS = 10
previous_roasts = []

async def generate_and_play_audio(text, count):
    audio_file = f"roast_{count}.mp3"
    communicate = edge_tts.Communicate(text, "en-AU-WilliamNeural", rate="+15%")
    await communicate.save(audio_file)
    
    pygame.mixer.music.load(audio_file)
    pygame.mixer.music.play()
    
    while pygame.mixer.music.get_busy():
        time.sleep(0.1)

def fetch_roast_in_background(frame):
    global is_roasting, roast_count, previous_roasts
    
    try:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2RGB)
        pil_image = Image.fromarray(rgb_frame)
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = (
            "You are looking through the POV of smart glasses. Look at the person in this photo and roast them. "
            "Make it a short roast about a specific physical feature, their clothing, their posture, or their surroundings. "
            "Be brutal, but make it exactly one sentence. Don't be corny. Don't use similes or metaphors.\n"
        )
        
        if previous_roasts:
            prompt += "IMPORTANT: You have already used these roasts:\n"
            for r in previous_roasts:
                prompt += f"- {r}\n"
            prompt += "You MUST find a completely NEW flaw to point out. Do not mention the same features again."
        
        response = model.generate_content([prompt, pil_image])
        latest_roast = response.text.strip()
        
        previous_roasts.append(latest_roast)
        roast_count += 1
        
        print(f"\n🔥 Roast {roast_count}/{MAX_ROASTS}: {latest_roast} 🔥\n")
        
        asyncio.run(generate_and_play_audio(latest_roast, roast_count))
        
    except Exception as e:
        print(f"\nAPI Error: {e}\n")
        
    finally:
        is_roasting = False

def live_screen_roast():
    global is_roasting, roast_count
    
    print(f"Screen capture warming up... Preparing for a {MAX_ROASTS}-round roast battle.")
    print("🚨 PRESS 'ESC' AT ANY TIME, ANYWHERE, TO FORCE QUIT 🚨")
    
    ROAST_INTERVAL = 15.0 
    last_roast_time = time.time()
    
    sct = mss.mss()
    monitor = sct.monitors[1] 
    
    while True:
        # GLOBAL EMERGENCY STOP (Works even if you are clicked into Instagram!)
        if keyboard.is_pressed('esc'):
            print("\n🚨 ESC pressed! Emergency stop activated. Shutting down... 🚨")
            break

        if roast_count >= MAX_ROASTS:
            print("\n🏁 Roast session complete! 🏁")
            break

        sct_img = sct.grab(monitor)
        frame = np.array(sct_img)
        
        display_frame = cv2.resize(frame, (800, 450))
        cv2.putText(display_frame, f"POV ROAST ACTIVE ({roast_count}/{MAX_ROASTS})", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        cv2.imshow("Hackathon POV Roast Cam", display_frame)
        
        current_time = time.time()
        if (current_time - last_roast_time) > ROAST_INTERVAL and not is_roasting:
            is_roasting = True
            last_roast_time = current_time
            print(f"\n📸 Snapping screen for round {roast_count + 1}... analyzing...")
            
            thread = threading.Thread(target=fetch_roast_in_background, args=(frame.copy(),))
            thread.start()
        
        # We still need waitKey(1) so OpenCV can draw the window, but we don't rely on it for ESC anymore.
        cv2.waitKey(1)
            
    cv2.destroyAllWindows()

if __name__ == "__main__":
    live_screen_roast()