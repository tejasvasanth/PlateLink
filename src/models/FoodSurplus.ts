export interface FoodSurplus {
  id: string;
  canteenId: string;
  canteenName: string;
  foodName: string;
  category: 'vegetarian' | 'non-vegetarian' | 'vegan' | 'beverages' | 'snacks' | 'desserts';
  quantity: number;
  unit: string;
  
  // Timing
  expiryTime: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Status
  status: 'available' | 'claimed' | 'collected' | 'expired';
  claimedBy: string | null; // NGO/Volunteer ID
  claimerName?: string; // NGO/Volunteer Name
  claimedAt: Date | null;
  
  // Location
  pickupLocation: string;
  
  // Additional info
  imageUrl?: string;
  additionalInfo?: string;
}