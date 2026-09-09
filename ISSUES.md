# Project Issues — Contact Manager (LAMP Stack)

Issues are grouped into three iterations, matching the project's build order. Each issue below is written so it can be copy-pasted directly into GitHub Issues (title, labels, description, tasks/acceptance criteria, suggested owner).

**Labels legend:** `database` `backend` `frontend` `security` `docs` `devops`

---

## Iteration 1 — Database Setup

### [DB-1] Design the Entity Relationship Diagram (ERD)
**Labels:** `database` `docs`
**Owner:** Database role

**Description**
Design the full data model for the app before any tables are created, including the required one-to-many relationship (e.g., one User → many Contacts).

**Tasks / Acceptance Criteria**
- [ ] Identify all entities (User, Contact, plus any others needed)
- [ ] Define fields and types for each entity (Contact minimum: First Name, Last Name, Email, Phone)
- [ ] Define primary keys and foreign keys
- [ ] Draw and export the ERD (image or diagram file) for inclusion in the presentation slides
- [ ] Get sign-off from API developers before implementation starts

---

### [DB-2] Create the `users` table and schema
**Labels:** `database` `security`
**Owner:** Database role

**Description**
Create the schema for storing user accounts, ensuring passwords are never stored in plain text.

**Tasks / Acceptance Criteria**
- [ ] Fields: id, name/username, email, password_hash, created_at
- [ ] Enforce unique constraint on email
- [ ] Column sized appropriately for a salted hash (e.g., PHP `password_hash()` output)
- [ ] Add indexes where needed (e.g., on email for login lookups)

---

### [DB-3] Create the `contacts` table and one:many relation
**Labels:** `database`
**Owner:** Database role

**Description**
Create the contacts table with a foreign key back to `users`, implementing the required one-to-many relationship.

**Tasks / Acceptance Criteria**
- [ ] Fields: id, user_id (FK), first_name, last_name, email, phone, created_at, updated_at
- [ ] Foreign key constraint: `contacts.user_id → users.id`
- [ ] `ON DELETE CASCADE` (or documented alternative) when a user is deleted
- [ ] Index on `user_id` for query performance

---

### [DB-4] Write schema migration / setup script
**Labels:** `database` `devops`
**Owner:** Database role

**Description**
Produce a single script the team can run to stand up the database from scratch.

**Tasks / Acceptance Criteria**
- [ ] `schema.sql` (or migration files) committed to the repo
- [ ] Script creates database, tables, constraints, and indexes
- [ ] README updated with import instructions
- [ ] Tested on a clean MySQL instance

---

### [DB-5] Create seed/test data
**Labels:** `database`
**Owner:** Database role

**Description**
Provide sample data so API and front-end developers can build and test against realistic records without waiting on the auth flow.

**Tasks / Acceptance Criteria**
- [ ] Seed script inserts 2–3 test users
- [ ] Seed script inserts 10+ sample contacts distributed across those users (covering search test cases like "Jo" → John/Jones/Jobs)
- [ ] Documented how to run/reset seed data

---

### [DB-6] Configure database connection credentials
**Labels:** `database` `security` `devops`
**Owner:** Database role + Backend

**Description**
Set up secure, environment-based DB configuration so credentials are never hardcoded or committed.

**Tasks / Acceptance Criteria**
- [ ] `.env.example` added with placeholder DB vars
- [ ] `.env` added to `.gitignore`
- [ ] PHP config reads credentials from environment
- [ ] Confirmed working connection from a local/dev PHP script

---

## Iteration 2 — Backend API Development

### [API-1] Set up PHP project structure and Apache routing
**Labels:** `backend` `devops`
**Owner:** API developer(s)

**Description**
Establish the base folder structure, routing approach, and Apache configuration for the REST API.

**Tasks / Acceptance Criteria**
- [ ] Project structure defined (e.g., `/api`, `/config`, `/models`)
- [ ] `.htaccess` / Apache vhost routes API requests correctly
- [ ] Base JSON response helper (consistent success/error format) implemented
- [ ] "Hello World" endpoint returns valid JSON to confirm setup

---

### [API-2] Build user registration endpoint
**Labels:** `backend` `security`
**Owner:** API developer(s)

**Description**
`POST /api/register` — creates a new user account.

**Tasks / Acceptance Criteria**
- [ ] Validates required fields and email format
- [ ] Rejects duplicate emails with a clear error
- [ ] Hashes and salts password with `password_hash()` before storing
- [ ] Returns appropriate status codes (201 on success, 400/409 on error)
- [ ] Documented in Bruno/SwaggerHub

---

### [API-3] Build login / authentication endpoint
**Labels:** `backend` `security`
**Owner:** API developer(s)

**Description**
`POST /api/login` — authenticates a user and starts a session (or issues a token, per the team's design decision).

**Tasks / Acceptance Criteria**
- [ ] Verifies credentials with `password_verify()`
- [ ] Starts a secure session / issues a token on success
- [ ] Returns 401 on invalid credentials without leaking whether the email exists
- [ ] Logout endpoint implemented (`POST /api/logout`)
- [ ] Documented in Bruno/SwaggerHub

---

### [API-4] Build auth middleware / route protection
**Labels:** `backend` `security`
**Owner:** API developer(s)

**Description**
Ensure all contact endpoints are only accessible to authenticated users, and that users can only access their own contacts.

**Tasks / Acceptance Criteria**
- [ ] Middleware/helper checks session or token on protected routes
- [ ] Returns 401 for unauthenticated requests
- [ ] All contact queries are scoped to the logged-in `user_id`
- [ ] Verified a user cannot read/edit/delete another user's contact by guessing an ID

---

### [API-5] Build "Create Contact" endpoint
**Labels:** `backend`
**Owner:** API developer(s)

**Description**
`POST /api/contacts` — creates a new contact for the authenticated user.

**Tasks / Acceptance Criteria**
- [ ] Validates required fields (First Name, Last Name, Email, Phone)
- [ ] Associates new contact with `user_id` from the session/token
- [ ] Returns created contact with 201 status
- [ ] Documented and tested in Bruno

---

### [API-6] Build "Read Contacts" endpoints (list + single)
**Labels:** `backend`
**Owner:** API developer(s)

**Description**
`GET /api/contacts` (list) and `GET /api/contacts/{id}` (single record).

**Tasks / Acceptance Criteria**
- [ ] List endpoint returns only the authenticated user's contacts
- [ ] Single-record endpoint returns 404 if not found or not owned by the user
- [ ] Response includes all contact fields
- [ ] Documented and tested in Bruno

---

### [API-7] Build "Update Contact" endpoint
**Labels:** `backend`
**Owner:** API developer(s)

**Description**
`PUT/PATCH /api/contacts/{id}` — updates an existing contact.

**Tasks / Acceptance Criteria**
- [ ] Validates input and ownership before updating
- [ ] Returns updated record on success
- [ ] Returns 404/403 for missing or non-owned contacts
- [ ] Documented and tested in Bruno

---

### [API-8] Build "Delete Contact" endpoint
**Labels:** `backend`
**Owner:** API developer(s)

**Description**
`DELETE /api/contacts/{id}` — deletes a contact.

**Tasks / Acceptance Criteria**
- [ ] Validates ownership before deleting
- [ ] Returns 204/200 on success, 404 if not found
- [ ] Documented and tested in Bruno
- [ ] **This is the endpoint demoed live via Bruno per project requirements** (or note which one is)

---

### [API-9] Build search endpoint
**Labels:** `backend`
**Owner:** API developer(s)

**Description**
`GET /api/contacts?search=<term>` — case-insensitive, partial-match search across contact fields.

**Tasks / Acceptance Criteria**
- [ ] Matches partial substrings (e.g., "Jo" matches John, Jones, Jobs)
- [ ] Case-insensitive matching (verify MySQL collation or use `LOWER()`)
- [ ] Searches across First Name and Last Name at minimum
- [ ] Scoped to the authenticated user's contacts only
- [ ] Documented and tested in Bruno

---

### [API-10] Enforce TLS and input sanitization
**Labels:** `backend` `security`
**Owner:** API developer(s)

**Description**
Harden the API against common vulnerabilities before deployment.

**Tasks / Acceptance Criteria**
- [ ] All endpoints reachable only over HTTPS in production
- [ ] Parameterized queries / prepared statements used everywhere (no raw SQL concatenation)
- [ ] Output escaping to prevent stored XSS via contact fields
- [ ] Basic rate limiting or input length limits considered

---

### [API-11] Document API in Bruno / SwaggerHub
**Labels:** `backend` `docs`
**Owner:** API developer(s)

**Description**
Keep a living collection of all endpoints so front-end developers always know current request/response shapes.

**Tasks / Acceptance Criteria**
- [ ] Every endpoint has a request example and expected response
- [ ] Auth requirements noted per endpoint
- [ ] Collection link added to README
- [ ] Updated whenever an endpoint changes

---

## Iteration 3 — Frontend Development

### [FE-1] Set up front-end project structure and Bootstrap
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Establish base HTML/CSS/JS structure and pull in Bootstrap/jQuery.

**Tasks / Acceptance Criteria**
- [ ] Base layout/template with nav bar and shared header/footer
- [ ] Bootstrap and jQuery included and confirmed working
- [ ] Consistent folder structure (`/css`, `/js`, `/pages` or similar)
- [ ] Responsive base layout verified on mobile and desktop widths

---

### [FE-2] Build registration page
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Form for new users to create an account, wired to the register API endpoint.

**Tasks / Acceptance Criteria**
- [ ] Form fields with client-side validation (required fields, email format)
- [ ] Calls `POST /api/register`
- [ ] Displays inline error messages (no native `alert()`)
- [ ] Redirects to login (or dashboard) on success

---

### [FE-3] Build login page
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Form for existing users to log in, wired to the login API endpoint.

**Tasks / Acceptance Criteria**
- [ ] Form calls `POST /api/login`
- [ ] Displays inline error on invalid credentials
- [ ] Stores session/token as appropriate on success
- [ ] Redirects to the contact dashboard on success

---

### [FE-4] Build contact list / dashboard view
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Main authenticated view listing the user's contacts, pulled from the API.

**Tasks / Acceptance Criteria**
- [ ] Calls `GET /api/contacts` on page load
- [ ] Renders contacts in a table or card list (First Name, Last Name, Email, Phone)
- [ ] Handles empty state (no contacts yet)
- [ ] Redirects unauthenticated users to login

---

### [FE-5] Build search bar
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Search input on the dashboard that filters the contact list via the search API.

**Tasks / Acceptance Criteria**
- [ ] Calls `GET /api/contacts?search=<term>` as the user types (debounced) or on submit
- [ ] Updates the list in place without a full page reload
- [ ] Clears back to full list when the search box is emptied
- [ ] Confirmed partial, case-insensitive matches work end-to-end (e.g., "jo")

---

### [FE-6] Build "Create Contact" form
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Form (page or modal) for adding a new contact.

**Tasks / Acceptance Criteria**
- [ ] Client-side validation on required fields
- [ ] Calls `POST /api/contacts`
- [ ] New contact appears in the list without a full page reload
- [ ] Inline success/error feedback (no native `alert()`)

---

### [FE-7] Build "Edit Contact" form
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Form (page or modal) for editing an existing contact, pre-populated with current values.

**Tasks / Acceptance Criteria**
- [ ] Pre-fills form via `GET /api/contacts/{id}`
- [ ] Calls `PUT/PATCH /api/contacts/{id}` on submit
- [ ] List view reflects changes immediately
- [ ] Inline success/error feedback

---

### [FE-8] Build "Delete Contact" flow with confirmation
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Delete action from the contact list, with a confirmation step before the API call fires.

**Tasks / Acceptance Criteria**
- [ ] Delete button triggers a confirmation dialog (this is the one allowed use of a confirm/dialog box)
- [ ] Calls `DELETE /api/contacts/{id}` only after confirmation
- [ ] Contact removed from the list immediately on success
- [ ] Error handling if delete fails

---

### [FE-9] Build logout flow and session handling
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Allow users to log out and ensure protected pages redirect unauthenticated visitors.

**Tasks / Acceptance Criteria**
- [ ] Logout button calls `POST /api/logout` (or clears token) and redirects to login
- [ ] Protected pages check auth state on load and redirect if not logged in
- [ ] Session/token expiration handled gracefully (redirect to login, not a broken page)

---

### [FE-10] Polish UI/UX and responsive styling
**Labels:** `frontend`
**Owner:** Front-end developer(s)

**Description**
Final visual pass across all pages before the demo/presentation.

**Tasks / Acceptance Criteria**
- [ ] Consistent styling/spacing across all pages
- [ ] Verified on at least one mobile viewport and one desktop viewport
- [ ] Loading states for API calls (spinner or disabled buttons)
- [ ] No native `alert()`/`dialog()` usage except the delete confirmation

---

### [FE-11] End-to-end smoke test against deployed API
**Labels:** `frontend` `devops`
**Owner:** Whole team

**Description**
Full walkthrough of the deployed app to catch integration issues before the presentation.

**Tasks / Acceptance Criteria**
- [ ] Register → login → create → search → edit → delete flow works end-to-end on the remote server
- [ ] Confirmed HTTPS/TLS is active on the deployed URL
- [ ] Confirmed at least one endpoint demo is ready in Bruno for the presentation
- [ ] README and API docs links verified and current
