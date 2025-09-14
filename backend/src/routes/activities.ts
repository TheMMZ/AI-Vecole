import { FastifyInstance } from "fastify";
import Activity from "../models/Activity";

export default async function activitiesRoutes(fastify: FastifyInstance) {
  fastify.get('/api/activities', async (req, reply) => {
    try {
      const activities = await Activity.find().sort({ date: -1 }).limit(20);
      reply.send(activities);
    } catch (e) {
      reply.status(500).send({ message: 'Failed to load activities' });
    }
  });
}
