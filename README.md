# 🔐 Node.js Auth Backend

A secure, modular authentication backend built with **Express**, **MongoDB**, and **Redis**, featuring:

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Email verification and password reset flows
- ✅ Redis-backed refresh token storage
- ✅ Rate limiting with `rate-limiter-flexible`
- ✅ Schema validation with Joi
- ✅ Centralized error handling and async wrappers

---

## 🚀 Tech Stack

| Layer        | Technology             |
|--------------|------------------------|
| Server       | Node.js + Express      |
| Database     | MongoDB (Mongoose)     |
| Cache/Session| Redis                  |
| Email        | Nodemailer             |
| Validation   | Joi                    |
| Rate Limiting| rate-limiter-flexible  |
| Auth         | JWT (access + refresh) |

---

## 📦 Features

### 🔐 Authentication
- Login with email + password
- Secure password hashing with bcrypt
- JWT access and refresh tokens
- Redis-backed refresh token storage with expiry

### 🛡️ Authorization
- Role-based access control (`user`, `admin`)
- Protected routes with middleware
- Centralized error handling

### 📧 Email Flows
- Email verification on registration
- Resend verification endpoint
- Forgot password + reset flow
- Auto-login after password reset

### 🧪 Validation
- Joi-based schema validation
- Structured error responses with status codes and details

### 🚦 Rate Limiting
- Per-IP or per-user limits on sensitive endpoints
- Configurable via `rate-limiter-flexible`
- Middleware-based integration

---

🧼 Tokenization
• 	Access tokens: short-lived, stateless
• 	Refresh tokens: stored in Redis with expiry
• 	Token revocation via Redis key deletion

📬 Email Verification
• 	Raw HTML emails via Nodemailer
• 	Secure token with expiry
• 	Verification via 

🛠️ Future Enhancements
• 	Device/session tracking
• 	RBAC admin panel
• 	OAuth integration
• 	Audit logging

📄 License
MIT © Nabin Saru

Available APIs: [Postman API](https://github.com/NabinSaru/BackEnd-Mock-API-Collection.git)


