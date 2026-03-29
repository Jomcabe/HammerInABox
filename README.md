# HammerInABox
The Ultrasonic sensor connects to the arduino and detects if there is a person turns on the LED. 
That sends a signal to the laptop which then turns on the external camera. 
The camera takes a picture, identifies what it is through gemini api:
If camera detects a person, then gemini generates a terminator based insult. 
LED connected to Arduino displays the insult, and the laptop outputs the insult in text-to-speech. 
