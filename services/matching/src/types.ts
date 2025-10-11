export interface MatchRequest {
  userId: string;
  email: string;
  difficulties: string[];
  topics: string[];
  socketId: string;
  timestamp: number;
}

export interface Match {
  roomId: string;
  user1: {
    userId: string;
    email: string;
  };
  user2: {
    userId: string;
    email: string;
  };
  difficulties: string[];
  topics: string[];
  createdAt: Date;
}
