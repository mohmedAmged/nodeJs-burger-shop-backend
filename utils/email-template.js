export const emailTemplates = [
  {
    label: "order-placed",
    // eslint-disable-next-line no-unused-vars
    generateSubject: (data) => `Order Placed Successfully`,
    generateBody: (data) => `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0b0b0b; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Burger Shop</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333333;">Order Placed Successfully</h2>
            <p>Hello ${data.userName},</p>
            <p>Your order has been placed successfully and is currently being processed.</p>
            <table style="width: 100%; margin-top: 20px;">
              <tr>
                <td style="color: #666666;">Order ID:</td>
                <td><strong>${data.orderId}</strong></td>
              </tr>
              <tr>
                <td style="color: #666666;">Total Price:</td>
                <td><strong>${data.totalPriceAfterCode || data.totalPrice} EGP</strong></td>
              </tr>
               <tr>
                <td style="color: #666666;">Payment Method:</td>
                <td><strong>${data.paymentMethod}</strong></td>
              </tr>
               <tr>
                <td style="color: #666666;">Order Status:</td>
                <td><strong>${data.orderStatus}</strong></td>
              </tr>
            </table>
             <div style="text-align: center; margin-top: 30px;">
              <a href="${data.orderLink}" style="background-color: #facc15; color: #0b0b0b; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order</a>
            </div>
          </div>
           <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666666;">
            <p>&copy; ${new Date().getFullYear()} Burger Shop. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  },
  {
    label: "order-status-updated",
    generateSubject: (data) =>
      data.orderStatus === "DELIVERED"
        ? "Order Delivered"
        : `Order Status Updated: ${data.orderStatus}`,
    generateBody: (data) => `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0b0b0b; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Burger Shop</h1>
          </div>
          <div style="padding: 20px;">
             <h2 style="color: #333333;">
              ${
                data.orderStatus === "DELIVERED"
                  ? "Order Delivered"
                  : "Order Status Updated"
              }
            </h2>
            <p>Hello ${data.userName},</p>
            <p>
              ${
                data.orderStatus === "DELIVERED"
                  ? "Your order has been delivered. Enjoy your meal!"
                  : `Your order status has been updated to <strong>${data.orderStatus}</strong>.`
              }
            </p>
             <table style="width: 100%; margin-top: 20px;">
              <tr>
                <td style="color: #666666;">Order ID:</td>
                <td><strong>${data.orderId}</strong></td>
              </tr>
              <tr>
                 <td style="color: #666666;">Current Status:</td>
                 <td><strong style="color: #facc15;">${data.orderStatus}</strong></td>
              </tr>
            </table>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${data.orderLink}" style="background-color: #facc15; color: #0b0b0b; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order</a>
            </div>
          </div>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666666;">
            <p>&copy; ${new Date().getFullYear()} Burger Shop. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  },
];