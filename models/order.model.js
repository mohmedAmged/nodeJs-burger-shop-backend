import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        deliveryAddress: {
            type: String,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["CASH", "ONLINE"],
            default: "CASH",
        },
        status: {
            type: String,
            enum: ["PENDING", "PREPARING", "ON_THE_WAY", "DELIVERED"],
            default: "PENDING",
        },
    },
);
const Order = mongoose.model('Order', orderSchema);
export default Order;