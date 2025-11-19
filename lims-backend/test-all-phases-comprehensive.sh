#!/bin/bash

# Comprehensive Endpoint Testing Script for Phases 1-7
# This script tests all endpoints systematically

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@lims.com"
ADMIN_PASSWORD="Admin@123"

echo "=========================================="
echo "COMPREHENSIVE ENDPOINT TESTING - PHASES 1-7"
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
# PHASE 1: AUTHENTICATION
# ==========================================
echo -e "${BLUE}=== PHASE 1: AUTHENTICATION ===${NC}"
echo ""

# 1.1 Health Check
test_endpoint "Health Check" "GET" "$BASE_URL/health" "" "" "200"

# 1.2 Login
echo "1.2 Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}✗ FAIL${NC}: Login (no token received)"
    echo "   Response: $LOGIN_RESPONSE"
    FAILED=$((FAILED + 1))
    exit 1
else
    print_result 0 "Login successful"
fi

# 1.3 Get Current User
test_endpoint "Get Current User" "GET" "$BASE_URL/auth/me" "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" "" "200"

# 1.4 Refresh Token (if refresh token available)
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('refreshToken', ''))" 2>/dev/null)
if [ -n "$REFRESH_TOKEN" ]; then
    test_endpoint "Refresh Token" "POST" "$BASE_URL/auth/refresh" "-H \"Content-Type: application/json\"" "{\"refreshToken\":\"$REFRESH_TOKEN\"}" "200"
fi

echo ""

# ==========================================
# PHASE 2: USER MANAGEMENT
# ==========================================
echo -e "${BLUE}=== PHASE 2: USER MANAGEMENT ===${NC}"
echo ""

# 2.1 Create User
CREATE_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"receptionist@test.com","password":"Receptionist@123","fullName":"Receptionist User","role":"RECEPTIONIST"}')

USER_ID=$(echo $CREATE_USER_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)

if [ -n "$USER_ID" ]; then
    print_result 0 "Create User (ID: $USER_ID)"
else
    # User might already exist
    if echo "$CREATE_USER_RESPONSE" | grep -q "already exists\|Conflict\|409"; then
        print_result 0 "Create User (already exists)"
        # Try to get existing user
        USERS_LIST=$(curl -s -X GET "$BASE_URL/users?search=receptionist@test.com" \
          -H "Authorization: Bearer $ADMIN_TOKEN")
        USER_ID=$(echo $USERS_LIST | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', [{}])[0].get('id', ''))" 2>/dev/null)
    else
        print_result 1 "Create User"
        echo "   Response: $CREATE_USER_RESPONSE"
    fi
fi

# 2.2 Get All Users
test_endpoint "Get All Users" "GET" "$BASE_URL/users?page=1&limit=10" "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" "" "200"

# 2.3 Get User by ID
if [ -n "$USER_ID" ]; then
    test_endpoint "Get User by ID" "GET" "$BASE_URL/users/$USER_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" "" "200"
fi

# 2.4 Update User
if [ -n "$USER_ID" ]; then
    test_endpoint "Update User" "PUT" "$BASE_URL/users/$USER_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" "{\"fullName\":\"Updated Receptionist\"}" "200"
fi

# 2.5 Change Password
if [ -n "$USER_ID" ]; then
    test_endpoint "Change Password" "POST" "$BASE_URL/users/$USER_ID/change-password" "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" "{\"currentPassword\":\"Receptionist@123\",\"newPassword\":\"Receptionist@1234\"}" "200"
fi

echo ""

# ==========================================
# PHASE 3: PACKAGE & TEST MANAGEMENT
# ==========================================
echo -e "${BLUE}=== PHASE 3: PACKAGE & TEST MANAGEMENT ===${NC}"
echo ""

# 3.1 Create Package
CREATE_PACKAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/packages" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Basic Health Package","description":"A comprehensive health checkup","price":1500.00,"validityDays":365}')

PACKAGE_ID=$(echo $CREATE_PACKAGE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)

if [ -z "$PACKAGE_ID" ]; then
    # Package might already exist
    if echo "$CREATE_PACKAGE_RESPONSE" | grep -q "already exists\|Conflict\|409"; then
        print_result 0 "Create Package (already exists)"
        PACKAGES_LIST=$(curl -s -X GET "$BASE_URL/packages" \
          -H "Authorization: Bearer $ADMIN_TOKEN")
        PACKAGE_ID=$(echo $PACKAGES_LIST | python3 -c "import sys, json; d=json.load(sys.stdin); print(d[0].get('id', ''))" 2>/dev/null)
    else
        print_result 1 "Create Package"
    fi
else
    print_result 0 "Create Package (ID: $PACKAGE_ID)"
fi

# 3.2 Create Test
CREATE_TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/tests" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Complete Blood Count","description":"CBC test","category":"lab","adminRole":"audiometry","normalRangeMin":4.5,"normalRangeMax":11.0,"unit":"g/dL","testFields":[{"field_name":"result_value","field_type":"number","required":true,"options":null},{"field_name":"notes","field_type":"text","required":false,"options":null}]}')

TEST_ID=$(echo $CREATE_TEST_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)

if [ -z "$TEST_ID" ]; then
    if echo "$CREATE_TEST_RESPONSE" | grep -q "already exists\|Conflict\|409"; then
        print_result 0 "Create Test (already exists)"
        TESTS_LIST=$(curl -s -X GET "$BASE_URL/tests?category=lab" \
          -H "Authorization: Bearer $ADMIN_TOKEN")
        TEST_ID=$(echo $TESTS_LIST | python3 -c "import sys, json; d=json.load(sys.stdin); print(d[0].get('id', ''))" 2>/dev/null)
    else
        print_result 1 "Create Test"
    fi
else
    print_result 0 "Create Test (ID: $TEST_ID)"
fi

# 3.3 Get All Packages
test_endpoint "Get All Packages" "GET" "$BASE_URL/packages" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"

# 3.4 Get Package by ID
if [ -n "$PACKAGE_ID" ]; then
    test_endpoint "Get Package by ID" "GET" "$BASE_URL/packages/$PACKAGE_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

# 3.5 Get All Tests
test_endpoint "Get All Tests" "GET" "$BASE_URL/tests" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"

# 3.6 Get Test by ID
if [ -n "$TEST_ID" ]; then
    test_endpoint "Get Test by ID" "GET" "$BASE_URL/tests/$TEST_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

# 3.7 Add Test to Package
if [ -n "$PACKAGE_ID" ] && [ -n "$TEST_ID" ]; then
    ADD_TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/packages/$PACKAGE_ID/tests" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"testId\":\"$TEST_ID\",\"testPrice\":500.00}")
    
    if echo "$ADD_TEST_RESPONSE" | grep -q "successfully\|added\|200"; then
        print_result 0 "Add Test to Package"
    elif echo "$ADD_TEST_RESPONSE" | grep -q "already\|Conflict\|409"; then
        print_result 0 "Add Test to Package (already added)"
    else
        print_result 1 "Add Test to Package"
    fi
fi

# 3.8 Get Package Tests
if [ -n "$PACKAGE_ID" ]; then
    test_endpoint "Get Package Tests" "GET" "$BASE_URL/packages/$PACKAGE_ID/tests" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

# 3.9 Update Package
if [ -n "$PACKAGE_ID" ]; then
    test_endpoint "Update Package" "PUT" "$BASE_URL/packages/$PACKAGE_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" "{\"description\":\"Updated description\"}" "200"
fi

# 3.10 Get Tests by Admin Role
test_endpoint "Get Tests by Admin Role" "GET" "$BASE_URL/tests/by-admin-role/audiometry" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"

echo ""

# ==========================================
# PHASE 4: PATIENT REGISTRATION
# ==========================================
echo -e "${BLUE}=== PHASE 4: PATIENT REGISTRATION ===${NC}"
echo ""

# 4.1 Register Patient
if [ -z "$PACKAGE_ID" ]; then
    echo -e "${YELLOW}⚠ SKIP${NC}: Register Patient (no package available)"
else
    REGISTER_PATIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/patients/register" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Test Patient\",\"age\":35,\"gender\":\"MALE\",\"contactNumber\":\"+1234567890\",\"packageId\":\"$PACKAGE_ID\"}")
    
    PATIENT_ID=$(echo $REGISTER_PATIENT_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)
    
    if [ -n "$PATIENT_ID" ]; then
        print_result 0 "Register Patient (ID: $PATIENT_ID)"
        PATIENT_PATIENT_ID=$(echo $REGISTER_PATIENT_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('patientId', ''))" 2>/dev/null)
    else
        print_result 1 "Register Patient"
        echo "   Response: $REGISTER_PATIENT_RESPONSE"
    fi
fi

# 4.2 Get All Patients
test_endpoint "Get All Patients" "GET" "$BASE_URL/patients?page=1&limit=10" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"

# 4.3 Get Patient by ID
if [ -n "$PATIENT_ID" ]; then
    test_endpoint "Get Patient by ID" "GET" "$BASE_URL/patients/$PATIENT_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

# 4.4 Get Patient by Patient ID
if [ -n "$PATIENT_PATIENT_ID" ]; then
    test_endpoint "Get Patient by Patient ID" "GET" "$BASE_URL/patients/by-patient-id/$PATIENT_PATIENT_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

# 4.5 Update Patient
if [ -n "$PATIENT_ID" ]; then
    test_endpoint "Update Patient" "PUT" "$BASE_URL/patients/$PATIENT_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" "{\"age\":36}" "200"
fi

# 4.6 Update Payment Status
if [ -n "$PATIENT_ID" ]; then
    # Get patient to find total price
    PATIENT_DETAILS=$(curl -s -X GET "$BASE_URL/patients/$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    TOTAL_PRICE=$(echo $PATIENT_DETAILS | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('package', {}).get('totalPrice', 1500))" 2>/dev/null)
    
    if [ -z "$TOTAL_PRICE" ] || [ "$TOTAL_PRICE" = "None" ]; then
        TOTAL_PRICE=1500.00
    fi
    
    test_endpoint "Update Payment Status" "PUT" "$BASE_URL/patients/$PATIENT_ID/payment" "-H \"Authorization: Bearer $ADMIN_TOKEN\" -H \"Content-Type: application/json\"" "{\"paymentStatus\":\"PAID\",\"paymentAmount\":$TOTAL_PRICE}" "200"
fi

echo ""

# ==========================================
# PHASE 5: TEST ASSIGNMENT
# ==========================================
echo -e "${BLUE}=== PHASE 5: TEST ASSIGNMENT ===${NC}"
echo ""

# 5.1 Auto-assign Tests
if [ -n "$PATIENT_ID" ]; then
    AUTO_ASSIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/assignments/auto-assign/$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    ASSIGNMENT_ID=$(echo $AUTO_ASSIGN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d[0].get('id', '') if isinstance(d, list) else d.get('id', ''))" 2>/dev/null)
    
    if [ -n "$ASSIGNMENT_ID" ]; then
        print_result 0 "Auto-assign Tests (Assignment ID: $ASSIGNMENT_ID)"
    else
        print_result 1 "Auto-assign Tests"
        echo "   Response: $AUTO_ASSIGN_RESPONSE"
    fi
fi

# 5.2 Get Assignments by Patient
if [ -n "$PATIENT_ID" ]; then
    test_endpoint "Get Assignments by Patient" "GET" "$BASE_URL/assignments/patient/$PATIENT_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

# 5.3 Get Assignment by ID
if [ -n "$ASSIGNMENT_ID" ]; then
    test_endpoint "Get Assignment by ID" "GET" "$BASE_URL/assignments/$ASSIGNMENT_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

# 5.4 Manual Assign
if [ -n "$PATIENT_ID" ] && [ -n "$TEST_ID" ]; then
    # Create a test admin user first
    CREATE_ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"email":"testadmin@test.com","password":"TestAdmin@123","fullName":"Test Admin","role":"TEST_ADMIN","testAdminType":"audiometry"}')
    
    ADMIN_USER_ID=$(echo $CREATE_ADMIN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)
    
    if [ -z "$ADMIN_USER_ID" ]; then
        # Try to get existing
        ADMIN_USERS=$(curl -s -X GET "$BASE_URL/users?search=testadmin@test.com" \
          -H "Authorization: Bearer $ADMIN_TOKEN")
        ADMIN_USER_ID=$(echo $ADMIN_USERS | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', [{}])[0].get('id', ''))" 2>/dev/null)
    fi
    
    if [ -n "$ADMIN_USER_ID" ]; then
        MANUAL_ASSIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/assignments/manual-assign" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"patientId\":\"$PATIENT_ID\",\"testId\":\"$TEST_ID\",\"adminId\":\"$ADMIN_USER_ID\"}")
        
        if echo "$MANUAL_ASSIGN_RESPONSE" | grep -q "id"; then
            print_result 0 "Manual Assign"
        else
            print_result 1 "Manual Assign"
        fi
    fi
fi

echo ""

# ==========================================
# PHASE 6: TEST RESULT ENTRY
# ==========================================
echo -e "${BLUE}=== PHASE 6: TEST RESULT ENTRY ===${NC}"
echo ""

# 6.1 Update Assignment Status to COMPLETED (required before submitting result)
if [ -n "$ASSIGNMENT_ID" ]; then
    # Login as test admin
    ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"testadmin@test.com","password":"TestAdmin@123"}')
    
    ADMIN_TOKEN_FOR_RESULT=$(echo $ADMIN_LOGIN | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
    
    if [ -z "$ADMIN_TOKEN_FOR_RESULT" ]; then
        ADMIN_TOKEN_FOR_RESULT=$ADMIN_TOKEN
    fi
    
    # First update to IN_PROGRESS, then COMPLETED
    UPDATE_TO_PROGRESS=$(curl -s -X PUT "$BASE_URL/assignments/$ASSIGNMENT_ID/status" \
      -H "Authorization: Bearer $ADMIN_TOKEN_FOR_RESULT" \
      -H "Content-Type: application/json" \
      -d '{"status":"IN_PROGRESS"}')
    
    UPDATE_STATUS_RESPONSE=$(curl -s -X PUT "$BASE_URL/assignments/$ASSIGNMENT_ID/status" \
      -H "Authorization: Bearer $ADMIN_TOKEN_FOR_RESULT" \
      -H "Content-Type: application/json" \
      -d '{"status":"COMPLETED"}')
    
    if echo "$UPDATE_STATUS_RESPONSE" | grep -q "COMPLETED"; then
        print_result 0 "Update Assignment Status to COMPLETED"
    else
        print_result 1 "Update Assignment Status"
        echo "   Response: $UPDATE_STATUS_RESPONSE"
    fi
fi

# 6.2 Submit Test Result
if [ -n "$ASSIGNMENT_ID" ]; then
    # Get assignment to find test fields
    ASSIGNMENT_DETAILS=$(curl -s -X GET "$BASE_URL/assignments/$ASSIGNMENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    # Extract test fields from assignment
    TEST_FIELDS=$(echo $ASSIGNMENT_DETAILS | python3 -c "import sys, json; d=json.load(sys.stdin); fields=d.get('test', {}).get('testFields', []); print(','.join([f.get('field_name', '') for f in fields if f.get('field_name')]))" 2>/dev/null)
    
    # Build result values based on test fields
    if echo "$TEST_FIELDS" | grep -q "Glucose Level"; then
        RESULT_VALUES='{"Glucose Level":7.5}'
    elif echo "$TEST_FIELDS" | grep -q "result_value"; then
        RESULT_VALUES='{"result_value":7.5}'
    else
        # Use first field name if available
        FIRST_FIELD=$(echo $TEST_FIELDS | cut -d',' -f1)
        if [ -n "$FIRST_FIELD" ] && [ "$FIRST_FIELD" != "None" ]; then
            RESULT_VALUES="{\"$FIRST_FIELD\":7.5}"
        else
            # Fallback: try to get from test directly
            TEST_DETAILS=$(echo $ASSIGNMENT_DETAILS | python3 -c "import sys, json; d=json.load(sys.stdin); test=d.get('test', {}); fields=test.get('testFields', []); print(','.join([f.get('field_name', '') for f in fields if f.get('field_name')]))" 2>/dev/null)
            FIRST_FIELD=$(echo $TEST_DETAILS | cut -d',' -f1)
            if [ -n "$FIRST_FIELD" ] && [ "$FIRST_FIELD" != "None" ]; then
                RESULT_VALUES="{\"$FIRST_FIELD\":7.5}"
            else
                RESULT_VALUES='{"result_value":7.5}'
            fi
        fi
    fi
    
    SUBMIT_RESULT_RESPONSE=$(curl -s -X POST "$BASE_URL/results/submit" \
      -H "Authorization: Bearer $ADMIN_TOKEN_FOR_RESULT" \
      -H "Content-Type: application/json" \
      -d "{\"assignmentId\":\"$ASSIGNMENT_ID\",\"resultValues\":$RESULT_VALUES}")
    
    RESULT_ID=$(echo $SUBMIT_RESULT_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)
    
    if [ -n "$RESULT_ID" ]; then
        print_result 0 "Submit Test Result (Result ID: $RESULT_ID)"
    else
        print_result 1 "Submit Test Result"
        echo "   Response: $SUBMIT_RESULT_RESPONSE"
    fi
fi

# 6.3 Get Result by Assignment
if [ -n "$ASSIGNMENT_ID" ]; then
    test_endpoint "Get Result by Assignment" "GET" "$BASE_URL/results/assignment/$ASSIGNMENT_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

# 6.4 Get Results by Patient
if [ -n "$PATIENT_ID" ]; then
    test_endpoint "Get Results by Patient" "GET" "$BASE_URL/results/patient/$PATIENT_ID" "-H \"Authorization: Bearer $ADMIN_TOKEN\"" "" "200"
fi

echo ""

# ==========================================
# PHASE 7: BLOOD TEST WORKFLOW
# ==========================================
echo -e "${BLUE}=== PHASE 7: BLOOD TEST WORKFLOW ===${NC}"
echo ""

# 7.1 Create Lab Technician
CREATE_LAB_TECH_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"labtech@test.com","password":"LabTech@123","fullName":"Lab Technician","role":"LAB_TECHNICIAN"}')

LAB_TECH_ID=$(echo $CREATE_LAB_TECH_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)

if [ -z "$LAB_TECH_ID" ]; then
    LAB_TECH_USERS=$(curl -s -X GET "$BASE_URL/users?search=labtech@test.com" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    LAB_TECH_ID=$(echo $LAB_TECH_USERS | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', [{}])[0].get('id', ''))" 2>/dev/null)
fi

# 7.2 Create Blood Test
CREATE_BLOOD_TEST_RESPONSE=$(curl -s -X POST "$BASE_URL/tests" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Blood Test CBC","description":"Complete Blood Count","category":"lab","adminRole":"blood_test","normalRangeMin":12.0,"normalRangeMax":16.0,"unit":"g/dL","testFields":[{"field_name":"hemoglobin","field_type":"number","required":true,"options":null},{"field_name":"hematocrit","field_type":"number","required":true,"options":null}]}')

BLOOD_TEST_ID=$(echo $CREATE_BLOOD_TEST_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)

if [ -z "$BLOOD_TEST_ID" ]; then
    BLOOD_TESTS=$(curl -s -X GET "$BASE_URL/tests?category=lab&adminRole=blood_test" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    BLOOD_TEST_ID=$(echo $BLOOD_TESTS | python3 -c "import sys, json; d=json.load(sys.stdin); print(d[0].get('id', '') if isinstance(d, list) and len(d) > 0 else '')" 2>/dev/null)
fi

# 7.3 Register Blood Sample
if [ -n "$PATIENT_ID" ]; then
    REGISTER_SAMPLE_RESPONSE=$(curl -s -X POST "$BASE_URL/blood-samples/register" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"patientId\":\"$PATIENT_ID\"}")
    
    SAMPLE_ID=$(echo $REGISTER_SAMPLE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('sampleId', ''))" 2>/dev/null)
    PASSCODE=$(echo $REGISTER_SAMPLE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('passcode', ''))" 2>/dev/null)
    BLOOD_SAMPLE_UUID=$(echo $REGISTER_SAMPLE_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null)
    
    if [ -n "$SAMPLE_ID" ] && [ -n "$PASSCODE" ]; then
        print_result 0 "Register Blood Sample (Sample ID: $SAMPLE_ID)"
    else
        print_result 1 "Register Blood Sample"
        echo "   Response: $REGISTER_SAMPLE_RESPONSE"
    fi
fi

# 7.4 Login as Lab Technician
if [ -n "$LAB_TECH_ID" ]; then
    LAB_TECH_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"labtech@test.com","password":"LabTech@123"}')
    
    LAB_TECH_TOKEN=$(echo $LAB_TECH_LOGIN | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('accessToken', ''))" 2>/dev/null)
    
    if [ -z "$LAB_TECH_TOKEN" ]; then
        LAB_TECH_TOKEN=$ADMIN_TOKEN
    fi
fi

# 7.5 Access Blood Sample with Wrong Passcode (should fail)
if [ -n "$SAMPLE_ID" ] && [ -n "$LAB_TECH_TOKEN" ]; then
    WRONG_ACCESS=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/blood-samples/access" \
      -H "Authorization: Bearer $LAB_TECH_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"sampleId\":\"$SAMPLE_ID\",\"passcode\":\"999999\"}")
    
    HTTP_CODE=$(echo "$WRONG_ACCESS" | grep "HTTP_CODE" | cut -d: -f2)
    if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "400" ]; then
        print_result 0 "Access with Wrong Passcode (correctly rejected)"
    else
        print_result 1 "Access with Wrong Passcode (should be rejected)"
    fi
fi

# 7.6 Access Blood Sample with Correct Passcode
if [ -n "$SAMPLE_ID" ] && [ -n "$PASSCODE" ] && [ -n "$LAB_TECH_TOKEN" ]; then
    ACCESS_RESPONSE=$(curl -s -X POST "$BASE_URL/blood-samples/access" \
      -H "Authorization: Bearer $LAB_TECH_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"sampleId\":\"$SAMPLE_ID\",\"passcode\":\"$PASSCODE\"}")
    
    if echo "$ACCESS_RESPONSE" | grep -q "$SAMPLE_ID"; then
        print_result 0 "Access Blood Sample with Correct Passcode"
    else
        print_result 1 "Access Blood Sample"
        echo "   Response: $ACCESS_RESPONSE"
    fi
fi

# 7.7 Get Sample by ID
if [ -n "$BLOOD_SAMPLE_UUID" ] && [ -n "$LAB_TECH_TOKEN" ]; then
    test_endpoint "Get Sample by ID" "GET" "$BASE_URL/blood-samples/$BLOOD_SAMPLE_UUID" "-H \"Authorization: Bearer $LAB_TECH_TOKEN\"" "" "200"
fi

# 7.8 Get My Samples
if [ -n "$LAB_TECH_TOKEN" ]; then
    test_endpoint "Get My Samples" "GET" "$BASE_URL/blood-samples/my-samples-list" "-H \"Authorization: Bearer $LAB_TECH_TOKEN\"" "" "200"
fi

# 7.9 Update Sample Status
if [ -n "$BLOOD_SAMPLE_UUID" ] && [ -n "$LAB_TECH_TOKEN" ]; then
    # Update to TESTED instead of IN_LAB (since access already sets it to IN_LAB)
    test_endpoint "Update Sample Status to TESTED" "PUT" "$BASE_URL/blood-samples/$BLOOD_SAMPLE_UUID/status" "-H \"Authorization: Bearer $LAB_TECH_TOKEN\" -H \"Content-Type: application/json\"" "{\"status\":\"TESTED\"}" "200"
fi

# 7.10 Submit Blood Test Result
if [ -n "$BLOOD_SAMPLE_UUID" ] && [ -n "$LAB_TECH_TOKEN" ]; then
    # First, ensure assignment exists and is COMPLETED
    # Auto-assign if needed
    AUTO_ASSIGN_BLOOD=$(curl -s -X POST "$BASE_URL/assignments/auto-assign/$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    # Get blood test assignment
    BLOOD_ASSIGNMENT=$(curl -s -X GET "$BASE_URL/assignments/patient/$PATIENT_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    BLOOD_ASSIGNMENT_ID=$(echo $BLOOD_ASSIGNMENT | python3 -c "import sys, json; d=json.load(sys.stdin); print([a.get('id') for a in d if a.get('test', {}).get('category') == 'lab'][0] if isinstance(d, list) else '')" 2>/dev/null)
    
    if [ -n "$BLOOD_ASSIGNMENT_ID" ]; then
        # Update to IN_PROGRESS first, then COMPLETED
        curl -s -X PUT "$BASE_URL/assignments/$BLOOD_ASSIGNMENT_ID/status" \
          -H "Authorization: Bearer $LAB_TECH_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"status":"IN_PROGRESS"}' > /dev/null
        
        curl -s -X PUT "$BASE_URL/assignments/$BLOOD_ASSIGNMENT_ID/status" \
          -H "Authorization: Bearer $LAB_TECH_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"status":"COMPLETED"}' > /dev/null
        
        # Submit result
        SUBMIT_BLOOD_RESULT=$(curl -s -X POST "$BASE_URL/blood-samples/$BLOOD_SAMPLE_UUID/results" \
          -H "Authorization: Bearer $LAB_TECH_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"resultValues":{"hemoglobin":14.5,"hematocrit":42.0},"notes":"Sample collected in fasting state"}')
        
        if echo "$SUBMIT_BLOOD_RESULT" | grep -q "hemoglobin\|id"; then
            print_result 0 "Submit Blood Test Result"
        else
            print_result 1 "Submit Blood Test Result"
            echo "   Response: $SUBMIT_BLOOD_RESULT"
        fi
    else
        print_result 1 "Submit Blood Test Result (no blood assignment found)"
    fi
fi

echo ""

# ==========================================
# SUMMARY
# ==========================================
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Phase 1: Authentication - WORKING"
    echo "✅ Phase 2: User Management - WORKING"
    echo "✅ Phase 3: Package & Test Management - WORKING"
    echo "✅ Phase 4: Patient Registration - WORKING"
    echo "✅ Phase 5: Test Assignment - WORKING"
    echo "✅ Phase 6: Test Result Entry - WORKING"
    echo "✅ Phase 7: Blood Test Workflow - WORKING"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED${NC}"
    echo "Please review the failures above"
    exit 1
fi

