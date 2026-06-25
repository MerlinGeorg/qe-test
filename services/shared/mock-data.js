const baseProducts = [
  {
    id: "sku-123",
    name: "Wireless Keyboard",
    description: "Compact mechanical keyboard for office and home setups.",
    category: "accessories",
    price: 79.99,
    currency: "CAD",
    active: true,
  },
  {
    id: "sku-456",
    name: "USB-C Dock",
    description: "Multi-port dock with HDMI, USB-C, and ethernet.",
    category: "accessories",
    price: 149.99,
    currency: "CAD",
    active: true,
  },
  {
    id: "sku-789",
    name: "Noise Cancelling Headphones",
    description: "Over-ear headphones with active noise cancellation.",
    category: "audio",
    price: 229.99,
    currency: "CAD",
    active: true,
  },
];

const baseCustomers = {
  "user-123": {
    id: "user-123",
    email: "customer@example.com",
    firstName: "Casey",
    lastName: "Nguyen",
    roles: ["customer"],
    defaultShippingAddressId: "addr-001",
  },
  "user-admin": {
    id: "user-admin",
    email: "admin@example.com",
    firstName: "Jordan",
    lastName: "Lee",
    roles: ["admin"],
    defaultShippingAddressId: "addr-900",
  },
};

const baseInventory = {
  "sku-123": {
    productId: "sku-123",
    available: true,
    quantity: 42,
    reserved: 3,
    warehouse: "TOR-01",
  },
  "sku-456": {
    productId: "sku-456",
    available: true,
    quantity: 14,
    reserved: 1,
    warehouse: "TOR-01",
  },
  "sku-789": {
    productId: "sku-789",
    available: false,
    quantity: 0,
    reserved: 5,
    warehouse: "VAN-02",
  },
};

const baseCartStore = {
  "user-123": [
    {
      productId: "sku-123",
      quantity: 1,
      unitPrice: 79.99,
      currency: "CAD",
      name: "Wireless Keyboard",
    },
  ],
};

const baseOrderStore = {
  "12345": {
    orderId: "12345",
    customerId: "user-123",
    status: "processing",
    currency: "CAD",
    subtotal: 79.99,
    items: [
      {
        productId: "sku-123",
        quantity: 1,
        unitPrice: 79.99,
        currency: "CAD",
        name: "Wireless Keyboard",
      },
    ],
    shippingAddressId: "addr-001",
    paymentMethodId: "pm-001",
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let cartStore;
let orderStore;
let paymentStore;

function resetState() {
  cartStore = new Map(Object.entries(clone(baseCartStore)));
  orderStore = new Map(Object.entries(clone(baseOrderStore)));
  paymentStore = new Map();
}

resetState();

function listProducts() {
  return clone(baseProducts);
}

function getProduct(productId) {
  return clone(baseProducts.find((product) => product.id === productId) || null);
}

function getInventory(productId) {
  return clone(baseInventory[productId] || null);
}

function listCustomers() {
  return clone(Object.values(baseCustomers));
}

function getCustomer(customerId) {
  return clone(baseCustomers[customerId] || null);
}

function findCustomerByEmail(email) {
  return listCustomers().find((customer) => customer.email === email) || null;
}

function getCart(userId) {
  return clone(cartStore.get(userId) || []);
}

function setCart(userId, items) {
  cartStore.set(userId, clone(items));
}

function addCartItem(userId, productId, quantity) {
  const product = getProduct(productId);

  if (!product) {
    return null;
  }

  const items = getCart(userId);
  const existingItem = items.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    items.push({
      productId,
      quantity,
      unitPrice: product.price,
      currency: product.currency,
      name: product.name,
    });
  }

  setCart(userId, items);
  return getCart(userId);
}

function getOrder(orderId) {
  return clone(orderStore.get(orderId) || null);
}

function listOrders() {
  return clone(Array.from(orderStore.values()));
}

function createOrder({ customerId, shippingAddressId, paymentMethodId, items }) {
  const orderId = String(12_345 + orderStore.size + 1);
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
  );
  const currency = items[0]?.currency || "CAD";
  const order = {
    orderId,
    customerId,
    status: "created",
    currency,
    subtotal,
    items: clone(items),
    shippingAddressId,
    paymentMethodId,
  };

  orderStore.set(orderId, clone(order));

  return clone(order);
}

function createPaymentAuthorization({ orderId, amount, currency }) {
  const paymentId = `pay_${Math.random().toString(36).slice(2, 10)}`;
  const payment = {
    paymentId,
    orderId,
    amount,
    currency,
    status: "authorized",
    authorizedAt: new Date().toISOString(),
  };

  paymentStore.set(paymentId, clone(payment));

  return clone(payment);
}

module.exports = {
  addCartItem,
  createOrder,
  createPaymentAuthorization,
  findCustomerByEmail,
  getCart,
  getCustomer,
  getInventory,
  getOrder,
  getProduct,
  listCustomers,
  listOrders,
  listProducts,
  resetState,
  setCart,
};