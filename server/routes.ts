import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  loginSchema, 
  registerSchema, 
  createPollSchema, 
  insertVoteSchema 
} from "@shared/schema";
import session from "express-session";
import bcrypt from "bcrypt";

// Extend session interface
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// WebSocket connections for real-time updates
const wsClients = new Set<WebSocket>();

// Broadcast to all connected clients
function broadcast(message: any) {
  const data = JSON.stringify(message);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Seed admin user
  (async () => {
    const adminExists = await storage.getUserByEmail("admin@gmail.com");
    if (!adminExists) {
      await storage.createUser({
        name: "Admin",
        email: "admin@gmail.com",
        passwordHash: "123456", // Will be hashed in storage
        isAdmin: true
      });
    }
  })();

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.user = user;
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        name: data.name,
        email: data.email,
        passwordHash: data.password,
        isAdmin: false
      });

      req.session.userId = user.id;
      res.json({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.validateUser(data.email, data.password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Poll routes
  app.get("/api/polls", async (req, res) => {
    try {
      const polls = await storage.getAllPolls();
      const pollsWithStats = await Promise.all(
        polls.map(async (poll) => {
          const options = await storage.getPollOptions(poll.id);
          const stats = await storage.getPollStats(poll.id);
          return { ...poll, options, stats };
        })
      );
      res.json(pollsWithStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/polls/my", requireAuth, async (req: any, res) => {
    try {
      const polls = await storage.getPollsByUser(req.session.userId);
      const pollsWithStats = await Promise.all(
        polls.map(async (poll) => {
          const options = await storage.getPollOptions(poll.id);
          const stats = await storage.getPollStats(poll.id);
          return { ...poll, options, stats };
        })
      );
      res.json(pollsWithStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/polls/:id", async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }

      const options = await storage.getPollOptions(poll.id);
      const stats = await storage.getPollStats(poll.id);
      
      res.json({ ...poll, options, stats });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/polls", requireAuth, async (req: any, res) => {
    try {
      const data = createPollSchema.parse(req.body);
      
      const poll = await storage.createPoll({
        question: data.question,
        userId: req.session.userId,
        allowMultiple: data.allowMultiple,
        showResults: data.showResults,
        isPublished: true
      });

      // Create poll options
      const options = await Promise.all(
        data.options.map(optionText => 
          storage.createPollOption({
            text: optionText,
            pollId: poll.id
          })
        )
      );

      const pollWithOptions = { ...poll, options, stats: { totalVotes: 0, optionVotes: [] } };
      
      // Broadcast new poll to all clients
      broadcast({ type: "POLL_CREATED", poll: pollWithOptions });
      
      res.json(pollWithOptions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/polls/:id", requireAuth, async (req: any, res) => {
    try {
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }

      // Check if user owns the poll or is admin
      const user = await storage.getUser(req.session.userId);
      if (poll.userId !== req.session.userId && !user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deletePoll(req.params.id);
      
      // Broadcast poll deletion
      broadcast({ type: "POLL_DELETED", pollId: req.params.id });
      
      res.json({ message: "Poll deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Vote routes
  app.post("/api/polls/:pollId/vote", requireAuth, async (req: any, res) => {
    try {
      const { optionId } = req.body;
      const pollId = req.params.pollId;
      const userId = req.session.userId;

      // Check if poll exists
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }

      // Check if user already voted (if not allowing multiple)
      if (!poll.allowMultiple) {
        const existingVotes = await storage.getUserVoteForPoll(userId, pollId);
        if (existingVotes.length > 0) {
          return res.status(400).json({ message: "You have already voted on this poll" });
        }
      }

      // Validate option exists
      const options = await storage.getPollOptions(pollId);
      const option = options.find(opt => opt.id === optionId);
      if (!option) {
        return res.status(400).json({ message: "Invalid option" });
      }

      // Create vote
      const vote = await storage.createVote({
        userId,
        pollId,
        optionId
      });

      // Get updated stats
      const stats = await storage.getPollStats(pollId);
      const pollWithStats = { ...poll, options, stats };

      // Broadcast vote update to all clients
      broadcast({ 
        type: "VOTE_CAST", 
        pollId, 
        vote, 
        poll: pollWithStats 
      });

      res.json({ vote, poll: pollWithStats });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/polls/:pollId/votes/user", requireAuth, async (req: any, res) => {
    try {
      const pollId = req.params.pollId;
      const userId = req.session.userId;
      
      const votes = await storage.getUserVoteForPoll(userId, pollId);
      res.json(votes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Statistics routes
  app.get("/api/stats/user", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats(req.session.userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      
      // Don't allow deleting yourself
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/polls/:id", requireAdmin, async (req: any, res) => {
    try {
      const pollId = req.params.id;
      
      const success = await storage.deletePoll(pollId);
      if (!success) {
        return res.status(404).json({ message: "Poll not found" });
      }

      // Broadcast poll deletion
      broadcast({ type: "POLL_DELETED", pollId });

      res.json({ message: "Poll deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    wsClients.add(ws);
    
    ws.on('close', () => {
      wsClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSocket connection established' }));
  });

  return httpServer;
}
