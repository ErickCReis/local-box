# MVP Scope

Deliver the smallest, reliable version of Local Box so a team can share files using one host machine and a simple web client.

## Objective
Enable a workspace with a single active host, basic workspace membership, and core file operations via a clean web UI.

## User Stories (MVP)
- As an owner, I create a workspace on my machine and receive a join link.
- As a teammate, I open the link, join the workspace, browse folders, and upload/download files.
- As an owner, I manage storage usage and can remove files.

## MVP Features

### Workspaces & Roles
- Create a workspace; the current machine becomes the host and the creator the owner.
- Join via a secure invite link; roles: owner and member.
- Owner can remove members. Members have read/upload rights; only the owner can delete.

### Host Setup
- Host runs a Bun server process on the owner machine.
- Convex self-hosted powers data sync and file storage.
- Cloud proxy exposes the host securely to the web.

### Auth & Access
- Minimal: link-based join with short-lived join codes.
- Session persists in the web client; sign-out supported.

### Files & Folders
- Create folders; upload/download files; rename/move; delete (owner only).
- Show file size and last modified time.
- Soft size limits per file and total storage (configurable).

### Sync & Replication
- Single host only in MVP; no replication.

### UI & Hosting
- Web client built with TanStack Start.
- Client can be hosted on Netlify; Host also serves an admin view locally.

## Sponsor Alignment (MVP)
- TanStack Start: Web UI and server routes for client and host admin.
- Netlify: Deploy the web-only client for members to access via the proxy URL.
- Convex (self-hosted): Realtime data sync and file storage on the host.
- Cloudflare: Secure proxy (e.g., Tunnel) to expose the host to clients.
- Autumn: Optional entitlement check to reveal Pro-only UI (not required to function).

## Non-Goals (Post-MVP)
- Per-folder/file ACLs beyond owner/member.
- Multi-host replication.
- External share links and public links.
- Version history and conflict resolution, full-text search.
- Offline desktop sync and mobile apps.

## Acceptance Criteria
- Owner creates a workspace and receives a working proxy URL.
- Member joins via invite and can browse, upload, and download files.
- File metadata is visible; storage limits enforced.
- Sessions work; owner can remove members and delete files.

## High-Level Architecture
Web Client (TanStack Start on Netlify) ↔ Proxy URL (Cloudflare) → Host Bun Server → Convex (self-hosted)

Data path: Client requests flow through the proxy into the Host, which uses Convex for metadata and file storage.


