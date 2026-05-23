# 📸 Photo2Passport

<div align="center">

![Photo2Passport Banner](https://img.shields.io/badge/Photo2Passport-AI%20Powered-6366f1?style=for-the-badge&logo=camera&logoColor=white)

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-photo2passports.netlify.app-6366f1?style=for-the-badge)](https://photo2passports.netlify.app/)
[![GitHub](https://img.shields.io/badge/GitHub-amith6491--netizen-181717?style=for-the-badge&logo=github)](https://github.com/amith6491-netizen/photo2passport)
[![Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://photo2passports.netlify.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/baphoto2passportsdge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Claude AI](https://img.shields.io/badge/Claude%20AI-Anthropic-cc785c?style=for-the-badge)](https://anthropic.com/)

**A modern AI-powered web application that converts personal photos into professional passport-size, visa-size, and stamp-size photos instantly — right in your browser.**

[🌐 Live Demo](https://.netlify.app/) · [🐛 Report Bug](https://github.com/amith6491-netizen/photo2passport/issues) · [✨ Request Feature](https://github.com/amith6491-netizen/photo2passport/issues)

</div>

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Data Flow Diagram DFD](#data-flow-diagram-dfd)
- [Context Flow Diagram CFD](#context-flow-diagram-cfd)
- [Supported Formats](#supported-formats)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [License](#license)

---

## 🎯 About The Project

**Photo2Passport** is a fully client-side React application that leverages **Claude AI (Anthropic)** for intelligent face detection and the **HTML5 Canvas API** for high-fidelity image processing at 300 DPI.

Unlike traditional passport photo tools, Photo2Passport:
- Processes everything **in your browser** — no data is sent to any server
- Uses **AI to detect and center your face** automatically
- Generates photos that meet **international passport standards**
- Produces **print-ready A4 PDF layouts** at 300 DPI

---

## 🌐 Live Demo

👉 **[https://photo2passports.netlify.app/](https://photo2passports.netlify.app/)**

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🤖 AI Face Detection | Claude AI precisely locates and centres the face |
| 📐 Auto Crop & Align | Intelligent crop with proper headroom and shoulder space |
| 🎨 Background Control | White, sky blue, gray, cream, or any custom color |
| ☀️ Brightness & Contrast | Fine-tune photo quality before generating |
| 🖨️ A4 Print Layout | Arrange up to 40 copies on a single A4 sheet at 300 DPI |
| 📥 Multiple Downloads | Export as PNG, PDF, or ZIP bundle |
| 🌙 Dark / Light Mode | Full theme switching support |
| 📱 Mobile Responsive | Works perfectly on all screen sizes |
| 🔒 100% Private | All processing happens locally in the browser |
| ⚡ Instant Preview | Live brightness and contrast preview before processing |

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas%20API-E34F26?logo=html5)

### AI & Processing
![Claude AI](https://img.shields.io/badge/Claude%20AI-Anthropic-cc785c)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5.1-red)
![JSZip](https://img.shields.io/badge/JSZip-3.10.1-yellow)

### Deployment
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify)
![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github)

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Client["🌐 Browser (Client Side)"]
        UI[React UI Layer]
        STATE[State Management useState / useRef]
        CANVAS[HTML5 Canvas API Image Processing]
        PDF[jsPDF PDF Generation]
        ZIP[JSZip ZIP Bundling]
    end

    subgraph AI["🤖 AI Layer"]
        CLAUDE[Claude AI claude-sonnet-4-20250514 Face Detection]
    end

    subgraph Output["📥 Output"]
        PNG[PNG Download]
        PDFOUT[PDF A4 Sheet]
        ZIPOUT[ZIP Bundle]
    end

    USER([👤 User]) -->|Upload Photo| UI
    UI --> STATE
    STATE -->|Base64 Image| CLAUDE
    CLAUDE -->|Face Coordinates JSON| STATE
    STATE --> CANVAS
    CANVAS -->|Cropped Image| PDF
    CANVAS -->|Cropped Image| ZIP
    CANVAS -->|Cropped Image| PNG
    PDF --> PDFOUT
    ZIP --> ZIPOUT
    PNG --> Output
```

---

## 📊 Data Flow Diagram (DFD)

### Level 0 — Context Diagram

```mermaid
graph LR
    USER([👤 User]) -->|Portrait Photo| SYS[Photo2Passport System]
    SYS -->|Passport Photos PNG/PDF/ZIP| USER
    SYS <-->|Face Detection Request/Response| CLAUDE([🤖 Claude AI API])
```

---

### Level 1 — DFD

```mermaid
graph TD
    USER([👤 User])

    P1[1.0 Upload & Validate Image]
    P2[2.0 AI Face Detection]
    P3[3.0 Crop & Process Image]
    P4[4.0 Generate Photo Formats]
    P5[5.0 Export PNG / PDF / ZIP]

    DS1[(D1: Image Buffer)]
    DS2[(D2: Face Coordinates)]
    DS3[(D3: Processed Photos)]

    USER -->|JPG/PNG File| P1
    P1 -->|Validated Base64| DS1
    DS1 -->|Base64 Image| P2
    P2 <-->|API Request/Response| CLAUDE([Claude AI])
    P2 -->|faceX faceY faceW faceH| DS2
    DS2 -->|Face Data + Settings| P3
    DS1 -->|Raw Image| P3
    P3 -->|Cropped Image| P4
    P4 -->|4 Format Photos| DS3
    DS3 -->|Photos| P5
    P5 -->|PNG / PDF / ZIP| USER
```

---

### Level 2 — Image Processing DFD

```mermaid
graph TD
    IN[Input: Cropped Base64 Image]
    S1[Apply Brightness & Contrast Filter]
    S2[Draw Image on Canvas]
    S3[Pixel-level Background Replacement]
    S4[Scale to Target Resolution 300 DPI]
    S5[Encode as JPEG Base64]
    OUT[Output: Processed Photo]

    IN --> S1
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 --> S5
    S5 --> OUT
```

---

## 🔄 Context Flow Diagram (CFD)

```mermaid
flowchart TD
    START([🚀 User Opens App]) --> HOME[Home Page]
    HOME -->|Click Upload| UPLOAD[Upload & Editor Page]

    UPLOAD -->|Drag & Drop or Browse| VALIDATE{File Valid? JPG/PNG less than 20MB}
    VALIDATE -->|No| ERROR[Show Error Toast]
    ERROR --> UPLOAD

    VALIDATE -->|Yes| PREVIEW_IMG[Show Image Preview]
    PREVIEW_IMG --> SETTINGS[Configure Settings Format Background Brightness Contrast Copies]

    SETTINGS --> GENERATE[Click Generate]
    GENERATE --> AI_DETECT[Claude AI Face Detection]

    AI_DETECT -->|Face Found| CROP_TIGHT[Tight Face Crop With Headroom]
    AI_DETECT -->|No Face| CROP_CENTER[Center Crop Fallback]

    CROP_TIGHT --> PROCESS[Canvas Processing Background Replace Brightness Contrast Scale to 300 DPI]
    CROP_CENTER --> PROCESS

    PROCESS --> FORMATS[Generate 4 Formats Passport India/EU Passport US/Canada Stamp Size Visa Schengen]

    FORMATS --> PREVIEW_PAGE[Preview & Download Page]

    PREVIEW_PAGE --> DL_PNG[Download PNG]
    PREVIEW_PAGE --> DL_PDF[Download A4 PDF with N copies]
    PREVIEW_PAGE --> DL_ZIP[Download ZIP All Formats]
    PREVIEW_PAGE --> EDIT[Edit Again]

    EDIT --> UPLOAD

    DL_PNG --> END([Done])
    DL_PDF --> END
    DL_ZIP --> END
```

---

## 📐 Supported Photo Formats

| Format | Size | Resolution | Use Case |
|--------|------|------------|---------|
| 🇮🇳 Passport India / EU | 35 x 45 mm | 413 x 531 px at 300 DPI | Indian passport, EU documents |
| 🇺🇸 Passport US / Canada | 51 x 51 mm | 603 x 603 px at 300 DPI | US/Canada passport |
| 📮 Stamp Size | 25 x 30 mm | 295 x 354 px at 300 DPI | Stamp-size identity photos |
| 🇪🇺 Visa Schengen | 35 x 45 mm | 413 x 531 px at 300 DPI | Schengen visa applications |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/amith6491-netizen/photo2passport.git

# Navigate to project directory
cd photo2passport

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

```bash
# Build first
npm run build

# Drag and drop the dist/ folder to
# https://app.netlify.com/drop
```

---

## 📁 Project Structure

```
photo2passport/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   ├── App.css          # Global styles
│   └── index.css        # Base styles
├── dist/                # Production build output
├── index.html           # HTML entry point
├── vite.config.js       # Vite configuration
├── vercel.json          # Vercel deployment config
├── package.json         # Dependencies
└── README.md            # Project documentation
```

---

## ⚙️ How It Works

### Step 1 — Upload
User uploads a JPG or PNG portrait photo via drag-and-drop or file picker. The file is validated for type and size, then converted to Base64.

### Step 2 — AI Face Detection
The Base64 image is sent to **Claude AI (claude-sonnet-4-20250514)** which returns face coordinates as JSON:
```json
{
  "faceX": 0.5,
  "faceY": 0.35,
  "faceW": 0.38,
  "faceH": 0.40,
  "ok": true
}
```

### Step 3 — Canvas Crop & Process
The HTML5 Canvas API uses face coordinates to:
- Calculate the optimal crop zone with proper headroom
- Apply brightness and contrast filters
- Replace background pixels with the selected color
- Scale to exact 300 DPI pixel dimensions

### Step 4 — Generate Formats
All 4 photo formats are generated simultaneously on separate canvas elements.

### Step 5 — Export
- **PNG** — Direct canvas download
- **PDF** — jsPDF arranges N copies on an A4 canvas at 300 DPI
- **ZIP** — JSZip bundles all formats and A4 layouts

---

## 🔒 Privacy

> All image processing happens **entirely in your browser**.
> Your photos are **never uploaded to any server**.
> Only a temporary anonymised crop request is sent to the Claude AI API.
> No images are stored anywhere.

---

## 👨‍💻 Author

**Amith** — [@amith6491-netizen](https://github.com/amith6491-netizen)

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
Made with ❤️ by <a href="https://github.com/amith6491-netizen">amith6491-netizen</a>
<br/>
⭐ Star this repo if you found it helpful!
</div>
