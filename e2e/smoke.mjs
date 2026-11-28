// End-to-end test of the Research Lab UI, in a real browser with a virtual passkey authenticator.
// Needs: the local stack with the chocolate data imported, the app on http://localhost:3000
// (pnpm build && pnpm start), and the local test user. See README, "Prueba de punta a punta".
// It cleans up after itself, except one commercial source per run (sources outlive their prices).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL ?? "local@research-lab.test";
const PASSWORD = process.env.E2E_PASSWORD ?? "local-dev-password";
const browserPath =
  process.env.E2E_BROWSER ??
  [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find(existsSync);
assert.ok(browserPath, "no Chromium browser found: set E2E_BROWSER");

// puppeteer.launch() fails with Edge on this Windows setup, so start the browser ourselves on a
// free debugging port (it writes the port to DevToolsActivePort) and connect to it.
const profile = mkdtempSync(join(tmpdir(), "research-lab-e2e-"));
const chromium = spawn(
  browserPath,
  ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "about:blank"],
  { stdio: "ignore" },
);
let browser;
for (let i = 0; i < 80 && !browser; i++) {
  await new Promise((r) => setTimeout(r, 250));
  const portFile = join(profile, "DevToolsActivePort");
  if (!existsSync(portFile)) continue;
  const port = readFileSync(portFile, "utf8").split("\n")[0];
  browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` }).catch(() => undefined);
}
assert.ok(browser, `could not connect to ${browserPath}`);
process.on("exit", () => {
  chromium.kill();
  rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
});
process.on("uncaughtException", async (e) => {
  console.error(e);
  await browser.close().catch(() => {});
  process.exit(1);
});
const page = await browser.newPage();
const problems = [];
page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("dialog", (d) => d.accept());

const cdp = await page.createCDPSession();
await cdp.send("WebAuthn.enable");
await cdp.send("WebAuthn.addVirtualAuthenticator", {
  options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true },
});

const step = (name) => console.log(`- ${name}`);
// E2E_SCREENSHOTS=<dir> saves full-page screenshots of the report, comparator and price chart.
const screenshot = async (name) =>
  process.env.E2E_SCREENSHOTS && page.screenshot({ path: join(process.env.E2E_SCREENSHOTS, `${name}.png`), fullPage: true });
const text = () => page.evaluate(() => document.body.innerText);
const waitText = (t, timeout = 15000) =>
  page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, t);
const post = (fn) => Promise.all([page.waitForResponse((r) => r.request().method() === "POST" && r.url().startsWith(BASE)), fn()]);
const nav = (fn) => Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), fn()]);
const turnstile = () =>
  page.waitForFunction(() => document.querySelector('input[name="cf-turnstile-response"]')?.value, { timeout: 20000 });
// Fill an input/textarea/select found by name inside a container selector.
async function fill(scope, values) {
  for (const [name, value] of Object.entries(values)) {
    const el = await page.$(`${scope} [name="${name}"]`);
    assert.ok(el, `field ${name} in ${scope}`);
    const tag = await el.evaluate((e) => e.tagName);
    if (tag === "SELECT") await el.select(value);
    else {
      await el.evaluate((e) => (e.value = ""));
      await el.type(value);
    }
  }
}
// Opens a <details> by its summary text; leaves it open if it already is (a click would close it).
async function openDetails(summaryText) {
  const handle = await page.evaluateHandle(
    (t) => [...document.querySelectorAll("summary")].find((s) => s.textContent.includes(t)),
    summaryText,
  );
  if (!(await handle.evaluate((s) => s.parentElement.open))) await handle.click();
}
async function clickButton(label) {
  const handle = await page.evaluateHandle(
    (t) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(t) && !b.disabled),
    label,
  );
  assert.ok(await handle.evaluate((b) => !!b), `button ${label}`);
  await handle.click();
}

// --- Auth: redirect, wrong password, password login ---------------------------------------
step("unauthenticated visit redirects to /login");
await page.goto(`${BASE}/products`, { waitUntil: "networkidle0" });
assert.equal(new URL(page.url()).pathname, "/login");

step("a blocked Turnstile script tells how to fix it");
const blocked = await browser.newPage();
await blocked.setRequestInterception(true);
blocked.on("request", (r) => (r.url().includes("challenges.cloudflare.com") ? r.abort() : r.continue()));
await blocked.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
await blocked.waitForFunction(() => document.body.innerText.includes("No se pudo cargar la verificación"), {
  timeout: 15000,
});
await blocked.close();

step("wrong password shows an error and keeps the email");
await turnstile();
await fill("form", { email: EMAIL, password: "wrong" });
await clickButton("Entrar");
await waitText("Email o contraseña incorrectos.");
assert.equal(await page.$eval('[name="email"]', (e) => e.value), EMAIL);

step("password login (fresh captcha token after the failed attempt)");
await page.waitForFunction(() => document.querySelector('input[name="cf-turnstile-response"]')?.value, { timeout: 20000 });
await fill("form", { password: PASSWORD });
await nav(() => clickButton("Entrar"));
assert.equal(new URL(page.url()).pathname, "/");
await waitText("Proyectos");
assert.match(await text(), /chocolate/i);

// --- Products and prices -----------------------------------------------------------------
step("product list shows imported products with latest price");
await nav(() => page.click('a[href="/products"]'));
const productRows = await page.$$eval("tbody tr", (r) => r.length);
assert.ok(productRows > 0, "the imported products are listed");
assert.match(await text(), /RD\$/);
assert.match(await text(), /\d{2}\/\d{2}\/\d{4}/, "dates as dd/mm/yyyy");
assert.equal(await page.$eval("nav a[aria-current=page]", (a) => a.textContent), "Productos");
assert.ok(await page.$('a[href="#main"]'), "skip link to the content");

step("create a product with a new ingredient");
await openDetails("Nuevo producto");
await fill("details form", { brand: "Prueba", name: "Azúcar smoke", package_size: "1000", unit: "g", ingredient: "Azúcar smoke" });
await nav(() => clickButton("Crear producto"));
assert.match(new URL(page.url()).pathname, /^\/products\/[0-9a-f-]{36}$/);
await waitText("Prueba Azúcar smoke 1,000 g");

step("duplicate product is rejected with a message");
const productUrl = page.url();
await page.goto(`${BASE}/products`, { waitUntil: "networkidle0" });
await openDetails("Nuevo producto");
await fill("details form", { brand: "Prueba", name: "Azúcar smoke", package_size: "1000", unit: "g" });
await clickButton("Crear producto");
await waitText("Ya existe un registro con esos datos.");

step("add a price with a new supplier and source URL");
await page.goto(productUrl, { waitUntil: "networkidle0" });
await fill("section form", { price: "125.50", supplier: "Super Smoke", source_url: "https://example.com/azucar", notes: "Observación: smoke test" });
// An earlier day, so the second price (today) makes a trend for the chart.
await page.$eval('section form [name="observed_on"]', (e) => (e.value = "2026-11-20"));
await clickButton("Añadir precio");
await waitText("Super Smoke");
assert.match(await text(), /RD\$\s?125[.,]50/);
assert.match(await text(), /0[.,]1255/, "unit cost per g from v_price_history");
assert.equal(await page.$eval('section form [name="price"]', (e) => e.value), "", "form resets after adding");
assert.ok(await page.$('a[href="https://example.com/azucar"]'), "supplier links to the source");

step("double-click on Añadir precio records one price");
const rowsBefore = await page.$$eval("section tbody tr", (r) => r.length);
await fill("section form", { price: "99" });
const addBtn = await page.evaluateHandle(() => [...document.querySelectorAll("button")].find((b) => b.textContent.startsWith("Añadir precio")));
await addBtn.click({ count: 2, delay: 0 });
await page.waitForFunction((n) => document.querySelectorAll("section tbody tr").length > n, {}, rowsBefore);
await new Promise((r) => setTimeout(r, 2500));
await page.reload({ waitUntil: "networkidle0" });
assert.equal(await page.$$eval("section tbody tr", (r) => r.length), rowsBefore + 1, "exactly one new price");
await page.waitForSelector("section .recharts-surface", { timeout: 10000 });
await screenshot("product-price-history");

step("edit product notes");
await openDetails("Editar producto");
assert.equal(await page.$("details input[name=package_size]:not([type=hidden])"), null, "size is fixed once the product has prices");
assert.match(await text(), /No se cambia porque ya tiene precios/);
await fill("details form", { notes: "Pendiente: smoke" });
await post(() => clickButton("Guardar"));
await waitText("Guardado.");
await page.reload({ waitUntil: "networkidle0" });
assert.equal(await page.$eval('details [name="notes"]', (e) => e.value), "Pendiente: smoke");

step("delete the unused product (and its prices)");
await openDetails("Editar producto");
await nav(() => clickButton("Borrar producto"));
assert.equal(new URL(page.url()).pathname, "/products");
assert.doesNotMatch(await text(), /Azúcar smoke/);

step("a product used in a recipe cannot be deleted");
await nav(() => page.click("tbody tr a"));
await openDetails("Editar producto");
await clickButton("Borrar producto");
await waitText("No se puede borrar: otros registros dependen de este.");

// --- Project, formulations, experiments ---------------------------------------------------
step("project page lists formulations and experiments");
await page.goto(BASE, { waitUntil: "networkidle0" });
await nav(() => page.click('tbody a[href^="/projects/"]'));
const projectUrl = page.url();
const recipeRows = await page.$$eval("#recetas tbody tr", (r) => r.length);
const experimentRows = await page.$$eval("#experimentos tbody tr", (r) => r.length);
assert.ok(recipeRows > 0 && experimentRows > 0, "the project lists its recipes and experiments");
await waitText("Hipótesis y conclusiones");

step("tested recipe is frozen; create a new version");
const completedExperiment = await page.evaluate(() =>
  [...document.querySelectorAll("#experimentos tbody tr")]
    .find((r) => r.innerText.includes("Realizado"))
    ?.querySelector("a")?.getAttribute("href"),
);
assert.ok(completedExperiment, "a completed experiment exists");
await page.goto(BASE + completedExperiment, { waitUntil: "networkidle0" });
await nav(() => page.click('a[href*="/formulations/"]'));
await waitText("cantidades y productos congelados");
const frozenIngredients = await page.$$eval("section:first-of-type tbody tr", (r) => r.length);
assert.equal(await page.$('[name="product_id"]'), null, "no add-ingredient form when frozen");
assert.equal(await page.$eval('tbody [name="quantity"]', (e) => e.readOnly), true);

step("ingredient notes stay editable on a frozen recipe");
const noteForm = 'section:first-of-type tbody tr:first-child form';
await fill(noteForm, { notes: "Observación: nota editada en receta congelada" });
await post(() => page.click(`${noteForm} button[type=submit]`));
await page.reload({ waitUntil: "networkidle0" });
assert.equal(
  await page.$eval(`${noteForm} [name="notes"]`, (e) => e.value),
  "Observación: nota editada en receta congelada",
);
const frozenTitle = await page.$eval("h1", (h) => h.innerText);

await nav(() => clickButton("Crear versión nueva"));
const newVersionUrl = page.url();
await waitText("Borrador");
const h1 = await page.$eval("h1", (h) => h.innerText);
const [, code, v] = frozenTitle.match(/^(\S+) v(\d+)/);
assert.match(h1, new RegExp(`^${code} v\\d+`));
assert.ok(Number(h1.match(/ v(\d+)/)[1]) > Number(v), "higher version number");
assert.equal(await page.$$eval("section:first-of-type tbody tr", (r) => r.length), frozenIngredients, "ingredients copied");
assert.doesNotMatch(await text(), /congelados/);

step("new version: change a quantity, add and remove an ingredient");
const qtyForm = 'section:first-of-type tbody tr:first-child form';
await fill(qtyForm, { quantity: "7" });
await post(() => page.click(`${qtyForm} button[type=submit]`));
const options = await page.$$eval('[name="product_id"] option:not([disabled])', (o) => o.map((x) => x.value));
const used = frozenIngredients;
await page.select('[name="product_id"]', options[options.length - 1]);
await fill("section:first-of-type > form", { quantity: "3" });
await clickButton("Añadir ingrediente");
await page.waitForFunction((n) => document.querySelectorAll("section:first-of-type tbody tr").length !== n, {}, used);
const afterAdd = await page.$$eval("section:first-of-type tbody tr", (r) => r.length);
if (afterAdd === used) {
  // The last product was already in the recipe: the unique key rejects it.
  await waitText("Ya existe un registro con esos datos.");
} else {
  assert.equal(afterAdd, used + 1);
  await page.evaluate(() => [...document.querySelectorAll("section:first-of-type tbody tr")].at(-1).querySelector("button.btn-danger").click());
  await page.waitForFunction((n) => document.querySelectorAll("section:first-of-type tbody tr").length === n, {}, used);
}

step("serving size without unit is rejected");
await openDetails("Editar receta");
await fill("details form", { serving_size: "250", serving_unit: "" });
await page.click("details form button[type=submit]");
await waitText("Indica el tamaño de la ración y su unidad");
assert.equal(await page.$eval("details [name=serving_size]", (e) => e.getAttribute("aria-invalid")), "true");
assert.match(
  await page.$eval("details [name=serving_size]", (e) =>
    e
      .getAttribute("aria-describedby")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" "),
  ),
  /Indica el tamaño de la ración/,
  "the error describes its field",
);
assert.equal(
  await page.$eval("details [name=serving_size]", (e) => e.labels[0]?.textContent),
  "Tamaño de la ración",
  "the label names only the control (error and hint are descriptions)",
);
assert.equal(
  await page.evaluate(() => document.activeElement?.getAttribute("name")),
  "serving_size",
  "focus goes to the field to fix",
);

step("create an experiment; completed needs a date; then the recipe freezes");
await page.goto(projectUrl, { waitUntil: "networkidle0" });
await openDetails("Nuevo experimento");
const newVersionId = newVersionUrl.split("/").at(-1);
await page.select('#experimentos details [name="formulation_id"]', newVersionId);
await fill("#experimentos details form", { status: "completed", conditions: "Smoke" });
await clickButton("Crear experimento");
await waitText("Un experimento realizado o fallido necesita fecha.");
await fill("#experimentos details form", { status: "planned" });
await nav(() => clickButton("Crear experimento"));
assert.match(new URL(page.url()).pathname, /\/experiments\//);
const experimentUrl = page.url();
const experimentId = experimentUrl.split("/").at(-1);
await waitText("Registrar datos");
await waitText("La evaluación sensorial se registra cuando el experimento está realizado");
const editForm = "#capture-edit form";
const saveEdit = () => post(() => page.click(`${editForm} button[type=submit]`));
await openDetails("Editar datos del experimento");
await page.$eval(`${editForm} [name="performed_on"]`, (e) => (e.value = "2026-11-27"));
await fill(editForm, { status: "completed" });
await saveEdit();

step("a completed experiment cannot go back to planned (even forcing the option)");
await page.waitForFunction(() => document.querySelectorAll("#capture-edit [name=status] option").length === 2, { timeout: 10000 });
assert.deepEqual(await page.$$eval(`${editForm} [name=status] option`, (o) => o.map((x) => x.value)), ["completed", "failed"]);
await page.$eval(`${editForm} [name=status]`, (s) => { s.add(new Option("Planificado", "planned")); s.value = "planned"; });
await saveEdit();
await waitText("no vuelve a planificado");
await page.goto(newVersionUrl, { waitUntil: "networkidle0" });
await waitText("cantidades y productos congelados");

// --- Experiment report ----------------------------------------------------------------------
step("report: compare with the earlier run of the original recipe");
const referenceId = completedExperiment.split("/").at(-1);
await page.goto(experimentUrl, { waitUntil: "networkidle0" });
await openDetails("Editar datos del experimento");
await page.select(`${editForm} [name=baseline_experiment_id]`, referenceId);
await saveEdit();
await waitText("Comparado con");
assert.match(await text(), /Cambia/, "what changes against the reference (the quantity edited above)");

step("report: two evaluators here, one on the reference");
const evaluate = async (scores) => {
  await openDetails("Registrar evaluación sensorial");
  await fill("#capture-evaluation form", scores);
  await post(() => page.click("#capture-evaluation form button[type=submit]"));
  await page.waitForFunction((ev) => document.querySelector("table")?.closest("section") && document.body.innerText.includes(ev), {}, scores.evaluator);
};
await openDetails("Registrar evaluación sensorial");
assert.equal(
  await page.$eval("#capture-evaluation [name=evaluator]", (e) => e.value),
  EMAIL.split("@")[0],
  "the signed-in person (no name saved: the start of the email) is proposed as evaluator",
);
await screenshot("evaluation-form");
await evaluate({ evaluator: "e2e-ana", score__overall: "8", score__dulzor: "6", comment: "Más intenso" });
await evaluate({ evaluator: "e2e-luis", score__overall: "7", score__dulzor: "5" });
await page.goto(BASE + completedExperiment, { waitUntil: "networkidle0" });
await evaluate({ evaluator: "e2e-ana", score__overall: "6", score__dulzor: "4" });
await page.goto(experimentUrl, { waitUntil: "networkidle0" });
const report = await text();
assert.match(report, /7[.,]5 \/ 10/, "overall mean of the two evaluators");
assert.match(report, /▲ \+1[.,]5 vs referencia/, "overall difference against the reference");
assert.doesNotMatch(
  await page.$eval('[aria-label="Cifras clave"] > div', (tile) => tile.innerText),
  /\((mejor|peor)\)/,
  "one evaluation on the reference: the score difference is not called better or worse",
);
assert.equal(await page.$$eval("figure svg[role=img] g > title", (t) => t.length), 2, "dot scale: Global and dulzor");
assert.match(await page.$eval("figure svg[role=img]", (s) => s.getAttribute("aria-label")), /Global: media 7[.,]5.*referencia 6/);
assert.match(report, /Evaluado por 2 personas/);
await screenshot("experiment-report");

step("report: a conclusion and the hypothesis verdict");
await openDetails("Editar datos del experimento");
const hypothesisId = await page.$eval(`${editForm} [name=hypothesis_id] option:nth-child(2)`, (o) => o.value);
await page.select(`${editForm} [name=hypothesis_id]`, hypothesisId);
await saveEdit();
await waitText("Estado actual de la hipótesis");
const verdictSelect = "section form [name=status]";
const originalVerdict = await page.$eval(verdictSelect, (s) => s.value);
await openDetails("Añadir conclusión");
await fill("#capture-conclusion form", { statement: "Prueba e2e: la versión nueva puntúa más alto." });
await post(() => page.click("#capture-conclusion form button[type=submit]"));
await waitText("Prueba e2e: la versión nueva puntúa más alto.");
await page.select(verdictSelect, "supported");
await post(() => clickButton("Guardar veredicto"));
await waitText("(considera todos los experimentos): Respaldada");

step("report: the print view hides navigation and capture");
await page.emulateMediaType("print");
assert.deepEqual(
  await page.evaluate(() => [
    document.querySelector("header:has(nav)").checkVisibility(),
    document.querySelector("#capture-edit").checkVisibility(),
    document.querySelector("#section-4").checkVisibility(),
  ]),
  [false, false, true],
  "print shows the report, not the navigation or the capture forms",
);
await screenshot("experiment-report-print");
await page.emulateMediaType("screen");

step("comparator: grouped bars and the tables");
await page.goto(`${projectUrl}/compare?e=${experimentId}&e=${referenceId}&e=not-a-uuid`, { waitUntil: "networkidle0" });
await page.waitForSelector(".recharts-surface", { timeout: 10000 });
const comparison = await text();
assert.match(comparison, /Composición/);
assert.match(comparison, /7[.,]5 \(n=2, desv\. 0[.,]71\)/, "overall with its n and spread");
assert.match(comparison, /6 \(n=1\)/, "one evaluation: no spread");
assert.ok(await page.$("tr.font-semibold .badge"), "rows that change are marked «Cambia»");
await screenshot("compare");

step("clean up: verdict, conclusion and the reference's scores");
await page.goto(experimentUrl, { waitUntil: "networkidle0" });
await page.select(verdictSelect, originalVerdict);
await post(() => clickButton("Guardar veredicto"));
await post(() => page.click("section li form button[type=submit]"));
await page.waitForFunction(() => !document.body.innerText.includes("Prueba e2e: la versión nueva"));
await page.goto(BASE + completedExperiment, { waitUntil: "networkidle0" });
await post(() =>
  page.evaluate(() =>
    [...document.querySelectorAll("tr")].find((r) => r.innerText.startsWith("e2e-ana"))?.querySelector("button").click(),
  ),
);
await page.waitForFunction(() => !document.body.innerText.includes("e2e-ana"));

step("clean up: delete the experiment, then the new version");
await page.goto(experimentUrl, { waitUntil: "networkidle0" });
await openDetails("Editar datos del experimento");
await nav(() => clickButton("Borrar experimento"));
await page.goto(newVersionUrl, { waitUntil: "networkidle0" });
await openDetails("Editar receta");
await nav(() => clickButton("Borrar versión"));
assert.equal(page.url(), projectUrl);

// --- Passkeys -------------------------------------------------------------------------------
step("register a passkey");
await nav(() => page.click('a[href="/account"]'));
await waitText("Aún no tienes passkeys.");
await clickButton("Añadir passkey");
await page.waitForFunction(() => document.querySelectorAll("tbody tr").length === 1, { timeout: 15000 }).catch(async () => {
  throw new Error(`passkey not listed: ${await text()}`);
});

step("sign out and sign in with the passkey");
await nav(() => clickButton("Salir"));
assert.equal(new URL(page.url()).pathname, "/login");
await turnstile();
await nav(() => clickButton("Entrar con passkey"));
assert.equal(new URL(page.url()).pathname, "/");
await waitText("Proyectos");

step("delete the passkey");
await nav(() => page.click('a[href="/account"]'));
await page.waitForFunction(() => document.querySelectorAll("tbody tr").length === 1);
await clickButton("Borrar");
await waitText("Aún no tienes passkeys.");

step("a name in Cuenta is saved; blank clears it");
const nameValue = () => page.$eval('form [name="name"]', (e) => e.value);
for (const name of ["Persona e2e", ""]) {
  await fill("form", { name });
  await post(() => clickButton("Guardar nombre"));
  await waitText("Guardado.");
  await page.reload({ waitUntil: "networkidle0" });
  assert.equal(await nameValue(), name, "the saved name is shown after a reload");
}

await browser.close();
const relevant = problems.filter((p) => !/turnstile|challenges\.cloudflare|Private Access Token|status of 401/i.test(p));
if (relevant.length) {
  console.log("Browser errors:\n" + relevant.join("\n"));
  process.exit(1);
}
console.log("OK");
