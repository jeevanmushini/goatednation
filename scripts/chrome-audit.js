const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;

const ROUTES = [
  '/',
  '/collections',
  '/collections/tees',
  '/collections/hoodies',
  '/collections/acid-wash',
  '/products/shibuya-incident-oversized-tee',
  '/cart',
  '/wishlist',
  '/track',
  '/about',
  '/admin',
  '/admin/homepage',
  '/admin/products',
  '/admin/categories',
  '/admin/media',
  '/admin/shipping',
  '/admin/navigation',
  '/admin/settings',
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runAudit() {
  console.log('[Audit] Launching Headless Chrome...');
  const chrome = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=C:\\Users\\jeeva\\AppData\\Local\\Temp\\chrome-audit-profile',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let pageWsUrl = null;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      const list = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) {
        pageWsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!pageWsUrl) {
    chrome.kill();
    throw new Error('Failed to find Page target in Chrome');
  }

  console.log('[Audit] Connected to Chrome Page WebSocket at', pageWsUrl);

  const ws = new WebSocket(pageWsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');
  await send('Network.enable');

  const auditResults = [];

  for (const route of ROUTES) {
    const fullUrl = `http://localhost:3000${route}`;
    process.stdout.write(`[Audit] Testing ${route} ... `);

    const consoleMessages = [];
    const exceptions = [];
    const networkFailures = [];

    const handleEvent = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Console.messageAdded') {
        consoleMessages.push(msg.params.message);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(msg.params.exceptionDetails);
      } else if (msg.method === 'Network.responseReceived') {
        const { status, url } = msg.params.response;
        if (status >= 400 && !url.includes('favicon.ico')) {
          networkFailures.push({ url, status });
        }
      }
    };

    ws.addEventListener('message', handleEvent);

    const start = Date.now();
    await send('Page.navigate', { url: fullUrl });
    await wait(1200); // Wait for page hydration

    const evalRes = await send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        h1: Array.from(document.querySelectorAll('h1')).map(e => e.innerText.trim()).filter(Boolean),
        buttonCount: document.querySelectorAll('button').length,
        imgCount: document.querySelectorAll('img').length,
        linkCount: document.querySelectorAll('a').length,
      })`,
      returnByValue: true,
    });

    const elapsed = Date.now() - start;
    ws.removeEventListener('message', handleEvent);

    const details = evalRes?.result?.value || {};
    const errors = consoleMessages.filter((m) => m.level === 'error');
    const warnings = consoleMessages.filter((m) => m.level === 'warning');

    const result = {
      route,
      title: details.title || 'Untitled',
      h1: details.h1?.join(' | ') || 'None',
      imgCount: details.imgCount || 0,
      buttonCount: details.buttonCount || 0,
      linkCount: details.linkCount || 0,
      elapsedMs: elapsed,
      errorsCount: errors.length + exceptions.length,
      warningsCount: warnings.length,
      networkErrorsCount: networkFailures.length,
      errors: [...errors.map((e) => e.text), ...exceptions.map((e) => e.exception?.description || e.text)],
      warnings: warnings.map((w) => w.text),
      networkFailures,
    };

    auditResults.push(result);

    if (result.errorsCount === 0 && result.networkErrorsCount === 0) {
      console.log(`PASS (${result.title}) [${result.imgCount} imgs, ${result.buttonCount} btns, ${elapsed}ms]`);
    } else {
      console.log(`WARN/FAIL (${result.errorsCount} errors, ${result.networkErrorsCount} net fails)`);
    }
  }

  ws.close();
  chrome.kill();

  console.log('\n================ AUDIT SUMMARY ================');
  let totalErrors = 0;
  for (const r of auditResults) {
    totalErrors += r.errorsCount + r.networkErrorsCount;
    console.log(`\nRoute: ${r.route} [${r.errorsCount === 0 ? '✓ OK' : '✗ HAS ERRORS'}]`);
    console.log(`  Title: ${r.title}`);
    console.log(`  H1: ${r.h1}`);
    console.log(`  Elements: ${r.imgCount} images, ${r.buttonCount} buttons, ${r.linkCount} links`);
    if (r.errors.length > 0) {
      console.log(`  ERRORS (${r.errors.length}):`);
      r.errors.forEach((e) => console.log(`    - ${e}`));
    }
    if (r.networkFailures.length > 0) {
      console.log(`  NETWORK FAILURES:`);
      r.networkFailures.forEach((n) => console.log(`    - [${n.status}] ${n.url}`));
    }
    if (r.warnings.length > 0) {
      console.log(`  WARNINGS (${r.warnings.length}):`);
      r.warnings.forEach((w) => console.log(`    - ${w}`));
    }
  }

  console.log(`\nTOTAL ISSUES DETECTED: ${totalErrors}`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

runAudit().catch((err) => {
  console.error('[Audit Error]', err);
  process.exit(1);
});
