import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
    {
        code:{
            type: String,
            required: true,
            unique: true
        },
        type:{
            type: String,
            enum: ['PERCENTAGE', 'FIXED'],
            default: 'PERCENTAGE'
        },
        value:{
            type: Number, // 50% or 50 egp
            required: true
        },
        maxDiscount:{
            type: Number //optional for (PERCENTAGE)
        },
        minOrderValue:{
            type: Number //optional
        },
        isGlobal:{
            type: Boolean,
            default: true // true = all users
        },
        allowedUsers:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        maxTotalUsage:{
            type: Number //null == no limit
        },
        usedCount:{
            type: Number,
            default: 0
        },
        oncePerUser:{
            type: Boolean,
            default: true // true = voucher used once per user
        },
        startDate:{
            type: Date,
        },
        endDate:{
            type: Date,
        },
        status:{
            type: String,
            enum: ['ACTIVE', 'DISABLED'],
            default: 'ACTIVE'
        },
    },
    { timestamps: true }
)
const Voucher = mongoose.model('Voucher', voucherSchema);
export default Voucher;
