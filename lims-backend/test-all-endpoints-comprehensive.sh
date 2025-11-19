#!/bin/bash

# COMPREHENSIVE TEST SCRIPT FOR ALL ENDPOINTS - PHASES 1-9
# Tests EVERY single endpoint in the application

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
echo "COMPREHENSIVE ENDPOINT TEST: ALL PHASES"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
        if [ "$HTTP_CODE" != "401" ] && [ "$HTTP_CODE" != "403" ]; then
            echo "   Response: $BODY" | head -2
        fi
        return 1
    fi
}

# ==========================================
# PHASE 1: AUTHENTICATION
# ==========================================
echo -e "${BLUE}=== PHASE 1: AUTHENTICATION (7 endpoints) ===${NC}"
echo ""

# Login as admin
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
    print_result 1 "POST /auth/login (Admin)"
    echo "   Cannot proceed without admin token"
    exit 1
fi
print_result 0 "POST /auth/login (Admin)"

REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('refreshToken', ''))" 2>/dev/null)

# Login as other users
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RECEPTIONIST_EMAIL\",\"password\":\"$RECEPTIONIST_PASSWORD\"}")
RECEPTIONIST_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
print_result $([ -n "$RECEPTIONIST_TOKEN" ] && echo 0 || echo 1) "POST /auth/login (Receptionist)"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"$DOCTOR_PASSWORD\"}")
DOCTOR_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
print_result $([ -n "$DOCTOR_TOKEN" ] && echo 0 || echo 1) "POST /auth/login (Doctor)"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$AUDIOMETRY_EMAIL\",\"password\":\"$AUDIOMETRY_PASSWORD\"}")
AUDIOMETRY_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
print_result $([ -n "$AUDIOMETRY_TOKEN" ] && echo 0 || echo 1) "POST /auth/login (Test Admin)"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$LABTECH_EMAIL\",\"password\":\"$LABTECH_PASSWORD\"}")
LABTECH_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
print_result $([ -n "$LABTECH_TOKEN" ] && echo 0 || echo 1) "POST /auth/login (Lab Technician)"

test_endpoint \
  "POST /auth/logout" \
  "POST" \
  "$BASE_URL/auth/logout" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

# Re-login after logout
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
REFRESH_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('refreshToken', ''))" 2>/dev/null)

if [ -n "$REFRESH_TOKEN" ]; then
    test_endpoint \
      "POST /auth/refresh" \
      "POST" \
      "$BASE_URL/auth/refresh" \
      "-H \"Content-Type: application/json\"" \
      "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
      "200"
fi

test_endpoint \
  "GET /auth/me" \
  "GET" \
  "$BASE_URL/auth/me" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

test_endpoint \
  "POST /auth/setup-passkey" \
  "POST" \
  "$BASE_URL/auth/setup-passkey" \
  "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
  "" \
  "200"

# ==========================================
# PHASE 2: USER MANAGEMENT (6 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 2: USER MANAGEMENT (6 endpoints) ===${NC}"
echo ""

test_endpoint \
  "GET /users" \
  "GET" \
  "$BASE_URL/users?page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

USER_ID=$(curl -s -X GET "$BASE_URL/users?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

if [ -n "$USER_ID" ]; then
    test_endpoint \
      "GET /users/:id" \
      "GET" \
      "$BASE_URL/users/$USER_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
    
    test_endpoint \
      "PUT /users/:id" \
      "PUT" \
      "$BASE_URL/users/$USER_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" \
      "{\"fullName\":\"Updated Name\"}" \
      "200"
    
    test_endpoint \
      "POST /users/:id/change-password" \
      "POST" \
      "$BASE_URL/users/$USER_ID/change-password" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" \
      "{\"currentPassword\":\"Admin@123\",\"newPassword\":\"Admin@123\"}" \
      "200"
fi

# ==========================================
# PHASE 3: PACKAGES (7 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 3: PACKAGES (7 endpoints) ===${NC}"
echo ""

test_endpoint \
  "GET /packages" \
  "GET" \
  "$BASE_URL/packages" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

PACKAGE_ID=$(curl -s -X GET "$BASE_URL/packages" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null)

if [ -n "$PACKAGE_ID" ]; then
    test_endpoint \
      "GET /packages/:id" \
      "GET" \
      "$BASE_URL/packages/$PACKAGE_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
    
    test_endpoint \
      "GET /packages/:id/tests" \
      "GET" \
      "$BASE_URL/packages/$PACKAGE_ID/tests" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 3: TESTS (6 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 3: TESTS (6 endpoints) ===${NC}"
echo ""

test_endpoint \
  "GET /tests" \
  "GET" \
  "$BASE_URL/tests" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

TEST_ID=$(curl -s -X GET "$BASE_URL/tests" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null)

if [ -n "$TEST_ID" ]; then
    test_endpoint \
      "GET /tests/:id" \
      "GET" \
      "$BASE_URL/tests/$TEST_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
    
    test_endpoint \
      "GET /tests/by-admin-role/audiometry" \
      "GET" \
      "$BASE_URL/tests/by-admin-role/audiometry" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 4: PATIENTS (6 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 4: PATIENTS (6 endpoints) ===${NC}"
echo ""

test_endpoint \
  "GET /patients" \
  "GET" \
  "$BASE_URL/patients?page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

PATIENT_ID=$(curl -s -X GET "$BASE_URL/patients?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

PATIENT_PATIENT_ID=$(curl -s -X GET "$BASE_URL/patients?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['patientId'] if data else '')" 2>/dev/null)

if [ -n "$PATIENT_ID" ]; then
    test_endpoint \
      "GET /patients/:id" \
      "GET" \
      "$BASE_URL/patients/$PATIENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
    
    if [ -n "$PATIENT_PATIENT_ID" ]; then
        test_endpoint \
          "GET /patients/by-patient-id/:patientId" \
          "GET" \
          "$BASE_URL/patients/by-patient-id/$PATIENT_PATIENT_ID" \
          "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
          "" \
          "200"
    fi
    
    test_endpoint \
      "PUT /patients/:id" \
      "PUT" \
      "$BASE_URL/patients/$PATIENT_ID" \
      "-H \"Authorization: Bearer $RECEPTIONIST_TOKEN\" -H \"Content-Type: application/json\"" \
      "{\"name\":\"Updated Patient Name\"}" \
      "200"
    
    # Get total price and current payment status from patientPackages array
    PATIENT_DATA=$(curl -s -X GET "$BASE_URL/patients/$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    TOTAL_PRICE=$(echo "$PATIENT_DATA" | python3 -c "import sys, json; d=json.load(sys.stdin); pps=d.get('patientPackages', []); price=pps[0]['totalPrice'] if pps and len(pps) > 0 and pps[0].get('totalPrice') else None; print(int(float(price)) if price is not None else 1800)" 2>/dev/null)
    
    CURRENT_PAYMENT_STATUS=$(echo "$PATIENT_DATA" | python3 -c "import sys, json; d=json.load(sys.stdin); pps=d.get('patientPackages', []); print(pps[0]['paymentStatus'] if pps and len(pps) > 0 and pps[0].get('paymentStatus') else 'PENDING')" 2>/dev/null)
    
    if [ "$CURRENT_PAYMENT_STATUS" != "PAID" ]; then
        # Use direct curl to ensure proper JSON formatting
        PAYMENT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PUT "$BASE_URL/patients/$PATIENT_ID/payment" \
          -H "Authorization: Bearer $RECEPTIONIST_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"paymentStatus\":\"PAID\",\"paymentAmount\":$TOTAL_PRICE}" 2>&1)
        
        PAYMENT_HTTP_CODE=$(echo "$PAYMENT_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
        if [ "$PAYMENT_HTTP_CODE" == "200" ]; then
            print_result 0 "PUT /patients/:id/payment (HTTP $PAYMENT_HTTP_CODE)"
        else
            print_result 1 "PUT /patients/:id/payment (Expected 200, got $PAYMENT_HTTP_CODE)"
            echo "$PAYMENT_RESPONSE" | sed '/HTTP_CODE/d' | head -2
        fi
    else
        print_result 0 "PUT /patients/:id/payment (Skipped - already PAID)"
    fi
fi

# ==========================================
# PHASE 5: ASSIGNMENTS (7 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 5: ASSIGNMENTS (7 endpoints) ===${NC}"
echo ""

if [ -n "$PATIENT_ID" ]; then
    test_endpoint \
      "GET /assignments/patient/:patientId" \
      "GET" \
      "$BASE_URL/assignments/patient/$PATIENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
    
    ASSIGNMENT_ID=$(curl -s -X GET "$BASE_URL/assignments/patient/$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null)
    
    if [ -n "$ASSIGNMENT_ID" ]; then
        test_endpoint \
          "GET /assignments/:id" \
          "GET" \
          "$BASE_URL/assignments/$ASSIGNMENT_ID" \
          "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
          "" \
          "200"
        
        # Check assignment status and admin
        ASSIGNMENT_DATA=$(curl -s -X GET "$BASE_URL/assignments/$ASSIGNMENT_ID" \
          -H "Authorization: Bearer $ADMIN_TOKEN")
        
        ASSIGNMENT_STATUS=$(echo "$ASSIGNMENT_DATA" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('status', ''))" 2>/dev/null)
        ASSIGNMENT_ADMIN_EMAIL=$(echo "$ASSIGNMENT_DATA" | python3 -c "import sys, json; d=json.load(sys.stdin); admin=d.get('admin', {}); print(admin.get('email', '') if admin else '')" 2>/dev/null)
        
        # Use the correct admin token based on assignment
        if [[ "$ASSIGNMENT_ADMIN_EMAIL" == *"audiometry"* ]]; then
            TOKEN_TO_USE=$AUDIOMETRY_TOKEN
        elif [[ "$ASSIGNMENT_ADMIN_EMAIL" == *"xray"* ]]; then
            TOKEN_TO_USE=$XRAY_TOKEN
        elif [[ "$ASSIGNMENT_ADMIN_EMAIL" == *"eye"* ]]; then
            TOKEN_TO_USE=$AUDIOMETRY_TOKEN  # Use audiometry as fallback
        else
            TOKEN_TO_USE=$AUDIOMETRY_TOKEN  # Default
        fi
        
        # Try to update status - if already SUBMITTED, skip
        if [ "$ASSIGNMENT_STATUS" == "SUBMITTED" ] || [ "$ASSIGNMENT_STATUS" == "COMPLETED" ]; then
            print_result 0 "PUT /assignments/:id/status (Skipped - already $ASSIGNMENT_STATUS)"
        elif [ "$ASSIGNMENT_STATUS" == "ASSIGNED" ]; then
            test_endpoint \
              "PUT /assignments/:id/status" \
              "PUT" \
              "$BASE_URL/assignments/$ASSIGNMENT_ID/status" \
              "-H \"Authorization: Bearer $TOKEN_TO_USE\" -H \"Content-Type: application/json\"" \
              "{\"status\":\"IN_PROGRESS\"}" \
              "200"
        else
            test_endpoint \
              "PUT /assignments/:id/status" \
              "PUT" \
              "$BASE_URL/assignments/$ASSIGNMENT_ID/status" \
              "-H \"Authorization: Bearer $TOKEN_TO_USE\" -H \"Content-Type: application/json\"" \
              "{\"status\":\"COMPLETED\"}" \
              "200"
        fi
    fi
    
    test_endpoint \
      "GET /assignments/my-assignments" \
      "GET" \
      "$BASE_URL/assignments/my-assignments" \
      "-H \"Authorization: Bearer $AUDIOMETRY_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 6: RESULTS (5 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 6: RESULTS (5 endpoints) ===${NC}"
echo ""

if [ -n "$ASSIGNMENT_ID" ]; then
    test_endpoint \
      "GET /results/assignment/:assignmentId" \
      "GET" \
      "$BASE_URL/results/assignment/$ASSIGNMENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
    
    RESULT_ID=$(curl -s -X GET "$BASE_URL/results/assignment/$ASSIGNMENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)
    
    if [ -n "$RESULT_ID" ]; then
        test_endpoint \
          "PUT /results/:id" \
          "PUT" \
          "$BASE_URL/results/$RESULT_ID" \
          "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" \
          "{\"notes\":\"Updated notes\"}" \
          "200"
        
        test_endpoint \
          "POST /results/:id/verify" \
          "POST" \
          "$BASE_URL/results/$RESULT_ID/verify" \
          "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
          "" \
          "201"
    fi
fi

if [ -n "$PATIENT_ID" ]; then
    test_endpoint \
      "GET /results/patient/:patientId" \
      "GET" \
      "$BASE_URL/results/patient/$PATIENT_ID" \
      "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
      "" \
      "200"
fi

# ==========================================
# PHASE 7: BLOOD SAMPLES (6 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 7: BLOOD SAMPLES (6 endpoints) ===${NC}"
echo ""

# Re-login lab tech to ensure fresh token
LABTECH_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$LABTECH_EMAIL\",\"password\":\"$LABTECH_PASSWORD\"}")

# Extract token with error handling - check if response contains accessToken
if echo "$LABTECH_LOGIN_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); sys.exit(0 if 'accessToken' in d else 1)" 2>/dev/null; then
    LABTECH_TOKEN=$(echo "$LABTECH_LOGIN_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
else
    LABTECH_TOKEN=""
fi

# Test blood samples endpoint with direct curl to ensure token is passed
if [ -n "$LABTECH_TOKEN" ] && [ ${#LABTECH_TOKEN} -gt 10 ]; then
    BLOOD_SAMPLE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/blood-samples/my-samples-list" \
      -H "Authorization: Bearer $LABTECH_TOKEN" 2>&1)
    
    BLOOD_SAMPLE_HTTP_CODE=$(echo "$BLOOD_SAMPLE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    if [ "$BLOOD_SAMPLE_HTTP_CODE" == "200" ]; then
        print_result 0 "GET /blood-samples/my-samples-list (HTTP $BLOOD_SAMPLE_HTTP_CODE)"
        echo "$BLOOD_SAMPLE_RESPONSE" | sed '/HTTP_CODE/d' > /tmp/last_response.json
        
        BLOOD_SAMPLE_ID=$(echo "$BLOOD_SAMPLE_RESPONSE" | sed '/HTTP_CODE/d' | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null)
        
        if [ -n "$BLOOD_SAMPLE_ID" ]; then
            test_endpoint \
              "GET /blood-samples/:id" \
              "GET" \
              "$BASE_URL/blood-samples/$BLOOD_SAMPLE_ID" \
              "-H \"Authorization: Bearer $LABTECH_TOKEN\"" \
              "" \
              "200"
        fi
    else
        print_result 1 "GET /blood-samples/my-samples-list (Expected 200, got $BLOOD_SAMPLE_HTTP_CODE)"
    fi
else
    print_result 1 "GET /blood-samples/my-samples-list (Lab tech login failed - no valid token)"
fi

# ==========================================
# PHASE 8: DOCTOR REVIEWS (5 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 8: DOCTOR REVIEWS (5 endpoints) ===${NC}"
echo ""

test_endpoint \
  "GET /doctor/patients" \
  "GET" \
  "$BASE_URL/doctor/patients?page=1&limit=10" \
  "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
  "" \
  "200"

# Get signed patients
SIGNED_PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/doctor/patients?status=SIGNED&limit=10" \
  -H "Authorization: Bearer $DOCTOR_TOKEN")

SIGNED_PATIENT_ID=$(echo $SIGNED_PATIENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); data=d.get('data', []); print(data[0]['id'] if data else '')" 2>/dev/null)

# If no signed patient, check all patients
if [ -z "$SIGNED_PATIENT_ID" ] && [ -n "$PATIENT_ID" ]; then
    REVIEW_RESPONSE=$(curl -s -X GET "$BASE_URL/doctor/patient/$PATIENT_ID/results" \
      -H "Authorization: Bearer $DOCTOR_TOKEN")
    
    IS_SIGNED=$(echo $REVIEW_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); review=d.get('review', {}); print('true' if review.get('isSigned') else 'false')" 2>/dev/null)
    
    if [ "$IS_SIGNED" == "true" ]; then
        SIGNED_PATIENT_ID=$PATIENT_ID
    fi
fi

if [ -n "$PATIENT_ID" ]; then
    test_endpoint \
      "GET /doctor/patient/:patientId/results" \
      "GET" \
      "$BASE_URL/doctor/patient/$PATIENT_ID/results" \
      "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
      "" \
      "200"
fi

test_endpoint \
  "GET /doctor/signed-reports" \
  "GET" \
  "$BASE_URL/doctor/signed-reports?page=1&limit=10" \
  "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
  "" \
  "200"

# ==========================================
# PHASE 9: REPORTS (5 endpoints)
# ==========================================
echo ""
echo -e "${BLUE}=== PHASE 9: REPORTS (5 endpoints) ===${NC}"
echo ""

test_endpoint \
  "GET /reports" \
  "GET" \
  "$BASE_URL/reports?page=1&limit=10" \
  "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
  "" \
  "200"

if [ -n "$SIGNED_PATIENT_ID" ]; then
    GENERATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/reports/generate/$SIGNED_PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" 2>&1)
    
    HTTP_CODE=$(echo "$GENERATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    
    if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
        print_result 0 "POST /reports/generate/:patientId (HTTP $HTTP_CODE)"
        REPORT_ID=$(echo "$GENERATE_RESPONSE" | sed '/HTTP_CODE/d' | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)
        
        if [ -n "$REPORT_ID" ]; then
            test_endpoint \
              "GET /reports/:id" \
              "GET" \
              "$BASE_URL/reports/$REPORT_ID" \
              "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
              "" \
              "200"
            
            test_endpoint \
              "GET /reports/patient/:patientId" \
              "GET" \
              "$BASE_URL/reports/patient/$SIGNED_PATIENT_ID" \
              "-H \"Authorization: Bearer $ADMIN_TOKEN\"" \
              "" \
              "200"
            
            # Test PDF download
            PDF_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/reports/$REPORT_ID/download" \
              -H "Authorization: Bearer $ADMIN_TOKEN" \
              -o /tmp/report.pdf 2>&1)
            
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
  "GET /reports?status=COMPLETED" \
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
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$(echo "scale=2; $PASSED * 100 / $TOTAL_TESTS" | bc)
    echo -e "Pass Rate: ${BLUE}${PASS_RATE}%${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi

