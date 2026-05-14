#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wokwi WiFi Credentials
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// You can use the same tunnel for multiple bins, the server uses bin_code to differentiate
const char* serverName = "https://2iizgh-ip-165-73-223-224.tunnelmole.net/api/bins/sensor-update";

// Simulation Configuration
String bin_code = "ECO-BIN-77X2"; // SECONDARY BIN
const int COLLECTION_THRESHOLD_CYCLES = 6; // Slower collection response for this site

// Simulated State
float current_fill = 45.0; // Starts more full
int cycles_at_full = 0;
bool is_full = false;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to WiFi.");
  Serial.println("🤖 EcoTrack IoT Simulator [SECONDARY UNIT]");
  Serial.println("Bin ID: " + bin_code);
}

void loop() {
  if(WiFi.status() == WL_CONNECTED){
    
    if (!is_full) {
      // Slower growth (Random growth between 1.0% and 3.5%)
      float increment = (random(100, 350) / 100.0);
      current_fill += increment;
      
      if (current_fill >= 100.0) {
        current_fill = 100.0;
        is_full = true;
        cycles_at_full = 0;
        Serial.println("\n⚠️ [ALERT] SECONDARY BIN FULL!");
      }
    } else {
      cycles_at_full++;
      Serial.print("⏳ Waiting for GCS... (Site 2) Cycle: ");
      Serial.println(cycles_at_full);

      if (cycles_at_full >= COLLECTION_THRESHOLD_CYCLES) {
        Serial.println("\n♻️ [GCS EVENT] Site 2 Cleared.");
        current_fill = 0.0;
        is_full = false;
        cycles_at_full = 0;
      }
    }

    float weight = (current_fill * 0.45) + (random(0, 150) / 100.0);
    
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", "ECOTRACK_IOTHUB_SECRET_2026"); 

    StaticJsonDocument<300> doc;
    doc["bin_code"] = bin_code;
    doc["fill_level_percent"] = (int)current_fill;
    doc["weight_kg"] = weight;
    doc["flame_detected"] = false; 

    String requestBody;
    serializeJson(doc, requestBody);
    
    Serial.print("🚀 Telemetry [BIN 2] -> ");
    Serial.println(requestBody);

    int httpResponseCode = http.POST(requestBody);
    
    if(httpResponseCode > 0){
      Serial.print("✅ Server Status: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("❌ Connection Error: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    
    http.end();
  }
  
  delay(20000); // 20 second delay for this unit
}
