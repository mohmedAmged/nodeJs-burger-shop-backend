# NodeJS Burger API

Minimal backend for a burger shop built with Express + MongoDB (Mongoose). This README documents current state, used libraries, how to run, implemented endpoints and next steps.

## Status (what's implemented)
- Project scaffolding and app entry (app.js)
- Auth: sign-up, sign-in, sign-out (JWT)
- Users:
  - Get user by slug
  - Update user by slug
  - Get all users (ADMIN only)
- Products:
  - Get all products (public)
  - Create / Update / Remove (ADMIN only)
  - Unique slug generation
- Categories:
  - Category model and controller created (controller kept for future use)
  - Product currently stores category as String (no ref) per project decision
- Middlewares:
  - auth.middleware (JWT + revoked tokens)
  - error.middleware (centralized error handling)
  - arcjet.middleware (project-specific)
- DB connection and session usage where applicable

## Libraries
- express
- mongoose
- dotenv
- bcrypt
- jsonwebtoken
- slug
- cookie-parser
- nodemon (dev)

## Environment variables
Place in `.env.development.local` (remove surrounding quotes):
```
PORT=3500
NODE_ENV=development
DB_URI=<mongodb-connection-string>
JWT_SECRET=<secret>
JWT_EXPIRES_IN=1d
ARCJET_KEY=<key>
ARCJET_ENV=development
ADMIN_CREATION_SECRET=<admin_secret>  # used only for admin bootstrap
```
Note: If using MongoDB Atlas, add your IP to the Atlas Network Access list.

## How to run
1. npm install
2. Create .env file as above
3. Start server:
   - npx nodemon app.js
   - or node app.js
Server listens on http://localhost:3500 (PORT from env)

## Important endpoints
- Auth
  - POST /api/v1/auth/sign-up
  - POST /api/v1/auth/sign-in
  - POST /api/v1/auth/sign-out
- Users (protected)
  - GET /api/v1/users/:slug
  - PUT /api/v1/users/update/:slug
  - GET /api/v1/users (ADMIN only)
- Products
  - GET /api/v1/products
  - POST /api/v1/products/create (ADMIN only)
  - PUT /api/v1/products/update/:slug (ADMIN only)
  - DELETE /api/v1/products/remove/:slug (ADMIN only)
- Categories (routes wired; controller implemented)
  - GET /api/v1/categories
  - POST /api/v1/categories/create (ADMIN only)
  - PUT /api/v1/categories/update/:slug (ADMIN only)
  - DELETE /api/v1/categories/remove/:slug (ADMIN only)

## Admin creation / protection
- Creating ADMIN via sign-up is protected server-side.
- Two allowed flows:
  1. Existing ADMIN creates another ADMIN: send Authorization: Bearer <admin-token>.
  2. Bootstrap: send header `x-admin-key: <ADMIN_CREATION_SECRET>` (use only for initial setup).
- Recommended: bootstrap first admin with ADMIN_CREATION_SECRET, then create future admins only via existing admin account. Keep secrets secure and use HTTPS.

## Notes & known decisions
- Product.category is currently stored as a string (no ObjectId ref). Category controller exists and can be enabled when switching to ObjectId refs.
- Sign-up currently generates a unique slug for users.

## Next work / TODO
- Cart: model, controllers, routes (add/remove/update/get)
- Orders: create from cart, order status, history, payment integration
- Deployment: environment configs, secret management, CI/CD

## Quick tips
- Create categories (admin) before creating products that reference them.
- Use Postman/curl with Authorization: Bearer <token> for protected routes.
- If MongoDB connection fails, check Atlas IP whitelist or use 0.0.0.0/0 for testing only.

```// filepath: f:\web development\backend\nodejs-burger-api\README.md
# NodeJS Burger API

Minimal backend for a burger shop built with Express + MongoDB (Mongoose). This README documents current state, used libraries, how to run, implemented endpoints and next steps.

## Status (what's implemented)
- Project scaffolding and app entry (app.js)
- Auth: sign-up, sign-in, sign-out (JWT)
- Users:
  - Get user by slug
  - Update user by slug
  - Get all users (ADMIN only)
- Products:
  - Get all products (public)
  - Create / Update / Remove (ADMIN only)
  - Unique slug generation
- Categories:
  - Category model and controller created (controller kept for future use)
  - Product currently stores category as String (no ref) per project decision
- Middlewares:
  - auth.middleware (JWT + revoked tokens)
  - error.middleware (centralized error handling)
  - arcjet.middleware (project-specific)
- DB connection and session usage where applicable

## Libraries
- express
- mongoose
- dotenv
- bcrypt
- jsonwebtoken
- slug
- cookie-parser
- nodemon (dev)

## Environment variables:
```
PORT=3500
NODE_ENV=development
DB_URI=<mongodb-connection-string>
JWT_SECRET=<secret>
JWT_EXPIRES_IN=1d
ARCJET_KEY=<key>
ARCJET_ENV=development
ADMIN_CREATION_SECRET=<admin_secret>  # used only for admin bootstrap
```
Note: If using MongoDB Atlas, add your IP to the Atlas Network Access list.

## How to run
1. npm install
2. Create .env file as above
3. Start server:
   - npx nodemon app.js
   - or node app.js
Server listens on http://localhost:3500 (PORT from env)

## Important endpoints
- Auth
  - POST /api/v1/auth/sign-up
  - POST /api/v1/auth/sign-in
  - POST /api/v1/auth/sign-out
- Users (protected)
  - GET /api/v1/users/:slug
  - PUT /api/v1/users/update/:slug
  - GET /api/v1/users (ADMIN only)
- Products
  - GET /api/v1/products
  - POST /api/v1/products/create (ADMIN only)
  - PUT /api/v1/products/update/:slug (ADMIN only)
  - DELETE /api/v1/products/remove/:slug (ADMIN only)
- Categories (routes wired; controller implemented)
  - GET /api/v1/categories
  - POST /api/v1/categories/create (ADMIN only)
  - PUT /api/v1/categories/update/:slug (ADMIN only)
  - DELETE /api/v1/categories/remove/:slug (ADMIN only)

## Admin creation / protection
- Creating ADMIN via sign-up is protected server-side.
- Two allowed flows:
  1. Existing ADMIN creates another ADMIN: send Authorization: Bearer <admin-token>.
  2. Bootstrap: send header `x-admin-key: <ADMIN_CREATION_SECRET>` (use only for initial setup).
- Recommended: bootstrap first admin with ADMIN_CREATION_SECRET, then create future admins only via existing admin account. Keep secrets secure and use HTTPS.

## Notes & known decisions
- Product.category is currently stored as a string (no ObjectId ref). Category controller exists and can be enabled when switching to ObjectId refs.
- Sign-up currently generates a unique slug for users.
- Do not trust client-supplied role in production; role assignment is server-controlled.

## Next work / TODO
- Cart: model, controllers, routes (add/remove/update/get)
- Orders: create from cart, order status, history, payment integration
- Deployment: environment configs, secret management, CI/CD

## Quick tips
- Create categories (admin) before creating products that reference them.
- Use Postman/curl with Authorization: Bearer <token> for protected routes.
- If MongoDB connection fails, check Atlas IP whitelist or use 0.0.0.0/0 for testing only.
