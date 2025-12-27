# 🔧 Troubleshooting: Storage Indexing Issue - FIXED

## Issue
When clicking "Index Library" on the settings page, you received:
```
POST /api/library/index 404
Error: Storage not found
```

## Root Cause
The library indexing API was still trying to fetch storage configurations from **MongoDB** instead of the new **YAML configuration file**.

## Fix Applied

### Changed Files:
1. **`app/api/library/index/route.ts`**
   - Replaced MongoDB lookup with YAML config lookup
   - Now uses `getStorageConfigById()` from `lib/config/storage-config.ts`
   
2. **`lib/storage/storage-adapter.ts`**
   - Added `shareName?: string` field to `StorageConfig` interface
   - This was missing and is needed for SMB connections

### What Was Changed:

**Before:**
```typescript
// Get storage connection from MongoDB
const storageCollection = await getStorageCollection();
const storage = await storageCollection.findOne({ id: storageId });
```

**After:**
```typescript
// Get storage connection from YAML config
const { getStorageConfigById } = await import('@/lib/config/storage-config');
const storage = getStorageConfigById(storageId);
```

## Testing

After the fix, your app should:
1. ✅ Load storage connections from `storage.config.yaml`
2. ✅ Display them on `/settings` page
3. ✅ Allow clicking "Index Library" successfully
4. ✅ Index files from your configured storage

## Next Steps

1. **Restart the dev server** (if not auto-reloaded):
   ```bash
   # Stop with Ctrl+C if needed, then:
   bun run dev
   ```

2. **Verify your storage config** is valid YAML:
   - Make sure `enabled: true` (or omit it, defaults to true)
   - Check all required fields are present
   - Ensure proper YAML indentation (use spaces, not tabs)

3. **Click "Index Library"** on the settings page
   - It should now work without 404 errors
   - You'll see indexing progress/results

## Example Valid Configuration

```yaml
connections:
  - id: my-storage
    name: My Media Server
    type: smb
    enabled: true
    host: 192.168.1.100
    port: 445
    username: admin
    password: password123
    shareName: media
    basePath: /movies
```

## Debugging Tips

If you still have issues:

1. **Check server logs** for config loading:
   ```
   [Config] Loaded X enabled storage connection(s) from storage.config.yaml
   [StorageManager] Initialized X storage adapter(s)
   ```

2. **Verify YAML syntax**:
   ```bash
   # Install yamllint if needed
   yamllint storage.config.yaml
   ```

3. **Check storage connectivity**:
   - Ensure your SMB/FTP/WebDAV server is accessible
   - Verify credentials are correct
   - Test network connectivity to the host

4. **Common mistakes**:
   - ❌ Using tabs instead of spaces in YAML
   - ❌ Missing required fields (id, name, type, host, username, password)
   - ❌ Wrong type value (must be: smb, ftp, or webdav)
   - ❌ Enabled set to `false` (should be `true` or omitted)

## Status: ✅ RESOLVED

The indexing API now correctly reads from the YAML configuration file!
