# Infra

## Components
- **Web UI/Dashboard**: Manage workspaces, files, access, and replication.
- **Host Server (Bun)**: Orchestrates local setup, runs the proxy, interfaces with Convex.
- **Convex (self-hosted)**: Database, file storage, realtime sync.
- **Proxy Layer**: Exposes a host via a shareable URL for clients.

## Data Sync & Storage (Convex)
- Backend defaults to local SQLite; can point to Postgres/MySQL for production.
- Typical ports: API `3210`, HTTP actions `3211`, Dashboard `6791`.
- Reference: Convex self-hosted guide
  - `https://raw.githubusercontent.com/get-convex/convex-backend/refs/heads/main/self-hosted/README.md`

## Proxy Layer
- Provides a secure URL for clients to reach a host.
- Should support HTTPS, auth, and revocation.
- Responsible for routing client requests to the host’s Convex/API endpoints.

## High-level Data Model
- **Workspace**: Group of users, hosts, folders/files, ACLs.
- **Host**: Node that runs Bun server + Convex backend; may replicate subsets of data.
- **User**: Member of one or more workspaces; has roles (owner/admin/member).
- **Folder/File**: Content entities with metadata, versioning (future), and replication policy.
- **Access Control**: Per-folder/file permissions targeting users within the workspace.
