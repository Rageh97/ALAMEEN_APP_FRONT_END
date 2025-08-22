// Product type definition
export const ProductType = {
  id: 'number',
  name: 'string',
  price: 'number',
  description: 'string',
  image: 'string'
}

// Order item type definition
export const OrderItemType = {
  name: 'string',
  quantity: 'number',
  price: 'number'
}

// Order type definition
export const OrderType = {
  id: 'number',
  customerName: 'string',
  customerEmail: 'string',
  items: 'OrderItemType[]',
  total: 'number',
  status: 'string', // 'pending' | 'approved' | 'denied'
  date: 'string'
}

// User type definition
export const UserType = {
  id: 'number',
  name: 'string',
  email: 'string',
  isAdmin: 'boolean'
}

// Cart item type definition
export const CartItemType = {
  id: 'number',
  name: 'string',
  price: 'number',
  image: 'string',
  description: 'string',
  quantity: 'number'
}

// Form data types
export const SignInFormType = {
  email: 'string',
  password: 'string'
}

export const SignUpFormType = {
  name: 'string',
  email: 'string',
  password: 'string',
  confirmPassword: 'string'
}

export const ProductFormType = {
  name: 'string',
  price: 'string',
  description: 'string',
  image: 'string'
} 