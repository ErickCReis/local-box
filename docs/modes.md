# Modes (Host / Client)

Users can switch between modes. Switching to host mode requires setup.

## Host Mode
- Run the Bun server (manages setup, proxy, Convex integration).
- Run Convex self-hosted backend and dashboard.
- Generate a proxy URL to share access with clients.

### Minimal Setup (local quickstart)
```bash
# Start backend + dashboard (Docker)
docker compose up

# Generate admin key for dashboard/CLI
docker compose exec backend ./generate_admin_key.sh
```

Set in your Convex project:
```bash
CONVEX_SELF_HOSTED_URL='http://127.0.0.1:3210'
CONVEX_SELF_HOSTED_ADMIN_KEY='<your admin key>'
```

- Reference: `https://raw.githubusercontent.com/get-convex/convex-backend/refs/heads/main/self-hosted/README.md`
- Typical ports: API `3210`, HTTP actions `3211`, Dashboard `6791`.

### Proxy
- Start proxy from the host server; generate a shareable URL.
- Clients authenticate via this URL; hosts can revoke/rotate it.

## Client Mode
- Only the web app is needed (can be hosted anywhere).
- User logs into a workspace via a host’s proxy URL.
- Can request to join as a host later to provide redundancy.

## Host-to-Host Redundancy
- A host can connect to other hosts in the same workspace.
- Select folders/files to replicate to specific hosts.
- UI should show which hosts store each item and replication status/health.
