const mongoose = require("mongoose");

// Hộp thư Hỗ trợ & Sự cố — Tenant gửi report, Super Admin trả lời ngay trong dashboard.
const ticketSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
    subject: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    messages: [
      {
        from: { type: String, enum: ["tenant", "superadmin"], required: true },
        senderName: { type: String, default: "" },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
