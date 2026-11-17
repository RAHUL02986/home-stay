// types/index.ts
export interface ICoordinates {
  lat: number;
  lng: number;
}

export type UserRole = 'guest' | 'host' | 'admin';
export type PropertyType = 'homestay' | 'hotel' | 'guesthouse' | 'resort' | 'apartment' | 'villa';
export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
export type BookingSource = 'instant' | 'request';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'razorpay' | 'cash' | 'wallet';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export type CouponType = 'percentage' | 'fixed';
export type PayoutStatus = 'pending' | 'processed' | 'failed';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IPropertyInput {
  name: string;
  description: string;
  propertyType: PropertyType;
  area: string;
  address: string;
  coordinates?: ICoordinates;
  amenities: string[];
  images: string[];
  host: string;
  checkInTime?: string;
  checkOutTime?: string;
  houseRules?: string[];
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict';
}

export interface IRoomInput {
  type: string;
  pricePerNight: number;
  maxGuests: number;
  availability: 'available' | 'unavailable';
  features: string[];
  images?: string[];
  totalRooms?: number;
  extraGuestCharge?: number;
  minStay?: number;
  maxStay?: number;
  advanceBookingDays?: number;
}

export interface IBookingInput {
  property: string;
  room: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  numberOfRooms: number;
  source?: BookingSource;
  travelerDetails: {
    fullName: string;
    email: string;
    phone: string;
    idProof?: string;
    idProofType?: string;
  };
  specialRequests?: string;
  couponCode?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PriceBreakdown {
  basePrice: number;
  nights: number;
  rooms: number;
  extraGuestCharges: number;
  subtotal: number;
  tax: number;
  serviceFee: number;
  discount: number;
  total: number;
}
