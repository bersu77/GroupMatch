import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { Group, GroupMember } from '@/types/group';
import { User } from 'firebase/auth';

/**
 * Ensure the creator is included in the group members array with their current profile
 * This fixes groups where the creator might not be in the members array
 */
export const ensureCreatorInGroupMembers = async (
  groupId: string,
  creator: User
): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) return;

  const group = { id: groupSnap.id, ...groupSnap.data() } as Group;
  
  // Check if creator is already in members array
  const creatorIndex = group.members.findIndex(m => m.userId === creator.uid);
  
  if (creatorIndex === -1) {
    // Creator not in members, add them
    const creatorMember: GroupMember = {
      userId: creator.uid,
      name: creator.displayName || creator.email?.split('@')[0] || 'User',
      photoURL: creator.photoURL || undefined,
    };
    
    await updateDoc(groupRef, {
      members: [...group.members, creatorMember],
      updatedAt: Timestamp.now(),
    });
  } else {
    // Creator is in members, update their info
    const updatedMembers = [...group.members];
    updatedMembers[creatorIndex] = {
      ...updatedMembers[creatorIndex],
      name: creator.displayName || creator.email?.split('@')[0] || 'User',
      photoURL: creator.photoURL || undefined,
    };
    
    await updateDoc(groupRef, {
      members: updatedMembers,
      updatedAt: Timestamp.now(),
    });
  }
};

/**
 * Batch ensure creator is in all their groups
 */
export const ensureCreatorInAllGroups = async (
  groups: Group[],
  creator: User
): Promise<void> => {
  const creatorGroups = groups.filter(g => g.createdBy === creator.uid);
  
  await Promise.all(
    creatorGroups.map(group => ensureCreatorInGroupMembers(group.id!, creator))
  );
};

