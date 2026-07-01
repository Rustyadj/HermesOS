# VPS Control Plane

Sentinel OS is the default web UI served at the VPS root. Hermes and OpenClaw run as managed agent services behind it.

## Architecture

```
Internet
    │
    ▼
Nginx / Caddy (443)
    ├── /                 → Sentinel OS (port 3000)
    ├── /legacy/hermes    → Hermes Lisa legacy UI (port 4860)
    └── /legacy/openclaw  → OpenClaw legacy UI (port 3001)

Sentinel OS (Next.js)
    └── /api/vps/agents/[id]/health   → server-side health check
    └── /api/vps/agents/[id]/logs     → docker logs (server-side)
    └── /api/vps/agents/[id]/restart  → docker restart (server-side)
    └── /api/vps/agents/[id]/config   → read/write config files (server-side)
```

## Environment Variables

Add these to `.env.local` on the VPS. See `.env.example` for the full list.

| Variable | Default | Purpose |
|---|---|---|
| `SENTINEL_DEFAULT_UI` | `true` | Marks Sentinel as the primary UI |
| `HERMES_ENDPOINT` | `http://127.0.0.1:4860` | Hermes Lisa health check URL |
| `HERMES_CLINT_ENDPOINT` | `http://127.0.0.1:4861` | Hermes Clint health check URL |
| `OPENCLAW_ENDPOINT` | `http://127.0.0.1:3000` | OpenClaw health check URL |
| `AGENT_CONFIG_DIR` | `/opt/sentinel-os/agents` | Root directory for agent config files |
| `HERMES_LISA_MODEL` | `claude-sonnet-4-6` | Model label shown in the UI |
| `HERMES_CLINT_MODEL` | `claude-sonnet-4-6` | Model label shown in the UI |
| `OPENCLAW_MODEL` | `claude-opus-4-8` | Model label shown in the UI |

## Agent Config Directory Layout

```
/opt/sentinel-os/agents/
├── hermes-lisa/
│   └── CLAUDE.md          ← editable in Sentinel → VPS Control → Config
├── hermes-clint/
│   └── CLAUDE.md
└── openclaw/
    └── config.json
```

The config editor reads/writes these files server-side. Supported extensions: `.md`, `.json`, `.yaml`, `.yml`, `.txt`. Paths outside `AGENT_CONFIG_DIR` are rejected.

## Reverse Proxy Setup

### Nginx

```bash
cp docs/proxy/nginx.conf /etc/nginx/sites-available/sentinel
ln -s /etc/nginx/sites-available/sentinel /etc/nginx/sites-enabled/
certbot --nginx -d srv1427612.hstgr.cloud
nginx -t && systemctl reload nginx
```

### Caddy

```bash
cp docs/proxy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
```

## VPS Control Page

Navigate to **VPS Control** in the Sentinel sidebar (or press `⌘K` → "VPS Control").

From there you can:

- **Health check** each agent with a live ping
- **View logs** (last 100 lines from `docker logs`)
- **Restart** a container via `docker restart <id>`
- **Edit config** files (CLAUDE.md, config.json, etc.) in-browser

No secrets are sent to the browser. All Docker/filesystem operations happen in server-side API routes.

## Security Notes

- The restart and config routes use an explicit allowlist (`ALLOWED_IDS`). Arbitrary container names cannot be passed.
- Config write path is validated against `AGENT_CONFIG_DIR` to prevent path traversal.
- Only `.md`, `.json`, `.yaml`, `.yml`, `.txt` extensions are readable/writable.
- No API keys or tokens are exposed to the client.
