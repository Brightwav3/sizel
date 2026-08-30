import React from "react";
import { CATALOG } from "../../../data/catalog/catalog";
import { money } from "../../../entities/build/metrics";
import type { PcSlot } from "../../../shared/lib/types";
import type { BuildContext } from "../../../entities/build/buildContext";

export function buildHomeVals(context: BuildContext) {
  const { app, s, route, on, dept, allProducts, pick, valueGpu, quietGpu, featuredCpu, featuredCooler, featuredStorage, featuredPhone, featuredConsole, promoProduct, brandRibbon, homeDepartments, homeCategories } = context;
  return {
      heroProduct: {
        name: valueGpu.name,
        brand: valueGpu.brand,
        price: money(valueGpu.price),
        image: valueGpu.imagePath,
        go: () => app.setState({ route: "product", productSlot: "gpu", productId: valueGpu.id }),
      },
      brandRibbon,
      promotions: [
        {
          kind: "service",
          name: "Rigsmith PC configurator",
          brand: "Rigsmith service",
          price: "Free to use",
          image: "/catalog/promos/rigsmith-configurator-promo.png",
          availability: "Compatibility checked as you build",
          label: "PC configurator",
          copy: "Choose parts step by step and get a build that fits together.",
          heroEyebrow: "PC configurator",
          heroTitle: "Build a PC that fits together.",
          heroCta: "Start a build",
          heroSecondaryLabel: "Browse all parts",
          heroSecondaryGo: () => app.go("category"),
          heroStats: [{ value: "9", label: "compatibility checks" }, { value: String(CATALOG.gpu.length), label: "graphics cards" }, { value: "135", label: "catalog products" }],
          heroGo: () => app.go("builder"),
          go: () => app.go("builder"),
        },
        {
          kind: "service",
          name: "Compare before buying",
          brand: "Rigsmith service",
          price: "Coming soon",
          image: "/catalog/promos/rigsmith-compare-promo.png",
          availability: "Comparison tool placeholder",
          label: "Compare before buying",
          copy: "Shortlist products by specs, price and fit before you decide.",
          heroEyebrow: "Compare before buying",
          heroTitle: "See the difference before you choose.",
          heroCta: "Browse the catalog",
          heroSecondaryLabel: "Start a build",
          heroSecondaryGo: () => app.go("builder"),
          heroStats: [{ value: "Coming soon", label: "comparison tool" }, { value: "135", label: "products to shortlist" }, { value: "13", label: "fictional brands" }],
          heroGo: () => app.go("category"),
          go: () => app.go("category"),
        },
        promoProduct(valueGpu, "gpu", "PC upgrade pick", "Compare graphics memory, card length and power draw before you buy.", {
          heroEyebrow: "PC parts in focus", heroTitle: "The right graphics card sets the whole build.", heroCta: "Shop graphics cards",
          heroSecondaryLabel: "Build a PC", heroSecondaryGo: () => app.setState({ route: "builder" }),
          heroStats: [{ value: String((valueGpu.stock ?? 0) > 5 ? "> 5" : (valueGpu.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.gpu.length), label: "graphics cards" }, { value: "9", label: "compatibility checks" }],
          heroGo: () => app.setState({ route: "category", dept: "pc", category: "gpu", brand: "any", search: "" }),
        }),
        promoProduct(featuredPhone, "phones", "Phone spotlight", "Compare battery, camera and display specs in one place.", {
          heroEyebrow: "Phone spotlight", heroTitle: "New phones, compared without the guesswork.", heroCta: "Shop phones",
          heroSecondaryLabel: "Browse all parts", heroSecondaryGo: () => app.go("category"),
          heroStats: [{ value: String((featuredPhone.stock ?? 0) > 5 ? "> 5" : (featuredPhone.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.phones.length), label: "phone models" }, { value: "30", label: "day returns" }],
          heroGo: () => app.setState({ route: "category", dept: "phone", category: "phones", brand: "any", search: "" }),
        }),
        promoProduct(featuredConsole, "consoles", "Gaming spotlight", "Find a ready-to-play system for the living room or on the go.", {
          heroEyebrow: "Gaming spotlight", heroTitle: "Ready-to-play hardware for the next session.", heroCta: "Shop consoles",
          heroSecondaryLabel: "Browse all parts", heroSecondaryGo: () => app.go("category"),
          heroStats: [{ value: String((featuredConsole.stock ?? 0) > 5 ? "> 5" : (featuredConsole.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.consoles.length), label: "console models" }, { value: "2", label: "year warranty" }],
          heroGo: () => app.setState({ route: "category", dept: "gaming", category: "consoles", brand: "any", search: "" }),
        }),
        promoProduct(featuredStorage, "storage", "Storage spotlight", "Keep more games, projects and media ready without guessing which drive fits.", {
          heroEyebrow: "Storage spotlight", heroTitle: "More room for the things you keep.", heroCta: "Shop storage",
          heroSecondaryLabel: "Build a PC", heroSecondaryGo: () => app.setState({ route: "builder" }),
          heroStats: [{ value: String((featuredStorage.stock ?? 0) > 5 ? "> 5" : (featuredStorage.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.storage.length), label: "storage options" }, { value: "1–2", label: "day delivery" }],
          heroGo: () => app.setState({ route: "category", dept: "pc", category: "storage", brand: "any", search: "" }),
        }),
        promoProduct(featuredCpu, "cpu", "Processor spotlight", "Start with the processor that matches your workload, socket and upgrade path.", {
          heroEyebrow: "Processor spotlight", heroTitle: "The part that sets your build's pace.", heroCta: "Shop processors",
          heroSecondaryLabel: "Build a PC", heroSecondaryGo: () => app.setState({ route: "builder" }),
          heroStats: [{ value: String((featuredCpu.stock ?? 0) > 5 ? "> 5" : (featuredCpu.stock ?? 0)), label: "in stock" }, { value: String(CATALOG.cpu.length), label: "processor options" }, { value: "9", label: "compatibility checks" }],
          heroGo: () => app.setState({ route: "category", dept: "pc", category: "cpu", brand: "any", search: "" }),
        }),
      ],
      homeDepartments,
      homeCategories,
      catalogCount: String(allProducts.length),
      brandCount: String(new Set(allProducts.map(product => product.brand)).size),
      bestOf: [
        { name: valueGpu.name, why: valueGpu.description, award: "Lowest price", awardFg: "var(--green-600)", price: money(valueGpu.price), picks: valueGpu.availability === "out_of_stock" ? "unavailable" : "in stock", image: valueGpu.imagePath, go: () => app.setState({ route: "product", productSlot: "gpu", productId: valueGpu.id }) },
        { name: quietGpu.name, why: quietGpu.description, award: "Quietest estimate", awardFg: "var(--accent-active)", price: money(quietGpu.price), picks: quietGpu.availability === "out_of_stock" ? "unavailable" : "in stock", image: quietGpu.imagePath, go: () => app.setState({ route: "product", productSlot: "gpu", productId: quietGpu.id }) },
        { name: featuredCpu.name, why: featuredCpu.description, award: "Default processor", awardFg: "var(--text-tertiary)", price: money(featuredCpu.price), picks: featuredCpu.availability === "out_of_stock" ? "unavailable" : "in stock", image: featuredCpu.imagePath, go: () => app.setState({ route: "product", productSlot: "cpu", productId: featuredCpu.id }) },
        { name: featuredCooler.name, why: featuredCooler.description, award: "Quietest estimate", awardFg: "var(--text-tertiary)", price: money(featuredCooler.price), picks: featuredCooler.availability === "out_of_stock" ? "unavailable" : "in stock", image: featuredCooler.imagePath, go: () => app.setState({ route: "product", productSlot: "cooler", productId: featuredCooler.id }) },
      ],
  };
}

