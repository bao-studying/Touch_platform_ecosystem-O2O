const mongoose = require("mongoose");

// Nhật ký mọi giao dịch tiền VÀO mà SePay báo về webhook — phục vụ 2 việc:
//  1) Chống xử lý trùng: SePay có thể gọi lại webhook nhiều lần → `sepayId` unique, lần thứ 2 bị chặn.
//  2) Đối soát: giao dịch không khớp đơn nào (khách ghi sai nội dung...) vẫn được lưu để Super Admin xử lý tay.
const paymentTransactionSchema = new mongoose.Schema(
  {
    sepayId: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    amount: { type: Number, required: true },
    gateway: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    code: { type: String, default: "" },
    content: { type: String, default: "" },
    referenceCode: { type: String, default: "" },
    transactionDate: { type: String, default: "" },
    // true khi giao dịch đã được TÍNH vào số tiền đã nhận của đơn. Số tiền đã nhận luôn được tính lại bằng cách cộng các giao dịch
    // credited (mỗi giao dịch là 1 document riêng) — không phụ thuộc vào việc nhiều cập nhật $inc chạy song song có nguyên tử hay không.
    credited: { type: Boolean, default: false },
    // paid: đủ tiền · partial: mới trả một phần · unmatched: không tìm thấy đơn · already_paid: đơn đã thanh toán trước đó
    // cancelled_order: tiền về cho đơn đã hủy (cần hoàn) — 3 trường hợp cuối đều báo Super Admin xử lý tay.
    result: { type: String, enum: ["pending", "paid", "partial", "unmatched", "already_paid", "cancelled_order"], default: "pending" },
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ order: 1, credited: 1 });

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
