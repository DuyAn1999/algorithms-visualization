import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the AlgoLab foundation checkpoint", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AlgoLab — Learn algorithms by seeing them<\/title>/i);
  assert.match(html, /AlgoLab/);
  assert.match(html, /Arrays &amp; indices/);
  assert.match(html, /Foundation lessons/);
  assert.match(html, /Where this idea is useful/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("removes the disposable starter preview", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<FoundationLab \/>/);
  assert.match(layout, /AlgoLab/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/", import.meta.url)));
});

test("server-renders the linear data structures checkpoint", async () => {
  const response = await render("/linear-structures");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Singly linked list/);
  assert.match(html, /Linear data structures/);
  assert.match(html, /Where this structure is useful/);
  assert.match(html, /Python/);
});

test("server-renders the searching and sorting checkpoint", async () => {
  const response = await render("/sorting-searching");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Linear Search/);
  assert.match(html, /Searching &amp; sorting/);
  assert.match(html, /Test values/);
  assert.match(html, /Where this algorithm is useful/);
  assert.match(html, /Python/);
});
