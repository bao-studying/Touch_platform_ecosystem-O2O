import api from "./axios";

// Tải 1 file ảnh lên server (multer, lưu local — xem ghi chú trong backend/controllers/uploadController.js
// về việc nâng cấp lên Cloudinary/S3 khi triển khai thật). Trả về { url }.
export const uploadImageFile = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const res = await api.post("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
};
