import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");
import Order from "../models/order.model.js";
import { sendOrderEmail } from "../utils/send-email.js";

export const orderWorkflow = serve(async (context) => {
    const { orderId } = context.requestPayload;
    
    // Initial fetch
    const order = await fetchOrder(context, "get-initial-order", orderId);
    if (!order) {
        console.error("Order not found");
        return;
    }

    let currentStatus = order.status;
    let stepIndex = 0;

    if (currentStatus === 'PENDING') {
        // Step 2: Send Confirmation Email for new orders
        await triggerConfirmationEmail(context, order);
    } else {
        // It's an update trigger (e.g. status changed to PREPARING/SHIPPED causing a re-trigger)
        // Send the update email for the *current* status immediately
        await triggerUpdateEmail(context, "initial-update-email", order, currentStatus);
    }

    // Step 3: Loop until DELIVERED (waiting for NEXT updates)
    while (currentStatus !== "DELIVERED") {
        stepIndex++;
        
        // 3a. Check the DB for the latest status (Self-Healing Race Condition Check)
        const latestOrder = await context.run(`check-status-${stepIndex}`, async () => {
             return await Order.findById(orderId).select("status").lean();
        });

        if (!latestOrder) {
            console.error(`Order ${orderId} no longer exists.`);
            return;
        }

        if (latestOrder.status !== currentStatus) {
            // Fast-forward: DB is ahead of us
            console.log(`Status mismatch detected! Local: ${currentStatus}, DB: ${latestOrder.status}. Processing update immediately.`);
            currentStatus = latestOrder.status;
        } else {
            // Status matches: We are up to date. Wait for the NEXT event.
            console.log(`Verifying event: 'order-updated-${orderId}' at step ${stepIndex}`);
            const event = await context.waitForEvent(
                `wait-for-status-change-${stepIndex}`, 
                `order-updated-${orderId}`,
                "7d"
            );
            console.log(`Received event for order ${orderId}:`, event.data);
            currentStatus = event.data.status;
        }

        // 3c. Send Status Update Email
        // We fetch fresh data to include in the email
        const updatedOrder = await fetchOrder(context, `get-updated-order-${stepIndex}`, orderId);
        if (updatedOrder) {
             await triggerUpdateEmail(context, stepIndex, updatedOrder, currentStatus);
        }
    }
});

const fetchOrder = async (context, stepName, orderId) => {
    return await context.run(stepName, async () => {
        return await Order.findById(orderId).populate("user", "name email").lean();
    });
};

const triggerConfirmationEmail = async (context, order) => {
    return await context.run("send-confirmation-email", async () => {
        console.log("Triggering confirmation email");
        await sendOrderEmail(order.user.email, "order-placed", order);
    });
};

const triggerUpdateEmail = async (context, stepIndex, order, status) => {
    return await context.run(`send-status-email-${stepIndex}`, async () => {
        console.log(`Triggering status email for ${status}`);
        const orderWithCurrentStatus = { ...order, status: status };
        
        await sendOrderEmail(
            order.user.email, 
            "order-status-updated", 
            orderWithCurrentStatus
        );
    });
};