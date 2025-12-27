# 🔐 YAML-Based Storage Configuration

## Overview

Storage connections are now configured via a **YAML configuration file** instead of the database. This provides several security benefits for public deployments:

- ✅ **Credentials stored server-side only** - Never exposed to clients
- ✅ **No public API for modifying settings** - Read-only from client perspective
- ✅ **Configuration file excluded from version control** - Safe to deploy
- ✅ **Perfect for public/demo instances** - Settings cannot be changed by users

## Setup Instructions

### 1. Create Configuration File

Copy the example configuration file:

```bash
cp storage.config.example.yaml storage.config.yaml
```

### 2. Edit Configuration

Open `storage.config.yaml` and configure your storage connections:

```yaml
connections:
  # SMB/SAMBA Storage Example
  - id: my-nas
    name: Home NAS
    type: smb
    enabled: true
    host: 192.168.1.100
    port: 445
    username: mediauser
    password: yourpassword
    shareName: media
    basePath: /movies

  # FTP Storage Example
  - id: ftp-server
    name: FTP Media Server
    type: ftp
    enabled: true
    host: ftp.example.com
    port: 21
    username: ftpuser
    password: yourpassword
    basePath: /media

  # WebDAV Storage Example (Nextcloud, etc.)
  - id: nextcloud
    name: Nextcloud Storage
    type: webdav
    enabled: true
    host: https://cloud.example.com
    username: user@example.com
    password: yourpassword
    basePath: /remote.php/dav/files/username/Media
```

### 3. Restart Application

After editing the configuration, restart the application:

```bash
bun run dev
```

The storage connections will be automatically loaded from the YAML file on startup.

## Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier for this connection |
| `name` | Yes | Display name shown in the UI |
| `type` | Yes | Storage type: `smb`, `ftp`, or `webdav` |
| `enabled` | No | Set to `false` to temporarily disable (default: `true`) |
| `host` | Yes | Hostname or IP address |
| `port` | No | Port number (defaults: SMB=445, FTP=21) |
| `username` | Yes | Authentication username |
| `password` | Yes | Authentication password |
| `basePath` | No | Base path on the storage (e.g., `/movies`) |
| `shareName` | SMB only | SMB share name |
| `secure` | No | Use secure connection (FTPS/HTTPS) |

## Managing Connections

### Adding a New Connection

1. Edit `storage.config.yaml`
2. Add a new entry under `connections:`
3. Restart the application

### Disabling a Connection

Set `enabled: false` in the configuration:

```yaml
- id: old-storage
  name: Old Storage
  type: ftp
  enabled: false  # This connection will be ignored
  # ... rest of config
```

### Removing a Connection

Simply delete or comment out the entry in `storage.config.yaml` and restart.

## Public & Cloud Deployment (Vercel, Docker)

For platforms like **Vercel** where you want to keep your configuration separate or easily updatable, use the **Remote YAML** method:

Host your `storage.config.yaml` as a **private GitHub Gist** or safe snippet, and provide the **Raw URL**:

1. Create a Gist with your YAML content.
2. Click "Raw" to get the direct link.
3. In Vercel Project Settings, add:
   - **Key**: `STORAGE_CONFIG_URL`
   - **Value**: `https://gist.githubusercontent.com/.../raw/.../storage.config.yaml`
4. Redeploy. Showtime will fetch and cache this config.


## Security Notes

⚠️ **Important:**
- `storage.config.yaml` is automatically excluded from git (in `.gitignore`)
- Never commit this file to version control
- If using `STORAGE_CONFIG_URL`, ensure the URL is **private** or restricted
- The settings page is now read-only - users cannot add/remove/edit connections via the UI

## Public Deployment

For public/demo instances:

1. Configure all storage connections in `storage.config.yaml` on the server
2. Deploy the application
3. Users can only view configured connections and trigger library indexing
4. Users cannot modify storage settings or view passwords

This makes it safe to host a public demo without worrying about users modifying your storage configuration or accessing sensitive credentials.

## Troubleshooting

### Connections not loading

- Check that `storage.config.yaml` exists in the project root OR `STORAGE_CONFIG_URL` is set in environment
- If using `STORAGE_CONFIG_URL`, ensure it is a **Direct Raw Link** (e.g., raw.githubusercontent.com)
- Verify YAML syntax is valid (use a YAML validator)
- Check server logs for fetch or configuration errors
- Ensure all required fields are present

### Changes not taking effect

- **Note:** The configuration is cached for **30 seconds**. Wait or redeploy to force an update.
- Restart the application after editing the local configuration file
- Check that `enabled` is set to `true` (or unset, which defaults to true)

### Testing configuration

Visit `/settings` to see loaded connections and their status.
