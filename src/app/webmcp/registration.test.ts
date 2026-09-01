import { afterEach, describe, expect, it, vi } from 'vitest';

const mockTools = vi.hoisted(() => ({
  execute: vi.fn((_args: Record<string, unknown>, _options?: { signal: AbortSignal }) => ({ content: [] })),
}));

vi.mock('./tools', () => ({
  TOOLS: [],
  DEMO_TOOL_NAMES: ['shared', 'stable'],
  demoTools: () => ['shared', 'stable'].map(name => ({
    name, description: name, inputSchema: {}, execute: mockTools.execute,
  })),
  toolsForRoute: vi.fn(),
}));

import { registeredToolNames, stopWebmcpTools, syncWebmcpTools } from './index';

afterEach(() => {
  stopWebmcpTools();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  mockTools.execute.mockClear();
});

describe('fast browser tool discovery', () => {
  it('submits every tool immediately even when the first browser acknowledgement hangs', () => {
    const registerTool = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal('document', { modelContext: { registerTool } });
    syncWebmcpTools();
    expect(registerTool.mock.calls).toHaveLength(2);
    expect(registeredToolNames()).toEqual(['shared', 'stable']);
  });

  it('keeps the stable demo registry when the shopper changes routes', () => {
    const signals = new Map<string, AbortSignal>();
    const registerTool = vi.fn((tool, options) => {
      signals.set(tool.name, options.signal);
      return new Promise(() => {});
    });
    vi.stubGlobal('document', { modelContext: { registerTool } });
    syncWebmcpTools();
    syncWebmcpTools();
    expect(signals.get('shared')!.aborted).toBe(false);
    expect(signals.get('stable')!.aborted).toBe(false);
    expect(registeredToolNames()).toEqual(['shared', 'stable']);
    expect(registerTool).toHaveBeenCalledTimes(2);
  });

  it('discovers a late browser API within the next 100ms tick', () => {
    vi.useFakeTimers();
    const doc: { modelContext?: unknown } = {};
    vi.stubGlobal('document', doc);
    syncWebmcpTools();
    const registerTool = vi.fn();
    doc.modelContext = { registerTool };
    vi.advanceTimersByTime(100);
    expect(registerTool).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels discovery retries on unmount', () => {
    vi.useFakeTimers();
    vi.stubGlobal('document', {});
    syncWebmcpTools();
    stopWebmcpTools();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not remove a newer registration when an old one rejects', async () => {
    let rejectOld!: (reason: Error) => void;
    const registerTool = vi.fn().mockImplementationOnce(() => new Promise((_, reject) => { rejectOld = reject; }));
    vi.stubGlobal('document', { modelContext: { registerTool } });
    syncWebmcpTools();
    stopWebmcpTools();
    syncWebmcpTools();
    rejectOld(new Error('old registration aborted'));
    await Promise.resolve();
    expect(registeredToolNames()).toEqual(['shared', 'stable']);
  });

  it('forwards the execution AbortSignal to the registered handler', async () => {
    let descriptor: any;
    const registerTool = vi.fn((tool: any) => {
      descriptor = tool;
      return undefined;
    });
    vi.stubGlobal('document', { modelContext: { registerTool } });
    syncWebmcpTools();
    const controller = new AbortController();
    await descriptor.execute({}, { signal: controller.signal });
    expect(registerTool).toHaveBeenCalledTimes(2);
    expect(mockTools.execute).toHaveBeenCalledWith({}, { signal: controller.signal });
  });

  it('records handler-only timing when debug logging is enabled', async () => {
    const descriptors = new Map<string, any>();
    const registerTool = vi.fn((tool: any) => { descriptors.set(tool.name, tool); return undefined; });
    vi.stubGlobal('window', { location: { pathname: '/', search: '?debugWebMcp=1' } });
    vi.stubGlobal('document', { modelContext: { registerTool } });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    syncWebmcpTools();
    await descriptors.get('shared').execute({});
    expect((window as any).__rigsmithWebmcpTimings).toEqual([
      expect.objectContaining({ name: 'shared', ms: expect.any(Number), outcome: 'ok' }),
    ]);
    expect(info).toHaveBeenCalledWith(expect.stringContaining('[webmcp timing] shared:'));
  });
});
