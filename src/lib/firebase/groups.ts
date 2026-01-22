import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './config';
import { Group, CreateGroupData, GroupMember } from '@/types/group';

/**
 * Create a new group
 */
export const createGroup = async (
  userId: string,
  groupData: CreateGroupData
): Promise<string> => {
  const groupsRef = collection(db, 'groups');
  const newGroupRef = doc(groupsRef);
  
  const group: Omit<Group, 'id'> = {
    ...groupData,
    createdBy: userId,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(newGroupRef, group);
  return newGroupRef.id;
};

/**
 * Get a group by ID
 */
export const getGroup = async (groupId: string): Promise<Group | null> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);

  if (groupSnap.exists()) {
    return { id: groupSnap.id, ...groupSnap.data() } as Group;
  }
  return null;
};

/**
 * Get all active groups (for browsing)
 */
export const getAllGroups = async (): Promise<Group[]> => {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('isActive', '==', true));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Group[];
};

/**
 * Get all groups created by a user
 */
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  const groupsRef = collection(db, 'groups');
  const q = query(
    groupsRef,
    where('createdBy', '==', userId),
    where('isActive', '==', true)
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Group[];
};

/**
 * Get all groups where user is a member
 */
export const getGroupsByMember = async (userId: string): Promise<Group[]> => {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('isActive', '==', true));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((group) => {
      const groupData = group as Group;
      return groupData.members?.some((member) => member.userId === userId);
    }) as Group[];
};

/**
 * Update a group
 */
export const updateGroup = async (
  groupId: string,
  data: Partial<CreateGroupData>
): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Deactivate a group (soft delete)
 */
export const deactivateGroup = async (groupId: string): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    isActive: false,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Add a member to an existing group
 */
export const addMemberToGroup = async (
  groupId: string,
  member: GroupMember
): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  
  // First, check if the user is already a member
  const group = await getGroup(groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  
  const isAlreadyMember = group.members.some(
    (m) => m.userId === member.userId
  );
  
  if (isAlreadyMember) {
    throw new Error('User is already a member of this group');
  }
  
  // Build member object without undefined values (Firestore doesn't accept undefined)
  const cleanMember: Record<string, string> = {
    userId: member.userId,
    name: member.name,
  };
  
  if (member.bio) {
    cleanMember.bio = member.bio;
  }
  if (member.photoURL) {
    cleanMember.photoURL = member.photoURL;
  }
  
  // Add the member using arrayUnion to avoid duplicates
  await updateDoc(groupRef, {
    members: arrayUnion(cleanMember),
    updatedAt: Timestamp.now(),
  });
};

/**
 * Update member photo across all groups they belong to
 */
export const updateMemberPhotoInGroups = async (
  userId: string,
  newPhotoURL: string | null,
  newDisplayName?: string
): Promise<void> => {
  // Get all groups where the user is a member
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('isActive', '==', true));
  const querySnapshot = await getDocs(q);

  const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
    const group = { id: docSnapshot.id, ...docSnapshot.data() } as Group;
    
    // Check if user is a member
    const memberIndex = group.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) return;

    // Update the member's photo and/or name
    const updatedMembers = [...group.members];
    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      ...(newPhotoURL !== null && { photoURL: newPhotoURL }),
      ...(newDisplayName && { name: newDisplayName }),
    };

    // Update the group
    await updateDoc(doc(db, 'groups', group.id!), {
      members: updatedMembers,
      updatedAt: Timestamp.now(),
    });
  });

  await Promise.all(updatePromises);
};

