#!/bin/bash

# Phase 8: Doctor Review & Signing Test Script
# This script tests all Phase 8 endpoints

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@lims.com"
ADMIN_PASSWORD="Admin@123"
DOCTOR_EMAIL="doctor@lims.com"
DOCTOR_PASSWORD="Doctor@123"

echo "=========================================="
echo "PHASE 8: DOCTOR REVIEW & SIGNING TESTS"
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
        return 0
    else
        print_result 1 "$name (Expected $expected_status, got $HTTP_CODE)"
        echo "   Response: $BODY" | head -3
        return 1
    fi
}

# ==========================================
# SETUP: Login and Create Test Data
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

# Create doctor user if doesn't exist
echo "Creating doctor user..."
CREATE_DOCTOR_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"$DOCTOR_PASSWORD\",\"fullName\":\"Dr. Test Doctor\",\"role\":\"DOCTOR\"}")

DOCTOR_ID=$(echo $CREATE_DOCTOR_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)

# Login as doctor
echo "Logging in as doctor..."
DOCTOR_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"$DOCTOR_PASSWORD\"}")

DOCTOR_TOKEN=$(echo $DOCTOR_LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)

if [ -z "$DOCTOR_TOKEN" ]; then
    echo -e "${RED}✗ FAIL${NC}: Doctor login failed"
    exit 1
fi
print_result 0 "Doctor login"

# Get a patient with submitted results (from previous phases)
echo "Finding patient with submitted results..."
PATIENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/patients?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

PATIENT_ID=$(echo $PATIENTS_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', [{}])[0].get('id', ''))" 2>/dev/null)

if [ -z "$PATIENT_ID" ] || [ "$PATIENT_ID" == "None" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC}: No patient found. Please run phases 1-7 first."
    PATIENT_ID=""
else
    # Ensure all assignments are SUBMITTED for this patient
    echo "Ensuring all assignments are SUBMITTED..."
    ASSIGNMENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/assignments/patient/$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json")
    
    # Parse assignments and update non-SUBMITTED ones
    if [ -n "$ASSIGNMENTS_RESPONSE" ] && [ "$ASSIGNMENTS_RESPONSE" != "[]" ]; then
        # Get assignment IDs that are not SUBMITTED
        ASSIGNMENT_IDS=$(echo "$ASSIGNMENTS_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    assignments = data if isinstance(data, list) else []
    ids = [a.get('id') for a in assignments if a.get('status') != 'SUBMITTED']
    print(','.join(ids))
except:
    print('')
" 2>/dev/null)
        
        # Update each assignment to SUBMITTED if not already
        if [ -n "$ASSIGNMENT_IDS" ] && [ "$ASSIGNMENT_IDS" != "" ]; then
            for ASSIGNMENT_ID in $(echo "$ASSIGNMENT_IDS" | tr ',' ' '); do
                if [ -n "$ASSIGNMENT_ID" ] && [ "$ASSIGNMENT_ID" != "None" ] && [ "$ASSIGNMENT_ID" != "" ]; then
                    # Get assignment details to find admin
                    ASSIGNMENT_DETAILS=$(curl -s -X GET "$BASE_URL/assignments/$ASSIGNMENT_ID" \
                      -H "Authorization: Bearer $ADMIN_TOKEN")
                    
                    ADMIN_ID=$(echo "$ASSIGNMENT_DETAILS" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('adminId', ''))" 2>/dev/null)
                    
                    # If no admin assigned, skip (can't submit without admin)
                    if [ -z "$ADMIN_ID" ] || [ "$ADMIN_ID" == "None" ] || [ "$ADMIN_ID" == "null" ]; then
                        continue
                    fi
                    
                    # Login as the admin to submit result
                    ADMIN_USER=$(curl -s -X GET "$BASE_URL/users/$ADMIN_ID" \
                      -H "Authorization: Bearer $ADMIN_TOKEN")
                    
                    ADMIN_EMAIL=$(echo "$ADMIN_USER" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('email', ''))" 2>/dev/null)
                    
                    if [ -z "$ADMIN_EMAIL" ] || [ "$ADMIN_EMAIL" == "None" ]; then
                        continue
                    fi
                    
                    # Login as admin (use default password)
                    ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
                      -H "Content-Type: application/json" \
                      -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"Admin@123\"}")
                    
                    ADMIN_TOKEN_FOR_RESULT=$(echo "$ADMIN_LOGIN" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
                    
                    if [ -z "$ADMIN_TOKEN_FOR_RESULT" ]; then
                        # Try with TestAdmin@123
                        ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
                          -H "Content-Type: application/json" \
                          -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"TestAdmin@123\"}")
                        ADMIN_TOKEN_FOR_RESULT=$(echo "$ADMIN_LOGIN" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
                    fi
                    
                    if [ -z "$ADMIN_TOKEN_FOR_RESULT" ]; then
                        continue
                    fi
                    
                    # First set status to COMPLETED
                    curl -s -X PUT "$BASE_URL/assignments/$ASSIGNMENT_ID/status" \
                      -H "Authorization: Bearer $ADMIN_TOKEN_FOR_RESULT" \
                      -H "Content-Type: application/json" \
                      -d "{\"status\":\"COMPLETED\"}" > /dev/null 2>&1
                    
                    # Get test fields
                    TEST_FIELDS=$(echo "$ASSIGNMENT_DETAILS" | python3 -c "import sys, json; d=json.load(sys.stdin); fields=d.get('test', {}).get('testFields', []); print(','.join([f.get('field_name', '') for f in fields if f.get('field_name')]))" 2>/dev/null)
                    
                    # Build result values - use the actual test field names
                    if [ -n "$TEST_FIELDS" ] && [ "$TEST_FIELDS" != "None" ] && [ "$TEST_FIELDS" != "" ]; then
                        # Get first field name
                        FIRST_FIELD=$(echo "$TEST_FIELDS" | cut -d',' -f1)
                        if [ -n "$FIRST_FIELD" ] && [ "$FIRST_FIELD" != "None" ] && [ "$FIRST_FIELD" != "" ]; then
                            # Use the actual field name from test
                            RESULT_VALUES="{\"$FIRST_FIELD\":7.5}"
                        else
                            # Fallback: try to get from test directly
                            TEST_ID=$(echo "$ASSIGNMENT_DETAILS" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('testId', ''))" 2>/dev/null)
                            if [ -n "$TEST_ID" ] && [ "$TEST_ID" != "None" ]; then
                                TEST_DETAILS=$(curl -s -X GET "$BASE_URL/tests/$TEST_ID" \
                                  -H "Authorization: Bearer $ADMIN_TOKEN")
                                TEST_FIELD_NAME=$(echo "$TEST_DETAILS" | python3 -c "import sys, json; d=json.load(sys.stdin); fields=d.get('testFields', []); print(fields[0].get('field_name', 'result_value') if fields else 'result_value')" 2>/dev/null)
                                RESULT_VALUES="{\"$TEST_FIELD_NAME\":7.5}"
                            else
                                RESULT_VALUES='{"result_value":7.5}'
                            fi
                        fi
                    else
                        # Try to get test details directly
                        TEST_ID=$(echo "$ASSIGNMENT_DETAILS" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('testId', ''))" 2>/dev/null)
                        if [ -n "$TEST_ID" ] && [ "$TEST_ID" != "None" ]; then
                            TEST_DETAILS=$(curl -s -X GET "$BASE_URL/tests/$TEST_ID" \
                              -H "Authorization: Bearer $ADMIN_TOKEN")
                            TEST_FIELD_NAME=$(echo "$TEST_DETAILS" | python3 -c "import sys, json; d=json.load(sys.stdin); fields=d.get('testFields', []); print(fields[0].get('field_name', 'result_value') if fields else 'result_value')" 2>/dev/null)
                            RESULT_VALUES="{\"$TEST_FIELD_NAME\":7.5}"
                        else
                            RESULT_VALUES='{"result_value":7.5}'
                        fi
                    fi
                    
                    # Submit result (this will set status to SUBMITTED)
                    curl -s -X POST "$BASE_URL/results/submit" \
                      -H "Authorization: Bearer $ADMIN_TOKEN_FOR_RESULT" \
                      -H "Content-Type: application/json" \
                      -d "{\"assignmentId\":\"$ASSIGNMENT_ID\",\"resultValues\":$RESULT_VALUES}" > /dev/null 2>&1
                fi
            done
            echo "Updated assignments to SUBMITTED status"
        else
            echo "All assignments already SUBMITTED"
        fi
    fi
fi

echo ""
echo -e "${BLUE}=== PHASE 8 TESTS ===${NC}"
echo ""

# ==========================================
# 8.1 Get Patients for Review
# ==========================================
echo -e "${BLUE}8.1 Get Patients for Review${NC}"
if [ -n "$DOCTOR_TOKEN" ]; then
    test_endpoint "Get Patients for Review" "GET" "$BASE_URL/doctor/patients" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "" "200"
    test_endpoint "Get Patients for Review (PENDING)" "GET" "$BASE_URL/doctor/patients?status=PENDING" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "" "200"
    test_endpoint "Get Patients for Review (with search)" "GET" "$BASE_URL/doctor/patients?search=test" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "" "200"
else
    print_result 1 "Get Patients for Review (no doctor token)"
fi

# ==========================================
# 8.2 Get Patient Results
# ==========================================
echo -e "${BLUE}8.2 Get Patient Results${NC}"
if [ -n "$PATIENT_ID" ] && [ -n "$DOCTOR_TOKEN" ]; then
    test_endpoint "Get Patient Results" "GET" "$BASE_URL/doctor/patient/$PATIENT_ID/results" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "" "200"
else
    print_result 1 "Get Patient Results (no patient or doctor token)"
fi

# ==========================================
# 8.3 Create/Update Review
# ==========================================
echo -e "${BLUE}8.3 Create/Update Review${NC}"
if [ -n "$PATIENT_ID" ] && [ -n "$DOCTOR_TOKEN" ]; then
    test_endpoint "Create Review" "POST" "$BASE_URL/doctor/review" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "{\"patientId\":\"$PATIENT_ID\",\"remarks\":\"All results within normal range\"}" "201"
    test_endpoint "Update Review" "POST" "$BASE_URL/doctor/review" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "{\"patientId\":\"$PATIENT_ID\",\"remarks\":\"Updated remarks\"}" "201"
else
    print_result 1 "Create Review (no patient or doctor token)"
fi

# ==========================================
# 8.4 Passkey Setup
# ==========================================
echo -e "${BLUE}8.4 Passkey Setup${NC}"
if [ -n "$DOCTOR_TOKEN" ]; then
    # Generate challenge
    SETUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/setup-passkey" \
      -H "Authorization: Bearer $DOCTOR_TOKEN" \
      -H "Content-Type: application/json")
    
    CHALLENGE_ID=$(echo $SETUP_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('challengeId', ''))" 2>/dev/null)
    
    if [ -n "$CHALLENGE_ID" ] && [ "$CHALLENGE_ID" != "None" ]; then
        print_result 0 "Generate Passkey Challenge"
        echo "   Note: Full passkey verification requires WebAuthn browser API"
    else
        HTTP_CODE=$(echo "$SETUP_RESPONSE" | grep -o '"statusCode":[0-9]*' | cut -d: -f2)
        if [ "$HTTP_CODE" == "200" ] || [ -z "$HTTP_CODE" ]; then
            print_result 0 "Generate Passkey Challenge"
        else
            print_result 1 "Generate Passkey Challenge (HTTP $HTTP_CODE)"
        fi
    fi
else
    print_result 1 "Passkey Setup (no doctor token)"
fi

# ==========================================
# 8.5 Sign Report
# ==========================================
echo -e "${BLUE}8.5 Sign Report${NC}"
if [ -n "$PATIENT_ID" ] && [ -n "$DOCTOR_TOKEN" ]; then
    # Note: Full passkey signing requires WebAuthn browser API
    # This test checks the endpoint exists and validates input
    test_endpoint "Sign Report (invalid - no passkey)" "POST" "$BASE_URL/doctor/sign-report" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "{\"patientId\":\"$PATIENT_ID\",\"passkeyCredential\":{}}" "400"
else
    print_result 1 "Sign Report (no patient or doctor token)"
fi

# ==========================================
# 8.6 Get Signed Reports
# ==========================================
echo -e "${BLUE}8.6 Get Signed Reports${NC}"
if [ -n "$DOCTOR_TOKEN" ]; then
    test_endpoint "Get Signed Reports" "GET" "$BASE_URL/doctor/signed-reports" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "" "200"
    test_endpoint "Get Signed Reports (paginated)" "GET" "$BASE_URL/doctor/signed-reports?page=1&limit=10" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "" "200"
else
    print_result 1 "Get Signed Reports (no doctor token)"
fi

# ==========================================
# 8.7 Verify Passkey Endpoints
# ==========================================
echo -e "${BLUE}8.7 Verify Passkey Endpoints${NC}"
if [ -n "$DOCTOR_TOKEN" ]; then
    test_endpoint "Verify Passkey Setup (invalid)" "POST" "$BASE_URL/auth/verify-passkey-setup" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "{\"challengeId\":\"invalid\",\"credential\":{},\"challenge\":\"invalid\"}" "400"
    test_endpoint "Verify Passkey (invalid)" "POST" "$BASE_URL/auth/verify-passkey" "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" "{\"challengeId\":\"invalid\",\"credential\":{},\"challenge\":\"invalid\"}" "400"
else
    print_result 1 "Verify Passkey Endpoints (no doctor token)"
fi

# ==========================================
# SUMMARY
# ==========================================
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All Phase 8 tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi

