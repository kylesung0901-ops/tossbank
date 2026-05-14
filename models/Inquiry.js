const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    name:    { type: String, required: true, trim: true },
    phone:   { type: String, required: true, trim: true },
    email:   { type: String, trim: true, default: '' },
    type:    { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
