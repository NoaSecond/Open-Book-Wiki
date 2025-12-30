<div align="center">
  <img src="public/Logo.svg" alt="Open Book Wiki Logo" width="500">
  
  # Open Book Wiki

  An interactive and modern open source wiki, built with React, TypeScript and Tailwind CSS.
</div>

## API Documentation

The backend API is fully documented with Swagger. You can explore endpoints, data schemas, and test requests directly from your browser.

- **Access Swagger Documentation**: [`http://localhost:3001/api-docs/`](http://localhost:3001/api-docs/)

> **Note:** To test protected routes, you can use the "Authorize" button in Swagger and enter the JWT token obtained via the `/auth/login` route.

## Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/NoaSecond/Open-Book-Wiki
cd Open-Book-Wiki
```

2. **Install dependencies:**
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

3. **Create the database directory:**
```bash
mkdir backend/data
```

4. **Start the application:**

In a first terminal (Backend):
```bash
cd backend
npm start
```

In a second terminal (Frontend):
```bash
npm run dev
```

5. **Access the application:**
- Frontend: `http://localhost:5176`
- API Backend: `http://localhost:3001`

### Default Login

- **Username:** `admin`
- **Password:** `admin123`

## Configuration (Optional)

You can configure ports and the API URL by modifying the `.env` files at the root and in the `backend` folder.

1. **Frontend**: Modify the `.env` file at the project root.
   - `VITE_PORT`: Frontend server port (default: 5176)
   - `VITE_API_URL`: Backend API URL (default: http://localhost:3001)

2. **Backend**: Modify the `backend/.env` file.
   - `PORT`: Backend server port (default: 3001)
   - `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5176)

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.