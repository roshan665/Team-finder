export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  skills: string[];
  trustScore: number;
  githubUsername?: string;
  linkedinURL?: string;
  githubReposCount: number;
  lastCommitDate?: string;
  role: 'user' | 'admin';
  hasCompletedProfile: boolean;
  isVerified?: boolean;
  college?: string;
  year?: string;
  enrollmentNo?: string;
  course?: string;
  branch?: string;
  achievements: string[];
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
}

export interface VerifiedStudent {
  id: string;
  name: string;
  enrollmentNo: string;
  course: string;
  branch: string;
  instituteName: string;
  verifiedAt: any;
}

export interface Team {
  id: string;
  leaderId: string;
  leaderName: string;
  title: string;
  description: string;
  hackathonId: string;
  hackathonName: string;
  neededSkills: string[];
  members: string[]; // Array of UIDs
  strength: number;
  chemistry: number;
  status: 'recruiting' | 'full' | 'completed';
  createdAt: any;
}

export interface Message {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request' | 'acceptance' | 'system';
  read: boolean;
  createdAt: any;
  link?: string;
}

export interface Hackathon {
  id: string;
  name: string;
  description: string;
  date: string; // This will be the deadline/event date
  deadline: string;
  location: string;
  maxTeamSize: number;
  teamCount: number;
  status: 'active' | 'closed' | 'upcoming' | 'completed';
}

export interface JoinRequest {
  id: string;
  teamId: string;
  teamName: string;
  leaderId: string;
  applicantId: string;
  applicantName: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  leaderId: string;
  leaderName: string;
  inviteeId: string;
  inviteeName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}
