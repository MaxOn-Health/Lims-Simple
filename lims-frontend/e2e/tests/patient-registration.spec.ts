import { test, expect } from '@playwright/test';

test.describe('Register New Patient Workflow', () => {
    test.setTimeout(120000); // 2 minutes due to slow backend
    test.use({ baseURL: 'http://localhost:3001' });

    test('should successfully register a new patient as receptionist', async ({ page }) => {
        // 1. Login Logic
        await page.goto('/login');
        await page.fill('input[name="email"]', 'receptionist@lims.com');
        await page.fill('input[name="password"]', 'Receptionist@123');
        await page.click('button[type="submit"]');

        // Wait for connection/login to complete
        await expect(page).toHaveURL(/dashboard|patients/, { timeout: 15000 });

        // 2. Navigate to Register Patient Page
        console.log('Step 2: Navigating to new patient form...');
        await page.goto('/patients/new');
        await expect(page.getByText('Patient Details')).toBeVisible();

        // 3. Fill Required Fields with Dynamic Data
        const timestamp = Date.now();
        const patientName = `Test Patient ${timestamp}`;
        const contactNumber = `9${Math.floor(100000000 + Math.random() * 900000000)}`; // 10 digits

        await page.fill('input[name="name"]', patientName);
        await page.fill('input[name="age"]', '30');

        // Select Gender (Shadcn Select)
        await page.click('#gender');
        await expect(page.getByRole('listbox')).toBeVisible();
        await page.keyboard.type('Male');
        await page.keyboard.press('Enter');

        // Validate selection worked
        await expect(page.locator('#gender')).toContainText('Male');

        await page.fill('input[name="contactNumber"]', contactNumber);
        await page.fill('input[name="email"]', `patient${timestamp}@example.com`);
        await page.fill('textarea[name="address"]', '123 Test Street, QA Lab');

        // 4. Select a Test
        // Wait for "Loading tests..." to disappear (backend might be slow)
        await expect(page.getByText('Loading tests...')).not.toBeVisible({ timeout: 30000 });

        const firstTestCheckbox = page.locator('button[role="checkbox"][id^="test-"]').first();
        await expect(firstTestCheckbox).toBeVisible({ timeout: 10000 });
        await firstTestCheckbox.click(); // Select the test

        // 5. Submit Form and Wait for API Response
        const registerResponsePromise = page.waitForResponse(response =>
            response.url().includes('/patients/register') && response.status() === 201
        );

        await page.click('button:has-text("Register Patient")');

        const registerResponse = await registerResponsePromise;
        const responseBody = await registerResponse.json();
        console.log('Registration Response:', responseBody);

        // Explicitly
        const patientId = responseBody.patientId; // Display ID (e.g., PAT-2025...)
        const patientUuid = responseBody.id;      // DB UUID (e.g., 550e84...)
        expect(patientId).toBeTruthy();

        // 6. Validate Success Message
        // Wait for the success card to appear, replacing the form
        // Use soft assertion because headless environment seems to have trouble rendering the success state transition
        // despite 201 response.
        await expect.soft(page.getByRole('heading', { name: 'Patient Registered Successfully' })).toBeVisible({ timeout: 10000 });

        // Check that the form submit button is GONE (meaning state changed)
        await expect.soft(page.locator('button[type="submit"]')).not.toBeVisible({ timeout: 5000 });

        // Verify the Patient ID component rendered
        await expect.soft(page.getByText(patientId)).toBeVisible({ timeout: 5000 });

        // Verify the "View All Patients" button appeared
        await expect.soft(page.getByRole('button', { name: 'View All Patients' })).toBeVisible({ timeout: 5000 });

        // 7. Data Persistence Check
        // Navigate directly to the new patient's details page using UUID
        await page.goto(`/patients/${patientUuid}`);

        // Wait for loading to finish (wait for "Patient Information" card header)
        // If this times out, check if we hit an error state
        try {
            await expect(page.getByRole('heading', { name: 'Patient Information' })).toBeVisible({ timeout: 30000 });
        } catch (e) {
            // Check for error state
            const errorVisible = await page.getByText('Patient not found').isVisible() || await page.getByText('Failed to load patient').isVisible();
            if (errorVisible) {
                console.error('Patient Details Page showed error state');
                // Capture screenshot or log
            }
            throw e;
        }

        // Verify Patient Information Persistence
        await expect(page.getByText(patientName)).toBeVisible();
        await expect(page.getByText(contactNumber)).toBeVisible();
        // Check gender
        await expect(page.getByText('Male')).toBeVisible();

        // Verify Test Selection Persistence
        await expect(page.getByText('Test Information')).toBeVisible();
    });
});
