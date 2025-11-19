#!/bin/bash

# Phase 9: Report Generation Test Script
# This script tests all Phase 9 endpoints

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@lims.com"
ADMIN_PASSWORD="Admin@123"
DOCTOR_EMAIL="doctor@lims.com"
DOCTOR_PASSWORD="Doctor@123"
RECEPTIONIST_EMAIL="receptionist@lims.com"
RECEPTIONIST_PASSWORD="Receptionist@123"

echo "=========================================="
echo "PHASE 9: REPORT GENERATION TESTS"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FAILED=0
PASSED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED=$((FAILED + 1))
    fi
}

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local headers="$4"
    local data="$5"
    local expected_status=$6
    
    # Build curl command
    CURL_CMD="curl -s -w \"\nHTTP_CODE:%{http_code}\" -X $method \"$url\""
    
    # Add headers
    if [ -n "$headers" ]; then
        CURL_CMD="$CURL_CMD $headers"
    fi
    
    # Add data if provided
    if [ -n "$data" ]; then
        CURL_CMD="$CURL_CMD -d '$data'"
    fi
    
    RESPONSE=$(eval $CURL_CMD 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ "$HTTP_CODE" == "$expected_status" ]; then
        print_result 0 "$name (HTTP $HTTP_CODE)"
        echo "$BODY" > /tmp/last_response.json
        return 0
    else
        print_result 1 "$name (Expected $expected_status, got $HTTP_CODE)"
        echo "   Response: $BODY" | head -5
        return 1
    fi
}

# ==========================================
# SETUP: Login and Prepare Test Data
# ==========================================
echo -e "${BLUE}=== SETUP ===${NC}"
echo ""

# Login as admin
echo "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}✗ FAIL${NC}: Admin login failed"
    exit 1
fi
print_result 0 "Admin login"

# Login as doctor
echo "Logging in as doctor..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"$DOCTOR_PASSWORD\"}")

DOCTOR_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)

if [ -z "$DOCTOR_TOKEN" ]; then
    echo -e "${RED}✗ FAIL${NC}: Doctor login failed"
    exit 1
fi
print_result 0 "Doctor login"

# Login as receptionist
echo "Logging in as receptionist..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RECEPTIONIST_EMAIL\",\"password\":\"$RECEPTIONIST_PASSWORD\"}")

RECEPTIONIST_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)

if [ -z "$RECEPTIONIST_TOKEN" ]; then
    echo -e "${YELLOW}⚠ WARN${NC}: Receptionist login failed (may not exist)"
    RECEPTIONIST_TOKEN=""
fi

# Get a patient with signed review (from Phase 8)
echo "Fetching patient with signed review..."
PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/doctor/patients?status=SIGNED&limit=1" \
  -H "Authorization: Bearer $DOCTOR_TOKEN")

PATIENT_ID=$(echo $PATIENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -z "$PATIENT_ID" ]; then
    echo -e "${YELLOW}⚠ WARN${NC}: No patient with signed review found. Creating test scenario..."
    # Try to get any patient
    PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/patients?limit=1" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    PATIENT_ID=$(echo $PATIENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)
    
    if [ -z "$PATIENT_ID" ]; then
        echo -e "${RED}✗ FAIL${NC}: No patient found. Cannot proceed with tests."
        exit 1
    fi
    
    # Ensure assignments are SUBMITTED
    echo "Ensuring assignments are SUBMITTED..."
    ASSIGNMENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/assignments?patientId=$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    ASSIGNMENT_IDS=$(echo $ASSIGNMENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(' '.join([a['id'] for a in data]))" 2>/dev/null)
    
    for ASSIGNMENT_ID in $ASSIGNMENT_IDS; do
        # Update status to COMPLETED
        curl -s -X PUT "$BASE_URL/assignments/$ASSIGNMENT_ID/status" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"status\":\"COMPLETED\"}" > /dev/null
        
        # Submit result
        curl -s -X POST "$BASE_URL/results" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"assignmentId\":\"$ASSIGNMENT_ID\",\"resultValues\":{\"value\":\"10.5\"}}" > /dev/null
    done
    
    # Create review
    curl -s -X POST "$BASE_URL/doctor/review" \
      -H "Authorization: Bearer $DOCTOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"patientId\":\"$PATIENT_ID\",\"remarks\":\"Test review for Phase 9\"}" > /dev/null
    
    # Sign report (with dummy passkey - will fail but that's ok for testing)
    curl -s -X POST "$BASE_URL/doctor/sign-report" \
      -H "Authorization: Bearer $DOCTOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"patientId\":\"$PATIENT_ID\",\"passkeyCredential\":{\"response\":{\"clientDataJSON\":\"dummy\"}}}" > /dev/null
fi

echo ""
echo -e "${BLUE}=== TESTING REPORT ENDPOINTS ===${NC}"
echo ""

# Test 1: Generate Report (Manual)
echo -e "${YELLOW}Test 1: Generate Report (Manual)${NC}"
# Use admin token if receptionist token is not available
TEST_TOKEN=${RECEPTIONIST_TOKEN:-$ADMIN_TOKEN}
test_endpoint \
  "POST /reports/generate/:patientId (RECEPTIONIST/ADMIN)" \
  "POST" \
  "$BASE_URL/reports/generate/$PATIENT_ID" \
  "-H \"Authorization: Bearer $TEST_TOKEN\" -H \"Content-Type: application/json\"" \
  "" \
  "201"

REPORT_ID=$(cat /tmp/last_response.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)
REPORT_NUMBER=$(cat /tmp/last_response.json | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('reportNumber', ''))" 2>/dev/null)

if [ -n "$REPORT_ID" ]; then
    echo "   Report ID: $REPORT_ID"
    echo "   Report Number: $REPORT_NUMBER"
fi

# Test 2: Get Report by Patient ID
echo ""
echo -e "${YELLOW}Test 2: Get Report by Patient ID${NC}"
test_endpoint \
  "GET /reports/patient/:patientId" \
  "GET" \
  "$BASE_URL/reports/patient/$PATIENT_ID" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

# Test 3: Get Report by ID
echo ""
echo -e "${YELLOW}Test 3: Get Report by ID${NC}"
if [ -n "$REPORT_ID" ]; then
    test_endpoint \
      "GET /reports/:id" \
      "GET" \
      "$BASE_URL/reports/$REPORT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
else
    print_result 1 "GET /reports/:id (No report ID available)"
fi

# Test 4: Download Report PDF
echo ""
echo -e "${YELLOW}Test 4: Download Report PDF${NC}"
if [ -n "$REPORT_ID" ]; then
    PDF_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/reports/$REPORT_ID/download" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -o /tmp/report.pdf)
    
    HTTP_CODE=$(echo "$PDF_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    
    if [ "$HTTP_CODE" == "200" ] && [ -f "/tmp/report.pdf" ]; then
        FILE_SIZE=$(stat -f%z /tmp/report.pdf 2>/dev/null || stat -c%s /tmp/report.pdf 2>/dev/null)
        if [ "$FILE_SIZE" -gt 0 ]; then
            print_result 0 "GET /reports/:id/download (PDF downloaded, ${FILE_SIZE} bytes)"
        else
            print_result 1 "GET /reports/:id/download (PDF file is empty)"
        fi
    else
        print_result 1 "GET /reports/:id/download (Expected 200, got $HTTP_CODE)"
    fi
else
    print_result 1 "GET /reports/:id/download (No report ID available)"
fi

# Test 5: Get All Reports (List)
echo ""
echo -e "${YELLOW}Test 5: Get All Reports (List)${NC}"
test_endpoint \
  "GET /reports (List all)" \
  "GET" \
  "$BASE_URL/reports?page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

# Test 6: Get All Reports with Filters
echo ""
echo -e "${YELLOW}Test 6: Get All Reports with Filters${NC}"
test_endpoint \
  "GET /reports?status=COMPLETED" \
  "GET" \
  "$BASE_URL/reports?status=COMPLETED&page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

# Test 7: Get All Reports by Patient ID
echo ""
echo -e "${YELLOW}Test 7: Get All Reports by Patient ID${NC}"
test_endpoint \
  "GET /reports?patientId=..." \
  "GET" \
  "$BASE_URL/reports?patientId=$PATIENT_ID" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

# Test 8: Error Handling - Generate Report without Signed Review
echo ""
echo -e "${YELLOW}Test 8: Error Handling - Generate Report without Signed Review${NC}"
# Get a patient without signed review
PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/doctor/patients?status=PENDING&limit=1" \
  -H "Authorization: Bearer $DOCTOR_TOKEN")

UNSIGNED_PATIENT_ID=$(echo $PATIENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$UNSIGNED_PATIENT_ID" ]; then
    test_endpoint \
      "POST /reports/generate/:patientId (Without signed review)" \
      "POST" \
      "$BASE_URL/reports/generate/$UNSIGNED_PATIENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" \
      "" \
      "400"
else
    print_result 1 "POST /reports/generate/:patientId (No unsigned patient found for error test)"
fi

# Test 9: Error Handling - Generate Report with Incomplete Tests
echo ""
echo -e "${YELLOW}Test 9: Error Handling - Generate Report with Incomplete Tests${NC}"
# This would require creating a patient with incomplete tests, which is complex
# Skipping for now as it requires extensive setup

# Test 10: Auto-generation on Doctor Sign
echo ""
echo -e "${YELLOW}Test 10: Auto-generation on Doctor Sign${NC}"
# Get a patient with all tests SUBMITTED but not signed
PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/doctor/patients?status=REVIEWED&limit=1" \
  -H "Authorization: Bearer $DOCTOR_TOKEN")

REVIEWED_PATIENT_ID=$(echo $PATIENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$REVIEWED_PATIENT_ID" ]; then
    # Sign the report (this should trigger auto-generation)
    SIGN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/doctor/sign-report" \
      -H "Authorization: Bearer $DOCTOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"patientId\":\"$REVIEWED_PATIENT_ID\",\"passkeyCredential\":{\"response\":{\"clientDataJSON\":\"dummy\"}}}")
    
    HTTP_CODE=$(echo "$SIGN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "400" ]; then
        # Check if report was auto-generated
        sleep 2  # Wait for async generation
        REPORT_CHECK=$(curl -s -X GET "$BASE_URL/reports/patient/$REVIEWED_PATIENT_ID" \
          -H "Authorization: Bearer $ADMIN_TOKEN")
        
        REPORT_EXISTS=$(echo $REPORT_CHECK | python3 -c "import sys, json; d=json.load(sys.stdin); print('id' in d)" 2>/dev/null)
        
        if [ "$REPORT_EXISTS" == "True" ]; then
            print_result 0 "Auto-generation on doctor sign (Report created)"
        else
            print_result 1 "Auto-generation on doctor sign (Report not found - may have failed silently)"
        fi
    else
        print_result 1 "Auto-generation on doctor sign (Signing failed with HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "Auto-generation on doctor sign (No reviewed patient found for test)"
fi

# ==========================================
# SUMMARY
# ==========================================
echo ""
echo "=========================================="
echo -e "${BLUE}TEST SUMMARY${NC}"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi

