# QrShareIt — Login-Free QR Document Transfer & Printing System

**QrShareIt** is a production-ready, secure web application designed for college computer labs and printing centers. It eliminates the privacy and security risks associated with students logging into WhatsApp Web, personal email accounts, or Google Drive on shared college PCs.

🌐 **Live Demo Website**: [https://qrshareit.vercel.app/](https://qrshareit.vercel.app/)  
🐙 **GitHub Repository**: [https://github.com/adiitya20/quickshare](https://github.com/adiitya20/quickshare)

---

## 🌟 Solution Overview

1. **Scan**: The college PC displays a unique, temporary QR code with an unguessable cryptographically secure token (`/upload/:token`).
2. **Upload**: The student scans the QR code with their phone's camera, opens the mobile upload portal, and selects their documents (PDF, DOCX, PPTX, JPG, PNG, WEBP, TXT).
3. **Print**: Files arrive in real time on the PC via WebSockets and 2-second background sync. The student previews and prints their files directly to the college printer.
4. **Done & Cleaned**: Upon session completion or timer expiry, all uploaded files are **permanently deleted**.

---

## 🔒 Privacy & Security Features

- **No Accounts Required**: Zero login prompts, phone numbers, or passwords.
- **Cryptographic Signed Capability Tokens**: HMAC-SHA256 signed tokens for 100% stateless serverless verification on Vercel.
- **Chunked File Uploads**: Uploads files in 1.5 MB chunks to bypass Vercel payload limits.
- **Session Isolation**: Each PC session has a separate token hash. Files uploaded for PC 01 can never leak to PC 02.
- **Strict File Validation**:
  - Whitelisted formats: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.txt`.
  - Blocked dangerous formats: `.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.js`, `.vbs`, `.msi`.
  - Maximum 20 MB per file, 100 MB / 20 files per session limit.
  - Path traversal & filename sanitization.
- **Automated Background Cleanup**: Periodic background process purges files and session records upon timer expiry.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Install Dependencies
Run the install command in the root directory, server, and client:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment Variables
Create a `.env` file inside the `server/` directory (a `.env.example` is provided):

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
DATABASE_PATH=./qrshareit.db
UPLOAD_DIR=./uploads
SESSION_DURATION_MINUTES=10
MAX_FILE_SIZE_MB=20
MAX_SESSION_FILES=20
MAX_SESSION_TOTAL_SIZE_MB=100
CLEANUP_INTERVAL_SECONDS=30
```

### 3. Run Development Servers
From the root directory, start both client and server concurrently:

```bash
npm run dev
```

- **Frontend PC Interface**: `http://localhost:5173/pc`
- **Frontend Home Page**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/health`

---

## 🧪 Running Automated Tests

Run the backend integration test suite verifying session security, file upload validation, executable blocking, and auto-cleanup:

```bash
npm run test --prefix server
```

---

## 🏗️ Architecture & Data Flow

```text
┌────────────────┐             ┌────────────────┐             ┌────────────────┐
│   College PC   │             │ QrShareIt Node │             │ Student Phone  │
│ (Browser /pc)  │             │ Server & DB    │             │(Mobile /upload)│
└───────┬────────┘             └───────┬────────┘             └───────┬────────┘
        │                              │                              │
        │ 1. POST /api/sessions        │                              │
        ├─────────────────────────────►│                              │
        │ 2. Returns Signed Token & QR │                              │
        │◄─────────────────────────────┤                              │
        │                              │                              │
        │ 3. Joins Socket Room / Polls │                              │
        ├─────────────────────────────►│                              │
        │                              │                              │
        │                              │ 4. Scans QR & Opens Page     │
        │                              │◄─────────────────────────────┤
        │                              │                              │
        │ 5. Socket: phone_connected   │                              │
        │◄─────────────────────────────┤                              │
        │                              │                              │
        │                              │ 6. POST /upload/:token/files │
        │                              │◄─────────────────────────────┤
        │                              │    (1.5MB Chunks + Security) │
        │                              │                              │
        │ 7. Real-Time File Sync       │                              │
        │◄─────────────────────────────┤                              │
        │                              │                              │
        │ 8. Preview & Print File      │                              │
        │                              │                              │
        │ 9. End Session / Auto Expiry │                              │
        │    (Purges Files Permanently)│                              │
        └──────────────────────────────┴──────────────────────────────┘
```

---

## 📄 License
MIT License. Built for colleges, computer labs, and public printing centers.
