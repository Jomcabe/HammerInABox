#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

// Calibration Values
#define SERVO_STOP        307   // The "neutral" point (no movement)
#define BIG_FORWARD       500   // Fast one way
#define BIG_BACKWARD      307   // Fast the other way
#define SMALL_FORWARD     500   // (307 + 45) Medium speed
#define SMALL_BACKWARD    100   // (307 - 45) Medium speed back

// Channels on the PCA9685
#define BIG_SERVO_CH      1
#define SMALL_SERVO_CH    2

void setup() {
  Serial.begin(9600);
  pwm.begin();
  pwm.setOscillatorFrequency(27000000);
  pwm.setPWMFreq(50); 

  // Initial State: Everything stopped
  pwm.setPWM(BIG_SERVO_CH, 0, SERVO_STOP);
  pwm.setPWM(SMALL_SERVO_CH, 0, SERVO_STOP);
  
  delay(1000); // Give it a second before starting
}

void loop() {
  // 1. Big servo starts moving
  Serial.println("Big Servo: Moving");
  pwm.setPWM(BIG_SERVO_CH, 0, BIG_FORWARD); 
  delay(800);

  // 2. Small servo starts moving (Big is still moving)
  Serial.println("Small Servo: Moving");
  pwm.setPWM(SMALL_SERVO_CH, 0, SMALL_FORWARD); 
  delay(800);

  // 3. Big servo resets (Stops or goes backward)
  Serial.println("Big Servo: Resetting");
  pwm.setPWM(BIG_SERVO_CH, 0, BIG_BACKWARD); // Or use SERVO_STOP to just stop it
  delay(800);

  // 4. Small servo moves back
  Serial.println("Small Servo: Resetting");
  pwm.setPWM(SMALL_SERVO_CH, 0, SMALL_BACKWARD); 
  delay(800);
}