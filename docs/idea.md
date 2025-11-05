# Idea

Local Box is a local-first "Google Drive" that teams fully control. One machine acts as a host; teammates use a web app to browse, upload, and download files. Add more hosts later for redundancy.

## Infra (at a glance)
- Web application for the UI/dashboard (TanStack Start).
- Bun server on the host machine for setup and control.
- Convex self-hosted for realtime sync and file storage: `https://raw.githubusercontent.com/get-convex/convex-backend/refs/heads/main/self-hosted/README.md`
- Secure proxy to expose the host (e.g., Cloudflare Tunnel).

## Modes
- Host mode: run the server and Convex backend; generates a proxy URL for clients.
- Client mode: use the web app (e.g., on Netlify) and connect via the host's proxy URL.
- Later: multiple hosts with selectable replication.

## Features
- Create a workspace; the creator becomes the owner and the current machine is the host.
- Invite teammates to join via a secure link.
- Upload/download, organize folders, and manage storage.
- Post-MVP: granular permissions, external links, replication.

## What to read next
- MVP scope: `./mvp.md`
- Roadmap: `./roadmap.md`
- Paid features: `./paid.md`
- Features overview: `./features.md`
- Infra details: `./infra.md`
- Modes: `./modes.md`