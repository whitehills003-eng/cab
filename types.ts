
export type UserRole = 'ADMIN' | 'DRIVER' | 'CUSTOMER';

export enum DriverStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MODERATION = 'MODERATION'
}

export enum BookingStatus {
  SEARCHING = 'SEARCHING',
  NEGOTIATING = 'NEGOTIATING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type PaymentMethod = 'WALLET' | 'UPI' | 'CARD' | 'CASH';

export interface Location {
  lat: number;
  lng: number;
}

export interface BankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface DriverDocuments {
  aadharCard: string;
  drivingLicense: string;
  vehicleRegistration: string;
  pollutionCertificate: string;
  insurance: string;
}

export interface UserBase {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface AdminProfile extends UserBase {}

export interface DriverProfile extends UserBase {
  licenseNumber: string;
  vehicleInfo: string;
  status: DriverStatus;
  documents?: DriverDocuments;
  bio?: string;
  rating: number;
  totalRatings: number;
  aiVerificationNote?: string;
  location?: Location;
  balance: number;
}

export interface CustomerProfile extends UserBase {
  balance: number;
  location?: Location;
}

export interface DriverOffer {
  driverId: string;
  fare: number;
  estimatedArrivalMins: number;
}

export interface Booking {
  id: string;
  customerId: string;
  driverId?: string;
  pickup: string;
  pickupCoords: Location;
  destination: string;
  destCoords: Location;
  fare: number;
  status: BookingStatus;
  timestamp: Date;
  rating?: number;
  paymentMethod: PaymentMethod;
  driverReachedPickup?: boolean;
  offers: DriverOffer[];
}
