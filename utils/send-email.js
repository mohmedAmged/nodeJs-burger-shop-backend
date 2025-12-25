import { transporter } from "../config/nodemailer.js";


export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const mailOptions = {
            from: '"Burger Shop" <mohamedamged55555@gmail.com>',
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
};
