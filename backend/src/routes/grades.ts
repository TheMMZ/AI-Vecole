import { FastifyInstance } from "fastify";
import { getAllGrades, createGrade, updateGrade, deleteGrade } from "../controllers/grade";

export default async function gradesRoutes(fastify: FastifyInstance) {
  fastify.get("/api/grades", getAllGrades);
  fastify.post("/api/grades", createGrade);
  fastify.put("/api/grades/:id", updateGrade); // Ensure this route is still valid
  fastify.delete("/api/grades/:id", deleteGrade); // Ensure this route is still valid
}
