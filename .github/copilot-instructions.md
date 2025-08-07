<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Weave OS - Browser-Based Operating System

This project is building a full browser-based operating system inspired by Ubuntu/GNOME using React, TypeScript, and Tailwind CSS.

## Project Guidelines

- **UI Framework**: Use React with TypeScript for all components
- **Styling**: Use ONLY Tailwind CSS utility classes - no custom CSS
- **Design Language**: Ubuntu/GNOME inspired design with:
  - Semi-transparent panels with backdrop blur
  - Clean, modern icons and typography
  - Consistent spacing and rounded corners
  - Dark theme with gradient backgrounds

## Code Style

- Use functional components with TypeScript interfaces
- Keep components modular and reusable
- Use descriptive prop types and component names
- Follow the existing folder structure:
  - `/src/components/` - UI components (TopBar, Dock, Desktop, Window)
  - `/src/apps/` - Individual applications (Terminal, Files, Media, Settings)
  - `/src/context/` - Global state management
  - `/src/hooks/` - Custom React hooks
  - `/src/filesystem/` - File system utilities
  - `/src/assets/` - Static assets

## Technical Stack

- React + TypeScript + Vite
- Tailwind CSS for styling
- Framer Motion for animations (to be added)
- Future additions: xterm.js, localForage, Monaco Editor

## Current Implementation Status

- ✅ Basic desktop layout with TopBar and Dock
- ✅ Ubuntu-inspired gradient background
- ✅ Semi-transparent UI elements with backdrop blur
- 🚧 Window management system (future)
- 🚧 File system implementation (future)
- 🚧 Individual applications (future)

When implementing new features, maintain the existing design patterns and ensure all styling uses Tailwind utility classes.
