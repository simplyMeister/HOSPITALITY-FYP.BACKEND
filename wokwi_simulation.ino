#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wokwi WiFi Credentials (Mock)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// EcoTrack Backend Server URL
// Note: In Wokwi, localhost/127.0.0.1 won't point to your laptop server directly without a tunnel.
// Replace this with your ngrok/localtunnel URL during local development, e.g. "https://<your-ngrok-id>.ngrok.io/api/bins/sensor-update"
const char* serverName = "https://hospitality-fyp-backend.vercel.app/api/bins/sensor-update";

// HC-SR04 Pins
const int trigPin = 5;
const int echoPin = 18;

// Simulated variables
const int BIN_HEIGHT_CM = 100; // 1 meter tall bin
String bin_id = "BIN_001";
String hospitality_id = ""; // Can be passed if you know the pre-registered HI id

void setup() {
  Serial.begin(115200);

  // Initialize HC-SR04 pins
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi network.");
}

void loop() {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    // Read Ultrasonic Distance (Simulation)
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    long duration = pulseIn(echoPin, HIGH);
    float distance_cm = duration * 0.034 / 2;

    // Calculate fill level % (Distance goes DOWN as fill goes UP)
    // If distance is 20cm, and bin is 100cm, fill is 80%
    float fill_level = 100.0 - ((distance_cm / BIN_HEIGHT_CM) * 100.0);
    if(fill_level < 0) fill_level = 0.0;
    if(fill_level > 100) fill_level = 100.0;

    // Build JSON Payload
    StaticJsonDocument<300> doc;
    doc["bin_id"] = bin_id;
    if(hospitality_id.length() > 0) {
       doc["hospitality_id"] = hospitality_id;
    }
    doc["fill_level_percent"] = fill_level;
    doc["weight_kg"] = random(0, 50) + (random(0, 100) / 100.0); // Simulated HX711 Load Cell
    doc["temperature_c"] = random(20, 45); // Simulated DHT22
    doc["humidity_percent"] = random(40, 80);
    
    // Simulate flame randomly (1% chance)
    doc["flame_detected"] = (random(0, 100) > 98); 

    String requestBody;
    serializeJson(doc, requestBody);
    
    Serial.print("Sending payload: ");
    Serial.println(requestBody);

    int httpResponseCode = http.POST(requestBody);
    
    if(httpResponseCode > 0){
      Serial.print("HTTP Code: ");
      Serial.println(httpResponseCode);
      String payload = http.getString();
      Serial.println(payload);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
  
  // Wait 30 seconds before next broadcast as per spec
  delay(30000);
}
