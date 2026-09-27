import { Component } from "react";
import { AlertTriangle } from "lucide-react";

// Chặn lỗi render ở bất kỳ trang nào để KHÔNG làm trắng cả app — hiện màn hình báo lỗi thân thiện
// kèm nút tải lại, thay vì màn hình trống không rõ nguyên nhân.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Lỗi khi render:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
          <div className="max-w-sm w-full text-center">
            <AlertTriangle className="mx-auto text-amber-500" size={32} />
            <h1 className="text-lg font-semibold text-slate-900 mt-4">Đã có lỗi xảy ra</h1>
            <p className="text-sm text-slate-500 mt-2">
              Trang này gặp sự cố khi hiển thị. Thử tải lại — nếu vẫn lỗi, kiểm tra console trình duyệt (F12) để
              biết chi tiết.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
