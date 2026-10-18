export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "canceled";
export type PaymentStatus = "pending" | "paid" | "failed" | "canceled" | "refunded";

export type ShippingAddress = {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
};

export type OrderItem = {
  id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  product_slug: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  cancel_reason: string | null;
  is_guest: boolean;
  email: string;
  shipping_method_code: string | null;
  shipping_method_name: string;
  shipping_address: ShippingAddress;
  currency: string;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  stripe_checkout_session_id: string | null;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
};
