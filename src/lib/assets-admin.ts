import { adminDb } from './firebase-admin';
import { Asset } from '@/types/asset';

export async function getUserAssetsAdmin(userId: string): Promise<Asset[]> {
  try {
    const assetsRef = adminDb.collection('users').doc(userId).collection('assets');
    const querySnapshot = await assetsRef.orderBy('createdAt', 'desc').get();
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Asset[];
  } catch (error) {
    console.error('Error getting user assets (admin):', error);
    throw error;
  }
}