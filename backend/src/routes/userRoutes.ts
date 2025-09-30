import { FastifyInstance } from "fastify";
import { getAllUsers, getUserById, updateUser, createUser, deleteUser } from "../controllers/user";

export default async function userRoutes(fastify: FastifyInstance) {

	// Helper: adapt Fastify reply to minimal Express-like response API used by controllers
	const makeExpressLikeRes = (reply: any) => {
		return {
			status: (code: number) => ({ json: (payload: any) => reply.code(code).send(payload) }),
			json: (payload: any) => reply.send(payload),
			send: (payload: any) => reply.send(payload),
		};
	};

	fastify.get('/api/users', async (req, reply) => {
		const res = makeExpressLikeRes(reply);
		return await getAllUsers(req as any, res as any);
	});

	fastify.get('/api/users/:id', async (req, reply) => {
		const res = makeExpressLikeRes(reply);
		return await getUserById(req as any, res as any);
	});

	fastify.post('/api/users', async (req, reply) => {
		const res = makeExpressLikeRes(reply);
		return await createUser(req as any, res as any);
	});

	fastify.put('/api/users/:id', async (req, reply) => {
		const res = makeExpressLikeRes(reply);
		return await updateUser(req as any, res as any);
	});

	fastify.delete('/api/users/:id', async (req, reply) => {
		const res = makeExpressLikeRes(reply);
		return await deleteUser(req as any, res as any);
	});
}
