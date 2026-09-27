import { useEffect } from "react";

// Khoá cuộn trang NỀN khi có overlay toàn màn hình đang mở (drawer cài đặt tài khoản,
// bottom sheet xem trước, popup...). Không có khoá này, trên mobile trang phía sau vẫn
// cuộn được trong lúc overlay hiển thị đè lên — khiến các phần tử "fixed" (như thanh menu
// dưới cùng ở AdminLayout) bị giật/lệch vị trí do trình duyệt tính lại viewport mỗi khi
// thanh địa chỉ ẩn/hiện giữa lúc cuộn nền.
export default function useLockBodyScroll(locked = true) {
  useEffect(() => {
    if (!locked) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [locked]);
}
