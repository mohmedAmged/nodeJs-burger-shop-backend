import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';

export const getDashboardStats = async (req, res, next) => {
    try {
        // Stats: Total Revenue, Orders, Users, Products
        const totalRevenueResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: { $ifNull: ["$totalPriceAfterCode", "$totalPrice"] }
                    }
                }
            }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        // Sales Trend (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesTrend = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: { $ifNull: ["$totalPriceAfterCode", "$totalPrice"] } },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    revenue: 1,
                    orders: 1
                }
            }
        ]);

        // Top Products (Top 5 by quantity)
        const topProducts = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    qty: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
            },
            { $sort: { qty: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    name: { $ifNull: ["$productInfo.name", "Unknown Product"] },
                    image: { $ifNull: ["$productInfo.image", ""] },
                    qty: 1,
                    revenue: 1
                }
            }
        ]);

        // Status Distribution
        const statusDistribution = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: "$_id",
                    count: 1
                }
            }
        ]);

        // 5. Recent Orders (Last 5)
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name');
        
        const formattedRecentOrders = recentOrders.map(order => ({
            id: order._id,
            userName: order.user ? order.user.name : 'Unknown User',
            total: order.totalPriceAfterCode || order.totalPrice,
            status: order.status,
            createdAt: order.createdAt
        }));

        res.status(200).json({
            stats: {
                totalRevenue,
                totalOrders,
                totalUsers,
                totalProducts
            },
            salesTrend,
            topProducts,
            statusDistribution,
            recentOrders: formattedRecentOrders
        });
    } catch (error) {
        next(error);
    }
};
