// Type definition for possible timestamp formats
type TimestampInput = 
  | { toDate: () => Date }  // Firestore Timestamp
  | { seconds: number; nanoseconds: number }  // Timestamp-like object
  | Date  // Already a Date
  | string  // ISO string or parseable date string
  | number  // Unix timestamp
  | null
  | undefined;

// Utility function to safely convert Firestore timestamps to Date objects
export const safeToDate = (timestamp: TimestampInput): Date | undefined => {
  if (!timestamp) return undefined;
  
  // Check if it's a proper Firestore Timestamp
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('Error converting timestamp:', error);
      return undefined;
    }
  }
  
  // Check if it's a timestamp-like object with seconds
  if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
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
