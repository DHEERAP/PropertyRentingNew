
A full-featured Property Listing app Backend code where users can browse, post, and manage property listings for rent or sale. Includes user authentication, image uploads, post management, and a clean UI. Built with modern web technologies to deliver a fast and responsive experience across devices.


# Property Listing  Backend API

This repository contains the backend API for a property Resting application. It handles property listings, user authentication, search, recommendations, favorites, and CSV data import.

## Technologies Used

*   Node.js
*   Express.js
*   MongoDB (using Mongoose)
*   Redis
*   TypeScript
*   Multer (for file uploads)
*   JWT (for authentication)

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd propertylending
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**

    Create a `.env` file in the root directory of the project with the following variables:

    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    REDIS_URL=redis://localhost:6379
    ```
    Replace the placeholder values with your actual MongoDB connection string, a strong JWT secret, and your Redis URL.

4.  **Start MongoDB and Redis servers:**

    Ensure your MongoDB and Redis server instances are running.

## Running the Application

To start the backend server:

```bash
npm start
# or
yarn start
```

The server will run on the port specified in your `.env` file (default is 5000).

## API Endpoints

The API base URL is `http://localhost:5000/api`

Authentication is required for most endpoints. Include a Bearer token in the `Authorization` header: `Authorization: Bearer [your_token]`.

### Authentication

*   `POST /api/auth/register` - Register a new user.
*   `POST /api/auth/login` - Log in and get a JWT token.

### Properties

*   `POST /api/properties` - Create a new property (requires authentication).
*   `GET /api/properties` - Get all properties (supports filtering, sorting, pagination).
*   `GET /api/properties/:id` - Get a property by ID.
*   `PUT /api/properties/:id` - Update a property by ID (requires authentication).
*   `DELETE /api/properties/:id` - Delete a property by ID (requires authentication).

### CSV Import

*   `POST /api/import` - Import properties from a CSV file (requires authentication). Send as `multipart/form-data` with the key `file`.
*   `GET /api/import/template` - Get a sample CSV template.

### Favorites

*   `POST /api/favorites/:propertyId` - Add a property to favorites (requires authentication).
*   `DELETE /api/favorites/:propertyId` - Remove a property from favorites (requires authentication).
*   `GET /api/favorites` - Get user's favorite properties (requires authentication).

### Recommendations

*   `GET /api/recommendations` - Get property recommendations (requires authentication, specific logic depends on implementation).
