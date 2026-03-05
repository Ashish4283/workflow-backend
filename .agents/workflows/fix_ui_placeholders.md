---
description: Fix UI placeholders and missing actions across Horizon project
---

# Workflow: Fix UI placeholders & missing actions

## 1️⃣ Update Routing to use the new Dashboard
- **File:** `src/App.jsx`
- **Change:** Replace `<Dashboard />` with `<UserDashboard />` in the `/dashboard` route.
- **Snippet:**
  ```jsx
  <Route path="/dashboard" element={<UserDashboard />} />
  ```
- **Test:** Run `npm run dev` and verify the polished dashboard appears at `/dashboard`.

## 2️⃣ Fix Recent Workflow navigation
- **File:** `src/pages/Dashboard/UserDashboard.jsx`
- **Change:** Update the onClick of recent workflow cards:
  ```jsx
  onClick={() => navigate(`/builder?id=${wf.id}`)}
  ```
- **Test:** Clicking a recent workflow should open that specific workflow in the builder.

## 3️⃣ Add row‑action dropdowns (Admin & Team)
- **Files:** `src/pages/Dashboard/AdminDashboard.jsx`, `src/pages/Dashboard/TeamHQ.jsx`
- **Change:** Replace the bare `<MoreVertical />` button with a dropdown menu:
  ```jsx
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon"><MoreVertical /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => editUser(u.id)}>Edit</DropdownMenuItem>
      <DropdownMenuItem onClick={() => deleteUser(u.id)}>Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  ```
- **API Calls:** `api/admin/users.php` (edit/delete) and `api/team/members.php` (edit/delete).
- **Test:** Verify the menu appears and actions succeed (toast on success/failure).

## 4️⃣ Implement Credential actions
- **File:** `src/pages/Dashboard/Credentials.jsx`
- **Changes:**
  - Replace “Add Credential” button with `<AddCredentialModal />`.
  - Hook modal submit to `api/credentials/create.php`.
  - Add similar modal for “Ingest New Secret”.
  - Add dropdown on credential cards (View / Delete) calling `api/credentials/*`.
  - Change “View Audit Log” button to navigate to `/audit`.
- **Test:** Create, ingest, view, and delete credentials; ensure API responses are handled.

## 5️⃣ Wire up Global Header actions
- **File:** `src/components/layout/MainLayout.jsx`
- **Changes:**
  - **Search bar:** Add `onChange={handleSearch}` that updates `searchQuery` state and calls `searchWorkflows(searchQuery)`.
  - **Support button:** Open `<SupportModal />`.
  - **Notifications bell:** Toggle `<NotificationsDropdown />` that fetches `api/notifications.php`.
- **Test:** Search returns results; support modal opens; notifications display.

## 6️⃣ Add WorkflowBuilder UI triggers
- **File:** `src/components/sections/WorkflowBuilder.jsx`
- **Changes:**
  - Add toolbar button `<input type="file" accept=".json" onChange={handleImport} style={{display: 'none'}} ref={importRef} />` with a visible `<Button>` that triggers `importRef.current.click()`.
  - Add “Save to Local Folder” button that calls `connectLocalFolder()`.
  - Replace the “+” tag prompt with a styled modal (`<TagModal />`) that returns the tag name.
- **Test:** Import/export workflows work; local folder save prompts the file‑system dialog.

## 7️⃣ Replace mocked Google Drive integration
- **File:** `src/components/sections/Inspector.jsx`
- **Changes:**
  - Implement real OAuth flow using `google-auth-library` (client ID from env).
  - Replace `MOCK_DRIVE_FILES` with a fetch to `api/google/drive/files.php`.
  - Update “Preview Data” to call `api/google/drive/preview.php` and render actual rows.
- **Test:** Sign‑in with Google, pick a file, preview data correctly.

## 8️⃣ Enable Template category filtering
- **File:** `src/pages/Dashboard/TemplatesPage.jsx`
- **Changes:**
  - Store selected category in state (`selectedCategory`).
  - Pass it to `<TemplateGallery filter={selectedCategory} />`.
  - Update `TemplateGallery` to filter its internal list based on the prop.
- **Test:** Clicking a category button updates the displayed templates.

## 9️⃣ Add Settings page actions
- **File:** `src/pages/Dashboard/Settings.jsx`
- **Changes:**
  - **Reset Master Password:** Open `<ResetPasswordModal />` → `api/settings/reset-password.php`.
  - **Manage Ledger:** Navigate to `/billing/ledger`.
  - **Protocol Upgrade:** Call `api/settings/upgrade.php` and show success toast.
- **Test:** Each button performs its real action and shows appropriate feedback.

## 🔟 Polish Footer & Landing page
- **Footer:** Update links to `/legal#privacy` and `/legal#terms`.
- **ContactSection:** Replace generic social URLs with actual profile URLs; ensure the resume link points to an existing page or create a simple `/resume.html` page.
- **Test:** Links open the correct destinations.

## 📦 Optional: Run Lint & Format
- After all changes, run:
  ```bash
  npm run lint -- --fix
  npm run format
  ```
- Verify there are no TypeScript/ESLint errors (the earlier lint error at line 15 should be resolved by the new import).

---

**How to use this workflow**
1. Open the file in your editor.
2. Follow the steps sequentially, committing after each major change.
3. Run the dev server frequently to verify UI behavior.
4. Adjust any step as needed for your specific project conventions.
