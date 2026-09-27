// Giá DỰ PHÒNG khi tạo đơn thanh toán — CHỈ dùng khi không gọi được sang Admin Server để lấy giá
// thật (xem utils/adminServerClient.js). Nguồn giá chính thức là Admin Server (Super Admin quản
// lý ở Billing & Plans); nếu Admin Server hoạt động bình thường, các số ở đây không được dùng tới.
// Nên cập nhật tay các số này định kỳ cho khớp giá thật, để nếu Admin Server có sự cố thì khách
// vẫn được tính giá gần đúng nhất thay vì một con số quá cũ.
const PLAN_PRICES = {
  level1: 99000,
  level2: 199000,
  level3: 299000,
};

module.exports = { PLAN_PRICES };
