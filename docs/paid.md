# Paid Features & Plans

Initial goal: keep the core free for small teams, monetize advanced reliability and collaboration.

## Plans (Draft)
- Free:
  - One host per workspace.
  - Basic workspace membership (owner + members).
  - Upload/download, folders, rename/move, delete (owner).
  - Modest storage quota (configurable default).
- Pro:
  - Multi-host replication (select folders; manual conflict policy).
  - External share links with expiration and optional password.
  - Higher storage quotas and longer retention.
  - Priority support.

## Autumn Integration
- Checkout flow opens Autumn; on success, workspace gets a Pro entitlement.
- Host and client check entitlements to show/unlock Pro-only UI/actions.
- Webhooks update entitlements on downgrade/cancel.

### Entitlement Mapping (Example)
- entitlement: `workspace.pro` → unlock replication setup, external links, higher quotas.

## UX Notes
- Clearly label Pro-only toggles (disabled with tooltip when not entitled).
- Avoid blocking MVP flows; paid features should not be required to operate.


