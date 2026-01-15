<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="build/logo-banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="build/logo-banner-light.svg">
    <img src="build/logo-banner-light.svg" alt="Grimoire" width="400">
  </picture>
</p>

<p align="center">
  <strong>A battle map manager for tabletop RPGs</strong>
</p>

<p align="center">
  <a href="https://github.com/hipsterusername/grimoire/actions"><img src="https://github.com/hipsterusername/grimoire/actions/workflows/build.yml/badge.svg" alt="Build Status"></a>
  <a href="https://github.com/hipsterusername/grimoire/releases"><img src="https://img.shields.io/github/v/release/hipsterusername/grimoire" alt="Release"></a>
  <a href="https://github.com/hipsterusername/grimoire/blob/master/LICENSE"><img src="https://img.shields.io/github/license/hipsterusername/grimoire" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
</p>

---

Run tactical encounters without the overhead. Grimoire gives DMs a focused tool for managing battle maps, tokens, and initiative—nothing more, nothing less.

<p align="center">
<img width="1261" height="688" alt="image" src="https://github.com/user-attachments/assets/3e5f6867-9354-4e0e-9656-90fcad515cce" />
</p>

## Features

- **Map Management** — Import maps, auto-detect or manually configure grids
- **Token System** — Drag-and-drop tokens with health tracking and status effects
- **Fog of War** — Reveal areas as players explore
- **Initiative Tracker** — Manage turn order during combat
- **Presentation Mode** — Second window for player-facing display
- **Asset Library** — Organize and reuse maps, tokens, and templates

## Use Cases

**In-Person Sessions** — Run Grimoire on a TV or second monitor as a digital battle mat

**Hybrid Games** — Share your screen over Discord/Zoom while running encounters

**Encounter Prep** — Build and save encounter templates for quick deployment

## Install

Download the latest release for your platform:

| Platform | Download |
|----------|----------|
| Windows | [Grimoire-Setup.exe](https://github.com/hipsterusername/grimoire/releases/latest) |
| macOS | [Grimoire.dmg](https://github.com/hipsterusername/grimoire/releases/latest) |
| Linux | [Grimoire.AppImage](https://github.com/hipsterusername/grimoire/releases/latest) |

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Package for your platform
npm run package:linux
npm run package:mac
npm run package:win
```

## License

Apache 2.0
