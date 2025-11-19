#!/bin/bash

# Comprehensive Test Script for Phases 1-9
# Tests all endpoints from Phase 1 through Phase 9

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@lims.com"
ADMIN_PASSWORD="Admin@123"
RECEPTIONIST_EMAIL="receptionist@lims.com"
RECEPTIONIST_PASSWORD="Receptionist@123"
DOCTOR_EMAIL="doctor@lims.com"
DOCTOR_PASSWORD="Doctor@123"
AUDIOMETRY_EMAIL="audiometry@lims.com"
AUDIOMETRY_PASSWORD="TestAdmin@123"
XRAY_EMAIL="xray@lims.com"
XRAY_PASSWORD="TestAdmin@123"
LABTECH_EMAIL="labtech@lims.com"
LABTECH_PASSWORD="LabTech@123"

echo "=========================================="
echo "COMPREHENSIVE TEST: PHASES 1-9"
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
TOTAL_TESTS=0

# Function to print test result
print_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
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
    
    CURL_CMD="curl -s -w \"\nHTTP_CODE:%{http_code}\" -X $method \"$url\""
    
    if [ -n "$headers" ]; then
        CURL_CMD="$CURL_CMD $headers"
    fi
    
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
        echo "   Response: $BODY" | head -3
        return 1
    fi
}

# ==========================================
# PHASE 1: Authentication
# ==========================================
echo -e "${BLUE}=== PHASE 1: AUTHENTICATION ===${NC}"
echo ""

# Login as admin
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
    print_result 1 "Admin login"
    echo "   Cannot proceed without admin token"
    exit 1
fi
print_result 0 "Admin login"

# Login as receptionist
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RECEPTIONIST_EMAIL\",\"password\":\"$RECEPTIONIST_PASSWORD\"}")

RECEPTIONIST_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
print_result $([ -n "$RECEPTIONIST_TOKEN" ] && echo 0 || echo 1) "Receptionist login"

# Login as doctor
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"$DOCTOR_PASSWORD\"}")

DOCTOR_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
print_result $([ -n "$DOCTOR_TOKEN" ] && echo 0 || echo 1) "Doctor login"

# Login as lab technician
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$LABTECH_EMAIL\",\"password\":\"$LABTECH_PASSWORD\"}")

LABTECH_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
print_result $([ -n "$LABTECH_TOKEN" ] && echo 0 || echo 1) "Lab Technician login"

# ==========================================
# PHASE 2: User Management
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 2: USER MANAGEMENT ===${NC}"
echo ""

test_endpoint \
  "GET /users (List users)" \
  "GET" \
  "$BASE_URL/users?page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

test_endpoint \
  "GET /users/:id (Get user by ID)" \
  "GET" \
  "$BASE_URL/users/$(echo $ADMIN_TOKEN | python3 -c "import sys, jwt; token=sys.stdin.read().strip(); payload=jwt.decode(token, options={'verify_signature': False}); print(payload.get('userId', ''))" 2>/dev/null || echo '')" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

# ==========================================
# PHASE 3: Packages & Tests
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 3: PACKAGES & TESTS ===${NC}"
echo ""

test_endpoint \
  "GET /packages (List packages)" \
  "GET" \
  "$BASE_URL/packages" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

PACKAGE_ID=$(curl -s -X GET "$BASE_URL/packages?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$PACKAGE_ID" ]; then
    test_endpoint \
      "GET /packages/:id (Get package by ID)" \
      "GET" \
      "$BASE_URL/packages/$PACKAGE_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

test_endpoint \
  "GET /tests (List tests)" \
  "GET" \
  "$BASE_URL/tests" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

TEST_ID=$(curl -s -X GET "$BASE_URL/tests?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$TEST_ID" ]; then
    test_endpoint \
      "GET /tests/:id (Get test by ID)" \
      "GET" \
      "$BASE_URL/tests/$TEST_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 4: Patient Registration
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 4: PATIENT REGISTRATION ===${NC}"
echo ""

test_endpoint \
  "GET /patients (List patients)" \
  "GET" \
  "$BASE_URL/patients?page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

PATIENT_ID=$(curl -s -X GET "$BASE_URL/patients?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$PATIENT_ID" ]; then
    test_endpoint \
      "GET /patients/:id (Get patient by ID)" \
      "GET" \
      "$BASE_URL/patients/$PATIENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 5: Test Assignment
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 5: TEST ASSIGNMENT ===${NC}"
echo ""

if [ -n "$PATIENT_ID" ]; then
    test_endpoint \
      "GET /assignments/patient/:patientId (Get assignments by patient)" \
      "GET" \
      "$BASE_URL/assignments/patient/$PATIENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
    
    ASSIGNMENT_ID=$(curl -s -X GET "$BASE_URL/assignments/patient/$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) and len(data) > 0 else (data.get('data', [{}])[0].get('id', '') if isinstance(data, dict) else ''))" 2>/dev/null)
fi

if [ -n "$ASSIGNMENT_ID" ]; then
    test_endpoint \
      "GET /assignments/:id (Get assignment by ID)" \
      "GET" \
      "$BASE_URL/assignments/$ASSIGNMENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 6: Test Results
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 6: TEST RESULTS ===${NC}"
echo ""

if [ -n "$ASSIGNMENT_ID" ]; then
    test_endpoint \
      "GET /results/assignment/:assignmentId (Get result by assignment)" \
      "GET" \
      "$BASE_URL/results/assignment/$ASSIGNMENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

if [ -n "$PATIENT_ID" ]; then
    test_endpoint \
      "GET /results/patient/:patientId (Get results by patient)" \
      "GET" \
      "$BASE_URL/results/patient/$PATIENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 7: Blood Test Workflow
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 7: BLOOD TEST WORKFLOW ===${NC}"
echo ""

test_endpoint \
  "GET /blood-samples/my-samples-list (List lab technician samples)" \
  "GET" \
  "$BASE_URL/blood-samples/my-samples-list" \
  "-H \"Authorization: Bearer $LABTECH_TOKEN\"" \
  "" \
  "200"

# Get a blood sample ID if available
BLOOD_SAMPLE_ID=$(curl -s -X GET "$BASE_URL/blood-samples/my-samples-list" \
  -H "Authorization: Bearer $LABTECH_TOKEN" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) and len(data) > 0 else (data.get('data', [{}])[0].get('id', '') if isinstance(data, dict) else ''))" 2>/dev/null)

if [ -n "$BLOOD_SAMPLE_ID" ]; then
    test_endpoint \
      "GET /blood-samples/:id (Get blood sample by ID)" \
      "GET" \
      "$BASE_URL/blood-samples/$BLOOD_SAMPLE_ID" \
      "-H \"Authorization: Bearer $LABTECH_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 8: Doctor Review & Signing
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 8: DOCTOR REVIEW & SIGNING ===${NC}"
echo ""

test_endpoint \
  "GET /doctor/patients (Get patients for review)" \
  "GET" \
  "$BASE_URL/doctor/patients?page=1&limit=10" \
  "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
  "" \
  "200"

# Get a patient with signed review
SIGNED_PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/doctor/patients?status=SIGNED&limit=10" \
  -H "Authorization: Bearer $DOCTOR_TOKEN")

SIGNED_PATIENT_ID=$(echo $SIGNED_PATIENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

# If no signed patient found, try to get any patient and check if they have a signed review
if [ -z "$SIGNED_PATIENT_ID" ]; then
    ALL_PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/patients?limit=10" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    ALL_PATIENT_IDS=$(echo $ALL_PATIENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(' '.join([p['id'] for p in data]))" 2>/dev/null)
    
    for PID in $ALL_PATIENT_IDS; do
        REVIEW_RESPONSE=$(curl -s -X GET "$BASE_URL/doctor/patient/$PID/results" \
          -H "Authorization: Bearer $DOCTOR_TOKEN")
        
        IS_SIGNED=$(echo $REVIEW_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); review=d.get('review', {}); print('true' if review.get('isSigned') else 'false')" 2>/dev/null)
        
        if [ "$IS_SIGNED" == "true" ]; then
            SIGNED_PATIENT_ID=$PID
            break
        fi
    done
fi

if [ -n "$SIGNED_PATIENT_ID" ]; then
    test_endpoint \
      "GET /doctor/patient/:patientId/results (Get patient results)" \
      "GET" \
      "$BASE_URL/doctor/patient/$SIGNED_PATIENT_ID/results" \
      "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
      "" \
      "200"
fi

test_endpoint \
  "GET /doctor/signed-reports (Get signed reports)" \
  "GET" \
  "$BASE_URL/doctor/signed-reports?page=1&limit=10" \
  "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
  "" \
  "200"

# ==========================================
# PHASE 9: Report Generation
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 9: REPORT GENERATION ===${NC}"
echo ""

test_endpoint \
  "GET /reports (List all reports)" \
  "GET" \
  "$BASE_URL/reports?page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

if [ -n "$SIGNED_PATIENT_ID" ]; then
    # Try to generate report
    GENERATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/reports/generate/$SIGNED_PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$GENERATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    
    if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
        print_result 0 "POST /reports/generate/:patientId (HTTP $HTTP_CODE)"
        REPORT_ID=$(echo "$GENERATE_RESPONSE" | sed '/HTTP_CODE/d' | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)
        
        if [ -n "$REPORT_ID" ]; then
            test_endpoint \
              "GET /reports/:id (Get report by ID)" \
              "GET" \
              "$BASE_URL/reports/$REPORT_ID" \
              "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
              "" \
              "200"
            
            test_endpoint \
              "GET /reports/patient/:patientId (Get report by patient)" \
              "GET" \
              "$BASE_URL/reports/patient/$SIGNED_PATIENT_ID" \
              "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
              "" \
              "200"
            
            # Test PDF download
            PDF_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/reports/$REPORT_ID/download" \
              -H "Authorization: Bearer $ADMIN_TOKEN" \
              -o /tmp/report.pdf)
            
            PDF_HTTP_CODE=$(echo "$PDF_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
            if [ "$PDF_HTTP_CODE" == "200" ] && [ -f "/tmp/report.pdf" ]; then
                FILE_SIZE=$(stat -f%z /tmp/report.pdf 2>/dev/null || stat -c%s /tmp/report.pdf 2>/dev/null)
                if [ "$FILE_SIZE" -gt 0 ]; then
                    print_result 0 "GET /reports/:id/download (PDF downloaded, ${FILE_SIZE} bytes)"
                else
                    print_result 1 "GET /reports/:id/download (PDF file is empty)"
                fi
            else
                print_result 1 "GET /reports/:id/download (Expected 200, got $PDF_HTTP_CODE)"
            fi
        fi
    else
        print_result 1 "POST /reports/generate/:patientId (Expected 201, got $HTTP_CODE)"
    fi
else
    print_result 1 "POST /reports/generate/:patientId (No signed patient found)"
fi

test_endpoint \
  "GET /reports?status=COMPLETED (Filter reports by status)" \
  "GET" \
  "$BASE_URL/reports?status=COMPLETED&page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

# ==========================================
# SUMMARY
# ==========================================
echo ""
echo "=========================================="
echo -e "${BLUE}TEST SUMMARY${NC}"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $TOTAL_TESTS"
PASS_RATE=$(echo "scale=2; $PASSED * 100 / $TOTAL_TESTS" | bc)
echo -e "Pass Rate: ${BLUE}${PASS_RATE}%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
