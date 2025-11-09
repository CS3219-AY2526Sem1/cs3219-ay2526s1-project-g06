import type { MatchRequest, Match } from "./types";
import { v4 as uuidv4 } from "uuid";

class MatchingQueue {
  private queue: MatchRequest[] = [];

  addToQueue(request: MatchRequest): void {
    this.queue.push(request);
  }

  removeFromQueue(userId: string): void {
    this.queue = this.queue.filter((req) => req.userId !== userId);
  }

  removeBySocketId(socketId: string): void {
    this.queue = this.queue.filter((req) => req.socketId !== socketId);
  }

  isUserInQueue(userId: string): boolean {
    return this.queue.some((req) => req.userId === userId);
  }

  findMatch(request: MatchRequest): { match: MatchRequest; matchedRequest: Match } | null {
    // Find a user with overlapping criteria
    for (let i = 0; i < this.queue.length; i++) {
      const candidate = this.queue[i];

      // Don't match with yourself
      if (candidate.userId === request.userId) {
        continue;
      }

      // Check for overlapping difficulties
      const hasOverlappingDifficulty = request.difficulties.some((d) =>
        candidate.difficulties.includes(d)
      );

      // Check for overlapping topics
      const hasOverlappingTopic = request.topics.some((t) =>
        candidate.topics.includes(t)
      );

      if (hasOverlappingDifficulty && hasOverlappingTopic) {
        // Found a match! Remove from queue
        this.queue.splice(i, 1);

        // Find overlapping criteria
        const matchedDifficulties = request.difficulties.filter((d) =>
          candidate.difficulties.includes(d)
        );
        const matchedTopics = request.topics.filter((t) =>
          candidate.topics.includes(t)
        );

        const matchedRequest: Match = {
          roomId: uuidv4(),
          user1: {
            userId: request.userId,
            email: request.email,
          },
          user2: {
            userId: candidate.userId,
            email: candidate.email,
          },
          difficulties: matchedDifficulties,
          topics: matchedTopics,
          createdAt: new Date(),
        };

        return { match: candidate, matchedRequest };
      }
    }

    return null;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearStaleRequests(maxAgeMs: number = 30000): void {
    const now = Date.now();
    this.queue = this.queue.filter(
      (req) => now - req.timestamp < maxAgeMs
    );
  }
}

export const matchingQueue = new MatchingQueue();
