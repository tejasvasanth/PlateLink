import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FoodSurplus } from '../models/FoodSurplus';

export interface CreateFoodSurplusData {
  canteenId: string;
  canteenName: string;
  foodName: string;
  category: 'vegetarian' | 'non-vegetarian' | 'vegan' | 'beverages' | 'snacks' | 'desserts';
  quantity: number;
  unit: string;
  expiryTime: Date;
  pickupLocation: string;
  additionalInfo?: string;
  imageUrl?: string;
}

class FoodSurplusService {
  private static instance: FoodSurplusService;
  private collectionName = 'foodSurplus';

  private constructor() {}

  public static getInstance(): FoodSurplusService {
    if (!FoodSurplusService.instance) {
      FoodSurplusService.instance = new FoodSurplusService();
    }
    return FoodSurplusService.instance;
  }

  public async createFoodSurplus(data: CreateFoodSurplusData): Promise<FoodSurplus> {
    try {
      const newSurplus: Omit<FoodSurplus, 'id'> = {
        ...data,
        status: 'available',
        createdAt: new Date(),
        updatedAt: new Date(),
        claimedBy: null,
        claimedAt: null,
      };

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...newSurplus,
        createdAt: Timestamp.fromDate(newSurplus.createdAt),
        updatedAt: Timestamp.fromDate(newSurplus.updatedAt),
        expiryTime: Timestamp.fromDate(newSurplus.expiryTime),
      });

      return {
        id: docRef.id,
        ...newSurplus,
      };
    } catch (error: any) {
      console.error('Error creating food surplus:', error);
      throw new Error(error.message || 'Failed to create food surplus');
    }
  }

  public async getFoodSurplusByCanteen(canteenId: string): Promise<FoodSurplus[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('canteenId', '==', canteenId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expiryTime: data.expiryTime.toDate(),
          claimedAt: data.claimedAt ? data.claimedAt.toDate() : null,
        } as FoodSurplus;
      });
    } catch (error: any) {
      console.error('Error fetching canteen food surplus:', error);
      throw new Error(error.message || 'Failed to fetch food surplus');
    }
  }

  public async getAvailableFoodSurplus(): Promise<FoodSurplus[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'available'),
        where('expiryTime', '>', Timestamp.now()),
        orderBy('expiryTime', 'asc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expiryTime: data.expiryTime.toDate(),
          claimedAt: data.claimedAt ? data.claimedAt.toDate() : null,
        } as FoodSurplus;
      });
    } catch (error: any) {
      console.error('Error fetching available food surplus:', error);
      throw new Error(error.message || 'Failed to fetch available food surplus');
    }
  }

  public async claimFoodSurplus(surplusId: string, claimedBy: string, claimerName: string): Promise<void> {
    try {
      const surplusRef = doc(db, this.collectionName, surplusId);
      await updateDoc(surplusRef, {
        status: 'claimed',
        claimedBy: claimedBy,
        claimerName: claimerName,
        claimedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error claiming food surplus:', error);
      throw new Error(error.message || 'Failed to claim food surplus');
    }
  }

  public async updateFoodSurplusStatus(
    surplusId: string, 
    status: 'available' | 'claimed' | 'collected' | 'expired'
  ): Promise<void> {
    try {
      const surplusRef = doc(db, this.collectionName, surplusId);
      await updateDoc(surplusRef, {
        status: status,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error updating food surplus status:', error);
      throw new Error(error.message || 'Failed to update food surplus status');
    }
  }

  public async deleteFoodSurplus(surplusId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, surplusId));
    } catch (error: any) {
      console.error('Error deleting food surplus:', error);
      throw new Error(error.message || 'Failed to delete food surplus');
    }
  }

  public async getFoodSurplusById(surplusId: string): Promise<FoodSurplus | null> {
    try {
      const docRef = doc(db, this.collectionName, surplusId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expiryTime: data.expiryTime.toDate(),
          claimedAt: data.claimedAt ? data.claimedAt.toDate() : null,
        } as FoodSurplus;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error fetching food surplus by ID:', error);
      throw new Error(error.message || 'Failed to fetch food surplus');
    }
  }

  public async getClaimedFoodSurplus(claimedBy: string): Promise<FoodSurplus[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('claimedBy', '==', claimedBy),
        orderBy('claimedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expiryTime: data.expiryTime.toDate(),
          claimedAt: data.claimedAt ? data.claimedAt.toDate() : null,
        } as FoodSurplus;
      });
    } catch (error: any) {
      console.error('Error fetching claimed food surplus:', error);
      throw new Error(error.message || 'Failed to fetch claimed food surplus');
    }
  }
}

export default FoodSurplusService.getInstance();