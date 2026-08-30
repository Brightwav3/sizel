import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PICKS } from '../../data/catalog/catalog';
import { metrics, requiredPower } from '../../entities/build/metrics';
import { recommendBuild } from './buildAdvisor';
import { OUTPUT_BUDGET, SNAPSHOT_OUTPUT_BUDGET } from './toolResult';

const holder = vi.hoisted(() => ({ instance: null as any }));
vi.mock('../state/appInstance', () => ({ requireRigsmithApp: () => holder.instance }));
import { TOOLS, toolsForRoute } from './tools';

const call = (name: string, args = {}) => {
  const result = TOOLS.find(tool => tool.name === name)!.execute(args) as any;
  const text = result.content[0].text;
  expect(text.length).toBeLessThanOrEqual(name === 'read_shop' ? SNAPSHOT_OUTPUT_BUDGET : OUTPUT_BUDGET);
  const data = JSON.parse(text);
  expect(data.error).toBeUndefined();
  return data;
};
beforeEach(() => {
  const picks = recommendBuild(1700, '1440p', true, 144).picks;
  holder.instance = { state: { picks, res: '1440p' }, metrics: () => metrics(picks, '1440p') };
});
describe('fewer WebMCP round trips', () => {
  it('combines search, comparisons and build inspection without navigation', () => {
    const result = call('read_shop', {
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
  });
  it('keeps good sections when a product fails and never dispatches arbitrary writes', () => {
    const result = call('read_shop', {
      productIds: ['not-a-real-product'], include: ['build', 'add_build_to_cart'],
    });
    expect(result.sections['product:not-a-real-product'].error).toBe('product_not_found');
    expect(result.sections.build.compatible).toBe(true);
    expect(result.sections.add_build_to_cart).toBeUndefined();
  });
  it('returns phone differences and shared cameras without detail lookups', () => {
    const result = call('compare_products', { productIds: ['pear-phone-16-pro::512gb', 'pear-phone-16-pro-max', 'pear-phone-16-pro-max::1024gb'] });
    expect(result.items).toHaveLength(3);
    expect(result.items[0].differs.displayInches).toBe(6.3);
    expect(result.items[1].differs.batteryMah).toBe(4700);
    expect(result.items[2].differs.storageGB).toBe(1024);
    expect(result.shared.rearCameras).toContain('48MP');
  });
  it('compares three consoles without repeating the build or dropping a device', () => {
    const ids = ['fourth-castle-castle-5-pro', 'y-ball-series-x', 'adventure-go-2-oled::1024gb'];
    const result = call('compare_build_to_product', { productIds: ids });
    expect(result.devices.map((device: any) => device.id)).toEqual(ids);
    for (const device of result.devices) expect(device.priceDifference).toBe(result.build.price - device.price);
    expect(call('compare_build_to_product', { productId: ids[0] }).device.id).toBe(ids[0]);
  });
  it('returns a complete build report within the response budget', () => {
    const result = call('check_build_compatibility');
    expect(result.socket.cpu).toBe(result.socket.board);
    expect(result.clearance.gpuMm).toBeLessThanOrEqual(result.clearance.caseMm);
    expect(result.power.headroomW).toBe(result.power.psuW - result.power.drawW);
    expect(result.power.psuW).toBeGreaterThanOrEqual(requiredPower(holder.instance.state.picks));
    expect(result.gpu.stock).toBeDefined();
    expect(result.performance.basis).toContain('not a game benchmark');
    expect(result.bottleneck).toBeTruthy();
  });
  it('does not offer an undersized PSU for the RX 9070 XT', () => {
    const picks = { ...DEFAULT_PICKS, gpu: 'fabrikam-rx-9070-xt', psu: 'acme-labs-powercore-650' };
    expect(requiredPower(picks)).toBe(750);
    expect(metrics(picks).fits).toBe(false);
  });
  it('exposes read-only comparisons on home without adding build editors', () => {
    const names = toolsForRoute('home').map(tool => tool.name);
    expect(names).toContain('compare_products');
    expect(names).toContain('check_build_compatibility');
    expect(names).toContain('compare_build_to_product');
    expect(names).not.toContain('set_build_component');
  });
});
