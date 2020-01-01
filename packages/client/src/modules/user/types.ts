/**
 * TODO: Share these types with the server!
 */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  givenName: string;
  familyName: string;
}

interface Payment {
  courseId: string;
  datePaid: string;
}

export interface User {
  profile: UserProfile;
  payments: Payment[];
}
