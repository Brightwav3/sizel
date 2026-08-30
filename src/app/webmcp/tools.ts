// ADR 0006: tools are application-level, and write only through the controller.
// docs/decisions/0006-webmcp-tools-follow-the-screen.md
/**
 * The Rigsmith WebMCP tool set.
 *
 * Every handler reads and writes the same state the shopper is looking at, so
 * a tool call is visible on screen the moment it lands. Read-only tools carry
 * `readOnlyHint`; the ones that spend money or change the build do not, which
 * is what lets an agent decide when to ask the person first.
 *
 * Budgets, per Chrome's WebMCP guidance: 30 characters for a name, 500 for a
 * description, 150 for a parameter description, 1.5K for a result. Result size
 * is enforced in toolResult.ts.
 */
import type { RigsmithApp } from "../App";
import { requireRigsmithApp } from "../state/appInstance";
import { CATALOG, CAT_META, DEFAULT_PICKS, ORDER } from "../../data/catalog/catalog";
import { listingStock, stockLabel } from "../../data/catalog/listingStock";
import { metrics, money, noiseWord, part, shipDate } from "../../entities/build/metrics";
import type { Resolution } from "../../entities/build/metrics";
import {
  brandOf, facetSummary, findProduct, partFits, productSummary, productTitle, searchProducts,
} from "../../entities/product/queries";
import type { SortId } from "../../entities/product/queries";
import type { Part, PcSlot, Picks, Route, Slot } from "../../shared/lib/types";
import { bottleneck, fansForCase, fixOptions, powerReport, recommendBuild } from "./buildAdvisor";
import { fail, ok } from "./toolResult";
import type { ToolDescriptor } from "./webmcpApi";

/** A tool, plus the routes it makes sense on. */
export interface RigsmithTool extends ToolDescriptor {
  /** Screens this tool is offered on. Empty means every screen. */
  routes: Route[];
}

const PC_SLOTS: PcSlot[] = ["cpu", "gpu", "board", "ram", "storage", "cooler", "psu", "case", "fans"];
const CATEGORIES: Slot[] = [...PC_SLOTS, "phones", "consoles"];
const RESOLUTIONS: Resolution[] = ["1080p", "1440p", "4K"];
const SORTS: SortId[] = ["popular", "price", "priceDesc", "perf", "new"];

const app = (): RigsmithApp => requireRigsmithApp();

// Schema helpers -------------------------------------------------------
const str = (description: string, values?: readonly string[]) =>
  values ? { type: "string", enum: [...values], description } : { type: "string", description };
const num = (description: string) => ({ type: "number", description });
const bool = (description: string) => ({ type: "boolean", description });
const schema = (properties: Record<string, unknown>, required: string[] = []) =>
  ({ type: "object", properties, required, additionalProperties: false });
const NO_INPUT = schema({});

// Result shapes --------------------------------------------------------
/** The listing fields an agent needs to choose. Anything more blows the budget. */
const brief = (product: Part, category?: Slot) => {
  const summary = productSummary(product, category);
  return {
    id: summary.id,
    name: summary.name,
    brand: summary.brand,
    price: summary.price,
    stock: summary.availability,
    shipsInDays: summary.shipsInDays,
  };
};

/** The compatibility facts, only where the catalog actually carries them. */
const facts = (product: Part) => {
  const all: Record<string, unknown> = {
    socket: product.socket, memoryType: product.memoryType, formFactor: product.formFactor,
    supportedSockets: product.supportedSockets, supportedMotherboards: product.supportedMotherboards,
    storageInterface: product.storageInterface, storageInterfaces: product.storageInterfaces,
    lengthMm: product.len, clearanceMm: product.clearance, wattage: product.watt,
    cpuPowerW: product.cpuPowerW, fps1440p: product.fps, score: product.score, noiseDb: product.noise,
  };
  return Object.fromEntries(Object.entries(all).filter(([, value]) => value !== undefined));
};

const slotName = (slot: PcSlot) => ORDER.find(entry => entry.slot === slot)?.cat ?? slot;

const locate = (productId: string) => {
  const found = findProduct(productId);
  return found ?? null;
};

const resolutionOf = (value: unknown, fallback: Resolution): Resolution =>
  RESOLUTIONS.includes(value as Resolution) ? value as Resolution : fallback;

// Tools ----------------------------------------------------------------
export const TOOLS: RigsmithTool[] = [
  {
    name: "search_products",
    description:
      "Search the Rigsmith catalog: PC parts, phones and consoles. Filter by free text, category, brand, price, stock or sale. Returns compact listings; call get_product for full specifications. Ask for a small limit and refine rather than paging through everything.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: [],
    inputSchema: schema({
      query: str("Free text across name, model, description and specifications."),
      category: str("Category to search. Omit when using free text.", CATEGORIES),
      brand: str("Brand name exactly as the catalog spells it."),
      minPrice: num("Lowest price in US dollars."),
      maxPrice: num("Highest price in US dollars."),
      inStockOnly: bool("Keep only listings in stock that ship within two days."),
      onSale: bool("Keep only listings currently on sale."),
      sort: str("Result order. 'perf' ranks by frame rate or benchmark score.", SORTS),
      limit: num("How many listings to return, 1 to 20. Defaults to 5."),
    }),
    execute(args) {
      const category = (args.category ?? undefined) as Slot | undefined;
      const result = searchProducts({
        search: args.query,
        category: category ?? (args.query ? undefined : "gpu"),
        brand: args.brand,
        minPrice: args.minPrice,
        maxPrice: args.maxPrice,
        stockOnly: args.inStockOnly,
        onSale: args.onSale,
        sort: args.sort as SortId | undefined,
      });
      const limit = Math.min(20, Math.max(1, Math.round(args.limit ?? 5)));
      const items = result.items.slice(0, limit).map(product => {
        const found = category ? { category } : locate(product.id);
        return brief(product, found?.category ?? category);
      });
      return ok({ total: result.items.length, showing: items.length, items }, "items");
    },
  },

  {
    name: "get_product",
    description:
      "Full record for one catalog listing: price, availability, delivery, description and the compatibility facts used by check_build_compatibility. Use the id returned by search_products.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: [],
    inputSchema: schema({ productId: str("Catalog id, exactly as returned by another tool.") }, ["productId"]),
    execute(args) {
      const found = locate(args.productId);
      if (!found) return fail("product_not_found", "Call search_products to get a valid id.");
      const { product, category } = found;
      return ok({
        ...brief(product, category),
        category,
        categoryName: CAT_META[category]?.name,
        description: product.description ?? product.note,
        specs: product.specs?.slice(0, 6),
        facts: facts(product),
        url: `/product/${encodeURIComponent(product.id)}`,
      });
    },
  },

  {
    name: "get_current_build",
    description:
      "The PC the shopper has on screen right now: the part in each of the nine slots, the total price, frame rate, power draw and whether anything clashes. Read this before changing the build.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: [],
    inputSchema: NO_INPUT,
    execute() {
      const instance = app();
      const model = instance.metrics();
      return ok({
        slots: PC_SLOTS.map(slot => {
          const item = part(instance.state.picks, slot);
          return { slot, id: item.id, name: item.name, price: item.price };
        }),
        chosenByShopper: instance.state.chosen,
        price: model.price,
        priceLabel: money(model.price),
        fps: model.fps,
        resolution: instance.state.res,
        powerW: model.watt,
        shipsInDays: model.days,
        compatible: model.fits,
        issueCount: model.issues.length,
      }, "slots");
    },
  },

  {
    name: "list_filters",
    description:
      "The filters a category actually supports, with the values in the catalog and how many listings each matches. Read this before guessing filter names for show_in_catalog.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: ["home", "category", "product", "builder"],
    inputSchema: schema({ category: str("Category to describe.", CATEGORIES) }, ["category"]),
    execute(args) {
      const facets = facetSummary({ category: args.category as Slot }).map(facet => ({
        id: facet.id,
        label: facet.label,
        affectsFit: facet.fit,
        values: facet.options.slice(0, 6).map(option => option.value),
      }));
      return ok({ category: args.category, facets }, "facets");
    },
  },

  {
    name: "compare_products",
    description:
      "Compare two to four listings side by side: price, delivery and the specifications where they differ. Use it to answer 'which of these should I take' without pulling every full record.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: ["home", "category", "product", "builder"],
    inputSchema: schema({
      productIds: {
        type: "array", minItems: 2, maxItems: 4, items: { type: "string" },
        description: "Two to four catalog ids to compare.",
      },
    }, ["productIds"]),
    execute(args) {
      const found = (args.productIds as string[]).map(locate);
      if (found.some(entry => !entry)) return fail("product_not_found", "Every id must come from search_products.");
      const entries = found as { product: Part; category: Slot }[];
      const keys = Array.from(new Set(entries.flatMap(entry => Object.keys(facts(entry.product)))));
      const differing = keys.filter(key => new Set(entries.map(entry => JSON.stringify((facts(entry.product) as any)[key]))).size > 1);
      return ok({
        items: entries.map(entry => ({
          id: entry.product.id,
          name: productTitle(entry.product, entry.category),
          price: entry.product.price,
          shipsInDays: entry.product.days,
          differs: Object.fromEntries(differing.map(key => [key, (facts(entry.product) as any)[key] ?? null])),
        })),
      }, "items");
    },
  },

  {
    name: "check_stock",
    description:
      "Stock on hand and the delivery date for one listing. Say so plainly when a part is out of stock or slow, and offer create_watchdog instead of a silent substitution.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: ["category", "product", "builder", "cart"],
    inputSchema: schema({ productId: str("Catalog id to check.") }, ["productId"]),
    execute(args) {
      const found = locate(args.productId);
      if (!found) return fail("product_not_found", "Call search_products to get a valid id.");
      const count = listingStock(found.product, found.category);
      return ok({
        id: found.product.id,
        name: productTitle(found.product, found.category),
        inStock: count > 0,
        units: stockLabel(count),
        shipsInDays: found.product.days,
        arrives: shipDate(found.product.days),
      });
    },
  },

  {
    name: "show_in_catalog",
    description:
      "Put a search on the shopper's screen: open a category, product page, builder or cart, and apply a text query, brand or price range. Use it so the person can see what you looked at instead of only reading your summary.",
    routes: [],
    inputSchema: schema({
      view: str("Screen to open. Defaults to the category listing.", ["category", "product", "builder", "cart"]),
      category: str("Category to show.", CATEGORIES),
      productId: str("Product to open. Required when view is 'product'."),
      query: str("Text to put in the search box."),
      brand: str("Brand to narrow to, or 'any'."),
      minPrice: num("Lowest price in US dollars."),
      maxPrice: num("Highest price in US dollars."),
    }),
    execute(args) {
      const instance = app();
      const view = args.view ?? (args.productId ? "product" : "category");
      if (view === "product") {
        const found = args.productId ? locate(args.productId) : null;
        if (!found) return fail("product_not_found", "Pass a productId from search_products.");
        instance.showInCatalog({
          route: "product", productId: found.product.id,
          category: found.category, productSlot: found.category,
          dept: found.category === "phones" ? "phone" : found.category === "consoles" ? "gaming" : "pc",
        });
        return ok({ shown: "product", productId: found.product.id });
      }
      if (view === "builder" || view === "cart") {
        instance.showInCatalog({ route: view });
        return ok({ shown: view });
      }
      const category = (args.category ?? instance.state.category) as Slot;
      instance.showInCatalog({
        route: "category", category, productSlot: category,
        dept: category === "phones" ? "phone" : category === "consoles" ? "gaming" : "pc",
        search: args.query ?? "",
        brand: args.brand ?? "any",
        minPrice: args.minPrice ?? 0,
        maxPrice: args.maxPrice ?? 2200,
        facetFilters: {},
      });
      return ok({ shown: "category", category, matches: searchProducts({ category, search: args.query, brand: args.brand }).items.length });
    },
  },

  {
    name: "list_compatible_parts",
    description:
      "Parts for one build slot that raise no compatibility issue against the build on screen. Different from search_products: this filters against what the shopper has already chosen, so nothing here can break the machine.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: ["category", "product", "builder"],
    inputSchema: schema({
      slot: str("Build slot to fill.", PC_SLOTS),
      maxPrice: num("Highest price in US dollars."),
      limit: num("How many parts to return, 1 to 10. Defaults to 5."),
    }, ["slot"]),
    execute(args) {
      const instance = app();
      const slot = args.slot as PcSlot;
      const build = instance.chosenPicks();
      const limit = Math.min(10, Math.max(1, Math.round(args.limit ?? 5)));
      const pool = CATALOG[slot]
        .filter(product => args.maxPrice === undefined || product.price <= args.maxPrice)
        .filter(product => partFits(product, slot, build));
      return ok({
        slot,
        slotName: slotName(slot),
        fitting: pool.length,
        of: CATALOG[slot].length,
        items: pool.slice(0, limit).map(product => brief(product, slot)),
      }, "items");
    },
  },

  {
    name: "set_build_component",
    description:
      "Put a part into the build on screen, or return a slot to its default. Changing the case brings its bundled fans with it. The change is visible immediately and can be reversed with undo_build_change.",
    routes: ["category", "product", "builder"],
    inputSchema: schema({
      slot: str("Build slot to change.", PC_SLOTS),
      productId: str("Part to fit. Leave empty when action is 'reset'."),
      action: str("'set' fits a part, 'reset' restores the default.", ["set", "reset"]),
    }, ["slot"]),
    execute(args) {
      const instance = app();
      const slot = args.slot as PcSlot;
      const res = instance.state.res as Resolution;
      if (args.action === "reset" || !args.productId) {
        const next = { ...instance.state.picks, [slot]: DEFAULT_PICKS[slot] } as Picks;
        instance.resetSlot(slot);
        return ok({ slot, action: "reset", price: metrics(next, res).price });
      }
      const found = locate(args.productId);
      if (!found) return fail("product_not_found", "Call list_compatible_parts for ids that fit this slot.");
      if (found.category !== slot) return fail("wrong_slot", `${args.productId} belongs to the ${found.category} category.`);
      const next = {
        ...instance.state.picks,
        [slot]: found.product.id,
        ...(slot === "case" ? { fans: fansForCase(found.product.id) } : {}),
      } as Picks;
      instance.set(slot, found.product.id);
      if (slot === "case") instance.set("fans", fansForCase(found.product.id));
      const model = metrics(next, res);
      return ok({
        slot, fitted: found.product.name,
        price: model.price, fps: model.fps, powerW: model.watt,
        compatible: model.fits, issues: model.issues.slice(0, 2),
      });
    },
  },

  {
    name: "check_build_compatibility",
    description:
      "Check the build on screen for socket, memory, form factor, clearance, cooling and power conflicts. Returns one plain sentence per conflict plus the power headroom. When something clashes, call fix_build_issue rather than guessing at a replacement.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: ["product", "builder", "cart"],
    inputSchema: NO_INPUT,
    execute() {
      const instance = app();
      const model = instance.metrics();
      return ok({
        compatible: model.fits,
        issues: model.issues,
        power: powerReport(instance.state.picks),
      }, "issues");
    },
  },

  {
    name: "estimate_performance",
    description:
      "Frame rate, noise, price, power and delivery for the build on screen at a chosen resolution. The numbers are the same ones the shopper sees, so quote them as they are.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: ["product", "builder", "cart"],
    inputSchema: schema({ resolution: str("Resolution to estimate at. Defaults to the shopper's setting.", RESOLUTIONS) }),
    execute(args) {
      const instance = app();
      const res = resolutionOf(args.resolution, instance.state.res as Resolution);
      const model = metrics(instance.state.picks, res);
      return ok({
        resolution: res,
        fps: model.fps,
        noise: noiseWord(model.noise),
        noiseDb: Math.round(model.noise),
        price: model.price,
        priceLabel: money(model.price),
        powerW: model.watt,
        arrives: shipDate(model.days),
        compatible: model.fits,
      });
    },
  },

  {
    name: "explain_build_bottleneck",
    description:
      "Why the build on screen does not reach the frame rate its graphics card is capable of. Names the part that holds it back, the frames it costs, and the cheapest fitting upgrade that actually helps.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: ["product", "builder"],
    inputSchema: schema({ resolution: str("Resolution to reason about. Defaults to the shopper's setting.", RESOLUTIONS) }),
    execute(args) {
      const instance = app();
      const res = resolutionOf(args.resolution, instance.state.res as Resolution);
      return ok({ resolution: res, ...bottleneck(instance.state.picks, res) });
    },
  },

  {
    name: "fix_build_issue",
    description:
      "Replacements that clear every open compatibility issue in the build on screen, smallest price change first, with the effect on frame rate. Returns nothing when the build is already clean. Offer the options; let the shopper pick.",
    readOnlyHint: true,
    annotations: { readOnlyHint: true },
    routes: ["product", "builder"],
    inputSchema: schema({ slot: str("Restrict fixes to this slot. Omit to consider every part the conflict names.", PC_SLOTS) }),
    execute(args) {
      const instance = app();
      const model = instance.metrics();
      if (model.fits) return ok({ compatible: true, issues: [], options: [] });
      const options = fixOptions(instance.state.picks, instance.state.res as Resolution, args.slot as PcSlot | undefined);
      if (!options.length) {
        return ok({ compatible: false, issues: model.issues.slice(0, 2), options: [], hint: "No single swap clears this. Try recommend_build." });
      }
      return ok({ compatible: false, issues: model.issues.slice(0, 2), options: options.slice(0, 6) }, "options");
    },
  },

  {
    name: "recommend_build",
    description:
      "Assemble a complete nine-part PC for a budget, resolution and noise preference. Returns the parts, price, frame rate and power. It only proposes; pass apply true to put it on screen, and say what it costs before you do.",
    routes: ["home", "category", "builder"],
    inputSchema: schema({
      budget: num("Total budget in US dollars for the whole machine."),
      resolution: str("Resolution to build for. Defaults to 1440p.", RESOLUTIONS),
      quiet: bool("Prefer quieter parts where the choice is close."),
      apply: bool("Put the proposal into the build on screen. Defaults to false."),
    }, ["budget"]),
    execute(args) {
      const instance = app();
      const budget = Math.max(300, Number(args.budget) || 0);
      const res = resolutionOf(args.resolution, "1440p");
      const proposal = recommendBuild(budget, res, args.quiet ?? instance.state.quiet);
      if (args.apply) instance.applyPicks(proposal.picks, `Build for ${money(budget)} applied`);
      return ok({
        applied: Boolean(args.apply),
        budget, resolution: res,
        price: proposal.price, priceLabel: money(proposal.price),
        fps: proposal.fps, powerW: proposal.watt,
        headroom: proposal.headroom,
        compatible: proposal.issues.length === 0,
        parts: PC_SLOTS.map(slot => ({ slot, id: proposal.picks[slot], name: part(proposal.picks, slot).name })),
      }, "parts");
    },
  },

  {
    name: "set_build_target",
    description:
      "Set what the shopper is aiming for: budget, resolution, frame rate and whether the machine should be quiet. The controls move on screen, and recommend_build and estimate_performance use these as their defaults.",
    routes: ["home", "category", "builder"],
    inputSchema: schema({
      budget: num("Budget in US dollars."),
      resolution: str("Resolution to build for.", RESOLUTIONS),
      targetFps: num("Frame rate the shopper is aiming for."),
      quiet: bool("Whether a quiet machine matters."),
    }),
    execute(args) {
      const instance = app();
      const patch: Record<string, unknown> = {};
      if (typeof args.budget === "number") patch.budget = Math.max(300, Math.round(args.budget));
      if (args.resolution) patch.res = resolutionOf(args.resolution, instance.state.res as Resolution);
      if (typeof args.targetFps === "number") patch.target = Math.max(30, Math.round(args.targetFps));
      if (typeof args.quiet === "boolean") patch.quiet = args.quiet;
      if (!Object.keys(patch).length) return fail("nothing_to_set", "Pass at least one of budget, resolution, targetFps or quiet.");
      // React applies state on its own schedule, so the answer is the merge we
      // just handed it — reading the instance back here returns the old values.
      const next = { ...instance.state, ...patch };
      instance.setTargets(patch);
      return ok({ budget: next.budget, resolution: next.res, targetFps: next.target, quiet: next.quiet });
    },
  },

  {
    name: "undo_build_change",
    description:
      "Step the build back to how it was before the last change. One level, the same as the button on screen. Use it when the shopper rejects a swap you just made.",
    routes: ["category", "product", "builder"],
    inputSchema: NO_INPUT,
    execute() {
      const instance = app();
      const restored = instance.state.prev;
      if (!instance.undoBuild() || !restored) return fail("nothing_to_undo", "The build has not changed since it was last saved.");
      const model = metrics(restored, instance.state.res as Resolution);
      return ok({ undone: true, price: model.price, fps: model.fps, compatible: model.fits });
    },
  },

  {
    name: "create_watchdog",
    description:
      "Watch a listing and tell the shopper when it comes back in stock or its price drops. Everything stays on this device. Offer this instead of substituting a part the shopper actually wanted.",
    routes: ["category", "product"],
    inputSchema: schema({
      productId: str("Catalog id to watch."),
      kind: str("'availability' watches for stock, 'price' for a drop.", ["availability", "price"]),
    }, ["productId"]),
    execute(args) {
      const instance = app();
      const found = locate(args.productId);
      if (!found) return fail("product_not_found", "Call search_products to get a valid id.");
      const kind = args.kind === "price" ? "price" : "availability";
      if (instance.isWatched(found.product.id, kind)) return ok({ watching: true, alreadySet: true, productId: found.product.id, kind });
      instance.toggleWatchdog(found.category, found.product.id, kind);
      return ok({ watching: true, productId: found.product.id, name: found.product.name, kind, priceAtWatch: found.product.price });
    },
  },

  {
    name: "add_to_cart",
    description:
      "Add one catalog product to the cart. This spends the shopper's money, so confirm the exact product and price with them first and never add something they have not agreed to.",
    routes: ["category", "product"],
    inputSchema: schema({
      productId: str("Catalog id to add."),
      quantity: num("How many, 1 to 5. Defaults to 1."),
    }, ["productId"]),
    execute(args) {
      const instance = app();
      const found = locate(args.productId);
      if (!found) return fail("product_not_found", "Call search_products to get a valid id.");
      if (listingStock(found.product, found.category) === 0) {
        return fail("out_of_stock", "Offer create_watchdog so the shopper hears when it is back.");
      }
      const qty = Math.min(5, Math.max(1, Math.round(args.quantity ?? 1)));
      const known = instance.state.cart.some(line => line.kind === "product" && line.id === found.product.id);
      instance.addToCart(found.category, found.product.id, qty);
      return ok({
        added: found.product.name, quantity: qty,
        price: found.product.price * qty,
        cartLines: instance.state.cart.length + (known ? 0 : 1),
      });
    },
  },

  {
    name: "add_build_to_cart",
    description:
      "Put the assembled PC into the cart as one line and open the cart. Refuses while the build has an open compatibility issue. This spends the shopper's money, so confirm the total with them first.",
    routes: ["product", "builder", "cart"],
    inputSchema: NO_INPUT,
    execute() {
      const instance = app();
      const model = instance.metrics();
      if (!model.fits) return fail("build_incompatible", "Call fix_build_issue and clear the conflict first.");
      instance.addBuildToCart();
      return ok({ added: "build", price: model.price, priceLabel: money(model.price), fps: model.fps, arrives: shipDate(model.days) });
    },
  },
];

/** Tools offered on a screen. A tool with no routes is offered everywhere. */
export const toolsForRoute = (route: Route): RigsmithTool[] =>
  TOOLS.filter(tool => tool.routes.length === 0 || tool.routes.includes(route));

/** Every listed brand, for tool descriptions and tests. */
export const catalogBrands = () =>
  Array.from(new Set(Object.values(CATALOG).flat().map(brandOf))).sort();
