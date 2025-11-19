# Testing Guide - Phase 1 Frontend

## Application Status
- ✅ Frontend running on: http://localhost:3002
- ✅ Backend running on: http://localhost:3000

## Manual Testing Steps

### 1. Test Login Page
1. Navigate to http://localhost:3002
2. You should be redirected to `/login` automatically
3. Verify the login form is displayed with:
   - Email input field
   - Password input field
   - "Sign In" button

### 2. Test Form Validation
1. Try submitting empty form - should show validation errors
2. Try invalid email format - should show "Please provide a valid email address"
3. Try password less than 8 characters - should show "Password must be at least 8 characters long"

### 3. Test Successful Login
Use test credentials (if backend has seeded data):
- Email: `admin@lims.com`
- Password: `Admin@123`

Expected behavior:
- Form submits successfully
- Redirects to `/dashboard`
- Shows user information on dashboard
- Shows logout button in navbar

### 4. Test Protected Routes
1. While logged in, try accessing `/dashboard` directly
2. Logout and try accessing `/dashboard` - should redirect to `/login`
3. Clear localStorage and refresh - should redirect to `/login`

### 5. Test Token Refresh
1. Login successfully
2. Wait for access token to expire (15 minutes) OR manually expire it
3. Make an API call - should automatically refresh token
4. Verify you remain logged in

### 6. Test Error Handling
1. Try login with wrong credentials - should show error message
2. Stop backend server and try login - should show network error
3. Verify error messages are user-friendly

### 7. Test Responsive Design
1. Resize browser window
2. Test on mobile viewport (dev tools)
3. Verify all components are responsive

## Browser Console Checks
Open browser DevTools and check:
- No console errors
- Network requests show correct API calls
- Tokens stored in localStorage (`lims_access_token`, `lims_refresh_token`)

## Expected API Calls
When testing login, you should see:
1. `POST /auth/login` - Login request
2. `GET /auth/me` - Get current user (after login)

## Playwright MCP Testing
If Playwright MCP is configured, you can test:
- Navigation to login page
- Form filling and submission
- Assertions on page elements
- Authentication flow testing

Note: Playwright MCP browser connection may need to be configured separately.

