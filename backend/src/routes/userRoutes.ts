import { FastifyInstance } from "fastify";
import { getAllUsers, getUserById, updateUser, createUser, deleteUser } from "../controllers/user";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.get('/api/users', async (req, reply) => await getAllUsers(req as any, reply as any));
	fastify.get('/api/users/:id', async (req, reply) => await getUserById(req as any, reply as any));
	fastify.post('/api/users', async (req, reply) => await createUser(req as any, reply as any));
	fastify.put('/api/users/:id', async (req, reply) => await updateUser(req as any, reply as any));
	fastify.delete('/api/users/:id', async (req, reply) => await deleteUser(req as any, reply as any));
}
