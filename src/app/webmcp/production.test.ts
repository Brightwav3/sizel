import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RigsmithApp } from '../App';
import { TOOLS } from './tools';
import { CATALOG, DEFAULT_PICKS } from '../../data/catalog/catalog';
import { BUILD_SLOTS, bundledFans } from '../../entities/build/selection';
import { listingStock } from '../../data/catalog/listingStock';
import { recommendBuild } from './buildAdvisor';
import { cartTotals } from '../../entities/cart/cartTotals';
import { metrics, shipDate } from '../../entities/build/metrics';
import { createBuildContext } from '../../entities/build/buildContext';
import { buildShellVals } from '../../shared/layout/shellVals';

let app: RigsmithApp;
const call = async (name: string, args = {}) => {
  const result = await TOOLS.find(tool => tool.name === name)!.execute(args);
  return JSON.parse(result.content[0].text);
};
const reason = 'This option leaves budget for the remaining parts; its catalog socket matches the chosen platform.';
const tradeoff = 'No game benchmark is available; this is not a promise of measured performance.';
beforeEach(() => {
  vi.stubGlobal('window', { location: { pathname: '/' } });
  app = new RigsmithApp({});
  app.flash = () => {};
  // Exercise actual controller commands with deferred commits. Native React
  // commits and rendered changes are additionally verified in the browser.
  app.setState = ((updater: any, callback: any) => queueMicrotask(() => {
    const patch = typeof updater === 'function' ? updater(app.state) : updater;
    app.state = { ...app.state, ...patch };
    callback?.();
  })) as any;
  RigsmithApp.instance = app;
});
afterEach(() => { RigsmithApp.instance = null; vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function fullBuild() {
  app.state = { ...app.state, picks: recommendBuild(1700).picks, budget: 5000, chosen: [...BUILD_SLOTS] };
}

describe('independent agent selections', () => {
  it('opens the build panel without choosing parts or navigating away', async () => {
    expect(await call('begin_build', { brief: 'A quiet gaming PC', budget: 800 })).toMatchObject({ opened: 'build_panel', budget: 800 });
    expect(app.state.route).toBe('home');
    expect(app.state.cornerMin).toBe(false);
    expect(app.state.chosen).toEqual([]);
    expect(TOOLS.some(tool => tool.name === 'recommend_build')).toBe(false);
    expect(await call('check_build_compatibility')).toMatchObject({ complete: false, price: 0, slots: [], performance: null });
  });

  it('shows the filled build pill after an atomic build completes', async () => {
    await call('begin_build', { brief: 'A compatible gaming PC', budget: 5000, reset: true });
    const picks = recommendBuild(1700).picks;
    await call('set_build_components', { components: Object.fromEntries(Object.entries(picks).filter(([slot]) => slot !== 'fans')) });
    expect(app.state.chosen).toHaveLength(BUILD_SLOTS.length);
    expect(app.state.cornerMin).toBe(true);
  });
  it('allows direct choices and retains optional fresh inspection evidence', async () => {
    const [first, second] = CATALOG.cpu.filter(p => p.stock !== 0).slice(0, 2);
    const args = { slot: 'cpu', productId: first.id, reason, tradeoff, alternativeId: second.id };
    expect(await call('set_build_component', { slot: 'cpu', productId: first.id })).not.toHaveProperty('error');
    expect(app.state.route).toBe('home');
    expect(app.state.decisions.cpu?.comparedIds).toEqual([]);
    await call('inspect_build_options', { slot: 'cpu', productIds: [first.id, second.id] });
    expect(await call('set_build_component', { ...args, alternativeId: first.id })).toMatchObject({ error: 'invalid_alternative' });
    expect(await call('set_build_component', args)).not.toHaveProperty('error');
    expect(app.state.decisions.cpu).toMatchObject({ reason, tradeoff, alternativeId: second.id, comparedIds: [first.id, second.id] });
    expect(app.state.picks.cpu).toBe(first.id);
    expect(app.state.route).toBe('home');
  });
  it('keeps an incompatible direct choice visible and reports the conflict', async () => {
    const cpu = CATALOG.cpu.find(p => p.stock !== 0)!;
    const board = CATALOG.board.find(p => p.stock !== 0 && p.socket !== cpu.socket)!;
    expect(await call('set_build_component', { slot: 'cpu', productId: cpu.id })).not.toHaveProperty('error');
    const result = await call('set_build_component', { slot: 'board', productId: board.id });
    expect(result).toMatchObject({ compatible: false, selectedCount: 2 });
    expect(result.issues?.[0]).toContain('uses');
    expect(app.state.chosen).toEqual(expect.arrayContaining(['cpu', 'board']));
  });
  it('does not require reinspection after target changes but still enforces the current budget', async () => {
    const item = CATALOG.cpu.find(p => p.stock !== 0)!;
    await call('inspect_build_options', { slot: 'cpu', productIds: [item.id] });
    await app.setTargets({ budget: 2000 });
    expect(await call('set_build_component', { slot: 'cpu', productId: item.id })).not.toHaveProperty('error');
    expect(app.state.decisions.cpu?.comparedIds).toEqual([]);
    await app.resetBuild();
    await app.setTargets({ budget: item.price - 1 });
    expect(await call('set_build_component', { slot: 'cpu', productId: item.id })).toMatchObject({ error: 'over_budget' });
  });
  it('does not reset a slot when the agent accidentally omits productId', async () => {
    const before = app.state.picks;
    expect(await call('set_build_component', { slot: 'cpu' })).toMatchObject({ error: 'missing_argument' });
    expect(app.state.picks).toBe(before);
  });
  it('commits case and included fans together, and undo restores selection state', async () => {
    const cs = CATALOG.case.find(p => p.stock !== 0 && p.id !== DEFAULT_PICKS.case)!;
    await call('inspect_build_options', { slot: 'case', productIds: [cs.id] });
    const result = await call('set_build_component', { slot: 'case', productId: cs.id, reason, tradeoff });
    expect(result).not.toHaveProperty('error');
    expect(app.state.picks.case).toBe(cs.id);
    expect(app.state.picks.fans).toBe(bundledFans(cs.id));
    expect(app.state.chosen).toEqual(['case', 'fans']);
    expect(await call('get_current_build')).toMatchObject({ complete: false, compatible: true, issueCount: 0, fps: null, price: cs.price });
    expect(await call('estimate_performance')).toMatchObject({ error: 'build_incomplete' });
    await call('undo_build_change');
    expect(app.state.chosen).toEqual([]);
    expect(app.state.picks).toEqual(DEFAULT_PICKS);
    expect(app.state.decisions).toEqual({});
  });
  it('enforces the exact agreed budget and rejects bad numeric input', async () => {
    await app.setTargets({ budget: 1 });
    expect(await app.set('cpu', CATALOG.cpu.find(p => p.stock !== 0)!.id)).toMatchObject({ error: 'over_budget' });
    expect(app.state.chosen).toEqual([]);
    expect(await call('begin_build', { brief: 'A gaming computer', budget: -1 })).toMatchObject({ error: 'invalid_budget' });
    for (const budget of [800, 850, 900]) {
      const proposal = recommendBuild(budget, '1440p', true, 144);
      expect(proposal.withinBudget).toBe(proposal.price <= budget);
    }
  });
});

describe('visible catalog flow', () => {
  it('keeps reads pure and lets the agent navigate explicitly', async () => {
    const phone = CATALOG.phones.find(item => item.id === 'pear-phone-16e')!;
    const [gpu, otherGpu] = CATALOG.gpu.filter(item => item.stock !== 0).slice(0, 2);

    await call('search_products', { category: 'phones', brand: 'Pear', limit: 3 });
    expect(app.state.route).toBe('home');

    await call('show_in_catalog', { view: 'category', category: 'phones', brand: 'Pear' });
    expect(app.state).toMatchObject({ route: 'category', category: 'phones', dept: 'phone' });

    await call('get_product', { productId: phone.id });
    expect(app.state.route).toBe('category');

    const shownPhone = await call('show_in_catalog', { view: 'product', productId: phone.id });
    expect(shownPhone.product).toMatchObject({ id: phone.id, category: 'phones', facts: expect.any(Object) });
    expect(app.state).toMatchObject({ route: 'product', productId: phone.id, productSlot: 'phones' });

    await call('begin_build', { brief: 'A gaming PC under budget', budget: 1800 });
    expect(app.state.route).toBe('product');

    await call('compare_products', { productIds: [gpu.id, otherGpu.id] });
    expect(app.state.route).toBe('product');

    await call('show_in_catalog', { view: 'product', productId: gpu.id });
    expect(app.state).toMatchObject({ route: 'product', productId: gpu.id, productSlot: 'gpu' });
    expect(await call('show_in_catalog', { view: 'builder' })).toMatchObject({ error: 'builder_view_unavailable' });
    expect(app.state.route).toBe('product');
  });

  it('keeps phone searches on phones and resolves a stale product slot by id', async () => {
    const phone = CATALOG.phones.find(item => item.id === 'pear-phone-16e')!;
    app.state = { ...app.state, route: 'category', dept: 'phone', category: 'phones', productSlot: 'phones', openDept: null, search: '' };
    const shell = buildShellVals(createBuildContext(app));
    shell.searchChange({ target: { value: 'Pear Phone' } } as any);
    await Promise.resolve();
    expect(app.state.category).toBe('phones');
    expect(app.state.productSlot).toBe('phones');
    expect(app.state.dept).toBe('phone');

    app.state = { ...app.state, route: 'product', productId: phone.id, productSlot: 'gpu', category: 'gpu' };
    const context = createBuildContext(app);
    expect(context.pSlot).toBe('phones');
    expect(context.pick.id).toBe(phone.id);
  });

  it('groups phone storage variants when searching for model comparisons', async () => {
    const result = await call('search_products', { category: 'phones', sort: 'new', limit: 20 });
    expect(result.distinctModels).toBe(true);
    expect(result.total).toBeLessThan(CATALOG.phones.length);
    expect(new Set(result.items.map((item: any) => item.id.split('::')[0])).size).toBe(result.items.length);
    expect(result.items.some((item: any) => item.id === 'pear-phone-16e')).toBe(true);
  });

  it('lists compatible GPU candidates without choosing one', async () => {
    await call('begin_build', {
      brief: 'A balanced gaming PC',
      budget: 1500,
      reset: true,
    });
    const result = await call('list_compatible_parts', { slot: 'gpu', maxPrice: 800, sort: 'priceDesc', limit: 3 });
    expect(result).toMatchObject({ slot: 'gpu' });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'northwind-gx-5070-ti', stock: expect.any(String), shipsInDays: expect.any(Number) }),
      expect.objectContaining({ id: 'fabrikam-rx-9070-xt', stock: expect.any(String), shipsInDays: expect.any(Number) }),
    ]));
    expect(result).not.toHaveProperty('primary');
    expect(result).not.toHaveProperty('fallback');
  });

  it('batches compatible options for every remaining slot', async () => {
    await call('begin_build', { brief: 'A gaming PC under budget', budget: 1800 });
    const result = await call('list_compatible_parts', { allRemaining: true });
    expect(result).toMatchObject({ allRemaining: true, requested: BUILD_SLOTS.length });
    expect(result.slots.map((entry: any) => entry.slot).sort()).toEqual([...BUILD_SLOTS].sort());
    expect(result.slots.every((entry: any) => entry.items.length === Math.min(5, entry.fitting))).toBe(true);
    expect(result.slots.filter((entry: any) => ['gpu', 'psu', 'case'].includes(entry.slot)).every((entry: any) => entry.items.length >= 5)).toBe(true);
    expect(result.slots.every((entry: any) => entry.items.every((item: any) => !item.details))).toBe(true);
  });

  it('honours a high per-slot limit in a complete batch while keeping it compact', async () => {
    await call('begin_build', { brief: 'A gaming PC under budget', budget: 1800 });
    const result = await call('list_compatible_parts', { allRemaining: true, limit: 10, includeDetails: true });
    expect(result).toMatchObject({ allRemaining: true, requested: BUILD_SLOTS.length });
    expect(result).not.toHaveProperty('candidateLimit');
    expect(result.slots).toHaveLength(BUILD_SLOTS.length);
    expect(result.slots.every((entry: any) => entry.items.length === Math.min(10, entry.fitting))).toBe(true);
    expect(result.slots.every((entry: any) => entry.items.every((item: any) => !item.details))).toBe(true);
  });

  it('honours the batch limit independently for explicitly requested slots', async () => {
    await call('begin_build', { brief: 'A gaming PC under budget', budget: 1800 });
    const result = await call('list_compatible_parts', { slots: ['gpu', 'psu', 'case'], limit: 7 });
    expect(result.slots).toHaveLength(3);
    expect(result.slots.every((entry: any) => entry.items.length === Math.min(7, entry.fitting))).toBe(true);
  });

  it('returns shopper budget shares and uses them as candidate allowances', async () => {
    const started = await call('begin_build', {
      brief: 'A gaming PC with a strong graphics card',
      budget: 1500,
      resolution: '1440p',
      budgetShares: { cpu: 20, gpu: 40 },
    });
    expect(started.budgetAllocation).toMatchObject({ source: 'shopper' });
    const allocation = Object.fromEntries(started.budgetAllocation.slots.map((row: any) => [row.slot, row]));
    expect(allocation.cpu).toMatchObject({ sharePct: 20, budgetUSD: 300, source: 'shopper' });
    expect(allocation.gpu).toMatchObject({ sharePct: 40, budgetUSD: 600, source: 'shopper' });
    expect(started.budgetAllocation.slots.reduce((sum: number, row: any) => sum + row.sharePct, 0)).toBeCloseTo(100, 5);

    const gpu = await call('list_compatible_parts', { slot: 'gpu', sort: 'priceDesc', limit: 3 });
    expect(gpu).toMatchObject({ slot: 'gpu', sharePct: 40, budgetUSD: 600 });
    expect(gpu.items[0].price).toBeGreaterThanOrEqual(gpu.items[1].price);
    expect(gpu.items[0]).toHaveProperty('withinBudgetAllocation');
  });

  it('opens a blank build and leaves the starting slot to the agent', async () => {
    const started = await call('begin_build', {
      brief: 'A balanced 1440p gaming PC',
      budget: 1500,
      resolution: '1440p',
      reset: true,
    });
    expect(started).toMatchObject({
      opened: 'build_panel',
      budget: 1500,
      resolution: '1440p',
    });
    expect(started).not.toHaveProperty('starter');
    expect(started).not.toHaveProperty('next');
    expect(app.state.picks).toEqual(DEFAULT_PICKS);
    expect(app.state.chosen).toEqual([]);
  });

  it('applies a complete agent-selected build in one atomic command', async () => {
    await call('begin_build', { brief: 'A compatible 1440p gaming PC', budget: 1700, resolution: '1440p', reset: true });
    const picks = recommendBuild(1700, '1440p', true).picks;
    const result = await call('set_build_components', {
      components: {
        cpu: picks.cpu, gpu: picks.gpu, board: picks.board, ram: picks.ram,
        storage: picks.storage, cooler: picks.cooler, psu: picks.psu, case: picks.case,
      },
    });
    expect(result).toMatchObject({
      applied: true, selectedCount: BUILD_SLOTS.length, complete: true,
      compatible: true, validationComplete: true, inStock: true, price: metrics(picks, '1440p').price,
      bundledFans: bundledFans(picks.case),
    });
    expect(app.state.chosen).toEqual(BUILD_SLOTS);
    expect(app.state.picks).toMatchObject({ ...picks, fans: bundledFans(picks.case) });
    expect(app.state.route).toBe('home');
  });

  it('rejects an invalid batch without partially changing the build', async () => {
    await call('begin_build', { brief: 'A compatible gaming PC', budget: 1700, reset: true });
    const before = { picks: structuredClone(app.state.picks), chosen: [...app.state.chosen], revision: app.state.buildRevision };
    const picks = recommendBuild(1700, '1440p', true).picks;
    const unavailable = CATALOG.gpu.find(item => listingStock(item, 'gpu') === 0)!;
    const result = await call('set_build_components', {
      components: {
        cpu: picks.cpu, gpu: unavailable.id, board: picks.board, ram: picks.ram,
        storage: picks.storage, cooler: picks.cooler, psu: picks.psu, case: picks.case,
      },
    });
    expect(result).toMatchObject({ error: 'out_of_stock' });
    expect(app.state.picks).toEqual(before.picks);
    expect(app.state.chosen).toEqual(before.chosen);
    expect(app.state.buildRevision).toBe(before.revision);
  });

  it('keeps the GPU candidate read separate from build selection', async () => {
    await call('begin_build', {
      brief: 'A 1440p gaming PC with the strongest GPU under 800 dollars',
      budget: 1500,
      resolution: '1440p',
      reset: true,
    });
    const candidates = await call('list_compatible_parts', { slot: 'gpu', maxPrice: 800, sort: 'priceDesc' });
    expect(candidates).toMatchObject({ slot: 'gpu' });
    expect(candidates.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'northwind-gx-5070-ti' }),
      expect.objectContaining({ id: 'fabrikam-rx-9070-xt' }),
    ]));
    expect(candidates).not.toHaveProperty('primary');
    expect(candidates).not.toHaveProperty('fallback');
    expect(candidates).not.toHaveProperty('watchdogOffer');
    expect(JSON.stringify(candidates).length).toBeLessThanOrEqual(1500);
    expect(app.state.chosen).not.toContain('gpu');
  });

  it('rejects budget shares that name unknown slots or exceed the whole budget', async () => {
    expect(await call('begin_build', { brief: 'A gaming PC', budget: 1500, budgetShares: { monitor: 20 } })).toMatchObject({ error: 'invalid_budget_allocation' });
    expect(await call('begin_build', { brief: 'A gaming PC', budget: 1500, budgetShares: { cpu: 70, gpu: 40 } })).toMatchObject({ error: 'invalid_budget_allocation' });
  });
});

describe('whole-build tradeoffs without automatic selection', () => {
  it('compares three alternatives in a single game without losing simulation labels', async () => {
    fullBuild();
    const before = structuredClone(app.state);
    const alternatives = CATALOG.gpu.filter(p => p.id !== app.state.picks.gpu).slice(0, 3).map(p => ({ gpu: p.id }));
    const estimate = await call('estimate_performance', { game: 'cyberpunk-2077' });
    expect(estimate).toMatchObject({ fps: null, simulation: { game: 'cyberpunk-2077', kind: 'simulation', datasetVersion: 'rigsmith-game-simulation-v2', loadSeconds: null, sourceUrl: 'https://www.pcguide.com/gpu/review/msi-suprim-soc-rtx-5090/', method: 'reference-calibrated', referenceGpu: 'Radeon RX 9070 XT' } });
    const comparison = await call('compare_build_options', { game: 'cyberpunk-2077', alternatives });
    expect(comparison).not.toHaveProperty('error');
    expect(comparison.alternatives).toHaveLength(3);
    expect(comparison.baseline.simulation).toEqual(estimate.simulation);
    for (const alternative of comparison.alternatives) expect(alternative.simulation.game).toBe('cyberpunk-2077');
    for (const tool of ['estimate_performance', 'compare_build_options']) {
      expect(await call(tool, { game: 'invented', alternatives })).toMatchObject({ game: 'invented', benchmark: 'no benchmark', status: 'unavailable', message: 'invented - no benchmark' });
      expect(await call(tool, { game: 'fortnite', scenario: 'competitive', alternatives })).toMatchObject({ error: 'conflicting_workload' });
    }
    expect(await call('compare_build_options', { games: ['fortnite', 'invented'], alternatives })).toMatchObject({ game: 'invented', benchmark: 'no benchmark', message: 'invented - no benchmark' });
    expect(app.state).toEqual(before);
  });

  it('returns three game simulations in one bounded comparison', async () => {
    fullBuild();
    const alternatives = CATALOG.gpu.filter(p => p.id !== app.state.picks.gpu).slice(0, 3).map(p => ({ gpu: p.id }));
    const result = await call('compare_build_options', {
      alternatives,
      games: ['fortnite', 'counter-strike-2', 'cyberpunk-2077'],
    });
    expect(result.games).toEqual(['fortnite', 'counter-strike-2', 'cyberpunk-2077']);
    expect(Object.keys(result.simulations)).toEqual(['fortnite', 'counter-strike-2', 'cyberpunk-2077']);
    expect(result.simulations.fortnite.baseline.game).toBe('fortnite');
    expect(result.simulations['counter-strike-2'].alternatives).toHaveLength(3);
    expect(result.simulations['cyberpunk-2077'].baseline.kind).toBe('simulation');
  });
  it('returns comparison facts without deciding whether to create a watchdog', async () => {
    const proposal = recommendBuild(1500, '1440p', true);
    app.state = { ...app.state, picks: proposal.picks, budget: 1500, res: '1440p', chosen: [...BUILD_SLOTS] };
    const result = await call('compare_build_options', {
      alternatives: [{ gpu: 'fabrikam-rx-9080-xt', psu: 'adventure-core-850g' }],
      games: ['fortnite', 'counter-strike-2', 'cyberpunk-2077'],
    });
    expect(result).not.toHaveProperty('watchdogOffer');
    expect(result).not.toHaveProperty('watchdogOffers');
    expect(result.alternatives[0]).toMatchObject({
      inStock: false,
      shipsInDays: 8,
      blockedBy: 'out_of_stock',
    });
    expect(result.simulations.fortnite.alternatives[0].delta.simulatedAverageFps).toBeGreaterThan(0);
  });
  it.each(['counter-strike-2', 'fortnite', 'cyberpunk-2077'] as const)('keeps compact provenance metadata for %s comparisons', async game => {
    fullBuild();
    const alternatives = CATALOG.gpu.filter(p => p.id !== app.state.picks.gpu).slice(0, 3).map(p => ({ gpu: p.id }));
    const estimate = await call('estimate_performance', { game });
    expect(estimate).not.toHaveProperty('error');
    expect(estimate.simulation).toMatchObject({ game, preset: expect.any(String), sourceUrl: expect.stringMatching(/^https:\/\//), method: expect.any(String), referenceGpu: expect.any(String) });
    const comparison = await call('compare_build_options', { game, alternatives });
    expect(comparison).not.toHaveProperty('error');
    expect(comparison.alternatives).toHaveLength(3);
    expect(comparison.baseline.simulation).toMatchObject({ game, preset: estimate.simulation.preset, sourceUrl: estimate.simulation.sourceUrl, method: estimate.simulation.method, referenceGpu: estimate.simulation.referenceGpu });
    for (const alternative of comparison.alternatives) expect(alternative.simulation).toMatchObject({ game, preset: expect.any(String), sourceUrl: expect.stringMatching(/^https:\/\//), method: expect.any(String), referenceGpu: expect.any(String) });
  });
  it('exposes versioned simulation separately from unknown measured FPS and validates scenarios', async () => {
    fullBuild();
    const estimate = await call('estimate_performance', { scenario: 'competitive' });
    expect(estimate).not.toHaveProperty('error');
    expect(estimate).toMatchObject({ fps: null, simulation: { kind: 'simulation', datasetVersion: 'rigsmith-simulation-v1', scenario: 'competitive', status: 'available' } });
    expect(estimate.simulation.averageFps).toBeGreaterThan(0);
    expect(await call('estimate_performance', { scenario: 'invented' })).toMatchObject({ error: 'invalid_scenario' });
    expect(await call('compare_build_options', { scenario: 'invented', alternatives: [{}] })).toMatchObject({ error: 'invalid_scenario' });
    const alternatives = CATALOG.gpu.filter(p => p.id !== app.state.picks.gpu).slice(0, 3).map(p => ({ gpu: p.id }));
    const compared = await call('compare_build_options', { scenario: 'competitive', alternatives });
    expect(compared).not.toHaveProperty('error');
    expect(compared.alternatives).toHaveLength(3);
    expect(compared.baseline.simulation).toEqual(estimate.simulation);
    expect(compared.simulationBasis).toContain('not measured');
    const report = await call('check_build_compatibility');
    expect(report).not.toHaveProperty('error');
    expect(report.simulation.kind).toBe('simulation');
    expect(report).not.toHaveProperty('decisionReview');
  });
  it('requires a real complete baseline and rejects malformed or duplicate alternatives', async () => {
    expect(await call('compare_build_options', { alternatives: [{ gpu: CATALOG.gpu[0].id }] })).toMatchObject({ error: 'build_incomplete' });
    fullBuild();
    for (const alternatives of [[], [{}], [null], [{ cpu: 'invented' }], [{ cpu: CATALOG.gpu[0].id }], [{ unknown: 'anything' }], Array(4).fill({ gpu: CATALOG.gpu[0].id })]) {
      expect(await call('compare_build_options', { alternatives })).toMatchObject({ error: 'invalid_alternatives' });
    }
    expect(await call('compare_build_options', { alternatives: [{ gpu: app.state.picks.gpu }] })).toMatchObject({ error: 'duplicate_alternative' });
  });
  it('compares whole-build marginal gains, preserves all state and recomputes after changes', async () => {
    fullBuild();
    const before = structuredClone(app.state);
    const gpu = CATALOG.gpu.find(item => item.id !== app.state.picks.gpu)!;
    const base = metrics(app.state.picks, app.state.res);
    const changed = metrics({ ...app.state.picks, gpu: gpu.id }, app.state.res);
    const result = await call('compare_build_options', { alternatives: [{ gpu: gpu.id }] });
    expect(result.baseline.priceUSD).toBe(base.price);
    expect(result.baseline.performance).toMatchObject({ fps: null });
    expect(result.baseline.performance.basis).toContain('not a game benchmark');
    expect(result.baseline.acoustics.noiseDb).toBeNull();
    expect(result.baseline.acoustics.basis).toContain('not lab measurements');
    expect(result.alternatives[0]).toMatchObject({
      priceUSD: changed.price,
      performance: { fps: null },
      delta: { priceUSD: changed.price - base.price, modeledFps: null, powerW: changed.watt - base.watt },
    });
    expect(result).not.toHaveProperty('winner');
    expect(app.state).toEqual(before);
    const estimate = await call('estimate_performance');
    expect(estimate).toMatchObject({ fps: null, noise: null, noiseDb: null, arrival: null });
    expect(estimate.basis).toContain('not a game benchmark');
    expect(estimate.noiseBasis).toContain('not lab measurements');
    await app.setTargets({ budget: changed.price - 1 });
    const revised = await call('compare_build_options', { alternatives: [{ gpu: gpu.id }] });
    expect(revised.revision).toBeGreaterThan(result.revision);
    expect(revised.alternatives[0]).toMatchObject({ eligible: false, withinBudget: false, remainingUSD: -1 });
  });
  it('checks the whole platform, stock and case fans instead of just the swapped part', async () => {
    fullBuild();
    const socket = CATALOG.cpu.find(item => item.id === app.state.picks.cpu)!.socket;
    const other = CATALOG.cpu.find(item => item.socket !== socket)!;
    const result = await call('compare_build_options', { alternatives: [{ cpu: other.id }] });
    expect(result.alternatives[0]).toMatchObject({ eligible: false, blockedBy: 'build_incompatible' });
    const unavailable = CATALOG.gpu.find(item => listingStock(item, 'gpu') === 0)!;
    expect((await call('compare_build_options', { alternatives: [{ gpu: unavailable.id }] })).alternatives[0].eligible).toBe(false);
    const cs = CATALOG.case.find(item => item.id !== app.state.picks.case)!;
    const caseResult = await call('compare_build_options', { alternatives: [{ case: cs.id }] });
    expect(caseResult.alternatives[0].changes).toMatchObject({ case: cs.id, fans: bundledFans(cs.id) });
    expect(await call('compare_build_options', { alternatives: [{ case: cs.id, fans: bundledFans(app.state.picks.case) }] })).toMatchObject({ error: 'invalid_alternatives' });
  });
});

describe('shared orderability and committed writes', () => {
  it('allows an unfinished build in the cart, but requires it to be complete at checkout', async () => {
    const cpu = CATALOG.cpu.find(item => listingStock(item, 'cpu') > 0)!;
    await app.setBuilderPart('cpu', cpu.id);
    expect(await app.addBuildToCart()).toMatchObject({ added: 'build', price: cpu.price });
    expect(app.state.cart).toEqual([{ kind: 'build', id: 'build', qty: 1 }]);
    expect(await call('start_checkout')).toMatchObject({ error: 'build_incomplete' });
  });
  it('blocks unavailable builds at add and checkout and flags them in cart', async () => {
    fullBuild();
    app.state.picks = { ...app.state.picks, cooler: 'alpine-liquid-420' };
    expect(metrics(app.state.picks).fits).toBe(true);
    expect(await call('add_build_to_cart')).toMatchObject({ error: 'out_of_stock' });
    app.state.cart = [{ kind: 'build', id: 'build', qty: 1 }];
    expect(cartTotals(app.state.cart, app.metrics(), app.state.picks).rows[0].outOfStock).toBe(true);
    expect(await call('start_checkout')).toMatchObject({ error: 'out_of_stock' });
  });
  it('does not add quantities beyond stock or the total per-line limit', async () => {
    const product = CATALOG.gpu.find(p => listingStock(p, 'gpu') > 0 && listingStock(p, 'gpu') < 5)!;
    expect(await app.addToCart('gpu', product.id, 5)).toMatchObject({ error: 'insufficient_stock' });
    expect(app.state.cart).toEqual([]);
    await app.addToCart('gpu', product.id, listingStock(product, 'gpu'));
    expect(await app.addToCart('gpu', product.id)).toMatchObject({ error: 'insufficient_stock' });
    expect(await app.setCartQty(0, 1.5)).toMatchObject({ error: 'invalid_quantity' });
    expect(await app.setCartQty(0, NaN)).toMatchObject({ error: 'invalid_quantity' });
  });
  it('serializes concurrent cart writes without losing an update', async () => {
    const product = CATALOG.storage.find(p => listingStock(p, 'storage') >= 3)!;
    await Promise.all([app.addToCart('storage', product.id), app.addToCart('storage', product.id)]);
    expect(app.state.cart[0].qty).toBe(2);
    expect((await call('get_cart')).lines[0].qty).toBe(2);
  });
  it('returns only after checkout is actually on delivery', async () => {
    const product = CATALOG.storage.find(p => listingStock(p, 'storage') > 0)!;
    await app.addToCart('storage', product.id);
    app.state.step = 2;
    expect(await call('start_checkout')).toMatchObject({ opened: 'checkout', step: 'delivery' });
    expect(app.state.route).toBe('checkout');
    expect((await call('get_checkout_fields')).currentStep).toBe('delivery');
  });
  it('allows removal of a broken cart line', async () => {
    app.state.cart = [{ kind: 'build', id: 'build', qty: 1 }];
    expect(await app.removeCartLine(0)).toMatchObject({ removed: true });
    expect(app.state.cart).toEqual([]);
  });
  it('rechecks exact budget and combined stock across build and individual lines', async () => {
    fullBuild();
    const cost = app.metrics().price;
    await app.setTargets({ budget: cost - 1 });
    expect(await app.addBuildToCart()).toMatchObject({ error: 'over_budget' });
    await app.setTargets({ budget: cost });
    expect(await app.addBuildToCart()).not.toHaveProperty('error');
    const gpu = CATALOG.gpu.find(p => p.id === app.state.picks.gpu)!;
    const stock = listingStock(gpu, 'gpu');
    expect(await app.addToCart('gpu', gpu.id, stock)).toMatchObject({ error: 'insufficient_stock' });
    expect(app.state.cart).toHaveLength(1);
  });
  it('paginates past character-budget truncation without skipping candidates', async () => {
    const ids: string[] = [];
    let offset: number | null = 0;
    while (offset !== null) {
      const page = await call('search_products', { category: 'cpu', limit: 20, offset });
      ids.push(...page.items.map((item: any) => item.id));
      if (page.nextOffset !== null) expect(page.nextOffset).toBeGreaterThan(offset);
      offset = page.nextOffset;
    }
    expect(new Set(ids).size).toBe(CATALOG.cpu.length);
    expect(ids.length).toBe(CATALOG.cpu.length);
  });
  it('awaits asynchronous read sections', async () => {
    const productTool = TOOLS.find(tool => tool.name === 'get_product')!;
    vi.spyOn(productTool, 'execute').mockImplementation(async () => ({ content: [{ type: 'text', text: '{"asyncResult":true}' }] }));
    const snapshot = await call('read_shop', { productIds: [CATALOG.cpu[0].id] });
    expect(snapshot.sections[`product:${CATALOG.cpu[0].id}`]).toEqual({ asyncResult: true });
  });
  it('calculates delivery from today, with an explicit date available for tests', () => {
    expect(shipDate(2, new Date(2026, 8, 10))).toBe('Sat 12 Sep');
    expect(shipDate(2)).toBe(shipDate(2, new Date()));
  });
});
