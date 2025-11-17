# Local Box

> **Easy, distributed, self-hosted Google Drive**

[![TanStack Start Hackathon](https://img.shields.io/badge/TanStack%20Start-Hackathon-blue)](https://www.convex.dev/hackathons/tanstack)

Local Box is a powerful file-sharing solution that brings the ease of cloud storage to your own infrastructure. Share files seamlessly between a host machine and web clients, with full control over your data and privacy.

## ✨ Why Local Box?

- 🔒 **Your Data, Your Control** - Self-hosted infrastructure means your files never leave your machines
- 🌐 **Dual Mode Architecture** - Run as a host on your machine or access via web client
- ⚡ **Realtime Sync** - Live updates across all clients and hosts instantly
- 🏷️ **Smart Organization** - Auto-tagging system organizes files by type, size, and owner
- 💳 **Built-in Billing** - Subscription management and paywall guards for monetization
- 🔐 **Secure Tunneling** - Cloudflare-powered secure connections between hosts and clients

---

## 🚀 Key Features

### Dual Mode Architecture
**Host Mode**: Run Local Box on your machine with Docker. Your machine acts as the file server, watching local folders and syncing changes to the backend.

**Client Mode**: Access files through a beautiful web app deployed on Netlify. Clients connect to hosts via secure tunnels, enabling remote access without exposing your network.

### Secure Tunneling
Cloudflare-powered tunnels create secure, shareable URLs that connect web clients to local hosts. No port forwarding or complex networking required—just start the tunnel and share the URL.

### Auto-Tagging System
Files are automatically tagged based on:
- **File Type**: Extension-based tags (`.pdf`, `.jpg`, `.docx`, etc.)
- **File Size**: Size range tags (Small, Medium, Large, Very Large)
- **Owner**: User-based tags for tracking who uploaded what

### Bulk Operations
Manage multiple files at once:
- Bulk tag assignment
- Multi-file deletion
- Batch operations for efficient content management

### Role-Based Access Control
Admin panel for configuring:
- User roles (admins, hosts, clients)
- Permissions and access levels
- Tag categories and auto-tagging rules

### Billing Integration
Complete subscription management:
- Connect to Autumn for payment processing
- Billing guards protect premium features
- Seamless checkout flow integrated into the app

### Realtime Sync
Powered by Convex, all file metadata updates instantly across:
- All connected clients
- Host machines
- Admin dashboards

---

## 🏗️ Built with Hackathon Sponsors

This project showcases deep integration with the TanStack Start Hackathon sponsors:

### 🎯 TanStack Start
**Full-stack framework powering the entire web application**

- Server-side routes and SSR capabilities for optimal performance
- Streaming support for real-time data updates
- RPC-style server functions for secure backend operations
- Integrated with TanStack Router for type-safe navigation
- TanStack Query for efficient data fetching and caching

**Integration**: The entire web UI is built with TanStack Start, from authentication flows to file management dashboards. Server functions handle tunnel creation, file uploads, and billing operations.

### ⚡ Convex (Self-Hosted)
**Realtime database and file storage backend**

- Self-hosted Convex instance running in Docker
- Realtime subscriptions for live file metadata updates
- File storage backend for uploaded content
- Schema-driven data model with type safety
- Automatic sync across all connected clients and hosts

**Integration**: All file metadata, tags, users, and billing configurations are stored in Convex. The self-hosted setup ensures complete data control while leveraging Convex's powerful realtime capabilities.

### ☁️ Cloudflare
**Secure tunnel creation and proxy layer**

- `cloudflared` package for creating secure tunnels
- Quick tunnel mode for instant host exposure
- TLS termination and secure routing
- No port forwarding or firewall configuration needed

**Integration**: Host machines use Cloudflare tunnels to expose themselves securely to the internet. The tunnel URL is shared with clients, enabling web-to-local connections without exposing the host's network.

### 🌐 Netlify
**Client mode deployment and hosting**

- Nitro preset configured for Netlify deployment
- Static site generation for public pages
- Serverless functions for API routes
- Optimized builds for web-only client experience

**Integration**: The client mode builds specifically for Netlify deployment, creating a web-only version that connects to remote hosts. Configured via `vite.config.ts` with Nitro preset.

### 💰 Autumn
**Billing and subscription management**

- `autumn-js` package for subscription handling
- Billing guards protecting premium features
- Integration with Better Auth for customer identification
- Pricing tables and checkout flows
- Subscription status tracking

**Integration**: Autumn powers the entire billing system. Admins configure billing settings, and the `BillingGuard` component protects premium routes. Users can subscribe directly from the app with a seamless checkout experience.

### 🐛 Sentry
**Error monitoring and performance tracking**

- `@sentry/tanstackstart-react` for TanStack Start integration
- Client-side error tracking with React Router integration
- Server-side error capture via `instrument.server.mjs`
- Performance monitoring for route navigation
- Environment-aware error reporting

**Integration**: Sentry is integrated at both the router level (for client errors) and server level (for API errors). TanStack Router browser tracing integration provides detailed performance metrics.

---

## 🏆 TanStack Start Hackathon Submission

This project is built for the **[TanStack Start Hackathon](https://www.convex.dev/hackathons/tanstack)** hosted by Convex, CodeRabbit, Firecrawl, Netlify, Autumn, Sentry, and Cloudflare.

### Sponsor Integration Summary

- ✅ **TanStack Start**: Full-stack framework for web UI and server routes
- ✅ **Convex**: Self-hosted realtime database and file storage
- ✅ **Cloudflare**: Secure tunnel creation and proxy layer
- ✅ **Netlify**: Client mode deployment and hosting
- ✅ **Autumn**: Billing and subscription management
- ✅ **Sentry**: Error monitoring and performance tracking
