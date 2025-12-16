import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: String,
        price: {
            type: Number,
            required: true,
        },
        currency:{
            type: String,
            default: 'EGP'
        },
        image: String,
        category: {
            // type: mongoose.Schema.Types.ObjectId,
            // ref: "Category",
            type: String,
            required: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        title: String,
        available: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);
const Product = mongoose.model('Product', productSchema);
export default Product;