import { useEffect, useState } from "react";
import { Target, Heart, Zap } from "lucide-react";
import api from "../../api/axios";

export default function About() {
  const [cms, setCms] = useState({});

  useEffect(() => {
    api.get("/public/cms").then((res) => setCms(res.data)).catch(() => {});
  }, []);

  const about = cms.about || {};

  return (
    <div className="max-w-3xl mx-auto px-5 py-16 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl font-semibold text-espresso-950">
        {about.title || "Về O2O Brand Promotion"}
      </h1>
      {about.bodyHtml && (
        <div
          className="mt-6 text-espresso-700 text-lg leading-relaxed [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: about.bodyHtml }}
        />
      )}

      <div className="mt-14 grid sm:grid-cols-3 gap-6">
        {[
          { icon: Target, title: "Sứ mệnh", desc: "Giúp doanh nghiệp vừa và nhỏ quảng bá thương hiệu hiệu quả, chi phí hợp lý." },
          { icon: Zap, title: "Cách tiếp cận", desc: "Kết nối thế giới vật lý và trải nghiệm số qua một cú chạm NFC hoặc quét QR." },
          { icon: Heart, title: "Giá trị cốt lõi", desc: "Đơn giản để dùng, dễ để đo lường hiệu quả, không cần đội ngũ kỹ thuật riêng." },
        ].map((v) => (
          <div key={v.title} className="bg-cream-100 rounded-2xl p-6">
            <v.icon className="text-clay-500" size={24} />
            <h3 className="font-display text-lg font-semibold text-espresso-950 mt-3">{v.title}</h3>
            <p className="text-sm text-espresso-700 mt-2 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
