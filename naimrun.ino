#include <Ultrasonic.h>
#include <Servo.h>

int distance;
int servo1position;
int servo2position;

Servo servo1;
Servo servo2;
Ultrasonic ultrasonic(1,2); //CHANGE THE PINS! PINS ARENT RIGHT!


void setup() {
  Serial.begin(9600);
  servo1.attach(9); // attaches a servo to pin 9
}

void loop() {
distance = ultrasonic.read(); //used to read the ultrasonic sensor
Serial.println(distance)
delay(1000)
}
