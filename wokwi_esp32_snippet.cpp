// EcoTrack IoT Telemetry Snippet (SECURE VERSION)
// Use this in your Wokwi simulation

#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

// ALWAYS USE THE HTTP VERSION FOR WOKWI SIMULATION
// URL REFRESHED AFTER SERVER RESTART
const char* serverPath = "http://orange-knives-talk.loca.lt/api/bins/sensor-update";
const char* apiKey = "ECOTRACK_IOTHUB_SECRET_2026";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverPath);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", apiKey);

    // EXACT PAYLOAD FORMAT REQUIRED BY SERVER
    String payload = "{\"bin_code\":\"BIN-001\",\"fill_level_percent\":75,\"weight_kg\":12.5,\"flame_detected\":false}";
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println(response);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
  delay(10000); // Update every 10 seconds
}
