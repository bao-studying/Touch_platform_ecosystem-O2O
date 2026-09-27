import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
          <div className="max-w-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Đã có lỗi xảy ra</h1>
            <p className="text-sm text-slate-500 mt-2">
              Trang gặp sự cố khi hiển thị. Vui lòng tải lại trang; nếu vẫn lỗi, hãy kiểm tra Console của trình duyệt để biết chi tiết.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors"
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
