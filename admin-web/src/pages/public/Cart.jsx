import { useEffect } from "react";
import CartView from "../../components/account/CartView";

// Trang /cart — ai cũng xem được (kể cả chưa đăng nhập). Đặt hàng thì cần đăng nhập, giỏ được giữ nguyên.
export default function Cart() {
  useEffect(() => {
    document.title = "Giỏ hàng — O2O Brand";
  }, []);
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 md:pb-28 md:pt-14">
      <h1 className="mb-8 font-display text-3xl font-semibold tracking-[-0.02em] text-espresso-950 sm:text-4xl">Giỏ hàng của bạn</h1>
      <CartView />
    </div>
  );
}
