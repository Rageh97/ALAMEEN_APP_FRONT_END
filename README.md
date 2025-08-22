# E-Commerce Store

A beautiful, modern e-commerce application built with Next.js and Tailwind CSS. This is a client-side application ready to connect to your backend API.

## Features

### 🛍️ Customer Features
- **Beautiful Home Page**: Hero section with featured products
- **Product Display**: Grid layout with product images, names, descriptions, and prices
- **Shopping Cart**: Add/remove products with quantity controls
- **User Authentication**: Sign up and sign in pages with email and password
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### 🔧 Admin Dashboard
- **Product Management**: Add, remove, and update products
- **Order Management**: View all customer orders
- **Order Status Control**: Approve or deny pending orders
- **Real-time Updates**: Instant UI updates for all actions

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Development Server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Integration Points

The app is designed to work with your backend API. Here are the key integration points:

### Authentication Endpoints
```javascript
// Sign Up
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

// Sign In
POST /api/auth/signin
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Product Endpoints
```javascript
// Get all products
GET /api/products

// Add new product (Admin only)
POST /api/products
{
  "name": "Product Name",
  "price": 99.99,
  "description": "Product description",
  "image": "https://example.com/image.jpg"
}

// Delete product (Admin only)
DELETE /api/products/:id

// Update product (Admin only)
PUT /api/products/:id
{
  "name": "Updated Name",
  "price": 89.99,
  "description": "Updated description",
  "image": "https://example.com/new-image.jpg"
}
```

### Order Endpoints
```javascript
// Get all orders (Admin only)
GET /api/orders

// Create new order
POST /api/orders
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 99.99
    }
  ],
  "total": 199.98
}

// Update order status (Admin only)
PUT /api/orders/:id/status
{
  "status": "approved" // or "denied"
}
```

## How to Connect to Your Backend

1. **Replace Mock Data**: In the components, replace the mock data arrays with API calls
2. **Add Authentication**: Implement JWT token storage and API authentication headers
3. **Error Handling**: Add proper error handling for API calls
4. **Loading States**: Add loading indicators while API calls are in progress

### Example API Integration

```javascript
// Example: Fetching products from your API
const fetchProducts = async () => {
  try {
    const response = await fetch('/api/products')
    const products = await response.json()
    setProducts(products)
  } catch (error) {
    console.error('Error fetching products:', error)
  }
}

// Example: Creating an order
const createOrder = async (orderData) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Add your auth token
      },
      body: JSON.stringify(orderData)
    })
    const order = await response.json()
    // Handle success
  } catch (error) {
    console.error('Error creating order:', error)
  }
}
```

## Project Structure

```
app/
├── page.js          # Main application with routing
├── layout.js        # Root layout
├── globals.css      # Global styles and Tailwind config
└── components/      # (You can extract components here)
```

## Technologies Used

- **Next.js 15** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **Heroicons** - Beautiful icons

## Customization

### Styling
- All styles are in `app/globals.css`
- Uses Tailwind CSS utility classes
- Custom component classes defined in the CSS file

### Adding Features
- Easy to add new pages by extending the routing in `page.js`
- Components are modular and reusable
- State management is handled with React hooks

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Support

This app is ready to be connected to your backend API. Simply replace the mock data with actual API calls to your endpoints, and you'll have a fully functional e-commerce store!

## License

This project is open source and available under the MIT License.
