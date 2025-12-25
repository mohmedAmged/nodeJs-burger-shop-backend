import nodemailer from "nodemailer";
import { EMAIL_PASSWORD } from "./env.js";

export const accountEmail = 'mohamedamged55555@gmail.com'
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: accountEmail,
        pass: EMAIL_PASSWORD
    }
})
export default transporter;