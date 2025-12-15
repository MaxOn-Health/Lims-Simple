import { test, expect } from '@playwright/test';

test.describe('Technician Result Entry Workflow', () => {
    test.setTimeout(120000); // 2 minutes for slow backend
    test.use({ baseURL: 'http://localhost:3001' });

    test('should allow X-Ray technician to start assignment and submit results', async ({ page }) => {
        // --- PART 1: SETUP (Receptionist) ---
        console.log('Step 1: Registering new patient with X-Ray test...');

        await page.goto('/login');
        await page.fill('input[name="email"]', 'receptionist@lims.com');
        await page.fill('input[name="password"]', 'Receptionist@123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/dashboard|patients/, { timeout: 15000 });

        await page.goto('/patients/new');

        const timestamp = Date.now();
        const patientName = `XRay Patient ${timestamp}`;
        await page.fill('input[name="name"]', patientName);
        await page.fill('input[name="age"]', '45');

        // Select Gender (Robust)
        await page.click('#gender');
        await expect(page.getByRole('listbox')).toBeVisible();
        await page.keyboard.type('Male');
        await page.keyboard.press('Enter');
        await expect(page.locator('#gender')).toContainText('Male');

        await page.fill('input[name="contactNumber"]', `9${Math.floor(100000000 + Math.random() * 900000000)}`);
        await page.fill('input[name="email"]', `xray${timestamp}@example.com`);
        await page.fill('textarea[name="address"]', '456 XRay Blvd');

        // Select X-Ray Chest Test (Robust via Label)
        await expect(page.getByText('Loading tests...')).not.toBeVisible({ timeout: 10000 });

        // Use getByLabel to target the checkbox via its associated label
        const xrayCheckbox = page.getByLabel('X-Ray Chest');
        await expect(xrayCheckbox).toBeVisible({ timeout: 5000 });
        await xrayCheckbox.click(); // Click/Check
        // await expect(xrayCheckbox).toBeChecked(); // Shadcn Checkbox might not expose standard checked state easily?
        // Actually button[role="checkbox"][data-state="checked"] is the standard.
        await expect(page.locator('button[role="checkbox"]').filter({ hasText: 'X-Ray Chest' }).first().or(xrayCheckbox)).toHaveAttribute('aria-checked', 'true');

        console.log('Selected X-Ray Chest');
        // Let's verify the checkbox itself if possible, or the class
        // Finding the checkbox input associated with the label
        // The structure is specific, but let's assume if no validation error, it works.
        // Actually, let's just log the body text if registration fails to see if we are still on form.

        // Check if button is enabled
        const isBtnDisabled = await page.getByRole('button', { name: 'Register Patient' }).isDisabled();
        console.log('Register Button Disabled:', isBtnDisabled);

        // Submit Registration
        const registerResponsePromise = page.waitForResponse(response =>
            response.url().includes('/patients') && response.request().method() === 'POST',
            { timeout: 5000 }
        );

        await page.click('button:has-text("Register Patient")', { force: true });

        try {
            const response = await registerResponsePromise;
            console.log('Registration Response Status:', response.status());
            const text = await response.text();
            console.log('Registration Response Body:', text.substring(0, 500));
        } catch (e) {
            console.log('Registration request NOT made within 5s');
        }

        try {
            await expect(page.getByRole('heading', { name: 'Patient Registered Successfully' })).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('Registration failed. Checking for Toasts/Errors...');
            const toasts = await page.getByRole('alert').allTextContents();
            console.log('Toast Messages:', toasts);
            const validationErrors = await page.locator('.text-destructive').allTextContents();
            console.log('Validation Errors:', validationErrors);
            throw e;
        }

        // Logout
        // Assuming there's a user menu or direct logout, or just clear cookies/storage
        // Simpler: just clear cookies to force logout
        await page.context().clearCookies();
        await page.goto('/login');


        // --- PART 2: TECHNICIAN WORKFLOW ---
        console.log('Step 2: Login as Technician to process assignment...');

        await page.fill('input[name="email"]', 'xray@lims.com');
        await page.fill('input[name="password"]', 'TestAdmin@123');
        await page.click('button[type="submit"]');

        // Wait for dashboard or assignments page
        await expect(page).toHaveURL(/dashboard|assignments/, { timeout: 15000 });

        // 3. Navigate to My Assignments
        await page.goto('/assignments/my-assignments');
        await expect(page.getByRole('heading', { name: 'My Tasks' })).toBeVisible();

        // 4. Find the X-Ray Assignment for our Patient
        // Debug: Log all visible text to see if our patient is there
        console.log('Searching for patient:', patientName);
        try {
            await expect(page.locator('.border-border\\/50').filter({ hasText: patientName }).first()).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('Assignment not found. Dashboard content:');
            const mainText = await page.locator('main').innerText();
            console.log(mainText);
            throw e;
        }

        const assignmentCard = page.locator('.border-border\\/50').filter({ hasText: patientName }).first();

        // Check status
        console.log('Assignment Card Text:', await assignmentCard.innerText());
        // Check status
        // Use strict regex to avoid matching "Assigned Date" or "Assigned To" labels
        // Dashboard renders status as "Assigned", "In Progress", etc. matching the Shadcn Badge style often
        if (await assignmentCard.getByText(/^Assigned$/i).isVisible()) {
            console.log('Assignment is in ASSIGNED state. Clicking Start...');
            await assignmentCard.getByRole('button', { name: 'Start' }).click();

            // Handle Update Status Modal
            const modal = page.locator('div[role="dialog"]');
            await expect(modal).toBeVisible();
            await expect(modal).toContainText('Update Assignment Status');

            // Click Update Status (assumes In Progress is pre-selected)
            await modal.getByRole('button', { name: 'Update Status' }).click();
            await expect(modal).not.toBeVisible();

            await expect(assignmentCard.getByText(/^In Progress$/i)).toBeVisible({ timeout: 10000 });
        } else if (await assignmentCard.getByText(/^In Progress$/i).isVisible()) {
            console.log('Assignment is already IN_PROGRESS.');
        } else {
            console.log('Unknown status or status not compatible.');
            throw new Error('Assignment status unknown');
        }

        // 5. Enter Results
        console.log('Entering results...');
        await assignmentCard.getByRole('button', { name: 'Enter Results' }).click();

        // Verify navigation to result entry page
        await expect(page).toHaveURL(/\/results\/entry\/.+/);
        await expect(page.getByRole('heading', { name: 'Enter Test Results' })).toBeVisible();

        // Verify X-Ray specific fields
        // Note: ResultFieldRenderer assigns ids as 'field-[name]' but might not assign name attribute
        await expect(page.locator('#field-findings')).toBeVisible();
        await expect(page.locator('#field-impression')).toBeVisible();

        // 6. Fill Data
        await page.fill('#field-findings', 'Patient chest X-ray shows clear lungs. No consolidation or pneumothorax.');
        await page.fill('#field-impression', 'Normal study.');

        // 7. Submit
        const submitResponsePromise = page.waitForResponse(response =>
            response.url().includes('/results/submit') && response.status() === 201
        );

        await page.getByRole('button', { name: 'Submit Result' }).click();

        const submitResponse = await submitResponsePromise;
        expect(submitResponse.ok()).toBeTruthy();

        // 8. Verify Success Modal
        await expect(page.getByRole('heading', { name: 'Result Submitted!' })).toBeVisible();

        // 9. Return to Dashboard
        await page.getByRole('button', { name: 'Back to Dashboard' }).click();
        await expect(page).toHaveURL('/dashboard');

        // Verify assignment is removed or status changed (depending on filter)
        // If "My Tasks" shows only active, it should be gone
        await expect(page.locator('.border-border\\/50').filter({ hasText: patientName })).not.toBeVisible();
    });
});
