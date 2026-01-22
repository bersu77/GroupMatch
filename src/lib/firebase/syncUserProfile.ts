import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { Group } from '@/types/group';

/**
 * Sync user profile across all their groups (creator and member)
 * This ensures the user's display name and photo are up-to-date everywhere
 */
export const syncUserProfileToGroups = async (
  userId: string,
  displayName: string,
  photoURL: string | null
): Promise<void> => {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('isActive', '==', true));
  const querySnapshot = await getDocs(q);

  const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
    const group = { id: docSnapshot.id, ...docSnapshot.data() } as Group;
    
    // Check if user is a member
    const memberIndex = group.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) return; // User not in this group

    // Update the member's data
    const updatedMembers = [...group.members];
    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      name: displayName,
      photoURL: photoURL || undefined,
    };

    // Update the group document
    await updateDoc(doc(db, 'groups', group.id!), {
      members: updatedMembers,
      updatedAt: Timestamp.now(),
    });
  });

  await Promise.all(updatePromises);
};

