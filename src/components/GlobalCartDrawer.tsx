import CartSidebar from "@/components/pharmacy/CartSidebar";
import { useCartDrawer } from "@/contexts/CartDrawerContext";

const GlobalCartDrawer = () => {
  const { isOpen, closeCart } = useCartDrawer();
  return <CartSidebar open={isOpen} onClose={closeCart} />;
};

export default GlobalCartDrawer;
