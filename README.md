# Contact Manager — LAMP Stack Project

A full-stack contact management web application built on the **LAMP stack** (Linux, Apache, MySQL, PHP). Authenticated users can perform full CRUD (Create, Read, Update, Delete) operations on their personal contacts through a browser-based UI backed by a PHP REST API.

---

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Components](#components)
- [Architecture](#architecture)
- [Team Roles](#team-roles)
- [Security](#security)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Getting Started](#getting-started)
- [Design Decision Log](#design-decision-log)
- [Submission Checklist](#submission-checklist)

---

## Project Description

This application allows a user to **register** for an account or **log in**, and once authenticated, manage their own list of personal contacts. It is built entirely with LAMP-stack technologies — no Python, no other backend frameworks.

Core user flow:
1. User registers or logs in.
2. User lands on a dashboard listing their contacts.
3. User can create, view, search, edit, and delete contacts.
4. All data changes flow through a documented API, not direct page-to-database logic.

---

## Features

- **Authentication** — user registration and login (session- or token-based).
- **CRUD on Contacts**
  - **C**reate a new contact
  - **R**ead / list / view contact details
  - **U**pdate an existing contact
  - **D**elete a contact (with confirmation dialog)
- **Search** — case-insensitive, partial-match search across contact records (e.g., searching `"Jo"` matches *John*, *Jones*, *Jobs*).
- **Minimum contact fields**: First Name, Last Name, Email, Phone.
- **Relational data model** — at least one **one-to-many** relationship in the schema (e.g., one user → many contacts).

---

## Components

| Layer | Technology | Notes |
|---|---|---|
| OS / Hosting | Linux | Remote server required — no localhost-only deployments |
| Web Server | Apache | Serves the front end and routes API requests |
| Database | MySQL | Stores users and contacts; includes ≥1 one-to-many relation |
| Backend | PHP | Implements the REST API consumed by the front end |
| Front End | HTML/CSS/JS (Bootstrap + jQuery recommended) | Consumes the API; avoid native `alert`/`dialog` boxes except for delete confirmations |
| API Testing | Bruno | Used to document and demo at least one endpoint |

---

## Architecture

```
┌────────────────┐        HTTPS/TLS        ┌──────────────────┐        SQL        ┌───────────────┐
│   Front End     │  ───────────────────▶  │   PHP REST API    │  ──────────────▶  │    MySQL DB    │
│ (HTML/JS/CSS)   │  ◀───────────────────  │  (Apache-hosted)   │  ◀──────────────  │  (Users/Contacts)│
└────────────────┘        JSON             └──────────────────┘                   └───────────────┘
```

- Front end communicates with the backend **exclusively through the API** — no direct DB access from the client.
- Passwords are **hashed and salted** before storage; nothing is ever stored in plain text.
- All traffic is served over **TLS**.

---

## Team Roles

| Role | Responsibilities |
|---|---|
| **Project Manager** | Coordinates work across roles, builds the project timeline, enables team communication — also takes a secondary development role rather than acting only as a coordinator. |
| **Database** | Designs the schema and produces the Entity Relationship Diagram (ERD) for the presentation. |
| **API Developer(s)** | Builds and tests backend endpoints, typically documented in SwaggerHub, so front-end devs know how to consume them. |
| **Front-End Developer(s)** | Builds the UI (Bootstrap/jQuery recommended) following the API documentation. |

> Everyone on the team generally receives the same grade — contribute your fair share. "Do What You Say You Will Do" (DWYSYWD).

---

## Security

- ✅ TLS enabled in production
- ✅ Passwords hashed **and salted** (e.g., `password_hash()` in PHP)
- ✅ No secrets committed to the repo (`.env` / config files excluded via `.gitignore`)
- ✅ Input validation/sanitization on all API endpoints to prevent SQL injection and XSS

---

## Deployment

- Must reside on a **remote server**, not a local machine.
- Acceptable hosts: GoDaddy, Heroku, DigitalOcean, AWS, or Azure. (Class demos are on **DigitalOcean**.)
- Update this section with the live URL and hosting details once deployed:

  - **Live URL:** _TBD_
  - **Host:** _TBD_

---

## API Documentation

- All endpoints must be documented and testable via **Bruno**.
- At least one endpoint must be demonstrated live via Bruno.
- Keep the collection current — update it whenever an endpoint changes.
- Link to Bruno collection / SwaggerHub docs: _TBD_

---

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd contact-manager

# Import the database schema
mysql -u <user> -p <database_name> < schema.sql

# Configure environment (DB credentials, secrets)
cp .env.example .env

# Point Apache's document root at /public (or equivalent)
# Then browse to the configured host/URL
```

_Update this section with real setup steps as the project takes shape (dependencies, config file locations, local dev instructions, etc.)._

---

## Design Decision Log

Use this template to record any significant design or architecture decision made during development (schema changes, auth approach, library choices, API contract changes, etc.). Add a new entry per decision — don't overwrite previous ones.

### Decision Record Template

```
### [DD-<number>] <Short title of the decision>

**Date:** YYYY-MM-DD
**Author(s):**
**Status:** Proposed | Accepted | Superseded (by DD-<number>)

**Context**
What problem or question prompted this decision? What constraints mattered
(project requirements, time, team skill, hosting limits, etc.)?

**Decision**
What did we decide to do?

**Alternatives Considered**
- Option A — why it was or wasn't chosen
- Option B — why it was or wasn't chosen

**Consequences**
What becomes easier or harder as a result? Any follow-up work created?

**Related Requirements**
Link to the project requirement(s) this touches (e.g., "one:many relation,"
"TLS/security," "search functionality").
```

#### Example Entry

```
### [DD-1] Use session-based authentication instead of JWT

**Date:** 2026-09-09
**Author(s):** Jane Doe
**Status:** Accepted

**Context**
We needed an auth approach simple enough to implement in PHP within the
project timeline, while still meeting the security requirement (hashed +
salted passwords, TLS).

**Decision**
Use native PHP sessions with `password_hash()`/`password_verify()` rather
than issuing JWTs.

**Alternatives Considered**
- JWT — more portable for future mobile clients, but adds complexity
  (token refresh, storage) we don't need for a single web front end.

**Consequences**
Simpler implementation and fewer moving parts, at the cost of being less
convenient if a mobile client is added later.

**Related Requirements**
Security (hashed/salted passwords, TLS).
```

---

## Submission Checklist

- [ ] User registration and login implemented
- [ ] Full CRUD on contacts
- [ ] Case-insensitive, partial-match search
- [ ] Minimum fields present: First Name, Last Name, Email, Phone
- [ ] At least one one:many relation in the DB schema (ERD included in slides)
- [ ] Front end ↔ backend communicate via API only
- [ ] At least one endpoint demonstrated via Bruno
- [ ] TLS enabled; passwords hashed and salted
- [ ] Deployed on a remote server (not localhost)
- [ ] Public GitHub repo kept current, link added to the project spreadsheet
- [ ] API documentation kept current
- [ ] Professional presentation slides prepared; all team members participate
