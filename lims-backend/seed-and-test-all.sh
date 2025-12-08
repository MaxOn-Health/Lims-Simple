#!/bin/bash

# Complete test script: Seed database then test all endpoints

cd "/Users/viswanthsai/Documents/Projects/my projects/Lims-Simple/lims-backend"

echo "=========================================="
echo "SEEDING DATABASE..."
echo "=========================================="
npm run seed:all

echo ""
echo "=========================================="
echo "RUNNING COMPREHENSIVE ENDPOINT TESTS..."
echo "=========================================="
./test-all-endpoints-comprehensive.sh






