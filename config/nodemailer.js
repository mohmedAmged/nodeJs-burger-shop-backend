import nodemailer from "nodemailer";
import { EMAIL_PASSWORD } from "./env.js";
export const transporter = nodemailer.createTransport({
   service: "gmail",
   auth: {
      user: "mohamedamged55555@gmail.com",
      pass: EMAIL_PASSWORD,
   },
});