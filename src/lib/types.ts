export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  debatesParticipated: number;
  totalVotes: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Debate = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  imageUrl: string;
  creatorId: string | { id: string; name: string; avatarUrl: string };
  duration: number;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Argument = {
  id: string;
  debateId: string;
  authorId: string | { id: string; name: string; avatarUrl: string };
  side: 'support' | 'oppose';
  text: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'upvote' | 'downvote' | null; 
  createdAt: string;
  updatedAt: string;
};
