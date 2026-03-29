import cv2
import google.generativeai as genai
from PIL import Image
import time
import os
from dotenv import load_dotenv

# =================================================================
# 1. SETUP AND CONFIGURATION
# =================================================================

# Load the environment variables from the .env file
load_dotenv()

# Fetch the API key
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("API Key not found. Please ensure your .env file contains GEMINI_API_KEY=your_key")

# Configure the Gemini API
genai.configure(api_key=api_key)

# Initialize the fastest model with strict system instructions
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction="You are a strict categorization system. Analyze the main object in the image and return EXACTLY one word: 'plastic', 'metal', or 'paper'. Do not use punctuation, capitalization, or any other words."
)

# =================================================================
# 2. FUNCTIONS
# =================================================================

def get_webcam_image():
    """Captures a single frame from the EMEET webcam."""
    
    # 0 is usually the default. Change to 1 if it grabs a built-in laptop cam.
    cap = cv2.VideoCapture(1)
    
    if not cap.isOpened():
        print("Error: Could not open the webcam.")
        return None

    # Let the camera warm up and adjust auto-exposure
    for _ in range(5):
        cap.read()
        time.sleep(0.05)
        
    ret, frame = cap.read()
    cap.release()
    
    if ret:
        # Convert from OpenCV's BGR format to PIL's RGB format
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return Image.fromarray(rgb_frame)
    
    return None

def classify_trash(image):
    """Sends the image to Gemini and returns the material type."""
    try:
        # Keep prompt minimal for speed
        prompt = "Classify this."
        response = model.generate_content([image, prompt])
        return response.text.strip()
    except Exception as e:
        print(f"API Error: {e}")
        return "error"

# =================================================================
# 3. MAIN EXECUTION LOOP
# =================================================================

if __name__ == "__main__":
    print("Powering up the targeting system...")
    
    target_image = get_webcam_image()
    
    if target_image:
        print("Image captured. Analyzing...")
        
        start_time = time.time()
        material = classify_trash(target_image)
        end_time = time.time()
        
        print(f"Target Locked: [{material.upper()}]")
        print(f"Processing time: {end_time - start_time:.2f} seconds")
        
        # This is where you will add the serial communication logic
        # to send the 'material' string to your microcontroller.
        
    else:
        print("Target acquisition failed. Check camera connection.")