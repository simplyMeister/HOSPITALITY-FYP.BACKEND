#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wokwi WiFi Credentials
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// The stable Tunnelmole URL
const char* serverName = "https://agotra-ip-165-73-223-224.tunnelmole.net/api/bins/sensor-update";

// Simulation Configuration
String bin_code = "ECO-BIN-10V5"; 
const int COLLECTION_THRESHOLD_CYCLES = 4; // Number of loops to stay at 100% before "collection"

// Simulated State
float current_fill = 15.0; 
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
  Serial.println("🤖 EcoTrack IoT Simulator [REFINED MODE]");
  Serial.println("Bin ID: " + bin_code);
}

void loop() {
  if(WiFi.status() == WL_CONNECTED){
    
    // --- REFINED ALGORITHM: REALISTIC WASTE FLOW ---
    
    if (!is_full) {
      // Phase 1: Filling Up (Random growth between 2.5% and 6.5%)
      float increment = (random(250, 650) / 100.0);
      current_fill += increment;
      
      if (current_fill >= 100.0) {
        current_fill = 100.0;
        is_full = true;
        cycles_at_full = 0;
        Serial.println("\n⚠️ [ALERT] BIN REACHED MAXIMUM CAPACITY!");
        Serial.println("📡 Alerting GCS Dispatch Center...");
      }
    } else {
      // Phase 2: Stalling at Full (Waiting for GCS to "arrive" on site)
      cycles_at_full++;
      Serial.print("⏳ [STALLED] Waiting for GCS Collection... Cycle: ");
      Serial.print(cycles_at_full);
      Serial.print("/");
      Serial.println(COLLECTION_THRESHOLD_CYCLES);

      if (cycles_at_full >= COLLECTION_THRESHOLD_CYCLES) {
        // Phase 3: Collection Completed
        Serial.println("\n♻️ [GCS EVENT] Garbage Truck has arrived on site.");
        Serial.println("♻️ BIN COLLECTED! Resetting to 0%...");
        current_fill = 0.0;
        is_full = false;
        cycles_at_full = 0;
      }
    }

    // Weight Correlation: Approx 0.5kg per 1% fill + variable density drift
    float base_weight = current_fill * 0.5;
    float density_jitter = (random(-100, 200) / 100.0);
    float weight = base_weight + density_jitter;
    if (weight < 0) weight = 0;
    
    // Thermal Anomaly Logic: 2% chance of heat spike when bin is > 50% full
    bool flame = (current_fill > 50.0 && random(0, 100) > 97);

    // --- END ALGORITHM ---

    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", "ECOTRACK_IOTHUB_SECRET_2026"); 

    StaticJsonDocument<300> doc;
    doc["bin_code"] = bin_code;
    doc["fill_level_percent"] = (int)current_fill;
    doc["weight_kg"] = weight;
    doc["flame_detected"] = flame; 

    String requestBody;
    serializeJson(doc, requestBody);
    
    Serial.print("🚀 Telemetry -> ");
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
  
  // Wait 15 seconds before the next simulation step
  delay(15000);
}
