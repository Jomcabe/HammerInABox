#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 20, 4);

const int trigPin = 9;
const int echoPin = 10;
unsigned long lastTriggerTime = 0;
const unsigned long cooldown = 10000; // 10 second cooldown

void setup() {
  Serial.begin(9600);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 1);
  lcd.print("    TERMINATOR      ");
  lcd.setCursor(0, 2);
  lcd.print("   SYSTEM ONLINE    ");
  delay(2000);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SCANNING..."); // Visual proof it's ready
}

void loop() {
  // Single, reliable ping with a timeout so it doesn't freeze
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH, 30000); 
  int distance = duration * 0.034 / 2;

  // Generous kill box: Between 2cm and 100cm (approx 3 feet)
  if (distance > 2 && distance <= 100 && (millis() - lastTriggerTime > cooldown)) {
    Serial.println("TRIGGER"); // Fire to Python
    lastTriggerTime = millis();
    
    lcd.clear();
    lcd.setCursor(0, 1);
    lcd.print("  ANALYZING TARGET  ");
  }

  // Listen for the Gemini API response from Python
  if (Serial.available() > 0) {
    String incomingInsult = Serial.readStringUntil('\n');
    incomingInsult.trim();
    
    if (incomingInsult.length() > 0) {
      lcd.clear();
      int len = incomingInsult.length();
      for (int i = 0; i < 4; i++) {
        if (len > i * 20) {
          lcd.setCursor(0, i);
          lcd.print(incomingInsult.substring(i * 20, min((i + 1) * 20, len)));
        }
      }
      delay(5000); // Leave the insult on screen for 5 seconds
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("SCANNING..."); // Reset visual state
    }
  }
  delay(100); // Give the sensor a tiny breather between pings
}