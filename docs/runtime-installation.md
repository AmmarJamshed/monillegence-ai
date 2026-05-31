# Monillegence AI — Runtime Installation Flow

## Ollama (Primary — Windows)

### Detection

```powershell
# Checked in order:
1. Test-NetConnection 127.0.0.1 -Port 11434
2. Get-Command ollama -ErrorAction SilentlyContinue
3. Test-Path "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
```

### Installation Steps

1. **Download**: `https://ollama.com/download/OllamaSetup.exe`
2. **Verify checksum** (SHA256 from manifest when available)
3. **Silent install**: `OllamaSetup.exe /S` (user-approved only)
4. **Wait for service**: poll `ollama list` until exit 0
5. **Configure**: set `OLLAMA_HOST=127.0.0.1:11434` in app env

### Post-Install

```bash
ollama pull qwen2.5-coder:7b
ollama serve  # if not auto-started as Windows service
```

## LM Studio (Alternative)

### Detection

- Port 1234 OpenAI endpoint
- Path: `%LOCALAPPDATA%/Programs/LM Studio/` or custom llmster path

### Installation Steps

1. Download LM Studio CLI/headless bundle (version pinned in config)
2. Extract to `%APPDATA%/MonillegenceAI/runtimes/lmstudio/`
3. Run: `lms server start --port 1234`
4. Load model via `lms load` API

## llama.cpp Server

### Detection

- `llama-server` on PATH or bundled binary in runtimes folder

### Installation

1. Download prebuilt Windows binary from releases (pinned version)
2. Extract to `%APPDATA%/MonillegenceAI/runtimes/llamacpp/`
3. Start: `llama-server -m {model.gguf} --port 8080`

## Install Flow (Code Path)

```typescript
async function installRuntimeWithConsent(
  type: RuntimeType,
  consent: InstallConsent
): Promise<InstallResult> {
  if (!consent.approved) {
    throw new ConsentRequiredError();
  }

  auditLog.write({ action: 'runtime_install_start', runtime: type });

  const installer = installers[type];
  const result = await installer.install({
    onProgress: (p) => eventBus.emit('install:progress', p),
    targetDir: getRuntimeDir(type),
  });

  if (!result.success) {
    auditLog.write({ action: 'runtime_install_failed', error: result.error });
    return result;
  }

  await configureRuntime(type);
  auditLog.write({ action: 'runtime_install_success', runtime: type });
  return result;
}
```

## User Consent Modal Data

| Field | Example |
|-------|---------|
| Runtime name | Ollama |
| Download size | ~500 MB |
| Install location | `%LOCALAPPDATA%\Programs\Ollama` |
| Network required | Yes |
| Admin required | No (user scope) |
| Starter model | Qwen2.5-Coder 7B (~4.7 GB) |

## Error Handling

| Error | User Message | Recovery |
|-------|--------------|----------|
| Download failed | "Could not download runtime. Check your connection." | Retry button |
| Disk full | "Not enough disk space. Need X GB free." | Link to model manager |
| Port in use | "Port 11434 is in use. Using 11435 instead." | Auto remapping |
| GPU unavailable | "Running in CPU mode. Responses may be slower." | Quantized model suggestion |
| Install cancelled | "Installation cancelled." | Return to onboarding |

## Uninstall

From Settings → Runtime:

- Stop process
- Optional: remove app-managed files only (never force-delete user's Ollama if pre-existing)
- Clear config entries

## Security Notes

- Installers downloaded over HTTPS only
- Checksum verification when manifest available
- No elevated privileges unless user explicitly opts in
- All install actions logged to audit trail
