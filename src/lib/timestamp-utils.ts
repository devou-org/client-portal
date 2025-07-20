// Utility function to safely convert Firestore timestamps to Date objects
export const safeToDate = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  
  // Check if it's a proper Firestore Timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('Error converting timestamp:', error);
      return undefined;
    }
  }
  
  // Check if it's a timestamp-like object with seconds
  if (timestamp.seconds && timestamp.nanoseconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Check if it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Check if it's a string that can be parsed as a date
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  // Check if it's a number (timestamp in milliseconds)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  console.warn('Unknown timestamp format:', timestamp);
  return undefined;
};
