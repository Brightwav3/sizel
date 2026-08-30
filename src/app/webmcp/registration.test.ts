import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./tools', () => ({
  TOOLS: [],
  toolsForRoute: (route: string) => ['shared', route].map(name => ({
    name, description: name, inputSchema: {}, execute: () => ({ content: [] }),
  })),
}));

import { registeredToolNames, stopWebmcpTools, syncWebmcpTools } from './index';

afterEach(() => {
  stopWebmcpTools();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fast browser tool discovery', () => {
  it('submits every tool immediately even when the first browser acknowledgement hangs', () => {
    const registerTool = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal('document', { modelContext: { registerTool } });
    syncWebmcpTools('home');
    expect(registerTool.mock.calls).toHaveLength(2);
    expect(registeredToolNames()).toEqual(['shared', 'home']);
  });

  it('withdraws pending old-route tools without waiting and preserves shared tools', () => {
    const signals = new Map<string, AbortSignal>();
    const registerTool = vi.fn((tool, options) => {
      signals.set(tool.name, options.signal);
      return new Promise(() => {});
    });
    vi.stubGlobal('document', { modelContext: { registerTool } });
    syncWebmcpTools('home');
    syncWebmcpTools('cart');
    expect(signals.get('home')!.aborted).toBe(true);
    expect(signals.get('shared')!.aborted).toBe(false);
    expect(registeredToolNames()).toEqual(['shared', 'cart']);
    expect(registerTool).toHaveBeenCalledTimes(3);
  });

  it('discovers a late browser API within the next 100ms tick', () => {
    vi.useFakeTimers();
    const doc: { modelContext?: unknown } = {};
    vi.stubGlobal('document', doc);
    syncWebmcpTools('home');
    const registerTool = vi.fn();
    doc.modelContext = { registerTool };
    vi.advanceTimersByTime(100);
    expect(registerTool).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels discovery retries on unmount', () => {
    vi.useFakeTimers();
    vi.stubGlobal('document', {});
    syncWebmcpTools('home');
    stopWebmcpTools();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not remove a newer registration when an old one rejects', async () => {
    let rejectOld!: (reason: Error) => void;
    const registerTool = vi.fn().mockImplementationOnce(() => new Promise((_, reject) => { rejectOld = reject; }));
    vi.stubGlobal('document', { modelContext: { registerTool } });
    syncWebmcpTools('home');
    stopWebmcpTools();
    syncWebmcpTools('home');
    rejectOld(new Error('old registration aborted'));
    await Promise.resolve();
    expect(registeredToolNames()).toEqual(['shared', 'home']);
  });
});
