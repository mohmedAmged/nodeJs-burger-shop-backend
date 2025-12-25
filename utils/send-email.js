import { emailTemplates } from "./email-template.js";
import transporter, { accountEmail } from "../config/nodemailer.js";

export const sendOrderEmail = async (to, type, order) => {
    if (!to || !type) throw new Error("Missing required parameters.");

    const template = emailTemplates.find((t) => t.label === type);

    if (!template) throw new Error(`invalid email type: ${type}`);

    const mailInfo = {
        userName: order.user.name,
        userEmail: order.user.email,
        orderId: order._id,
        orderStatus: order.status,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        orderLink: `https://burger-shop-gamma-wine.vercel.app/all-orders/${order._id}`,
    }

    const message = template.generateBody(mailInfo);
    const subject = template.generateSubject(mailInfo);

    const emailOptions = {
        from: accountEmail,
        to: to,
        subject: subject,
        html: message, 
    }

    return new Promise((resolve, reject) => {
        transporter.sendMail(emailOptions, (error, info) => {
            if (error) {
                console.log("Error sending email:", error);
                reject(error);
            } else {
                console.log('Email sent: ' + info.response);
                resolve(info);
            }
        });
    });
}
