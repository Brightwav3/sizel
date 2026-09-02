import { partIn } from '../../data/catalog/catalog';
import { listingStock } from '../../data/catalog/listingStock';
import { requireQuantity, ShopError } from '../build/selection';
import type { CartLine, PcSlot, Picks } from '../../shared/lib/types';

export function cartBlocker(cart: CartLine[], picks: Picks, chosen: PcSlot[], budget: number): ShopError | null {
  if (!cart.length) return new ShopError('cart_empty', 'Add a product or build first.');
  const needed = new Map<string, { slot: PcSlot | NonNullable<CartLine['slot']>; qty: number }>();
  for (const line of cart) {
    try { requireQuantity(line.qty, line.kind === 'build' ? 1 : 5); } catch (error) { return error as ShopError; }
    if (line.qty === 0) return new ShopError('invalid_quantity', 'Remove empty cart lines.');
    if (line.kind === 'build') {
      for (const slot of chosen) {
        const previous = needed.get(picks[slot]);
        needed.set(picks[slot], { slot, qty: (previous?.qty ?? 0) + 1 });
      }
    } else {
      if (!line.slot || !partIn(line.slot, line.id)) return new ShopError('product_not_found', 'Remove the unknown product.');
      const previous = needed.get(line.id);
      needed.set(line.id, { slot: line.slot, qty: (previous?.qty ?? 0) + line.qty });
    }
  }
  for (const [id, { slot, qty }] of needed) {
    const product = partIn(slot, id)!;
    const stock = listingStock(product, slot);
    if (stock < qty) return new ShopError(stock === 0 ? 'out_of_stock' : 'insufficient_stock', `${product.name}: ${stock} available, ${qty} requested across the cart.`);
  }
  return null;
}
