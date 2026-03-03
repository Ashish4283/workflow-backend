# creative4AI

My first Live Project.

## Description

A brief description of what **creative4AI** is and what problem it solves. (e.g., "An AI-powered tool to generate creative assets...")

## Features

- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3
- [x] **VAPI Gemini AI BPO**: Voice AI integration using Google Gemini for BPO agent responses.
  - **Scenario Testing**: Switch between 'Sales' and 'Support' modes via Vapi metadata.
  - **CRM Connectivity**: Integrated Function Calling to look up data in Salesforce/DBs.

## Architecture

This project operates with a hybrid backend:
1.  **Frontend**: React (Vite).
2.  **Auth Backend**: PHP (Hosted on Hostinger) - Handles Login, Registration, and Dashboard.
3.  **AI/Builder Backend**: Python (Hosted on Render) - Handles Workflow logic and AI generation.
4.  **Database**: MySQL (Hosted on Hostinger) - Central data store.

## Development Roadmap

### Phase 3: Bug Fixes & UX
- [ ] **Builder Navigation**: Fix navigation flow within the builder interface.
- [ ] **History vs. Save**: Clarify mechanics between session history (undo/redo) and persistent saves.
- [ ] **Dashboard Syncing**: Fix data synchronization issues on the dashboard.
- [ ] **Graph Connector Links**: Correct rendering and logic for graph edge connections.

## Configuration & Connectivity

### 1. Database Access (Crucial for Render)
Since the Python backend runs on Render, it needs **Remote Access** to the Hostinger MySQL database.
1.  Log in to **Hostinger Dashboard** > **Databases** > **Remote MySQL**.
2.  Add the IP address of your Render service (or use `%` to allow any IP for testing).
3.  Click **Create**.

### 2. Environment Variables
   Create a `.env` file (or configure Environment Variables in Render) with the Hostinger details:
   ```env
   DB_HOST=sql.hostinger.com (or your specific Hostinger DB IP)
   DB_USER=u123456789_root
   DB_PASSWORD=your_secure_password
   DB_NAME=u123456789_creative4ai
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

## Installation
Instructions on how to install the project dependencies.

```bash
# Example
npm install
# or
pip install -r requirements.txt
```

## Usage

```bash
python main.py
```
