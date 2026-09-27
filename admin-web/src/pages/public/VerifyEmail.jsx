import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "../../api/axios";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("checking"); // checking | ok | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get(`/auth/verify-email/${token}`)
      .then(() => setStatus("ok"))
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Liên kết không hợp lệ");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-5">
      <div className="max-w-sm w-full text-center">
        {status === "checking" && <Loader2 className="mx-auto animate-spin text-espresso-700" size={32} />}
        {status === "ok" && (
          <>
            <CheckCircle2 className="mx-auto text-sage-500" size={36} />
            <h1 className="font-display text-xl font-semibold text-espresso-950 mt-4">Xác thực email thành công</h1>
            <p className="text-sm text-espresso-600 mt-2">Cảm ơn bạn, email của bạn đã được xác thực.</p>
            <Link to="/admin" className="inline-block mt-6 bg-espresso-900 text-cream-50 px-6 py-2.5 rounded-full font-medium">
              Vào Dashboard
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="mx-auto text-clay-500" size={36} />
            <h1 className="font-display text-xl font-semibold text-espresso-950 mt-4">Không thể xác thực</h1>
            <p className="text-sm text-espresso-600 mt-2">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
