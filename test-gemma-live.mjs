// Test Live Gemma Inference through the game client in Edge
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
    console.log("Sending live askGemma call to gemma3:4b through game client...");
    const res = await sendCommand("Runtime.evaluate", {
      expression: `window.GemmaClient.askGemma({
        purpose: "Live Inference Verification",
        system: "Respond in JSON format with status and quote.",
        prompt: "Provide a 5-word cyberpunk battle cry in JSON: { status: 'ready', quote: string }",
        schema: { status: "string", quote: "string" },
        timeoutMs: 15000,
        fallback: { status: "fallback", quote: "We run forever!" }
      })`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("Gemma Response:", JSON.stringify(res.result?.value, null, 2));

    const inspectorStats = await sendCommand("Runtime.evaluate", {
      expression: `({
        status: window.STATE.ai.statusText,
        lastLatency: window.STATE.ai.lastLatency,
        totalReq: window.STATE.ai.stats.total,
        successReq: window.STATE.ai.stats.success,
        fallbacks: window.STATE.ai.stats.fallbacks,
        lastEntry: window.STATE.ai.history[0]
      })`,
      returnByValue: true
    });

    console.log("Inspector Live Stats:", JSON.stringify(inspectorStats.result?.value, null, 2));
    ws.close();
    process.exit(0);
  });
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
