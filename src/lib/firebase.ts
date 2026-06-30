import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Task, FocusSession, CalendarEvent } from '../types';

// 1. Initialize Firebase App
console.log('[Firebase Init] Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId
});
const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore with custom databaseId from the config
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
console.log('[Firestore Init] Firestore database initialized successfully.');

// 3. Initialize Firebase Auth
const auth = getAuth(app);
console.log('[Auth Init] Firebase Auth initialized successfully.');

// 4. Initialize Auth Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Handle user document sync in Firestore.
 * Creates the user record if it doesn't already exist.
 */
export async function syncUserToFirestore(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  console.log(`[Firestore Read] Checking user profile document at: ${path}`);
  
  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  try {
    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log(`[Firestore Read] Successfully loaded user profile for UID: ${user.uid}`, data);
      return {
        name: data.name || user.displayName || 'Demo Guest',
        email: data.email || user.email || 'guest@deadlineguardian.ai',
        avatar: data.avatar || user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        role: data.role || 'Engineer',
        weeklyGoal: data.weeklyGoal || 10,
        completedCount: data.completedCount || 0,
        themePreference: data.themePreference || 'light'
      };
    } else {
      // User doesn't exist, create profile doc
      const localTheme = localStorage.getItem('themePreference') as 'light' | 'dark' | null;
      const newProfile: UserProfile = {
        name: user.displayName || (user.isAnonymous ? 'Demo Guest' : 'Guardian User'),
        email: user.email || (user.isAnonymous ? 'guest@deadlineguardian.ai' : ''),
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        role: 'Engineer', // default role
        weeklyGoal: 10,
        completedCount: 0,
        themePreference: localTheme || 'light'
      };

      console.log(`[Firestore Write] Profile not found. Creating user profile document at: ${path}`, newProfile);
      await setDoc(userRef, {
        name: newProfile.name,
        email: newProfile.email,
        avatar: newProfile.avatar,
        role: newProfile.role,
        weeklyGoal: newProfile.weeklyGoal,
        completedCount: newProfile.completedCount,
        themePreference: newProfile.themePreference,
        createdAt: serverTimestamp()
      });
      console.log(`[Firestore Write] Successfully created user profile document for UID: ${user.uid}`);

      return newProfile;
    }
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Trigger Google Sign-In Popup.
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    console.log('[Auth Action] Initiating Google popup sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[Auth Action] Google sign-in successful. Syncing user profile...');
    const profile = await syncUserToFirestore(result.user);
    return profile;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.warn('[Auth Warning] Google login popup was closed or cancelled by the user.');
    } else {
      console.error('[Auth Error] Error during Google login:', error);
    }
    throw error;
  }
}

/**
 * Sign out of current Firebase session.
 */
export async function logOutFromFirebase(): Promise<void> {
  try {
    console.log('[Auth Action] Signing out from Firebase...');
    await signOut(auth);
    console.log('[Auth Action] Signed out successfully.');
  } catch (error: any) {
    console.error('[Auth Error] Error during sign-out:', error);
    throw error;
  }
}

/**
 * Retrieve all tasks for a specific user from Firestore.
 */
export async function getTasksFromFirestore(userId: string): Promise<Task[]> {
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const path = `users/${userId}/tasks`;
  
  let querySnapshot;
  try {
    console.log(`[Firestore Read] Retrieving all tasks for user UID: ${userId}`);
    querySnapshot = await getDocs(tasksRef);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  try {
    const tasks: Task[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAtVal = data.createdAt;
      // Convert server timestamp or date string to milliseconds for sorting
      let createdAtMs = 0;
      if (createdAtVal) {
        if (typeof createdAtVal.toMillis === 'function') {
          createdAtMs = createdAtVal.toMillis();
        } else if (createdAtVal.seconds) {
          createdAtMs = createdAtVal.seconds * 1000;
        } else {
          createdAtMs = Date.parse(createdAtVal) || 0;
        }
      }
      
      tasks.push({
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        priority: data.priority || 'medium',
        deadline: data.deadline || '',
        category: data.category || 'General',
        progress: typeof data.progress === 'number' ? data.progress : 0,
        status: data.status || 'todo',
        estimatedDuration: data.estimatedDuration || '',
        createdAtMs: createdAtMs // Keep temporary in-memory property for sorting
      } as any);
    });
    
    // Sort tasks in memory: newest (highest createdAtMs) first
    tasks.sort((a: any, b: any) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    
    // Clean up temporary property
    tasks.forEach((t: any) => delete t.createdAtMs);
    
    console.log(`[Firestore Read] Successfully fetched and sorted ${tasks.length} tasks for UID: ${userId}`);
    return tasks;
  } catch (error: any) {
    console.error(`[Firestore Error] Failed to process retrieved tasks for UID: ${userId}:`, error);
    throw error;
  }
}

/**
 * Retrieve all calendar events for a specific user from Firestore.
 */
export async function getCalendarEventsFromFirestore(userId: string): Promise<CalendarEvent[]> {
  const eventsRef = collection(db, 'users', userId, 'calendarEvents');
  const path = `users/${userId}/calendarEvents`;
  
  let querySnapshot;
  try {
    console.log(`[Firestore Read] Retrieving all calendar events for user UID: ${userId}`);
    querySnapshot = await getDocs(eventsRef);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  try {
    const events: CalendarEvent[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      events.push({
        id: docSnap.id,
        title: data.title || '',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        category: data.category || ''
      });
    });
    console.log(`[Firestore Read] Successfully fetched ${events.length} calendar events for UID: ${userId}`);
    return events;
  } catch (error: any) {
    console.error(`[Firestore Error] Failed to process retrieved calendar events for UID: ${userId}:`, error);
    throw error;
  }
}

/**
 * Add a new calendar event to a user's collection in Firestore.
 */
export async function addCalendarEventToFirestore(userId: string, event: Omit<CalendarEvent, 'id'>): Promise<string> {
  const eventsRef = collection(db, 'users', userId, 'calendarEvents');
  const newDocRef = doc(eventsRef);
  const docId = newDocRef.id;
  const path = `users/${userId}/calendarEvents/${docId}`;

  try {
    console.log(`[Firestore Write] Writing calendar event "${event.title}" to path: ${path}`, event);
    await setDoc(newDocRef, {
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      category: event.category || '',
      createdAt: serverTimestamp()
    });
    console.log(`[Firestore Write] Successfully wrote calendar event "${event.title}" to Firestore (ID: ${docId}).`);
    return docId;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Delete a calendar event from a user's collection in Firestore.
 */
export async function deleteCalendarEventFromFirestore(userId: string, eventId: string): Promise<void> {
  const eventRef = doc(db, 'users', userId, 'calendarEvents', eventId);
  const path = `users/${userId}/calendarEvents/${eventId}`;

  try {
    console.log(`[Firestore Write] Deleting calendar event ID: ${eventId} from path: ${path}`);
    await deleteDoc(eventRef);
    console.log(`[Firestore Write] Successfully deleted calendar event ID: ${eventId} from Firestore.`);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Add a new task to a user's collection in Firestore.
 */
export async function addTaskToFirestore(userId: string, task: Omit<Task, 'id'>, customId?: string): Promise<string> {
  const tasksRef = collection(db, 'users', userId, 'tasks');
  const newDocRef = customId ? doc(db, 'users', userId, 'tasks', customId) : doc(tasksRef);
  const docId = newDocRef.id;
  const path = `users/${userId}/tasks/${docId}`;

  try {
    console.log(`[Firestore Write] Writing task "${task.title}" to path: ${path}`, task);
    await setDoc(newDocRef, {
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      deadline: task.deadline || '',
      category: task.category || 'General',
      progress: typeof task.progress === 'number' ? task.progress : 0,
      status: task.status || 'todo',
      estimatedDuration: task.estimatedDuration || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`[Firestore Write] Successfully wrote task "${task.title}" to Firestore (ID: ${docId}).`);
    return docId;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update an existing task in a user's collection in Firestore.
 */
export async function updateTaskInFirestore(userId: string, taskId: string, updatedFields: Partial<Task>): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  const path = `users/${userId}/tasks/${taskId}`;
  const updateData: Record<string, any> = {};
  
  if (updatedFields.title !== undefined) updateData.title = updatedFields.title;
  if (updatedFields.description !== undefined) updateData.description = updatedFields.description;
  if (updatedFields.priority !== undefined) updateData.priority = updatedFields.priority;
  if (updatedFields.deadline !== undefined) updateData.deadline = updatedFields.deadline;
  if (updatedFields.category !== undefined) updateData.category = updatedFields.category;
  if (updatedFields.progress !== undefined) updateData.progress = updatedFields.progress;
  if (updatedFields.status !== undefined) updateData.status = updatedFields.status;
  if (updatedFields.estimatedDuration !== undefined) updateData.estimatedDuration = updatedFields.estimatedDuration;
  updateData.updatedAt = serverTimestamp();

  try {
    console.log(`[Firestore Write] Updating task ID: ${taskId} in path: ${path}`, updateData);
    await updateDoc(taskRef, updateData);
    console.log(`[Firestore Write] Successfully updated task ID: ${taskId} in Firestore.`);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a task from a user's collection in Firestore.
 */
export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  const path = `users/${userId}/tasks/${taskId}`;

  try {
    console.log(`[Firestore Write] Deleting task ID: ${taskId} from path: ${path}`);
    await deleteDoc(taskRef);
    console.log(`[Firestore Write] Successfully deleted task ID: ${taskId} from Firestore.`);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Add a completed focus session report to Firestore.
 */
export async function addFocusSessionToFirestore(userId: string, session: Omit<FocusSession, 'id'>): Promise<string> {
  const sessionsRef = collection(db, 'users', userId, 'focusSessions');
  const newDocRef = doc(sessionsRef);
  const docId = newDocRef.id;
  const path = `users/${userId}/focusSessions/${docId}`;

  try {
    console.log(`[Firestore Write] Writing focus session to path: ${path}`, session);
    await setDoc(newDocRef, {
      taskId: session.taskId,
      taskTitle: session.taskTitle,
      startTime: session.startTime,
      endTime: session.endTime,
      focusedTime: session.focusedTime,
      interruptionCount: session.interruptionCount,
      totalInterruptedTime: session.totalInterruptedTime,
      longestInterruption: session.longestInterruption,
      focusEfficiency: session.focusEfficiency,
      interruptions: session.interruptions || [],
      createdAt: serverTimestamp()
    });
    console.log(`[Firestore Write] Successfully wrote focus session to Firestore (ID: ${docId}).`);
    return docId;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Retrieve all focus sessions for a user from Firestore.
 */
export async function getFocusSessionsFromFirestore(userId: string): Promise<FocusSession[]> {
  const sessionsRef = collection(db, 'users', userId, 'focusSessions');
  const path = `users/${userId}/focusSessions`;
  
  let querySnapshot;
  try {
    console.log(`[Firestore Read] Retrieving focus sessions for user UID: ${userId}`);
    querySnapshot = await getDocs(sessionsRef);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, path);
  }

  try {
    const sessions: FocusSession[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      sessions.push({
        id: docSnap.id,
        taskId: data.taskId || '',
        taskTitle: data.taskTitle || '',
        startTime: typeof data.startTime === 'number' ? data.startTime : 0,
        endTime: typeof data.endTime === 'number' ? data.endTime : 0,
        focusedTime: typeof data.focusedTime === 'number' ? data.focusedTime : 0,
        interruptionCount: typeof data.interruptionCount === 'number' ? data.interruptionCount : 0,
        totalInterruptedTime: typeof data.totalInterruptedTime === 'number' ? data.totalInterruptedTime : 0,
        longestInterruption: typeof data.longestInterruption === 'number' ? data.longestInterruption : 0,
        focusEfficiency: typeof data.focusEfficiency === 'number' ? data.focusEfficiency : 0,
        interruptions: data.interruptions || []
      });
    });

    // Sort focus sessions newest first based on startTime
    sessions.sort((a, b) => b.startTime - a.startTime);
    return sessions;
  } catch (error: any) {
    console.error(`[Firestore Error] Failed to process retrieved focus sessions for UID: ${userId}:`, error);
    throw error;
  }
}

/**
 * Update a user's profile fields in Firestore.
 */
export async function updateUserProfileInFirestore(userId: string, updatedFields: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const path = `users/${userId}`;
  try {
    console.log(`[Firestore Write] Updating user profile at: ${path}`, updatedFields);
    await updateDoc(userRef, updatedFields as Record<string, any>);
    console.log(`[Firestore Write] Successfully updated user profile at: ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Save a generated Guardian Rescue Plan to Firestore.
 */
export async function saveRescuePlanToFirestore(userId: string, plan: {
  id: string;
  originalTasks: Task[];
  optimizedSchedule: any[];
  appliedChanges: any[];
  metrics: any;
  timestamp: string;
  isApplied: boolean;
  reasons: string[];
}): Promise<void> {
  const planRef = doc(db, 'users', userId, 'rescuePlans', plan.id);
  const latestRef = doc(db, 'users', userId, 'rescuePlans', 'latest');
  const path = `users/${userId}/rescuePlans/${plan.id}`;
  try {
    console.log(`[Firestore Write] Saving rescue plan to path: ${path}`, plan);
    const docData = {
      id: plan.id,
      originalTasks: plan.originalTasks,
      optimizedSchedule: plan.optimizedSchedule,
      appliedChanges: plan.appliedChanges,
      metrics: plan.metrics,
      timestamp: plan.timestamp,
      isApplied: plan.isApplied,
      reasons: plan.reasons,
      updatedAt: serverTimestamp()
    };
    await setDoc(planRef, docData);
    await setDoc(latestRef, docData);
    console.log(`[Firestore Write] Successfully saved latest rescue plan and history in Firestore.`);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Retrieve the latest Guardian Rescue Plan from Firestore.
 */
export async function getLatestRescuePlanFromFirestore(userId: string): Promise<any | null> {
  const planRef = doc(db, 'users', userId, 'rescuePlans', 'latest');
  const path = `users/${userId}/rescuePlans/latest`;
  try {
    console.log(`[Firestore Read] Reading latest rescue plan for UID: ${userId}`);
    const docSnap = await getDoc(planRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Retrieve all Guardian Rescue Plans from Firestore history.
 */
export async function getRescuePlansHistoryFromFirestore(userId: string): Promise<any[]> {
  const plansColl = collection(db, 'users', userId, 'rescuePlans');
  const path = `users/${userId}/rescuePlans`;
  try {
    const querySnapshot = await getDocs(plansColl);
    const plans: any[] = [];
    querySnapshot.forEach((doc) => {
      if (doc.id !== 'latest') {
        plans.push(doc.data());
      }
    });
    // Sort client-side safely to avoid Firestore index errors
    plans.sort((a, b) => {
      const timeA = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : new Date(a.timestamp || 0).getTime();
      const timeB = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    return plans;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Delete the latest Guardian Rescue Plan from Firestore.
 */
export async function deleteRescuePlanFromFirestore(userId: string): Promise<void> {
  const planRef = doc(db, 'users', userId, 'rescuePlans', 'latest');
  const path = `users/${userId}/rescuePlans/latest`;
  try {
    console.log(`[Firestore Write] Deleting latest rescue plan for UID: ${userId}`);
    await deleteDoc(planRef);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export { auth, db };
