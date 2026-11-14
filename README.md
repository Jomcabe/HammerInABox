# HammerInABox
The Ultrasonic sensor connects to the arduino and detects if there is a person (using ultrasonic sensor), displays status on the LCD display. 

That sends a signal to the laptop which then turns on the external camera. 

The camera takes a picture, identifies what it is through gemini api.

If camera detects a person, then gemini generates a roast based on the character of the Terminator. 

LCD connected to Arduino displays status of analyzing target, and the laptop outputs the roast in text-to-speech. 

To finish it off, a clip of Brian Griffin barking is played to deter the person.
