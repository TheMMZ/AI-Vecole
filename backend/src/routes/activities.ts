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
      // If user is admin, return everything. Otherwise return activities that are public (no actor) or owned by the user.
      let filter = {} as any;
      if (payload && payload.role === 'admin') {
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
