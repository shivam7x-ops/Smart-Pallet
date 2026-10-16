#include <Arduino.h>
#include <Wire.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <HTTPClient.h>

// =====================================================
// SMART PALLET TRACKER WITH ROUTE OPTIMIZATION
// ESP32 + DHT22 + MPU6050/6500 + NEO-6M + SIM800L
// Full IoT Cloud Gateway Integration (Wi-Fi / GPRS)
// =====================================================

// ---------------- PIN CONFIGURATION (PRESERVED) ----------------

// DHT22 3-pin module
#define DHT_PIN 4
#define DHT_TYPE DHT22

// MPU6050 / MPU6500 I2C
#define SDA_PIN 21
#define SCL_PIN 22

// NEO-6M GPS (Hardware Serial 1)
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17

// SIM800L GSM (Hardware Serial 2)
#define GSM_RX_PIN 26
#define GSM_TX_PIN 27

// ---------------- COMMUNICATION SELECTION ----------------
// Set USE_WIFI to true to send telemetry over Wi-Fi HTTP REST.
// Set USE_GSM_GPRS to true to transmit over 2G Cellular GPRS.
#define USE_WIFI true
#define USE_GSM_GPRS false

// ---------------- WI-FI CREDENTIALS ----------------
const char* WIFI_SSID = "realme 9 pro+";         // Replace with your Wi-Fi SSID
const char* WIFI_PASS = "1234@1234";     // Replace with your Wi-Fi Password

// ---------------- BACKEND API CONFIGURATION ----------------
// Configured to your Windows computer's active Wi-Fi LAN IPv4 address.
// Note: If your IP changes after reconnecting Wi-Fi, find it using `ipconfig`.
// DO NOT use "localhost" or "127.0.0.1" inside ESP32 code.
const char* BACKEND_URL = "http://10.87.234.196:8000/api/iot/data";
const char* API_KEY = "SMART_PALLET_SECRET_KEY_2026";


// ---------------- PALLET & DEVICE DETAILS ----------------
const char* PALLET_ID = "P001";
const char* DEVICE_ID = "P001";

// Put your emergency alert phone number here for SMS
const char* PHONE_NUMBER = "+91XXXXXXXXXX";

// SIM800L GPRS APN (e.g. "airtelgprs.com", "www", "jionet")
const char* GPRS_APN = "airtelgprs.com";

// ---------------- OBJECTS ----------------
DHT dht(DHT_PIN, DHT_TYPE);
TinyGPSPlus gps;
HardwareSerial GPS_Serial(1);
HardwareSerial GSM_Serial(2);

// ---------------- MPU DETAILS ----------------
#define MPU6050_ADDR 0x68
#define MPU6500_ADDR 0x68

uint8_t MPU_ADDR = MPU6050_ADDR;
bool mpuConnected = false;

int16_t accelXRaw, accelYRaw, accelZRaw;
int16_t gyroXRaw, gyroYRaw, gyroZRaw;

float accelX = 0;
float accelY = 0;
float accelZ = 0;

float gyroX = 0;
float gyroY = 0;
float gyroZ = 0;

// ---------------- SENSOR DATA & FLAGS ----------------
float temperature = 0;
float humidity = 0;
double latitude = 0;
double longitude = 0;
int satellites = 0;

bool gpsValid = false;
bool gsmReady = false;
bool movementDetected = false;
bool shockDetected = false;

// Movement & Shock thresholds
const float SHOCK_G_THRESHOLD = 2.2;     // Severe impact threshold (>2.2g)
const float MOTION_DELTA_THRESHOLD = 0.15;// Motion threshold

// ---------------- TIMERS (NON-BLOCKING) ----------------
unsigned long lastSensorRead = 0;
unsigned long lastGPSRead = 0;
unsigned long lastGSMRead = 0;
unsigned long lastBackendSend = 0;
unsigned long lastWifiCheck = 0;

const unsigned long SENSOR_INTERVAL = 3000;   // Read sensors every 3s
const unsigned long BACKEND_INTERVAL = 4000;  // Stream to cloud API every 4s
const unsigned long GSM_INTERVAL = 60000;     // Emergency SMS check every 60s
const unsigned long WIFI_CHECK_INTERVAL = 10000; // Check Wi-Fi connection every 10s

// Function Declarations
bool initMPU();
void writeMPURegister(uint8_t reg, uint8_t value);
void readDHT22();
void readMPU();
void readGPS();
void printTelemetry();
void testGSM();
void sendPalletSMS();
void connectWiFi();
void checkWiFiConnection();
void sendTelemetryToBackend();
void sendGprsData(const String& jsonPayload);

// =====================================================
// SETUP
// =====================================================
void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println();
  Serial.println("======================================");
  Serial.println("  SMART PALLET TRACKER - IOT GATEWAY  ");
  Serial.println("======================================");
  Serial.print("Pallet ID: "); Serial.println(PALLET_ID);
  Serial.print("Device ID: "); Serial.println(DEVICE_ID);

  // 1. DHT22
  dht.begin();
  Serial.println("[OK] DHT22 initialized");

  // 2. I2C Bus for MPU6050/MPU6500
  Wire.begin(SDA_PIN, SCL_PIN);
  if (initMPU()) {
    mpuConnected = true;
    Serial.println("[OK] MPU6050/6500 detected");
  } else {
    Serial.println("[ERROR] MPU6050/6500 not detected");
  }

  // 3. NEO-6M GPS Serial
  GPS_Serial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("[OK] GPS serial started");

  // 4. SIM800L GSM Serial
  GSM_Serial.begin(9600, SERIAL_8N1, GSM_RX_PIN, GSM_TX_PIN);
  Serial.println("[OK] GSM serial started");
  delay(1500);
  testGSM();

  // 5. Connect to Internet via Wi-Fi if enabled
  if (USE_WIFI) {
    connectWiFi();
  }

  Serial.println();
  Serial.println("System ready.");
  Serial.println("Waiting for sensor data...");
  Serial.println();
}

// =====================================================
// LOOP (STRICTLY NON-BLOCKING)
// =====================================================
void loop() {
  // Continuously ingest GPS NMEA sentences into TinyGPSPlus parser
  readGPS();

  // Non-blocking sensor reading timer
  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = millis();
    readDHT22();

    if (mpuConnected) {
      readMPU();
    }

    printTelemetry();
  }

  // Non-blocking telemetry ingestion to backend API
  if (millis() - lastBackendSend >= BACKEND_INTERVAL) {
    lastBackendSend = millis();
    sendTelemetryToBackend();
  }

  // Automatic Wi-Fi Reconnection check
  if (USE_WIFI && (millis() - lastWifiCheck >= WIFI_CHECK_INTERVAL)) {
    lastWifiCheck = millis();
    checkWiFiConnection();
  }

  // Non-blocking GSM SMS Heartbeat timer
  if (millis() - lastGSMRead >= GSM_INTERVAL) {
    lastGSMRead = millis();
    if (gsmReady) {
      sendPalletSMS();
    }
  }
}

// =====================================================
// DHT22 READING
// =====================================================
void readDHT22() {
  float newHumidity = dht.readHumidity();
  float newTemperature = dht.readTemperature();

  if (isnan(newHumidity) || isnan(newTemperature)) {
    Serial.println("[ERROR] DHT22 reading failed!");
    return;
  }

  humidity = newHumidity;
  temperature = newTemperature;
}

// =====================================================
// MPU6050 / MPU6500 I2C
// =====================================================
bool initMPU() {
  Wire.beginTransmission(MPU6050_ADDR);
  if (Wire.endTransmission() == 0) {
    MPU_ADDR = MPU6050_ADDR;
    // Wake up sensor (clear sleep bit in PWR_MGMT_1)
    writeMPURegister(0x6B, 0x00);
    delay(50);
    return true;
  }
  return false;
}

void writeMPURegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

void readMPU() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, (uint8_t)14);

  if (Wire.available() < 14) {
    Serial.println("[ERROR] MPU data unavailable!");
    return;
  }

  uint8_t buffer[14];
  for (int i = 0; i < 14; i++) {
    buffer[i] = Wire.read();
  }

  accelXRaw = (buffer[0] << 8) | buffer[1];
  accelYRaw = (buffer[2] << 8) | buffer[3];
  accelZRaw = (buffer[4] << 8) | buffer[5];

  gyroXRaw = (buffer[8] << 8) | buffer[9];
  gyroYRaw = (buffer[10] << 8) | buffer[11];
  gyroZRaw = (buffer[12] << 8) | buffer[13];

  // Default accelerometer range: ±2g
  accelX = accelXRaw / 16384.0;
  accelY = accelYRaw / 16384.0;
  accelZ = accelZRaw / 16384.0;

  // Default gyroscope range: ±250 degrees/sec
  gyroX = gyroXRaw / 131.0;
  gyroY = gyroYRaw / 131.0;
  gyroZ = gyroZRaw / 131.0;

  // Movement & Shock Calculations
  float totalG = sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
  shockDetected = (totalG > SHOCK_G_THRESHOLD);

  // Dynamic deviation from 1.0g or high angular velocity indicates movement
  movementDetected = (abs(totalG - 1.0) > MOTION_DELTA_THRESHOLD) || 
                     (abs(gyroX) > 15.0 || abs(gyroY) > 15.0 || abs(gyroZ) > 15.0);
}

// =====================================================
// GPS READING (NEO-6M)
// =====================================================
void readGPS() {
  while (GPS_Serial.available()) {
    char c = GPS_Serial.read();
    gps.encode(c);
  }

  if (gps.location.isValid() && gps.location.age() < 5000) {
    latitude = gps.location.lat();
    longitude = gps.location.lng();
    satellites = gps.satellites.value();

    if (!gpsValid) {
      Serial.println("GPS fix available");
    }
    gpsValid = true;
  } else {
    if (gpsValid) {
      Serial.println("GPS fix unavailable");
    }
    gpsValid = false;
  }
}

// =====================================================
// WI-FI CONNECTION & RECONNECTION
// =====================================================
void connectWiFi() {
  Serial.println();
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Backend connection failed: Wi-Fi offline");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Retrying connection: Wi-Fi dropped, reconnecting...");
    WiFi.disconnect();
    WiFi.reconnect();
  }
}

// =====================================================
// TELEMETRY HTTP CLOUD INGESTION
// =====================================================
void sendTelemetryToBackend() {
  // Construct clean JSON payload strictly adhering to project specification
  String jsonPayload = "{";
  jsonPayload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"temperature\":" + (isnan(temperature) ? "null" : String(temperature, 1)) + ",";
  jsonPayload += "\"humidity\":" + (isnan(humidity) ? "null" : String(humidity, 1)) + ",";

  jsonPayload += "\"accel\":{";
  jsonPayload += "\"x\":" + String(accelX, 3) + ",";
  jsonPayload += "\"y\":" + String(accelY, 3) + ",";
  jsonPayload += "\"z\":" + String(accelZ, 3);
  jsonPayload += "},";

  jsonPayload += "\"gyro\":{";
  jsonPayload += "\"x\":" + String(gyroX, 2) + ",";
  jsonPayload += "\"y\":" + String(gyroY, 2) + ",";
  jsonPayload += "\"z\":" + String(gyroZ, 2);
  jsonPayload += "},";

  jsonPayload += "\"gps\":{";
  if (gpsValid) {
    jsonPayload += "\"latitude\":" + String(latitude, 6) + ",";
    jsonPayload += "\"longitude\":" + String(longitude, 6) + ",";
    jsonPayload += "\"satellites\":" + String(satellites) + ",";
    jsonPayload += "\"valid\":true";
  } else {
    jsonPayload += "\"latitude\":null,";
    jsonPayload += "\"longitude\":null,";
    jsonPayload += "\"satellites\":" + String(satellites) + ",";
    jsonPayload += "\"valid\":false";
  }
  jsonPayload += "},";

  jsonPayload += "\"movementDetected\":" + String(movementDetected ? "true" : "false") + ",";
  jsonPayload += "\"shockDetected\":" + String(shockDetected ? "true" : "false") + ",";
  jsonPayload += "\"gsmStatus\":\"" + String(gsmReady ? "connected" : "disconnected") + "\"";
  jsonPayload += "}";

  // Method 1: Wi-Fi HTTP POST
  if (USE_WIFI) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(BACKEND_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-Key", API_KEY);
      http.setTimeout(5000);

      int httpResponseCode = http.POST(jsonPayload);

      if (httpResponseCode > 0) {
        Serial.print("Backend connected - HTTP response code: ");
        Serial.println(httpResponseCode);
        String responseStr = http.getString();
        if (responseStr.length() > 0) {
          Serial.print("Server response: ");
          Serial.println(responseStr);
        }
        if (httpResponseCode == 200) {
          Serial.println("[OK] Telemetry recorded & synced to Supabase!");
        } else {
          Serial.print("[WARN] Non-200 response: ");
          Serial.println(httpResponseCode);
        }
      } else {
        Serial.println("[ERROR] Backend connection failed");
        Serial.print("HTTPClient error code: ");
        Serial.print(httpResponseCode);
        Serial.print(" (");
        Serial.print(http.errorToString(httpResponseCode).c_str());
        Serial.println(")");
        Serial.println("Troubleshooting: Verify Windows LAN IP, port 8000, and firewall permissions.");
      }
      http.end();

    } else {
      Serial.println("Retrying connection: Waiting for Wi-Fi link");
    }
  }

  // Method 2: Cellular GPRS POST via SIM800L AT Commands
  if (USE_GSM_GPRS && gsmReady) {
    sendGprsData(jsonPayload);
  }
}

// =====================================================
// SIM800L GPRS TRANSMIT (ALTERNATIVE CELLULAR PATH)
// =====================================================
void sendGprsData(const String& jsonPayload) {
  // AT Command flow for SIM800L HTTP POST
  GSM_Serial.println("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"");
  delay(200);
  GSM_Serial.println("AT+SAPBR=3,1,\"APN\",\"" + String(GPRS_APN) + "\"");
  delay(200);
  GSM_Serial.println("AT+SAPBR=1,1");
  delay(500);

  GSM_Serial.println("AT+HTTPINIT");
  delay(200);
  GSM_Serial.println("AT+HTTPPARA=\"CID\",1");
  delay(200);
  GSM_Serial.println("AT+HTTPPARA=\"URL\",\"" + String(BACKEND_URL) + "\"");
  delay(200);
  GSM_Serial.println("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
  delay(200);

  GSM_Serial.println("AT+HTTPDATA=" + String(jsonPayload.length()) + ",5000");
  delay(200);
  GSM_Serial.print(jsonPayload);
  delay(500);

  GSM_Serial.println("AT+HTTPACTION=1"); // POST
  delay(1500);
  GSM_Serial.println("AT+HTTPTERM");
}

// =====================================================
// TELEMETRY LOCAL PRINTING (PRESERVED)
// =====================================================
void printTelemetry() {
  Serial.println();
  Serial.println("------------- PALLET DATA -------------");
  Serial.print("Pallet ID: "); Serial.println(PALLET_ID);
  Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");

  Serial.println();
  Serial.println("Movement Data:");
  Serial.print("Acceleration X: "); Serial.print(accelX); Serial.println(" g");
  Serial.print("Acceleration Y: "); Serial.print(accelY); Serial.println(" g");
  Serial.print("Acceleration Z: "); Serial.print(accelZ); Serial.println(" g");
  Serial.print("Gyro X: "); Serial.print(gyroX); Serial.println(" deg/s");
  Serial.print("Gyro Y: "); Serial.print(gyroY); Serial.println(" deg/s");
  Serial.print("Gyro Z: "); Serial.print(gyroZ); Serial.println(" deg/s");
  Serial.print("Movement Detected: "); Serial.println(movementDetected ? "YES" : "NO");
  Serial.print("Shock / Impact Detected: "); Serial.println(shockDetected ? "ALERT! YES" : "NO");

  Serial.println();
  Serial.println("GPS Data:");
  if (gpsValid) {
    Serial.print("Latitude: "); Serial.println(latitude, 6);
    Serial.print("Longitude: "); Serial.println(longitude, 6);
    Serial.print("Satellites: "); Serial.println(satellites);
  } else {
    Serial.println("Waiting for GPS fix...");
  }
  Serial.println("----------------------------------------");
}

// =====================================================
// GSM TESTING (PRESERVED)
// =====================================================
void testGSM() {
  Serial.println();
  Serial.println("Testing SIM800L...");
  GSM_Serial.println("AT");
  delay(1000);

  if (GSM_Serial.available()) {
    String response = GSM_Serial.readString();
    Serial.println(response);

    if (response.indexOf("OK") >= 0) {
      gsmReady = true;
      Serial.println("GSM connected");
      Serial.println("[OK] SIM800L responding");
    } else {
      Serial.println("[ERROR] SIM800L not responding");
    }
  } else {
    Serial.println("[ERROR] No response from SIM800L");
  }
}

// =====================================================
// SEND SMS (PRESERVED)
// =====================================================
void sendPalletSMS() {
  Serial.println();
  Serial.println("Sending pallet SMS...");

  GSM_Serial.println("AT+CMGF=1");
  delay(1000);

  GSM_Serial.print("AT+CMGS=\"");
  GSM_Serial.print(PHONE_NUMBER);
  GSM_Serial.println("\"");
  delay(1000);

  GSM_Serial.println("Smart Pallet Tracker");
  GSM_Serial.print("Pallet ID: "); GSM_Serial.println(PALLET_ID);
  GSM_Serial.print("Temperature: "); GSM_Serial.print(temperature); GSM_Serial.println(" C");
  GSM_Serial.print("Humidity: "); GSM_Serial.print(humidity); GSM_Serial.println(" %");

  if (gpsValid) {
    GSM_Serial.print("Location: ");
    GSM_Serial.print(latitude, 6);
    GSM_Serial.print(", ");
    GSM_Serial.println(longitude, 6);
  } else {
    GSM_Serial.println("GPS unavailable");
  }

  if (shockDetected) {
    GSM_Serial.println("WARNING: Impact / Shock Detected!");
  }

  GSM_Serial.write(26);
  delay(3000);
  Serial.println("SMS command sent.");
}
