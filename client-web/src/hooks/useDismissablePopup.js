import { useCallback, useState } from "react";

// Hook dùng chung cho MỌI popup/modal trong app:
// - Bấm ra ngoài (backdrop) sẽ đóng popup, giống hành vi chuẩn người dùng mong đợi.
// - Đóng có hiệu ứng ẩn dần (fade-out + pop-out) thay vì biến mất đột ngột — chỉ thật sự
//   gọi onClose (unmount) SAU khi hiệu ứng chạy xong, để animation kịp hiển thị.
//
// Cách dùng:
//   const { closing, requestClose, backdropProps } = useDismissablePopup(onClose);
//   <div {...backdropProps} className={`... ${closing ? "animate-fade-out" : "animate-fade-in"}`}>
//     <div className={`... ${closing ? "animate-pop-out" : "animate-pop-in"}`}>...</div>
//   </div>
//   nút X / hủy gọi requestClose() thay vì onClose() trực tiếp.
export default function useDismissablePopup(onClose, { duration = 170, disabled = false } = {}) {
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (closing || disabled) return;
    setClosing(true);
    setTimeout(() => onClose?.(), duration);
  }, [closing, disabled, onClose, duration]);

  // Chỉ đóng khi click ĐÚNG vào lớp nền (backdrop), không đóng khi click bên trong panel
  // rồi thả chuột ra ngoài (kéo chọn text) — dùng mousedown trên chính currentTarget.
  const handleBackdropMouseDown = useCallback(
    (e) => {
      if (e.target === e.currentTarget) requestClose();
    },
    [requestClose]
  );

  return {
    closing,
    requestClose,
    backdropProps: { onMouseDown: handleBackdropMouseDown },
  };
}
