// Dò domain trong URL để tự gán platform — bỏ dropdown chọn tay.
// Không nhận diện được domain nào phù hợp thì mặc định về "website" (vẫn thêm link tùy ý được).
const DOMAIN_MAP = [
  { test: /facebook\.com|fb\.me|fb\.com/i, platform: "facebook" },
  { test: /tiktok\.com/i, platform: "tiktok" },
  { test: /shopee\.(vn|com)/i, platform: "shopee" },
  { test: /zalo\.me/i, platform: "zalo" },
  { test: /instagram\.com/i, platform: "instagram" },
  { test: /youtube\.com|youtu\.be/i, platform: "youtube" },
  { test: /^mailto:/i, platform: "email" },
];

export const detectPlatform = (url = "") => {
  const trimmed = url.trim();
  if (!trimmed) return "website";
  const match = DOMAIN_MAP.find((entry) => entry.test.test(trimmed));
  return match ? match.platform : "website";
};
