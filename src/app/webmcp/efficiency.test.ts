import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PICKS } from '../../data/catalog/catalog';
import { metrics, requiredPower } from '../../entities/build/metrics';
import { recommendBuild } from './buildAdvisor';
import { BUILD_REPORT_BUDGET, OUTPUT_BUDGET, SNAPSHOT_OUTPUT_BUDGET } from './toolResult';

const PC_SLOTS = ['cpu', 'gpu', 'board', 'ram', 'storage', 'cooler', 'psu', 'case', 'fans'];

const holder = vi.hoisted(() => ({ instance: null as any }));
vi.mock('../state/appInstance', () => ({ requireRigsmithApp: () => holder.instance }));
import { TOOLS, toolsForRoute } from './tools';

const call = async (name: string, args = {}) => {
  const result = await TOOLS.find(tool => tool.name === name)!.execute(args);
  const text = result.content[0].text;
  const ceiling = name === 'read_shop' ? SNAPSHOT_OUTPUT_BUDGET
    : name === 'check_build_compatibility' ? BUILD_REPORT_BUDGET : OUTPUT_BUDGET;
  expect(text.length).toBeLessThanOrEqual(ceiling);
  const data = JSON.parse(text);
  expect(data.error).toBeUndefined();
  return data;
};
beforeEach(() => {
  const picks = recommendBuild(1700, '1440p', true, 144).picks;
  holder.instance = { state: { picks, chosen: PC_SLOTS, budget: 1700, cart: [], watchdogs: [], res: '1440p' }, metrics: () => metrics(picks, '1440p') };
});
describe('fewer WebMCP round trips', () => {
  it('searches and compares distinct models without an agent round trip for ids', async () => {
    const result = await call('read_shop', {
      search: { category: 'phones', brand: 'Pear', sort: 'priceDesc', inStockOnly: true, compare: true },
      compareDeviceSearch: { category: 'consoles', sort: 'priceDesc', limit: 5 },
    });
    expect(result.sections.searchComparison.items.length).toBeGreaterThanOrEqual(2);
    const ids = result.sections.search.selectedIds.map((id: string) => id.split('::')[0]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.sections.devices.devices).toHaveLength(3);
  });
  it('does not expose automatic whole-build selection', () => {
    expect(TOOLS.some(tool => tool.name === 'recommend_build')).toBe(false);
    expect(TOOLS.some(tool => tool.name === 'begin_build')).toBe(true);
    expect(TOOLS.some(tool => tool.name === 'inspect_build_options')).toBe(true);
  });
  it('combines search, comparisons and build inspection without extra round trips', async () => {
    const result = await call('read_shop', {
      search: { category: 'phones', brand: 'Pear', limit: 3 },
      compareProductIds: ['pear-phone-16-pro::512gb', 'pear-phone-16-pro-max'],
      compareDeviceIds: ['fourth-castle-castle-5-pro', 'y-ball-series-x'],
      include: ['build'],
    });
    expect(result.currency).toBe('USD');
    expect(result.sections.search.items).toHaveLength(3);
    expect(result.sections.comparison.items).toHaveLength(2);
    expect(result.sections.devices.devices).toHaveLength(2);
    expect(result.sections.build.power.headroomW).toBeGreaterThan(0);
    expect(result.sections.build.performance).toMatchObject({ fps: null });
  });
  it('keeps good sections when a product fails and never dispatches arbitrary writes', async () => {
    const result = await call('read_shop', {
      productIds: ['not-a-real-product'], include: ['build', 'add_build_to_cart'],
    });
    expect(result.sections['product:not-a-real-product'].error).toBe('product_not_found');
    expect(result.sections.build.compatible).toBe(true);
    expect(result.sections.add_build_to_cart).toBeUndefined();
  });
  it('returns phone differences and shared cameras without detail lookups', async () => {
    const result = await call('compare_products', { productIds: ['pear-phone-16-pro::512gb', 'pear-phone-16-pro-max', 'pear-phone-16-pro-max::1024gb'] });
    expect(result.items).toHaveLength(3);
    expect(result.items[0].differs.displayInches).toBe(6.3);
    expect(result.items[1].differs.batteryMah).toBe(4700);
    expect(result.items[2].differs.storageGB).toBe(1024);
    expect(result.shared.rearCameras).toContain('48MP');
  });
  it('compares three consoles without repeating the build or dropping a device', async () => {
    const ids = ['fourth-castle-castle-5-pro', 'y-ball-series-x', 'adventure-go-2-oled::1024gb'];
    const result = await call('compare_build_to_product', { productIds: ids });
    expect(result.devices.map((device: any) => device.id)).toEqual(ids);
    for (const device of result.devices) expect(device.priceDifference).toBe(result.build.price - device.price);
    expect((await call('compare_build_to_product', { productId: ids[0] })).device.id).toBe(ids[0]);
  });
  it('returns a complete build report within the response budget', async () => {
    const result = await call('check_build_compatibility');
    expect(result.socket.cpu).toBe(result.socket.board);
    expect(result.clearance.gpuMm).toBeLessThanOrEqual(result.clearance.caseMm);
    expect(result.power.headroomW).toBe(result.power.psuW - result.power.drawW);
    expect(result.power.psuW).toBeGreaterThanOrEqual(requiredPower(holder.instance.state.picks));
    expect(result.performance.fps).toBeNull();
    expect(result.performance.basis).toContain('not a game benchmark');
    expect(result.bottleneck).toContain('not a game benchmark');
    // Every slot, bundled fans included, so no follow-up stock calls are needed.
    expect(result.slots.map((entry: any) => entry.slot).sort())
      .toEqual([...PC_SLOTS].sort());
    expect(result.slots.find((entry: any) => entry.slot === 'fans').id).toBeTruthy();
    expect(result.availability.allInStock).toBe(true);
    expect(result.slots.reduce((sum: number, entry: any) => sum + entry.price, 0)).toBe(result.price);
  });

  it('agrees with check_stock on every slot, so the extra calls buy nothing', async () => {
    const result = await call('check_build_compatibility');
    for (const entry of result.slots) {
      const direct = await call('check_stock', { productId: entry.id });
      expect({ inStock: entry.inStock, units: entry.units, shipsInDays: entry.shipsInDays })
        .toEqual({ inStock: direct.inStock, units: direct.units, shipsInDays: direct.shipsInDays });
    }
  });

  it('names an unavailable non-GPU part and its delivery without another call', async () => {
    // The catalog ships its out-of-stock parts on the slow eight-day date, so
    // one fixture covers both the unavailable and the slow-delivery reading.
    const picks = { ...holder.instance.state.picks, cooler: 'alpine-liquid-420' };
    holder.instance = { state: { picks, chosen: PC_SLOTS, budget: 1700, cart: [], watchdogs: [], res: '1440p' }, metrics: () => metrics(picks, '1440p') };
    const result = await call('check_build_compatibility');
    const cooler = result.slots.find((entry: any) => entry.slot === 'cooler');
    expect(cooler.inStock).toBe(false);
    expect(cooler.units).toBe('0');
    expect(cooler.shipsInDays).toBe(8);
    expect(cooler.concern).toBe('out_of_stock');
    expect(result.availability.allInStock).toBe(false);
    expect(result.availability.outOfStock).toEqual(['cooler']);
    expect((await call('check_stock', { productId: cooler.id })).inStock).toBe(false);
  });

  it('keeps all nine slots when a phone comparison shares the response', async () => {
    const result = await call('read_shop', {
      search: { category: 'phones', brand: 'Pear', sort: 'priceDesc', compare: true },
      compareDeviceSearch: { category: 'consoles', sort: 'priceDesc', limit: 5 },
      include: ['build', 'cart', 'watchdogs'],
    });
    expect(result.sections.build.slots).toHaveLength(9);
    expect(result.sections.build.availability.allInStock).toBe(true);
    expect(result.sections.searchComparison.items.length).toBeGreaterThanOrEqual(2);
  });
  it('does not offer an undersized PSU for the RX 9070 XT', async () => {
    const picks = { ...DEFAULT_PICKS, gpu: 'fabrikam-rx-9070-xt', psu: 'acme-labs-powercore-650' };
    expect(requiredPower(picks)).toBe(750);
    expect(metrics(picks).fits).toBe(false);
  });
  it('exposes read-only comparisons on home without adding build editors', async () => {
    const names = toolsForRoute('home').map(tool => tool.name);
    expect(names).toContain('compare_products');
    expect(names).toContain('check_build_compatibility');
    expect(names).toContain('compare_build_to_product');
    expect(names).not.toContain('set_build_component');
  });
});
