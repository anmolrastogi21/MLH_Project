// Automated Browser Test Script using Chrome DevTools Protocol & Node.js Native WebSocket
import http from 'http';

async function main() {
  console.log("1. Finding Edge page target...");
  const pages = await new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json/list", (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });

  const target = pages.find(p => p.type === "page" && p.url.includes("dino-gone-rogue"));
  if (!target) {
    console.error("Game page not found in Edge targets!");
    process.exit(1);
  }

  console.log("Found game page target:", target.id);
  const wsUrl = target.webSocketDebuggerUrl;

  const WebSocket = globalThis.WebSocket;
  const ws = new WebSocket(wsUrl);

  let messageId = 1;
  const pending = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled") {
      const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(" ");
      console.log(`[BROWSER CONSOLE] ${text}`);
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  });

  ws.addEventListener('open', async () => {
    console.log("Connected to Edge DevTools WebSocket!");
    await sendCommand("Runtime.enable");
    await sendCommand("Console.enable");

    // Wait 1.5 seconds for initial game scripts & Ollama probe to finish
    await new Promise(r => setTimeout(r, 1500));

    console.log("\n2. Running in-browser test suite: window.runDinoTests()...");
    const testResult = await sendCommand("Runtime.evaluate", {
      expression: "window.runDinoTests()",
      awaitPromise: true,
      returnByValue: true
    });
    console.log("Suite Result:", JSON.stringify(testResult.result?.value));

    console.log("\n3. Testing interactive UI clicks & button states...");
    const uiTests = await sendCommand("Runtime.evaluate", {
      expression: `(async () => {
        const results = [];
        function testBtn(id, name) {
          const btn = document.getElementById(id);
          if (!btn) {
            results.push({ name, passed: false, error: "Button not found: " + id });
            return;
          }
          try {
            btn.click();
            results.push({ name, passed: true });
          } catch(err) {
            results.push({ name, passed: false, error: err.message });
          }
        }

        // Test How to Play
        testBtn("howToPlayBtn", "Open How to Play");
        const htpActive = document.getElementById("howToPlayModal").classList.contains("active");
        results.push({ name: "How to Play Modal Visible", passed: htpActive });
        testBtn("closeHowToPlayBtn", "Close How to Play");
        const htpClosed = !document.getElementById("howToPlayModal").classList.contains("active");
        results.push({ name: "How to Play Modal Closed", passed: htpClosed });

        // Test Settings
        testBtn("settingsBtn", "Open Settings");
        const setOpen = document.getElementById("settingsModal").classList.contains("active");
        results.push({ name: "Settings Modal Visible", passed: setOpen });
        
        // Test Difficulty selector
        const diffSelect = document.getElementById("diffSelect");
        if (diffSelect) {
          diffSelect.value = "Rogue";
          diffSelect.dispatchEvent(new Event("change"));
          results.push({ name: "Difficulty changed to Rogue", passed: window.STATE.difficulty === "Rogue" });
          diffSelect.value = "Normal";
          diffSelect.dispatchEvent(new Event("change"));
        }

        testBtn("closeSettingsBtn", "Close Settings");
        const setClosed = !document.getElementById("settingsModal").classList.contains("active");
        results.push({ name: "Settings Modal Closed", passed: setClosed });

        // Test Inspector
        testBtn("headerInspectorBtn", "Open Inspector");
        const inspOpen = document.getElementById("inspectorModal").classList.contains("active");
        results.push({ name: "Inspector Visible", passed: inspOpen });
        testBtn("inspClearBtn", "Inspector Clear Log");
        testBtn("closeInspectorBtn", "Close Inspector");
        const inspClosed = !document.getElementById("inspectorModal").classList.contains("active");
        results.push({ name: "Inspector Closed", passed: inspClosed });

        // Test Sound Mute button
        const soundBefore = window.STATE.soundEnabled;
        testBtn("headerMuteBtn", "Toggle Sound Header");
        results.push({ name: "Sound Toggle Updated State", passed: window.STATE.soundEnabled !== soundBefore });

        // Test Start Game button
        testBtn("startBtn", "Click START GAME");
        const inRun = window.STATE?.phase === "RUN";
        results.push({ name: "Game in RUN phase", passed: inRun });

        // Test Pause button
        testBtn("headerPauseBtn", "Click Pause");
        results.push({ name: "Game is Paused", passed: window.STATE?.isPaused === true });
        testBtn("resumeBtn", "Click Resume");
        results.push({ name: "Game Resumed", passed: window.STATE?.isPaused === false });

        // Test Restart button
        testBtn("headerRestartBtn", "Click Restart Header");
        results.push({ name: "Game Restarted in RUN phase", passed: window.STATE?.phase === "RUN" && window.STATE?.score === 0 });

        // Test Return to Menu
        window.returnToMenu();
        results.push({ name: "Return to MENU phase", passed: window.STATE?.phase === "MENU" });

        return results;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("\n=== UI BUTTON TEST REPORT ===");
    const items = uiTests.result?.value || [];
    let allPassed = true;
    for (const item of items) {
      if (item.passed) {
        console.log(`[PASS] ${item.name}`);
      } else {
        console.error(`[FAIL] ${item.name}: ${item.error || 'Assertion failed'}`);
        allPassed = false;
      }
    }

    console.log(`\nOverall Button Verification: ${allPassed ? "ALL 100% WORKING" : "DEFECTS DETECTED"}`);
    ws.close();
    process.exit(allPassed ? 0 : 1);
  });
}

main().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
