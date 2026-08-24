// eslint-disable-next-line no-restricted-imports -- CartSidebar is a shared pharmacy component
import { CartSidebar } from "@modules/pharmacy";
import { useCartDrawer } from "@/contexts/CartDrawerContext";

const GlobalCartDrawer = () => {
  const { isOpen, closeCart } = useCartDrawer();
  return <CartSidebar open={isOpen} onClose={closeCart} />;
};

export default GlobalCartDrawer;
