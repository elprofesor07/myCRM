# CRM System - Task Management & Customer Relationship Management

A production-ready, full-stack CRM system built with the MERN stack (MongoDB, Express, React, Node.js). Features include contact management, deal tracking, task management, and comprehensive reporting with a beautiful, responsive UI.

## Features

* 🔐 **Secure Authentication** - JWT with refresh token rotation and email verification
* 👥 **Contact Management** - Full CRUD operations with advanced filtering
* 🏢 **Company Management** - Track organizations and relationships
* 💰 **Deal Pipeline** - Visual pipeline with drag-and-drop functionality
* ✅ **Task Management** - Assign, track, and manage tasks with team collaboration
* 📅 **Activity Tracking** - Log calls, emails, meetings, and notes
* 📊 **Reports & Analytics** - Real-time dashboards with interactive charts
* 🌓 **Theme Support** - Light/dark mode with system preference detection
* 🌍 **Internationalization** - Multi-language support (EN, ES, FR)
* 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

### Backend

* Node.js & Express.js
* MongoDB with Mongoose ODM
* JWT Authentication with refresh tokens
* Bcrypt for password hashing
* SendGrid for email services
* Express Validator for input validation
* Winston for logging
* Helmet for security headers

### Frontend

* React 18 with Vite
* Redux Toolkit & RTK Query
* Ant Design UI Components
* React Router v6
* React Hook Form with Zod validation
* Recharts for data visualization
* i18next for internationalization
* SCSS modules for styling

## Prerequisites

* Node.js 18.0.0 or higher
* MongoDB 5.0 or higher
* SendGrid account (for email services)

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/crm-system.git
cd crm-system
```

2. **Backend Setup**

```bash
cd backend
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
# Required: MONGODB_URI, JWT secrets, SendGrid API key
```

3. **Frontend Setup**

```bash
cd ../frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

4. **Database Setup**

```bash
# Make sure MongoDB is running
# Seed initial data (optional)
cd backend
npm run seed
```

## Running the Application

### Development Mode

**Backend:**

```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Frontend:**

```bash
cd frontend
npm run dev
# Application runs on http://localhost:3000
```

### Production Mode

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
```

## Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/crm-database

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourcrm.com

# Security
BCRYPT_SALT_ROUNDS=12

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## Default Login Credentials

After seeding the database:

* **Email:** admin@crm.com
* **Password:** Admin123!

## Project Structure

```
crm-system/
├── backend/
│   ├── config/         # Database and app configuration
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
│
├── frontend/
│   ├── public/         # Static files
│   ├── src/
│   │   ├── assets/     # Images, fonts, etc.
│   │   ├── components/ # Reusable components
│   │   ├── features/   # Feature-based modules
│   │   ├── hooks/      # Custom React hooks
│   │   ├── i18n/       # Internationalization
│   │   ├── layouts/    # Layout components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── store/      # Redux store
│   │   ├── styles/     # Global styles
│   │   └── utils/      # Utility functions
│   └── index.html
│
└── README.md
```

## API Documentation

### Authentication Endpoints

* `POST /api/auth/register` - User registration
* `POST /api/auth/login` - User login
* `POST /api/auth/refresh` - Refresh access token
* `POST /api/auth/logout` - Logout user
* `GET /api/auth/verify-email/:token` - Verify email
* `POST /api/auth/forgot-password` - Request password reset
* `POST /api/auth/reset-password/:token` - Reset password

### Resource Endpoints

All resource endpoints require authentication:

* **Contacts:** `/api/contacts`
* **Companies:** `/api/companies`
* **Deals:** `/api/deals`
* **Tasks:** `/api/tasks`
* **Activities:** `/api/activities`

Each resource supports:

* `GET /` - List with pagination and filtering
* `GET /:id` - Get single resource
* `POST /` - Create new resource
* `PUT /:id` - Update resource
* `DELETE /:id` - Delete resource

## Key Features Implementation

### Authentication & Security

* JWT tokens with 15-minute access token expiry
* Refresh token rotation for enhanced security
* Email verification for new accounts
* Password reset functionality
* Rate limiting on authentication endpoints
* Input validation and sanitization
* XSS and NoSQL injection protection

### State Management

* Redux Toolkit for global state
* RTK Query for API calls with caching
* Optimistic updates for better UX
* Automatic cache invalidation

### UI/UX Features

* Responsive design with mobile-first approach
* Dark/light theme with system preference detection
* Loading states and skeleton screens
* Error boundaries for graceful error handling
* Toast notifications for user feedback
* Breadcrumb navigation
* Global search functionality

### Performance Optimizations

* Code splitting with lazy loading
* Image optimization
* API response caching
* Debounced search inputs
* Virtual scrolling for large lists
* Memoized expensive calculations

## Deployment

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

1. **Backend on Heroku/Railway:**
   * Set environment variables
   * Configure MongoDB Atlas connection
   * Deploy using Git
2. **Frontend on Vercel/Netlify:**
   * Build the frontend
   * Set API URL environment variable
   * Deploy the build folder

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed for educational purposes. For commercial use, please contact the author.

## Acknowledgments

* Built for the MERN Stack Development Course
* UI components from Ant Design
* Icons from Ant Design Icons
* Charts from Recharts

## Support

For support, email support@crm.com or create an issue in the repository.

---

**Note:** This is a production-ready application suitable for real-world deployment. All security best practices have been implemented, including secure authentication, input validation, and protection against common vulnerabilities.
