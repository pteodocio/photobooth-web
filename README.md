# 📸 Korean 4-Cut Photobooth Web & Cloud Synchronization Platform

> An authentic interactive Korean-style 4-Cut photobooth web application, synchronized 1:1 with the mobile Flutter application. Features in-browser webcam capture, 36 aesthetic Korean photobooth frames, balanced 4-Cut & 6-Cut geometries, real-time filters, sticker stamps, and a high-resolution 300 DPI strip compositor.

---

## ✨ Features & Mobile Parity

| Feature | Web Application (`photobooth-web`) | Mobile App (`photobooth`) |
| :--- | :--- | :--- |
| **Aesthetic Frames** | 36 Synchronized Themes (Pastel Dream, Y2K Cyber, Midnight Galaxy, Cherry Blossom, Retro Film, etc.) | 36 Synchronized Themes |
| **Geometries** | 4-Cut ($1040 \times 720$) & Balanced 6-Cut ($500 \times 950$, 2 cols $\times$ 3 rows, 0% dead space) | Identical Canvas Coordinates |
| **Viewfinder** | 4:3 Korean Viewfinder Mask, Corner Guides, Center Crosshair, 8s Countdown Ring | 4:3 Viewfinder Mask & 8s Countdown |
| **Clicker Remote** | "찰칵 Shoot Now" Floating Action Remote Button | Floating Action Button |
| **Filmstrip Customizer** | Reorderable Strip Tray, Filter Previews, Korean Stamp Stickers (`인생샷 👑`, `오늘의 우리 ✨`) | Identical Reorderable Tray & Stamps |
| **Dispenser Animation** | Mechanical Printer Slot Mouth & Slide-Down Strip Animation | Mechanical Slot Animation |
| **Live Motion Reel** | Animated Looping 4:3 Live Reel Player | Live Motion Reel Player |
| **Universal QR Retrieval** | Scannable `/strip?s=<sessionId>` route for mobile downloads & PIN search | Scannable White Quiet-Zone QR Badge |
| **Output Formats** | Single Strip ($1200 \times 3600$) & Twin Strip 1+1 ($2400 \times 3600$) with cut line | Single Strip & Twin Strip 1+1 |

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph "Core Domain & Config"
        Frames[36 Synced Korean Frames]
        Layouts[4-Cut & 6-Cut Geometries]
        Stamps[Korean Sticker Stamps]
    end

    subgraph "State & Services"
        BoothStore[Zustand Session Store]
        CameraService[Webcam MediaStream API]
        Compositor[HTML5 2D Canvas Compositor]
        SyncService[Cloud / LAN Session Sync]
    end

    subgraph "UI Subsystems"
        Landing[Showcase & APK Download]
        Viewfinder[4:3 Framing Mask & 8s Countdown]
        ContactSheet[Photo Reordering & Filter/Stamp Picker]
        ExportView[Mechanical Dispenser & Motion Reel]
        StripRoute[/strip Universal Viewer]
    end

    Frames --> Compositor
    Layouts --> Compositor
    Stamps --> Compositor
    CameraService --> Viewfinder
    BoothStore --> Viewfinder
    BoothStore --> ContactSheet
    BoothStore --> ExportView
    Compositor --> ExportView
    SyncService --> StripRoute
    Landing --> BoothStore
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- npm >= 10

### Installation
```bash
git clone git@github.com:pteodocio/photobooth-web.git
cd photobooth-web
npm install
```

### Running Locally
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

---

## 📱 Mobile App APK Download

The latest release APK (`photobooth-release.apk`) is bundled directly in the web app under `public/apk/` and downloadable from the landing page.

---

## 📄 License

MIT © 2026 Philip Teodocio
