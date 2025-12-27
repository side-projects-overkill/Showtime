# Showtime

**Stream your media from any remote storage with rich metadata and a stunning interface.**

A modern, self-hosted web application for streaming movies and TV shows from WebDAV, FTP, and SMB drives with automatic TMDB metadata integration.

![Home Page](/.screenshots/home_page.png)

## Features

- 🌐 **Multiple Storage Types**: Connect to WebDAV, FTP, and SMB/CIFS drives
- 🎬 **Rich Metadata**: Automatic metadata fetching from TMDB for movies and TV shows
- 📱 **Modern Streaming**: Smooth playback with Video.js and responsive design
- 🎨 **Beautiful UI**: Dark mode with glassmorphism effects and smooth animations
- 🔒 **Secure**: Encrypted credential storage for your connections

## Screenshots

### Home Page
Beautiful landing page with hero section and feature showcase.

![Home Page](/.screenshots/home_page.png)

### Settings & Storage Management
Easy-to-use interface for adding WebDAV, FTP, and SMB connections.

![Settings Page](/.screenshots/settings_page.png)

### Browse Media
Navigate your storage and select media files to stream.

![Browse Page](/.screenshots/browse_page.png)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system
- TMDB API key (get one at [TMDB](https://www.themoviedb.org/settings/api))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your TMDB API key to the `.env` file:
   ```
   TMDB_API_KEY=your_api_key_here
   ```

### Running the Application

Start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Add Storage Connection**: Go to Settings and add your WebDAV, FTP, or SMB connection
2. **Browse Files**: Navigate to the Browse page and select your storage
3. **Play Media**: Click on any video file to start streaming
4. **View Metadata**: The app will automatically search TMDB for metadata

## Supported Video Formats

- MP4
- MKV
- AVI
- MOV
- WebM
- M4V
- MPG/MPEG

## Future Enhancements

- Jellyfin integration
- Plex integration
- Subtitle support
- Playback queue
- Watch history
- Electron app packaging

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Video Player**: Video.js
- **Package Manager**: Bun

## License

MIT
