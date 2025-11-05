# Features / System

## Workspaces
- Create a workspace; the current machine becomes a host and the creator is the **owner**.
- A workspace requires at least one active host to function.
- Invite users by email/link; owner/admins can manage membership.

## Roles & Access
- **Owner**: Admin privileges; can grant admin to others.
- **Admin**: Manage folders/files and access policies.
- **Member**: Access as granted.
- Access control per folder/file targeting users within the workspace.

## Files & Folders
- Admins can create folders and upload files.
- Assign permissions to users (view/edit/manage).
- Show where each file lives (single host vs replicated across hosts).

## Proxy-based Access
- Hosts generate a proxy URL; clients use it to access the workspace.
- Hosts can rotate/revoke URLs.

## Redundancy & Visibility
- As a host, connect to other hosts to replicate selected folders/files.
- UI clearly displays per-file location and replication state.

## Notes
- Self-hosted Convex powers sync, database, and file storage.
- Reference: `https://raw.githubusercontent.com/get-convex/convex-backend/refs/heads/main/self-hosted/README.md`
