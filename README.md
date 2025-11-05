# Local Box

Easy, distributed, self-hosted Google Drive.

## What is it?
Local Box is a simple way for teams to share and organize files they fully control. It brings the ease of a cloud drive to your own machines, so your data stays private and close to you.

## How it works (at a glance)
- Create a workspace and invite your teammates.
- One machine acts as the host; others join through a secure link.
- Add more hosts for redundancy and choose which folders sync where.
- Access everything through a clean, lightweight web app.

## Components
- **Web UI/Dashboard (TanStack Start)**: The front-end app to create/join workspaces, browse files/folders, manage access, and trigger actions (uploads, moves, sharing). Connects to the backend for realtime updates.
- **Host Server (Bun)**: A lightweight service running on your machine or a small server. It watches local folders, syncs file changes to the backend, serves file content to clients through the proxy, and enforces replication policies.
- **Convex (self-hosted)**: Provides the realtime database, storage, and sync primitives. Stores file/folder metadata, ACLs, replication policies, and (optionally) file blobs.
- **Proxy Layer (Cloudflare)**: Securely exposes a host to the internet behind a shareable URL, handling TLS, revocation, and routing to the host’s endpoints.
- **Payments/Access (Autumn)**: Optional paid feature gating and entitlements for teams that need advanced capabilities.

## Key flows
1. **Workspace creation**
   - User creates a workspace in the Web UI.
   - Convex persists workspace, owner user, and default roles.
   - A secure invite link is generated for teammates and/or hosts.

2. **Host onboarding**
   - A machine runs the Host Server and uses the invite to register as a host.
   - The Host establishes a tunnel via the Proxy Layer and advertises reachable endpoints.
   - Admins assign replication policies to select which folders this host keeps locally.

3. **File sync**
   - Clients upload files via the Web UI. Files are chunked, hashed, and stored via Convex storage or streamed to a reachable Host.
   - Metadata is updated in Convex; subscribed clients and hosts receive realtime updates and reconcile.
   - Hosts pull down content they’re responsible for according to replication policies; clients fetch content from the nearest available source (host or storage) via signed URLs.

4. **Sharing and access control**
   - Per-folder/file ACLs determine who can view, edit, or share.
   - Share links can be created with scopes (read-only, time-limited, workspace-only) and revoked at any time.

5. **Redundancy and recovery**
   - Multiple hosts can pin the same folders for redundancy.
   - If a host goes offline, clients fall back to other hosts or (if configured) Convex storage copies.

## Security model (draft)
- **Identity**: Workspace-level auth; users authenticate to the Web UI and receive scoped tokens for API/file access.
- **Transport**: All external traffic is HTTPS via the proxy. Internal host traffic is authenticated and signed.
- **Access control**: ACLs enforced at the API layer; share links use signed, revocable tokens.
- **At-rest**: Storage backends can be encrypted at rest. Optional client-side encryption can be added per workspace for sensitive data (future).

## Replication policies (draft)
- **Pinned**: Host maintains a full copy of selected folders/files.
- **On-demand**: Host caches items recently accessed by its users and evicts with an LRU policy.
- **Exclude**: Host ignores selected folders entirely.

## Conflict resolution (draft)
- **Metadata**: Realtime, last-writer-wins for simple fields; operations are ordered by server timestamps.
- **Content**: New file versions are immutable; updates create a new version. Clients always fetch the latest version referenced by metadata.

## Capabilities (prototype scope)
- Realtime workspace/file metadata
- Folder/file CRUD, move/rename
- Upload/download with resumable chunks
- Share links with revocation
- Basic replication and redundancy across hosts

## Non-goals (prototype)
- End-to-end encrypted search/indexing
- Full CRDT-based collaborative editing
- Complex retention/legal hold

## Links
- Infra details: see `docs/infra.md`
- Features and scope: see `docs/features.md`, `docs/modes.md`, `docs/roadmap.md`, `docs/mvp.md`

## Built for the TanStack Start Hackathon
This project is built for the TanStack Start Hackathon. Learn more: `https://www.convex.dev/hackathons/tanstack`.

- **TanStack Start**: App framework for the web UI and server-side routes.
- **Netlify**: Hosting the web-only client experience.
- **Convex**: Realtime data sync and file storage.
- **Cloudflare**: Secure proxy to connect clients to hosts.
- **Autumn**: Payments and access for paid features.

## Who is it for?
Teams and small organizations that want a familiar file‑sharing experience without giving up control, privacy, or simplicity.

## Status
Hackathon prototype. We're organizing the idea and scope first; implementation details will follow.
