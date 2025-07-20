import { debatesApi, argumentsApi, usersApi, AuthService } from '@/lib/api';
import { Debate, Argument, User } from '@/lib/types';
import { isValidObjectId } from '@/lib/utils';

export const dataService = {
  // --------------------------------------Users--------------------------------------------------
  async getUsers(): Promise<User[]> {
    try {
      const response = await usersApi.getUsers({ limit: 100 });
      return response.success && response.data ? response.data.users : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await usersApi.getUserById(id);
      return response.success && response.data ? response.data as User : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async getLeaderboard(period: 'weekly' | 'monthly' | 'all-time' = 'all-time'): Promise<User[]> {
    try {
      const response = await usersApi.getLeaderboard(period);
      return response.success && response.data ? response.data as User[] : [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  // --------------------------------Debates--------------------------------
  async getDebates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<Debate[]> {
    try {
      const response = await debatesApi.getDebates(params);
      return response.success && response.data ? response.data.debates : [];
    } catch (error) {
      console.error('Error fetching debates:', error);
      return [];
    }
  },

  async getDebateById(id: string): Promise<Debate | null> {
    try {
      if (!isValidObjectId(id)) {
        console.warn('Invalid debate ID format:', id);
        return null;
      }
      
      const response = await debatesApi.getDebateById(id);
      return response.success && response.data ? response.data.debate as Debate : null;
    } catch (error) {
      console.error('Error fetching debate:', error);
      return null;
    }
  },

  async createDebate(debateData: {
    title: string;
    description: string;
    category: string;
    tags?: string[];
    duration: number;
    imageUrl?: string;
  }): Promise<Debate | null> {
    try {
      const response = await debatesApi.createDebate(debateData);
      return response.success && response.data ? response.data.debate as Debate : null;
    } catch (error) {
      console.error('Error creating debate:', error);
      throw error;
    }
  },

  async getActiveDebates(): Promise<Debate[]> {
    return this.getDebates({ isActive: true });
  },

  async getDebatesByCategory(category: string): Promise<Debate[]> {
    return this.getDebates({ category });
  },

  // ---------------------------------------------Arguments--------------------------------------------
  async getArgumentsForDebate(debateId: string): Promise<Argument[]> {
    try {
      if (!isValidObjectId(debateId)) {
        console.warn('Invalid debate ID format for arguments:', debateId);
        return [];
      }
      
      const isAuthenticated = AuthService.isAuthenticated();
      
      if (isAuthenticated) {
        try {
          const response = await argumentsApi.getArgumentsWithVotes(debateId);
          return response.success && response.data ? response.data.arguments : [];
        } catch (authError) {
          console.log('Authenticated arguments call failed, falling back to public endpoint:', authError);
          const response = await argumentsApi.getArgumentsForDebate(debateId);
          return response.success && response.data ? response.data.arguments : [];
        }
      } else {
        const response = await argumentsApi.getArgumentsForDebate(debateId);
        return response.success && response.data ? response.data.arguments : [];
      }
    } catch (error) {
      console.error('Error fetching arguments:', error);
      return [];
    }
  },

  async createArgument(debateId: string, argumentData: {
    text: string;
    side: 'support' | 'oppose';
  }): Promise<Argument | null> {
    try {
      const response = await argumentsApi.createArgument(debateId, argumentData);
      return response.success && response.data ? response.data as Argument : null;
    } catch (error) {
      console.error('Error creating argument:', error);
      throw error;
    }
  },

  async voteOnArgument(argumentId: string, voteType: 'upvote' | 'downvote'): Promise<boolean> {
    try {
      const response = await argumentsApi.voteOnArgument(argumentId, voteType);
      return response.success;
    } catch (error) {
      console.error('Error voting on argument:', error);
      return false;
    }
  },

  async getUserSide(debateId: string): Promise<string | null> {
    try {
      const response = await argumentsApi.getUserSide(debateId);
      return response.data?.side || null;
    } catch (error) {
      console.error('Error getting user side:', error);
      return null;
    }
  },

  async joinSide(debateId: string, side: 'support' | 'oppose'): Promise<boolean> {
    try {
      const response = await argumentsApi.joinSide(debateId, side);
      return response.success;
    } catch (error) {
      console.error('Error joining side:', error);
      return false;
    }
  },

  async updateArgument(argumentId: string, text: string): Promise<boolean> {
    try {
      const response = await argumentsApi.updateArgument(argumentId, { text });
      return response.success;
    } catch (error) {
      console.error('Error updating argument:', error);
      return false;
    }
  },

  async deleteArgument(argumentId: string): Promise<boolean> {
    try {
      const response = await argumentsApi.deleteArgument(argumentId);
      return response.success;
    } catch (error) {
      console.error('Error deleting argument:', error);
      return false;
    }
  },

  //--------------------------- Utility functions-----------------------------
  async searchDebates(query: string): Promise<Debate[]> {
    return this.getDebates({ search: query });
  },

  async getPopularDebates(): Promise<Debate[]> {
    return this.getDebates({ sort: 'participantCount', order: 'desc', limit: 10 });
  },

  async getRecentDebates(): Promise<Debate[]> {
    return this.getDebates({ sort: 'createdAt', order: 'desc', limit: 10 });
  }
};

export const {
  getUsers,
  getUserById,
  getLeaderboard,
  getDebates,
  getDebateById,
  createDebate,
  getActiveDebates,
  getDebatesByCategory,
  getArgumentsForDebate,
  createArgument,
  voteOnArgument,
  getUserSide,
  joinSide,
  updateArgument,
  deleteArgument,
  searchDebates,
  getPopularDebates,
  getRecentDebates
} = dataService;
