import type { Vals } from "../types";
import { AppShell } from "../shell/AppShell";
import { HomeScreen } from "../screens/HomeScreen";
import { CategoryScreen } from "../screens/CategoryScreen";
import { ProductScreen } from "../screens/ProductScreen";
import { BuilderScreen } from "../screens/BuilderScreen";
import { CartScreen, CheckoutScreen, DoneScreen } from "../screens/CheckoutScreens";
import { FloatingBuildCard, Toast } from "../overlays/FloatingBuildCard";

export function RigsmithView({ v }: { v: Vals }) {
  return (
    <>
      <AppShell v={v}>
        {v.isHome && <HomeScreen v={v} />}
        {v.isCategory && <CategoryScreen v={v} />}
        {v.isProduct && <ProductScreen v={v} />}
        {v.isBuilder && <BuilderScreen v={v} />}
        {v.isCart && <CartScreen v={v} />}
        {v.isCheckout && <CheckoutScreen v={v} />}
        {v.isDone && <DoneScreen v={v} />}
      </AppShell>
      {!v.isBuilder && v.cornerShow && <FloatingBuildCard v={v} />}
      <Toast v={v} />
    </>
  );
}
