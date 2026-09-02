import type { Vals } from "../shared/lib/types";
import { AppShell } from "../shared/layout/AppShell";
import { HomeScreen } from "../features/catalog/home/HomeScreen";
import { CategoryScreen } from "../features/catalog/CategoryScreen";
import { ProductScreen } from "../features/product/ProductScreen";
import { CartScreen } from "../features/cart/CartScreen";
import { CheckoutScreen, DoneScreen } from "../features/checkout/CheckoutScreens";
import { FloatingBuildCard, Toast } from "../features/pc-builder/FloatingBuildCard";
import { NotFoundScreen } from "../features/errors/NotFoundScreen";
import { StorefrontSkeleton } from "../shared/layout/StorefrontSkeleton";

export function RigsmithView({ v }: { v: Vals }) {
  if (v.isLoading) return <StorefrontSkeleton />;
  if (v.isNotFound) return <><NotFoundScreen v={v} /><Toast v={v} /></>;
  return (
    <>
      <AppShell v={v}>
        {v.isHome && <HomeScreen v={v} />}
        {v.isCategory && <CategoryScreen v={v} />}
        {v.isProduct && <ProductScreen v={v} />}
        {v.isBuilder && <CategoryScreen v={v} />}
        {v.isCart && <CartScreen v={v} />}
        {v.isCheckout && <CheckoutScreen v={v} />}
        {v.isDone && <DoneScreen v={v} />}
      </AppShell>
      {v.cornerShow && <FloatingBuildCard v={v} />}
      <Toast v={v} />
    </>
  );
}
