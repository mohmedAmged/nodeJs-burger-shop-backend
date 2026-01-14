# 🍔 NodeJS Burger API

A robust, feature-rich backend for a Burger Shop application built with **Express.js**, **MongoDB**, and **Upstash**. This API handles everything from user authentication and cart management to automated order workflows and administrative dashboards.

## 🚀 Key Features

- **🔐 Advanced Authentication**:
  - JWT-based authentication with secure cookie storage.
  - Automated logout on token expiry.
  - Role-based Access Control (RBAC) - Public, User, and Admin tiers.
- **🛒 Cart & Checkout**:
  - Persistent shopping cart for authenticated users.
  - Real-time stock reservation upon adding items to cart.
  - Automatic stock restoration if items are removed or cart expires.
- **🏷️ Voucher System**:
  - Flexible discount codes (Percentage or Fixed amount).
  - Usage limits: Global limits, per-user limits (Once per user), and minimum order values.
  - Start/End date validation and status management.
- **📦 Order Management**:
  - Secure checkout flow converting cart to orders.
  - Detailed order tracking with multiple statuses (Pending, Preparing, Out for Delivery, Delivered).
  - Admin controls for updating order status.
- **🤖 Automated Workflows (Upstash)**:
  - Event-driven order processing using **Upstash Workflow**.
  - Automated email notifications (Order confirmation & status updates) via **Nodemailer**.
  - "Self-healing" status checks to ensure data consistency between the database and the workflow.
- **📊 Admin Dashboard Statistics**:
  - Comprehensive metrics: Total Revenue, Total Orders, Total Users, and Total Products.
  - Sales Trend analysis (Last 7 days).
  - Top-selling products ranking.
  - Order status distribution.
- **🛡️ Security & Protection**:
  - **Arcjet Integration**: Bot detection, rate limiting, and email verification.
  - Input validation and centralized error handling.
  - Secure password hashing with Bcrypt.
- **🖼️ Product & Category Management**:
  - Full CRUD for products and categories (Admin only).
  - Unique slug generation for SEO-friendly URLs.
  - Support for product availability and stock management.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JsonWebToken)
- **Security**: Arcjet (Bot protection, Rate limit)
- **Automation**: Upstash Workflow & QStash
- **Emails**: Nodemailer
- **Utilities**: Bcrypt, Slug, Cookie-parser, Morgan

## 📂 API Endpoints

### 🔑 Authentication

| Method | Endpoint                | Description                | Access |
| :----- | :---------------------- | :------------------------- | :----- |
| `POST` | `/api/v1/auth/sign-up`  | Create a new account       | Public |
| `POST` | `/api/v1/auth/sign-in`  | Sign in to account         | Public |
| `POST` | `/api/v1/auth/sign-out` | Sign out and clear cookies | Public |

### 👤 User Management

| Method | Endpoint                     | Description              | Access |
| :----- | :--------------------------- | :----------------------- | :----- |
| `GET`  | `/api/v1/users/:slug`        | Get user profile by slug | User   |
| `PUT`  | `/api/v1/users/update/:slug` | Update user profile      | User   |
| `GET`  | `/api/v1/users`              | Get list of all users    | Admin  |

### 🍔 Products & Categories

| Method   | Endpoint                        | Description            | Access |
| :------- | :------------------------------ | :--------------------- | :----- |
| `GET`    | `/api/v1/products`              | Get all products       | Public |
| `POST`   | `/api/v1/products/create`       | Create new product     | Admin  |
| `PUT`    | `/api/v1/products/update/:slug` | Update product details | Admin  |
| `DELETE` | `/api/v1/products/remove/:slug` | Delete a product       | Admin  |
| `GET`    | `/api/v1/categories`            | Get all categories     | Public |
| `POST`   | `/api/v1/categories/create`     | Create new category    | Admin  |

### 🛒 Shopping Cart

| Method   | Endpoint                     | Description           | Access |
| :------- | :--------------------------- | :-------------------- | :----- |
| `GET`    | `/api/v1/cart`               | Get user's cart       | User   |
| `POST`   | `/api/v1/cart/add`           | Add item to cart      | User   |
| `PUT`    | `/api/v1/cart/update/:slug`  | Update item quantity  | User   |
| `DELETE` | `/api/v1/cart/remove/:slug`  | Remove item from cart | User   |
| `POST`   | `/api/v1/cart/apply-voucher` | Apply a discount code | User   |

### 📦 Orders

| Method | Endpoint                           | Description                | Access     |
| :----- | :--------------------------------- | :------------------------- | :--------- |
| `GET`  | `/api/v1/orders`                   | Get user's order history   | User       |
| `POST` | `/api/v1/orders/create`            | Checkout and create order  | User       |
| `GET`  | `/api/v1/orders/:id`               | Get specific order details | User/Admin |
| `PUT`  | `/api/v1/orders/update-status/:id` | Update order status        | Admin      |

### 📈 Dashboard & Vouchers

| Method | Endpoint                  | Description            | Access |
| :----- | :------------------------ | :--------------------- | :----- |
| `GET`  | `/api/v1/dashboard-stats` | Fetch business metrics | Admin  |
| `GET`  | `/api/v1/vouchers`        | Get all vouchers       | Admin  |
| `POST` | `/api/v1/vouchers/create` | Create new voucher     | Admin  |

## ⚙️ Environment Variables

Create a `.env.development.local` file in the root directory:

```env
PORT=3500
NODE_ENV=development
DB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
ARCJET_KEY=aj_your_key
ARCJET_ENV=development

# Upstash/QStash (For Workflows)
QSTASH_TOKEN=your_qstash_token
QSTASH_URL=https://qstash.upstash.io/v1/...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...

# Email configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🏃 How to Run

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Fill in the `.env` file as shown above.

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3500`.

## 📜 Admin Bootstrap

To create the first admin user, you can use the `ADMIN_CREATION_SECRET` (if configured) in the request header `x-admin-key` during sign-up, or manually update a user's role in the database to `ADMIN`.

---

_Created with ❤️ for the Burger Shop Project._
