// Test Fallback Behavior when model name is invalid
import http from 'http';

async function main() {
  const pages = await new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json/list", (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });

  const target = pages.find(p => p.type === "page" && p.url.includes("dino-gone-rogue"));
  const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);

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
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  });

  ws.addEventListener('open', async () => {
    console.log("Testing fallback with non-existent model name...");
    const res = await sendCommand("Runtime.evaluate", {
      expression: `(async () => {
        const origModel = window.CONFIG.GEMMA_MODEL;
        window.CONFIG.GEMMA_MODEL = "non_existent_model_12345";
        const result = await window.GemmaClient.askGemma({
          purpose: "Fallback Verification Test",
          prompt: "Test prompt",
          schema: { text: "string" },
          timeoutMs: 2000,
          fallback: { text: "Safe Predefined Content" }
        });
        window.CONFIG.GEMMA_MODEL = origModel; // restore
        return {
          result,
          lastEntry: window.STATE.ai.history[0],
          stats: window.STATE.ai.stats
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("Fallback Test Output:", JSON.stringify(res.result?.value, null, 2));
    ws.close();
    process.exit(0);
  });
}

main().catch(err => {
  console.error("Fallback test failed:", err);
  process.exit(1);
});
