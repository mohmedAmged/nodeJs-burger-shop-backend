export const generateEmailTemplate = 
({
    userName, 
    userEmail, 
    deliveryAddress, 
    paymentMethod, 
    orderLink, 
    facebookUrl, 
    instagramUrl, 
    twitterUrl, 
    supportEmail, 
    orderId, 
    orderStatus, 
    totalPrice,
    statusDescription })=>`
<div style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
    <!-- Wrapper table for email clients -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td style="padding: 20px 0;">
                <!-- Main container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #0b0b0b; border-radius: 8px; max-width: 600px; width: 100%;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; text-align: center;">
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 32px; font-weight: bold;">Burger Shop</h1>
                            <p style="margin: 0; color: #a3a3a3; font-size: 14px;">Fresh food, delivered fast</p>
                            <div style="margin-top: 20px; height: 2px; background-color: #facc15; width: 60px; margin-left: auto; margin-right: auto;"></div>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 24px 32px 0 32px;">
                            <p style="margin: 0; color: #ffffff; font-size: 16px; line-height: 1.5;">Hello ${userName},</p>
                        </td>
                    </tr>

                    <!-- Main message card -->
                    <tr>
                        <td style="padding: 24px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 28px;">
                                        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 20px; font-weight: bold;">Your order has been placed successfully</h2>
                                        
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: #a3a3a3; font-size: 14px;">Order ID:</span>
                                                    <span style="color: #ffffff; font-size: 14px; margin-left: 8px;">${orderId}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: #a3a3a3; font-size: 14px;">Current Status:</span>
                                                    <span style="color: #facc15; font-size: 14px; font-weight: bold; margin-left: 8px;">${orderStatus}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: #a3a3a3; font-size: 14px;">Total Price:</span>
                                                    <span style="color: #ffffff; font-size: 14px; font-weight: bold; margin-left: 8px;">${totalPrice} EGP</span>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 16px 0 0 0; color: #d4d4d4; font-size: 14px; line-height: 1.6;">${statusDescription}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- User & Delivery Info -->
                    <tr>
                        <td style="padding: 0 32px 24px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1a1a1a; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 28px;">
                                        <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 16px; font-weight: bold;">Delivery Details</h3>
                                        
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 6px 0;">
                                                    <span style="color: #a3a3a3; font-size: 13px; display: inline-block; width: 120px;">Name:</span>
                                                    <span style="color: #ffffff; font-size: 13px;">${userName}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0;">
                                                    <span style="color: #a3a3a3; font-size: 13px; display: inline-block; width: 120px;">Email:</span>
                                                    <span style="color: #ffffff; font-size: 13px;">${userEmail}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0;">
                                                    <span style="color: #a3a3a3; font-size: 13px; display: inline-block; width: 120px;">Delivery Address:</span>
                                                    <span style="color: #ffffff; font-size: 13px;">${deliveryAddress}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0;">
                                                    <span style="color: #a3a3a3; font-size: 13px; display: inline-block; width: 120px;">Payment Method:</span>
                                                    <span style="color: #ffffff; font-size: 13px;">${paymentMethod}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 32px 32px 32px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background-color: #facc15; border-radius: 8px; text-align: center;">
                                        <a href="${orderLink}" style="display: inline-block; padding: 14px 32px; color: #0b0b0b; font-size: 15px; font-weight: bold; text-decoration: none;">View Order</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 32px;">
                            <div style="height: 1px; background-color: #262626;"></div>
                        </td>
                    </tr>

                    <!-- Social Media Links -->
                    <tr>
                        <td style="padding: 28px 32px; text-align: center;">
                            <p style="margin: 0 0 16px 0; color: #a3a3a3; font-size: 13px;">Follow us on social media</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 8px;">
                                        <a href="${facebookUrl}" style="display: inline-block; width: 36px; height: 36px; background-color: #262626; border-radius: 50%; text-align: center; line-height: 36px; color: #facc15; text-decoration: none; font-size: 14px; font-weight: bold;">f</a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="${instagramUrl}" style="display: inline-block; width: 36px; height: 36px; background-color: #262626; border-radius: 50%; text-align: center; line-height: 36px; color: #facc15; text-decoration: none; font-size: 14px; font-weight: bold;">i</a>
                                    </td>
                                    <td style="padding: 0 8px;">
                                        <a href="${twitterUrl}" style="display: inline-block; width: 36px; height: 36px; background-color: #262626; border-radius: 50%; text-align: center; line-height: 36px; color: #facc15; text-decoration: none; font-size: 14px; font-weight: bold;">t</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 0 32px 32px 32px; text-align: center;">
                            <p style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; font-weight: bold;">Burger Shop</p>
                            <p style="margin: 0 0 8px 0; color: #a3a3a3; font-size: 12px; line-height: 1.6;">If you have any questions, contact us at <a href="mailto:${supportEmail}" style="color: #facc15; text-decoration: none;">${supportEmail}</a></p>
                            <p style="margin: 0; color: #737373; font-size: 11px; line-height: 1.5;">This email was sent to you because you placed an order with us. Please do not reply to this email.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</div>

`