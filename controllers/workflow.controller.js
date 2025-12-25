import { serve } from "@upstash/workflow/express";
import Order from "../models/order.model.js";
import { sendEmail } from "../utils/send-email.js";
import { generateEmailTemplate } from "../utils/email-template.js";

export const orderWorkflow = serve(async (context) => {
    const { orderId } = context.requestPayload;

    // Step 1: Fetch the initial order
    const order = await context.run("get-order", async () => {
        return await Order.findById(orderId).populate("user", "name email");
    });

    if (!order) {
        console.error("Order not found");
        return;
    }

    // Step 2: Send Confirmation Email (Order Placed)
    await context.run("send-initial-email", async () => {
        const emailContent = generateEmailTemplate({
            userName: order.user.name,
            userEmail: order.user.email,
            deliveryAddress: order.deliveryAddress,
            paymentMethod: order.paymentMethod,
            orderLink: `https://burger-shop-gamma-wine.vercel.app/all-orders/${orderId}`, 
            facebookUrl: "https://facebook.com",
            instagramUrl: "https://instagram.com",
            twitterUrl: "https://twitter.com",
            supportEmail: "support@burgershop.com",
            orderId: order._id,
            orderStatus: order.status,
            totalPrice: order.totalPrice,
            statusDescription: "Your order has been placed successfully and is currently being processed."
        });

        await sendEmail({
            to: order.user.email,
            subject: "Order Placed Successfully",
            html: emailContent
        });
    });

    let currentStatus = order.status;
    let stepIndex = 0;

    // Step 3: Wait for status updates until DELIVERED
    while (currentStatus !== "DELIVERED") {
        stepIndex++;
        
        // Wait for the 'order-updated-{orderId}' event
        // We use a dynamic step name because steps must have unique names in a workflow
        const event = await context.waitForEvent(
            `wait-for-status-change-${stepIndex}`, 
            `order-updated-${orderId}`
        );

        // Update local status from the event data
        currentStatus = event.data.status;

        // Send update email
        await context.run(`send-status-email-${stepIndex}`, async () => {
            const updatedOrder = await Order.findById(orderId).populate("user", "name email");
            
            if (!updatedOrder) return;

            const emailContent = generateEmailTemplate({
                userName: updatedOrder.user.name,
                userEmail: updatedOrder.user.email,
                deliveryAddress: updatedOrder.deliveryAddress,
                paymentMethod: updatedOrder.paymentMethod,
                orderLink: `https://burger-shop-gamma-wine.vercel.app/all-orders/${orderId}`,
                facebookUrl: "https://facebook.com",
                instagramUrl: "https://instagram.com",
                twitterUrl: "https://twitter.com",
                supportEmail: "support@burgershop.com",
                orderId: updatedOrder._id,
                orderStatus: currentStatus,
                totalPrice: updatedOrder.totalPrice,
                statusDescription: currentStatus === "DELIVERED" 
                    ? "Your order has been delivered. Enjoy your meal!" 
                    : `Your order status has been updated to ${currentStatus}.`
            });

            await sendEmail({
                to: updatedOrder.user.email,
                subject: currentStatus === "DELIVERED" ? "Order Delivered" : `Order Status Updated: ${currentStatus}`,
                html: emailContent
            });
        });
    }
});