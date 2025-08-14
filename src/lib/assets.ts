import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Asset } from '@/types/asset';

export async function saveAsset(userId: string, assetData: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'assets'), {
      ...assetData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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
