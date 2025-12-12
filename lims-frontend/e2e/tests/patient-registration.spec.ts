import { test, expect } from '@playwright/test';

test.describe('Patient Registration & Order Creation Workflow', () => {

    test('should register a new patient and create initial lab order', async ({ page }) => {
        // 1. Login Sequence
        console.log('Step 1: Logging in as Receptionist...');
        await page.goto('/login');

        // Fill login form
        await page.fill('input[name="email"]', 'receptionist@lims.com'); // Replace with valid factory/seed credential if different
        await page.fill('input[name="password"]', 'password123'); // Replace with valid password

        // Click Sign In and wait for dashboard
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);
        console.log('Login successful.');

        // 2. Navigation to Patient Registration
        console.log('Step 2: Navigating to Patient Registration...');
        // We can navigate via UI or direct URL. Using direct URL for reliability in specific workflow test.
        await page.goto('/patients/new');
        await expect(page).toHaveURL('/patients/new');
        await expect(page.getByText('Patient Details')).toBeVisible();

        // 3. Fill Patient Registration Form
        console.log('Step 3: Filling Patient Form...');

        // Generate random patient data to avoid collisions
        const timestamp = Date.now();
        const patientName = `Test Patient ${timestamp}`;
        const patientPhone = `9${Math.floor(Math.random() * 1000000000)}`; // Random 10 digit starting with 9

        // Personal Information
        await page.fill('input[name="name"]', patientName);
        await page.fill('input[name="age"]', '25');

        // Select Gender (using Shadcn Select or native select depending on implementation)
        // Based on code: <SelectTrigger id="gender">...
        await page.click('button[id="gender"]');
        await page.click('div[role="option"]:has-text("Male")'); // Assuming Shadcn dropdown options

        // Select Date of Birth if needed, or other fields
        await page.fill('input[name="contactNumber"]', patientPhone);
        await page.fill('input[name="email"]', `patient${timestamp}@example.com`);
        await page.fill('textarea[name="address"]', '123 Test St, QA City');

        // 4. Test/Order Selection (The "Order Creation" part)
        console.log('Step 4: Selecting Tests (Creating Order)...');

        // Wait for tests to load (skeleton or loading state might exist)
        // Code showed: map over tests and render Checkbox
        // We'll select the first available test checkbox
        const firstTestCheckbox = page.locator('input[type="checkbox"][id^="test-"]').first();

        // Ensure at least one test is available
        await expect(firstTestCheckbox).toBeVisible({ timeout: 10000 });

        // Check if it's already checked (unlikely on new form) or check it
        if (!(await firstTestCheckbox.isChecked())) {
            await firstTestCheckbox.click();
        }

        // Get the test name to verify later
        const testId = await firstTestCheckbox.getAttribute('id');
        const labelSelector = `label[for="${testId}"]`;
        const testName = await page.textContent(labelSelector);
        console.log(`Selected Test: ${testName}`);

        // 5. Submit Form
        console.log('Step 5: Submitting Form...');

        // Setup API interception for verification
        const registerResponsePromise = page.waitForResponse(response =>
            response.url().includes('/patients/register') && response.status() === 201
        );

        await page.click('button[type="submit"]');

        // Wait for API response
        const registerResponse = await registerResponsePromise;
        const responseBody = await registerResponse.json();
        console.log('Registration API Response:', responseBody);

        expect(responseBody).toHaveProperty('patientId');
        const createdPatientId = responseBody.patientId;

        // 6. Validation (Post-Submission)
        console.log('Step 6: Verifying Creation...');

        // Verify Success UI (Card title "Patient Registered Successfully")
        await expect(page.getByText('Patient Registered Successfully')).toBeVisible();
        await expect(page.getByText(createdPatientId)).toBeVisible();

        // 7. Verify Data Persistence & Order Display
        console.log('Step 7: Verifying Patient Search & Details...');

        // Navigate to Patient Details
        await page.click('button:has-text("View All Patients")');
        await page.waitForURL('/patients');

        // Search for the patient
        const searchInput = page.locator('input[placeholder*="Search"]'); // Common pattern
        if (await searchInput.isVisible()) {
            await searchInput.fill(patientName);
            // Wait for table update - simplistic wait for row
            await expect(page.getByText(patientName)).toBeVisible();
        }

        // Navigate to details (clicking the patient name or 'View' button)
        await page.click(`text=${patientName}`);

        // Verify redirects to details
        await expect(page).toHaveURL(new RegExp(`/patients/.*`));

        // Verify Details Page Content
        await expect(page.getByText(patientName)).toBeVisible();

        // Verify Order/Test Information
        // PatientView.tsx shows "Test Information" or "Package Information" card
        // And lists "Selected Tests"
        await expect(page.getByText('Test Information')).toBeVisible();
        // Verify the test count or name
        await expect(page.getByText('1 test selected', { exact: false })).toBeVisible();

        console.log('Workflow verification complete!');
    });
});
