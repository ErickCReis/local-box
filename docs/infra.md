# Infra

## Components
- **Web UI/Dashboard**: Manage workspaces, files, access, and replication.
- **Host Server (Bun)**: Orchestrates local setup, runs the proxy, interfaces with Convex.
- **Convex (self-hosted)**: Database, file storage, realtime sync.
- **Proxy Layer**: Exposes a host via a shareable URL for clients.

### Component responsibilities
#### Web UI/Dashboard
- Connects to Convex for realtime data (workspaces, files, ACLs, hosts, policies).
- Initiates uploads/downloads via signed URLs (to Host or storage).
- Manages invites, roles, share links, and replication assignments.

#### Host Server (Bun)
- Registers the device as a Host in a workspace using an invite.
- Runs a local file watcher to detect adds/edits/deletes and computes chunk hashes.
- Maintains an upload/download queue with backpressure and retry logic.
- Serves file content to clients through the Proxy Layer via signed, scoped requests.
- Enforces replication policies (pinned/on-demand/exclude) and manages a local cache.
- Reports health/metrics (capacity, status, folders pinned, last sync) to Convex.

#### Convex (self-hosted)
- Stores metadata for users, workspaces, hosts, folders, files, versions, ACLs, and policies.
- Provides realtime subscriptions to propagate changes to clients and hosts.
- Stores file content when configured (direct storage) or tracks pointers to host locations.
- Issues signed URLs/tokens to authorize short-lived content access.

#### Proxy Layer
- Establishes a secure public endpoint for a Host behind NAT/firewalls.
- Terminates TLS and routes requests to the Host’s HTTP endpoints.
- Supports URL rotation, revocation, rate limiting, and audit logging.

## Data Sync & Storage (Convex)
- Backend defaults to local SQLite; can point to Postgres/MySQL for production.
- Typical ports: API `3210`, HTTP actions `3211`, Dashboard `6791`.
- Reference: Convex self-hosted guide
  - `https://raw.githubusercontent.com/get-convex/convex-backend/refs/heads/main/self-hosted/README.md`

### Entities (draft)
- **Workspace**: `id`, `name`, `ownerId`, `createdAt`, `settings`.
- **User**: `id`, `email`, `name`, `workspaces[]`, `roles{workspaceId->role}`.
- **Host**: `id`, `workspaceId`, `label`, `status`, `tunnelUrl`, `capabilities`, `lastSeenAt`.
- **Folder**: `id`, `workspaceId`, `parentId`, `name`, `path`, `acl`.
- **File**: `id`, `workspaceId`, `folderId`, `name`, `size`, `contentType`, `currentVersionId`, `acl`.
- **FileVersion**: `id`, `fileId`, `chunks[]`, `hash`, `createdBy`, `createdAt`.
- **Chunk**: `id`, `hash`, `size`, `replicas{hostId->state}`, `storagePointer?`.
- **ReplicationPolicy**: `hostId`, `scope{folderIds}`, `mode(pinned|on-demand|exclude)`.
- **ShareLink**: `id`, `target{file|folder}`, `scope(read|write)`, `expiresAt?`, `revokedAt?`.

### File blobs and chunking (draft)
- Chunk size is configurable (e.g., 4–16 MB). Each chunk is content-addressed by hash.
- Uploads are resumable: the client probes which chunks already exist, then uploads the missing ones.
- Deduplication occurs across files/versions sharing identical chunks.
- Chunks can be persisted in Convex storage or served primarily by Hosts with storage used as a fallback/cache.

### Replication and caching
- Hosts in `pinned` mode ensure full local copies for assigned folders.
- `On-demand` hosts cache recently used data with eviction (LRU or size-based).
- Clients select the nearest available source (same-host > other-hosts > storage) using availability advertised through Convex.

### Conflict resolution
- Metadata changes are last-writer-wins on simple fields (server timestamp ordering).
- File content uses immutable versions; updates create new versions to avoid merge conflicts.

### Background jobs (draft)
- Garbage collection for unreferenced chunks after retention windows.
- Repair/re-replication tasks if a Host goes offline for pinned data.
- Periodic integrity checks (hash validation) for stored chunks.

## Proxy Layer
- Provides a secure URL for clients to reach a host.
- Should support HTTPS, auth, and revocation.
- Responsible for routing client requests to the host’s Convex/API endpoints.

### Behavior
- Each Host establishes a tunnel and publishes a signed, short-lived URL catalog (download/upload endpoints) via Convex.
- On revocation or rotation, the Host refreshes URLs and clients fall back to other sources.
- Rate limiting and request shaping protect Hosts from abuse and accidental overload.

## High-level Data Model
- **Workspace**: Group of users, hosts, folders/files, ACLs.
- **Host**: Node that runs Bun server + Convex backend; may replicate subsets of data.
- **User**: Member of one or more workspaces; has roles (owner/admin/member).
- **Folder/File**: Content entities with metadata, versioning (future), and replication policy.
- **Access Control**: Per-folder/file permissions targeting users within the workspace.

## Networking flows (draft)
1. **Browse/metadata**: Web UI connects to Convex; subscribes to folders/files/hosts; renders tree and statuses.
2. **Download**: Client requests a signed URL for a file version; prefers Host URL; falls back to other Hosts or storage if unavailable.
3. **Upload**: Client computes chunk hashes, checks existence, uploads missing chunks (to Host or storage), then commits a new `FileVersion` transactionally.
4. **Host sync**: Hosts subscribe to policy changes and new versions; they fetch required chunks and update replica states.

## Security (draft)
- **AuthN**: Users authenticate to the Web UI; tokens are scoped to a workspace.
- **AuthZ**: ACLs enforced at API boundaries; share links use signed tokens with scope and expiry.
- **Transport**: All external traffic is HTTPS; tunnels terminate TLS at the proxy.
- **Auditability**: Mutations record `actor`, `timestamp`, and essential context for review.
- **Key rotation**: Short-lived tokens and rotating keys for signed URLs.

## Operations
- **Deployment profiles**
  - Dev: single-node Convex (SQLite), one Host, local tunnel, minimal storage.
  - Small team: Convex on Postgres/MySQL, 1–3 Hosts, Cloudflare Tunnel, object storage optional.
- **Observability**: Basic logs, health/endpoints for Hosts, Convex dashboard.
- **Backups**: Database snapshots and storage bucket versioning (if used).
- **Limits**: Configurable max file size, rate limits, and workspace quotas.

## Environment & Ports
- Convex typical ports: API `3210`, HTTP actions `3211`, Dashboard `6791`.
- Host Server ports are configurable; the tunnel exposes only the necessary HTTP routes.

## Open questions (prototype)
- Choose default chunk size and retention windows.
- Decide default storage mode: host-first vs storage-first.
- Authentication provider(s) for the first iteration.
