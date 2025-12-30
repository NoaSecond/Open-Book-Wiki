<div align="center">
  <img src="public/Logo.svg" alt="Open Book Wiki Logo" width="500">
  
  # Open Book Wiki

  An interactive and modern open source wiki, built with React, TypeScript and Tailwind CSS.
</div>

## 🛠️ Technologies Used

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Linting**: ESLint

### Backend
- **Runtime**: Node.js + Express
- **Database**: SQLite
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: Swagger / OpenAPI

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

## Available Scripts

### Frontend
- `npm run dev`: Starts the frontend development server
- `npm run build`: Builds the application for production
- `npm run preview`: Previews the production version
- `npm run lint`: Checks code with ESLint
- `npm run backend`: Starts only the backend
- `npm run start`: Alias for `npm run dev`

### Backend
- `npm start`: Starts the backend server (from backend/ folder)

### Content
The wiki content can be modified via the edit interface or by directly modifying components in the `src/components/` folder.

## Contribution

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes using **Gitmoji** (`git commit -m '✨ Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Gitmoji Convention

This project uses [Gitmoji](https://gitmoji.dev/) for expressive commit messages.
Install the Gitmoji extension for easier usage:
```bash
npm install -g gitmoji-cli
gitmoji -c
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
