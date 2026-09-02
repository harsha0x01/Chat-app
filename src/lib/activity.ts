export const logActivity = async (db: any, userId: string, action: string, details?: string) => {
  const { collection, addDoc } = await import('firebase/firestore');
  try {
    await addDoc(collection(db, 'activity'), {
      userId,
      action,
      details,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error('Failed to log activity', e);
  }
};
