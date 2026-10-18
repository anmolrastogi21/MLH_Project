# DINO GONE ROGUE — Cyber Runner & Local Gemma AI Boss Battle

**DINO GONE ROGUE** is a high-speed, arcade cyber-runner and boss-combat browser game powered by your locally running **Gemma AI** via **Ollama**.

---

## 🎮 Quick Start Guide

### Option 1: One-Click Windows Launcher (Recommended)
Double-click `start-game.bat` (or run `./start-game.ps1` in PowerShell).
This automatically:
1. Verifies that your local Ollama instance is active and checks installed models.
2. Serves the game over `http://localhost:8000/dino-gone-rogue.html`.
3. Opens Microsoft Edge / your default browser directly into the game.

### Option 2: Running via Any Local Web Server
You can serve the folder using any local HTTP server (such as Python, Node, or VS Code Live Server):
```powershell
python -m http.server 8000
# or npx serve -l 8000
```
Then visit: `http://localhost:8000/dino-gone-rogue.html`

*(Note: Serving over an HTTP origin like `http://localhost:8000` allows direct browser requests to Ollama at `http://localhost:11434` without file origin CORS blocking).*

---

## 🦖 Game Concept & Phase Progression

The game evolves through eight distinct state-machine phases:

1. **MENU:** Interactive arcade title screen with animated previews, sound controls, how-to-play guide, settings modal, and live Gemma status indicator.
2. **RUN (36s):** High-speed runner through neon ruins. Jump over spiked crates and duck under airborne recon drones. Surviving stumbles costs lives (default 3 lives, or 1 life in One-Hit Mode).
3. **WARNING (4s):** Alarm sirens blare and screen shakes as a cyber dinosaur arrives! Local Gemma dynamically generates the boss's personality, backstory, and signature attack style.
4. **FLEE:** Outrun the pursuing titan while dodging hazards and ground quakes to reach the safe energy cache.
5. **CHARGE:** Collect floating hexagonal energy cells to overclock your Rogue Blaster from 0% to 100%.
6. **FIGHT:** Full arena boss combat! Attack with your Blaster (`J` / `Space`), fire massive Charged Mega Bursts (`K`), and evade telegraphed boss attacks (ground shockwaves, laser sweeps, meteor slams).
7. **WIN:** Defeat the boss to trigger victory fanfare, confetti particles, and final score debrief.
8. **LOSE:** Game over screen with detailed distance, dodge, and stumble stats, plus instant Retry and Main Menu buttons.

---

## ⌨️ Controls

| Action | Desktop Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Jump / Evade** | `SPACE`, `↑`, `W` | `⬆ JUMP` button |
| **Duck / Slide** | `↓`, `S` | `⬇ DUCK` button |
| **Blaster Attack** | `J`, `Z`, or Canvas Click | `⚡ ATTACK` button |
| **Mega Burst Special** | `K`, `X` (requires 40%+ charge) | `💥 SPECIAL` button |
| **Pause / Resume** | `P` | `⏸ Pause` header button |
| **Restart Run** | `R` | `🔄 Restart` header button |
| **Toggle Sound** | `M` | `🔊 Sound` header button |
| **Open Inspector** | `G` | `🔍 Inspector` button |
| **Debug Phase Jump** | Keys `1` through `8` | Accessible in code / Inspector |

---

## 🧠 Gemma AI Features (via Ollama)

All AI requests communicate directly with your local Ollama instance (`http://localhost:11434/api/chat`) using structured JSON:

* **Feature A — Story Snippets:** Hilarious micro-stories (<= 18 words) generated during the RUN phase.
* **Feature B — Boss Personality Generation:** Unique boss name, personality, backstory, and signature attack generated during the WARNING phase.
* **Feature C — Tactical Attack Suggestions:** Boss combat suggestions (damage, telegraph duration, and whitelisted attack types) streamed asynchronously so gameplay never freezes.
* **Feature D — Dynamic Commentary:** Reactive commentary triggered by high dodges, stumbles, weapon pickups, low health, and victory.
* **Feature E — Adaptive Difficulty:** Live evaluation of player dodges and survival, proposing gradual speed adjustments within safe clamps.
* **Feature F — Inspector & Diagnostics:** Press `G` anytime to view real runtime stats, connection latency, total requests, fallbacks, and a 10-call transaction log with live "Test Gemma" and "Clear Log" tools.

---

## 🧪 Automated Testing

Automated end-to-end tests can be executed at any time:

1. **In-Browser Self-Test:**
   Open browser developer tools and run:
   ```javascript
   window.runDinoTests();
   ```
2. **Automated Headless CDP Test:**
   ```powershell
   agy-node.cmd test-runner.mjs
   agy-node.cmd test-gemma-live.mjs
   agy-node.cmd test-fallback.mjs
   ```

---

## 🎨 Visual Design & Audio System

* **6 Principal Palette Colors:**
  * Space Dark: `#0c1017`
  * Starlight White: `#f0f6fc`
  * Cyber Cyan: `#00f3ff`
  * Laser Crimson: `#ff2a5f`
  * Neon Amber: `#ffcc00`
  * Emerald Matrix: `#00ff88`
* **Zero External Assets:** All sound effects (jump, dodge, stumble, pickup, blaster, roar, victory, defeat) are generated procedurally using the browser's native **Web Audio API**.
