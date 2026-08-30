import { mkdir, writeFile } from 'node:fs/promises';

// Sites expects a Worker entry point alongside dist/client static assets.
await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/server/index.js', import.meta.url), `
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || !['GET', 'HEAD'].includes(request.method)) return response;
    const url = new URL(request.url);
    if (url.pathname.split('/').pop().includes('.')) return response;
    url.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
};
`);
