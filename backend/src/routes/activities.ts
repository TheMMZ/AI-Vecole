import { FastifyInstance } from "fastify";
import Activity from "../models/Activity";

export default async function activitiesRoutes(fastify: FastifyInstance) {
  fastify.get('/api/activities', async (req, reply) => {
    try {
      // Try to read Authorization header and verify token to determine role/user
      const authHeader = (req.headers as any).authorization as string | undefined;
      const { verifyToken } = require("../utils/auth");
      const payload = verifyToken(authHeader);
      const userId = payload?.id;
      // If user is admin, return everything. Our JWT currently only stores the user id,
      // so fetch the user record to determine role when a token is present.
      let filter = {} as any;
      let isAdmin = false;
      try {
        if (userId) {
          const User = require('../models/User').default;
          const user = await User.findById(userId).select('role');
          if (user && (user as any).role === 'admin') isAdmin = true;
        }
      } catch (e) {
        // ignore lookup errors and fall back to non-admin behavior
      }

      if (isAdmin) {
        filter = {};
      } else if (userId) {
        filter = { $or: [{ actor: userId }, { actor: { $exists: false } }, { actor: null }] };
      } else {
        // not authenticated: only public activities (no actor)
        filter = { actor: { $exists: false } };
      }
      const activities = await Activity.find(filter).sort({ date: -1 }).limit(20);
      reply.send(activities);
    } catch (e) {
      reply.status(500).send({ message: 'Failed to load activities' });
    }
  });
}
