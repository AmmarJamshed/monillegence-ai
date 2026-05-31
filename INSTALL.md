# Installing Monillegence AI

Step-by-step guide for anyone — no prior dev experience required beyond basic terminal use.

## Step 1: Install prerequisites

### Node.js
1. Visit https://nodejs.org
2. Download **LTS** (20 or newer)
3. Run installer, accept defaults
4. Verify: open terminal and run `node --version`

### pnpm
```bash
npm install -g pnpm
pnpm --version
```

### Ollama (local AI engine)
1. Visit https://ollama.com/download
2. Install for your OS
3. Open terminal:
```bash
ollama pull qwen2.5-coder:7b
```
This downloads ~4.7 GB. Wait until complete.

---

## Step 2: Get Monillegence AI

### From GitHub
```bash
git clone https://github.com/AmmarJamshed/monillegence-ai.git
cd monillegence-ai
```

### Or download ZIP
1. Open the GitHub repo page
2. **Code → Download ZIP**
3. Extract to a folder like `C:\Projects\monillegence-ai`
4. Open terminal in that folder

---

## Step 3: Install dependencies

```bash
pnpm install
```

Copy config:
- **Windows:** `copy .env.example .env`
- **Mac/Linux:** `cp .env.example .env`

Build packages (one-time, ~1 min):
```bash
pnpm --filter @monillegence/shared build
pnpm --filter @monillegence/runtime-manager build
pnpm --filter @monillegence/model-router build
pnpm --filter @monillegence/agent-backend build
```

---

## Step 4: Run Monillegence AI

Open **two** terminal windows in the project folder.

**Terminal 1:**
```bash
pnpm dev:backend
```
Wait for: `Monillegence Agent Backend → http://127.0.0.1:9477`

**Terminal 2:**
```bash
pnpm dev:ui
```
Wait for: `Local: http://localhost:5173/`

Open **http://localhost:5173** in Chrome or Edge.

---

## Step 5: Complete onboarding

1. Accept the legal disclaimer
2. Install/configure Ollama if prompted (or skip if already installed)
3. Wait for starter model download if needed
4. Click **Open Monillegence AI**

---

## Step 6: Build your first app

Type in chat:

```
Create a React todo app with Tailwind
```

Watch the **Artifact panel** on the right:
- 10 files scaffold instantly
- Polished UI template applied
- Files written to workspace
- npm install runs

When done, run your app:

**Windows:**
```powershell
cd $env:APPDATA\MonillegenceAI\workspace\react-todo-tailwind
npm run dev
```

**Mac/Linux:**
```bash
cd ~/.monillegence-ai/workspace/react-todo-tailwind
npm run dev
```

Open the URL shown (usually http://localhost:5173 or :5174).

---

## Example prompts

| Prompt | What you get |
|--------|----------------|
| `Create a React todo app with Tailwind` | Full todo app with add/complete/delete |
| `Build a counter app` | Increment/decrement counter |
| `Make a smiley face app` | Interactive emoji app |
| `Build a landing page for a coffee shop` | Custom LLM-generated site |

---

## Where projects are saved

| OS | Path |
|----|------|
| Windows | `%APPDATA%\MonillegenceAI\workspace\` |
| macOS/Linux | `~/.monillegence-ai/workspace/` |

Each build creates a subfolder, e.g. `react-todo-tailwind/`.

---

## Need help?

- Check [README.md](./README.md) troubleshooting
- Ensure Ollama is running: `ollama list`
- Backend health: http://127.0.0.1:9477/api/health
- Open a GitHub Issue on the repo

---

*Monillegence AI — Pakistan's local-first AI coding platform* 🇵🇰
