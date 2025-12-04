# LIMS UI/UX Redesign Plan for Non-Technical Users

## Objective
To simplify the LIMS (Laboratory Information Management System) user interface, making it intuitive and easy to understand for non-technical test technicians and other staff. The goal is to reduce cognitive load, improve workflow efficiency, and provide a professional, premium look.

## Core Philosophy
- **Simplicity:** Hide complex options unless needed. Use plain language.
- **Clarity:** Use clear visual hierarchy, distinct actions, and helpful instruction text.
- **Guidance:** Guide the user through processes (e.g., step-by-step forms).
- **Feedback:** Provide immediate and clear feedback for actions (success, error, loading).

## Phased Approach

### Phase 1: Immediate Improvements (Current Focus)
**Goal:** Quick wins to improve usability of the most critical daily tasks.

1.  **Navigation (Sidebar):**
    -   Rename menu items to use simple, action-oriented language (e.g., "Test Orders" -> "Pending Tests").
    -   Ensure icons match the new labels.

2.  **Patient Registration:**
    -   Redesign the `PatientForm` to be less overwhelming.
    -   Use a cleaner layout (e.g., two-column layout for large screens).
    -   Simplify the "Package vs. Test" selection logic visually.
    -   Add clear helper text for non-technical users.

### Phase 2: Core Workflow Optimization
**Goal:** Streamline the end-to-end process of testing.

1.  **Pending Tests (Assignment Page):**
    -   **Simplify Header:** Focus on the "Manual Assign" action.
    -   **Filters:** Collapse complex filters by default; keep Search prominent.
    -   **Terminology:** Use "Test Order" instead of "Assignment".

2.  **Manual Assignment Form:**
    -   **Layout:** Use a 2-column layout similar to Patient Registration.
        -   **Left:** Patient Search & Selection.
        -   **Right:** Test & Technician Selection.
    -   **Visuals:** Highlight the selected patient clearly.

3.  **Technician Dashboard (My Tasks):**
    -   **Focus:** Prioritize the "To Do" list.
    -   **Stats:** Reduce to essential counters (Pending vs. Completed).
    -   **Cards:** Make the "Enter Result" action button large and distinct.

4.  **Result Entry:**
    -   **Layout:** Split view.
        -   **Left (Sticky):** Patient & Test Context (Reference).
        -   **Right:** Data Entry Form (Action).
    -   **Validation:** Clear, immediate feedback on out-of-range values.

### Phase 3: comprehensive UI Overhaul
**Goal:** Apply a consistent, premium design language across the entire application.

1.  **Design System:**
    -   Standardize colors, typography, and spacing.
    -   Create reusable UI components (Cards, Buttons, Inputs) with a "premium" feel (shadows, rounded corners, smooth transitions).

2.  **Dashboard:**
    -   Create role-specific dashboards (e.g., Technician Dashboard showing "My Tasks for Today").

3.  **Mobile Responsiveness:**
    -   Ensure all critical workflows are usable on tablets/mobile devices (common for technicians moving around).

## Detailed Plan for Phase 1 (Immediate Tasks)

### 1. Sidebar Updates
-   **Current:** Test Orders, My Assignments, Test Results, Register Sample, Access Sample.
-   **New:** Pending Tests, My Tasks, Completed Results, New Sample, Find Sample.

### 2. Patient Registration Redesign
-   **Layout:**
    -   Split into two distinct areas: "Who is the Patient?" (Personal Info) and "What do they need?" (Tests/Packages).
    -   Use a "Summary" sticky panel on the right (or bottom on mobile) to show costs and selected items in real-time.
-   **Interactions:**
    -   Make "Package" selection a clear card choice rather than a dropdown if possible, or a very prominent dropdown.
    -   Searchable test list with clear "Add" buttons.
-   **Visuals:**
    -   Use softer borders and shadows.
    -   Group related fields logically with clear section headers.

---
*This plan serves as a roadmap. We will start with Phase 1 immediately.*
