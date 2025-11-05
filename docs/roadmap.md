# Roadmap (Post-MVP)

Prioritized features once the MVP is stable.

## Access & Collaboration
- Per-folder/file ACLs with roles: owner, admin, member.
- External share links with expiration and optional passwords.
- Activity log and basic auditing.

## Reliability & Scale
- Multi-host replication with selectable folders.
- Health dashboard for hosts; alerts when hosts go offline.
- Quotas and usage reporting per workspace and per member.

## Files & Quality of Life
- Version history and simple conflict resolution.
- Trash/restore and retention policies.
- Full-text search across filenames and metadata; content search later.
- Deduplication and server-side checksums.

## Clients & Integrations
- Desktop helper (tray) for background sync to a local folder.
- Mobile web optimizations and native mobile later.
- Webhooks/integrations for CI or backup workflows.

## Security & Privacy
- Optional end-to-end encryption for selected folders.
- SSO (OAuth providers) and 2FA.

## Paid Features (initial set)
- Multi-host replication (Pro).
- External share links with access rules (Pro).
- Increased storage quotas and retention (Pro).

## Implementation Notes
- Use Autumn entitlements to gate Pro features in the UI and server.
- Use Cloudflare for stable tunnels and per-host routing.
- Convex: add indexes for search and metadata queries; expand storage as needed.


