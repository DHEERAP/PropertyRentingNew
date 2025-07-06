🏡 Full-Featured Property Listing App – Backend
A robust and scalable backend for a modern Property Listing platform that allows users to browse, post, and manage real estate listings for both rent and sale. Built with clean architecture and modern technologies to ensure fast performance, secure operations, and mobile responsiveness.

✨ Key Features:
1. User Authentication & Authorization
2. Secure registration, login, and session management
3. Role-based access (e.g., admin, authenticated users)


#### Property Listings 

1. Users can create, update, delete, and manage their listings
2. Listings include details like title, price, location, amenities, tags, images, and more
3. Listings categorized by sale or rent
4. Property Browsing
5. Search and filter properties by location, price, type, and tags
6. View detailed property pages with descriptions, ratings, and amenities


### Favorites System 

1. Every user can add any property to their favorites for quick access later
2. View and manage your list of favorite properties
3. Property Recommendations
4. Authenticated users can recommend properties to other registered users
5. Recommendations stored and visible in the recipient’s dashboard


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
*   render (fro deployement)

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

The API base URL is`http://localhost:5000/api`(local host)
Deployed API testing URL is `https://property-renting-backend.onrender.com/`(Production)

Authentication is required for most endpoints. Include a Bearer token in the `Authorization` header: `Authorization: Bearer [your_token]`.


#### Postmen checking EndPoints---

### Authentication

*   `POST https://property-renting-backend.onrender.com/api/auth/register` - Register a new user.
*   `POST https://property-renting-backend.onrender.com/api/auth/login` - Log in and get a JWT token.

### Properties

*   `POST https://property-renting-backend.onrender.com/api/properties` - Create a new property (requires authentication).
*   `GET https://property-renting-backend.onrender.com/api/properties` - Get all properties (supports filtering, sorting, pagination).
*   `GET https://property-renting-backend.onrender.com/api/properties/:id` - Get a property by ID.
*   `PUT https://property-renting-backend.onrender.com/api/properties/:id` - Update a property by ID (requires authentication).
*   `DELETE https://property-renting-backend.onrender.com/api/properties/:id` - Delete a property by ID (requires authentication).

### CSV Import
*    Import through MongoDB Compass

### Favorites

*   `POST https://property-renting-backend.onrender.com/api/favorites/:propertyId` - Add a property to favorites (requires authentication).
*   `DELETE https://property-renting-backend.onrender.com/api/favorites/:propertyId` - Remove a property from favorites (requires authentication).
*   `GET https://property-renting-backend.onrender.com/api/favorites` - Get user's favorite properties (requires authentication).

### Recommendations

*   `GET https://property-renting-backend.onrender.com/api/recommendations` - Get property recommendations (requires authentication, specific logic depends on implementation).
