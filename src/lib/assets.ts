import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Asset } from '@/types/asset';

export async function saveAsset(userId: string, assetData: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    // Basic deduplication: check for recent assets with the same name and category
    const recentCutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const q = query(
      collection(db, 'users', userId, 'assets'),
      where('name', '==', assetData.name),
      where('category', '==', assetData.category),
      where('createdAt', '>=', recentCutoff),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const existingAssets = await getDocs(q);
    
    if (!existingAssets.empty) {
      const existingAsset = existingAssets.docs[0];
      const existingData = existingAsset.data();
      
      // Check if the estimated values are very similar (within $10)
      const valueDifference = Math.abs(
        (assetData.estimatedValue?.amount || 0) - (existingData.estimatedValue?.amount || 0)
      );
      
      if (valueDifference <= 10) {
        console.log('Duplicate asset detected, skipping save:', assetData.name);
        return existingAsset.id; // Return existing asset ID instead of creating duplicate
      }
    }
    
    // No duplicate found, create new asset
    const docRef = await addDoc(collection(db, 'users', userId, 'assets'), {
      ...assetData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('New asset saved:', assetData.name, 'ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving asset:', error);
    throw error;
  }
}

export async function uploadAssetImage(userId: string, assetId: string, imageFile: File) {
  try {
    const imageRef = ref(storage, `users/${userId}/assets/images/${assetId}-${Date.now()}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function getUserAssets(userId: string): Promise<Asset[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'assets'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Asset[];
  } catch (error) {
    console.error('Error getting user assets:', error);
    throw error;
  }
}

export async function updateAsset(userId: string, assetId: string, updates: Partial<Asset>) {
  try {
    const assetRef = doc(db, 'users', userId, 'assets', assetId);
    await updateDoc(assetRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    throw error;
  }
}

export async function deleteAsset(userId: string, assetId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'assets', assetId));
  } catch (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
}

export async function analyzeImage(imageFile: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Image analysis error:', error);
    throw error;
  }
}