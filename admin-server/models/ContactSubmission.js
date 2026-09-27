const mongoose = require("mongoose");

// Lưu các lượt submit của Form Liên hệ công khai.
const contactSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["new", "read"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactSubmission", contactSubmissionSchema);
