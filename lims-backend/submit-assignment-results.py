#!/usr/bin/env python3
import sys
import json
import subprocess

BASE_URL = "http://localhost:3000"

# Login as admin
login_resp = subprocess.check_output([
    'curl', '-s', '-X', 'POST', f'{BASE_URL}/auth/login',
    '-H', 'Content-Type: application/json',
    '-d', '{"email":"admin@lims.com","password":"Admin@123"}'
], text=True)
admin_token = json.loads(login_resp).get('accessToken')

if not admin_token:
    print("Failed to login as admin")
    sys.exit(1)

# Get patient
patients_resp = subprocess.check_output([
    'curl', '-s', '-X', 'GET', f'{BASE_URL}/patients?limit=1',
    '-H', f'Authorization: Bearer {admin_token}'
], text=True)
patient_id = json.loads(patients_resp).get('data', [{}])[0].get('id')

if not patient_id:
    print("No patient found")
    sys.exit(1)

# Get assignments
assignments_resp = subprocess.check_output([
    'curl', '-s', '-X', 'GET', f'{BASE_URL}/assignments/patient/{patient_id}',
    '-H', f'Authorization: Bearer {admin_token}'
], text=True)
assignments = json.loads(assignments_resp)

# Process each assignment
for assignment in assignments:
    aid = assignment.get('id')
    status = assignment.get('status')
    admin_id = assignment.get('adminId')
    
    if status == 'SUBMITTED':
        print(f"Assignment {aid} already SUBMITTED")
        continue
    
    if not admin_id:
        print(f"Assignment {aid} has no admin, skipping")
        continue
    
    # Get admin email
    admin_user_resp = subprocess.check_output([
        'curl', '-s', '-X', 'GET', f'{BASE_URL}/users/{admin_id}',
        '-H', f'Authorization: Bearer {admin_token}'
    ], text=True)
    admin_email = json.loads(admin_user_resp).get('email')
    
    if not admin_email:
        print(f"Cannot get admin email for {aid}")
        continue
    
    # Login as admin
    admin_token_for_result = None
    for pwd in ['TestAdmin@123', 'Admin@123', 'LabTech@123']:
        login_resp = subprocess.check_output([
            'curl', '-s', '-X', 'POST', f'{BASE_URL}/auth/login',
            '-H', 'Content-Type: application/json',
            '-d', f'{{"email":"{admin_email}","password":"{pwd}"}}'
        ], text=True)
        login_data = json.loads(login_resp)
        admin_token_for_result = login_data.get('accessToken')
        if admin_token_for_result:
            break
    
    if not admin_token_for_result:
        print(f"Cannot login as admin {admin_email} for assignment {aid}")
        continue
    
    # Get assignment details
    assignment_details_resp = subprocess.check_output([
        'curl', '-s', '-X', 'GET', f'{BASE_URL}/assignments/{aid}',
        '-H', f'Authorization: Bearer {admin_token}'
    ], text=True)
    assignment_details = json.loads(assignment_details_resp)
    
    # Get test fields
    test_fields = assignment_details.get('test', {}).get('testFields', [])
    if test_fields and len(test_fields) > 0:
        first_field = test_fields[0].get('field_name', 'result_value')
        result_values = {first_field: 7.5}
    else:
        result_values = {"result_value": 7.5}
    
    # Ensure status is COMPLETED
    if status != 'COMPLETED':
        subprocess.check_output([
            'curl', '-s', '-X', 'PUT', f'{BASE_URL}/assignments/{aid}/status',
            '-H', f'Authorization: Bearer {admin_token_for_result}',
            '-H', 'Content-Type: application/json',
            '-d', '{"status":"COMPLETED"}'
        ], text=True)
    
    # Submit result
    result_resp = subprocess.check_output([
        'curl', '-s', '-X', 'POST', f'{BASE_URL}/results/submit',
        '-H', f'Authorization: Bearer {admin_token_for_result}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({"assignmentId": aid, "resultValues": result_values})
    ], text=True)
    
    result_data = json.loads(result_resp)
    if 'error' in result_resp.lower() or 'statusCode' in result_data:
        print(f"✗ Failed to submit result for {aid}: {result_resp[:200]}")
    else:
        print(f"✓ Submitted result for assignment {aid}")






