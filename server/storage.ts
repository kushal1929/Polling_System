import { 
  users, polls, pollOptions, votes,
  type User, type InsertUser,
  type Poll, type InsertPoll,
  type PollOption, type InsertPollOption,
  type Vote, type InsertVote
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(email: string, password: string): Promise<User | null>;
  
  // Poll methods
  getAllPolls(): Promise<Poll[]>;
  getPollsByUser(userId: string): Promise<Poll[]>;
  getPoll(id: string): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  updatePoll(id: string, poll: Partial<InsertPoll>): Promise<Poll | undefined>;
  deletePoll(id: string): Promise<boolean>;
  
  // Poll option methods
  getPollOptions(pollId: string): Promise<PollOption[]>;
  createPollOption(option: InsertPollOption): Promise<PollOption>;
  
  // Vote methods
  createVote(vote: InsertVote): Promise<Vote>;
  getVotesByPoll(pollId: string): Promise<Vote[]>;
  getUserVoteForPoll(userId: string, pollId: string): Promise<Vote[]>;
  
  // Statistics
  getPollStats(pollId: string): Promise<{
    totalVotes: number;
    optionVotes: Array<{ optionId: string; count: number }>;
  }>;
  
  getUserStats(userId: string): Promise<{
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
  }>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<boolean>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalPolls: number;
    totalVotes: number;
    activePolls: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const passwordHash = await bcrypt.hash(insertUser.passwordHash, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, passwordHash })
      .returning();
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  async getAllPolls(): Promise<Poll[]> {
    return await db.select().from(polls).orderBy(desc(polls.createdAt));
  }

  async getPollsByUser(userId: string): Promise<Poll[]> {
    return await db
      .select()
      .from(polls)
      .where(eq(polls.userId, userId))
      .orderBy(desc(polls.createdAt));
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll || undefined;
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const [created] = await db
      .insert(polls)
      .values(poll)
      .returning();
    return created;
  }

  async updatePoll(id: string, poll: Partial<InsertPoll>): Promise<Poll | undefined> {
    const [updated] = await db
      .update(polls)
      .set({ ...poll, updatedAt: new Date() })
      .where(eq(polls.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePoll(id: string): Promise<boolean> {
    // Delete votes first
    await db.delete(votes).where(eq(votes.pollId, id));
    // Delete options
    await db.delete(pollOptions).where(eq(pollOptions.pollId, id));
    // Delete poll
    const result = await db.delete(polls).where(eq(polls.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPollOptions(pollId: string): Promise<PollOption[]> {
    return await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId));
  }

  async createPollOption(option: InsertPollOption): Promise<PollOption> {
    const [created] = await db
      .insert(pollOptions)
      .values(option)
      .returning();
    return created;
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const [created] = await db
      .insert(votes)
      .values(vote)
      .returning();
    return created;
  }

  async getVotesByPoll(pollId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.pollId, pollId));
  }

  async getUserVoteForPoll(userId: string, pollId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.pollId, pollId)));
  }

  async getPollStats(pollId: string): Promise<{
    totalVotes: number;
    optionVotes: Array<{ optionId: string; count: number }>;
  }> {
    const totalVotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.pollId, pollId));

    const optionVotes = await db
      .select({
        optionId: votes.optionId,
        count: sql<number>`count(*)`
      })
      .from(votes)
      .where(eq(votes.pollId, pollId))
      .groupBy(votes.optionId);

    return {
      totalVotes: totalVotes[0]?.count || 0,
      optionVotes: optionVotes || []
    };
  }

  async getUserStats(userId: string): Promise<{
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
  }> {
    const totalPollsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(polls)
      .where(eq(polls.userId, userId));

    const activePollsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(polls)
      .where(and(eq(polls.userId, userId), eq(polls.isPublished, true)));

    const totalVotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .innerJoin(polls, eq(votes.pollId, polls.id))
      .where(eq(polls.userId, userId));

    return {
      totalPolls: totalPollsResult[0]?.count || 0,
      activePolls: activePollsResult[0]?.count || 0,
      totalVotes: totalVotesResult[0]?.count || 0,
    };
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Delete user's votes first
    await db.delete(votes).where(eq(votes.userId, userId));
    // Delete user's polls (which will cascade to options and votes)
    const userPolls = await db.select({ id: polls.id }).from(polls).where(eq(polls.userId, userId));
    for (const poll of userPolls) {
      await this.deletePoll(poll.id);
    }
    // Delete user
    const result = await db.delete(users).where(eq(users.id, userId));
    return (result.rowCount || 0) > 0;
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalPolls: number;
    totalVotes: number;
    activePolls: number;
  }> {
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const totalPollsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(polls);

    const activePollsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(polls)
      .where(eq(polls.isPublished, true));

    const totalVotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes);

    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      totalPolls: totalPollsResult[0]?.count || 0,
      activePolls: activePollsResult[0]?.count || 0,
      totalVotes: totalVotesResult[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
