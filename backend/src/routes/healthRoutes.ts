import { Router, Request, Response } from "express";

const healthRoutes = Router();

// Health check endpoint for Docker and EasyPanel
healthRoutes.get("/api/health", async (req: Request, res: Response) => {
  try {
    // Return basic health status
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    return res.status(503).json({
      status: "unhealthy",
      error: error.message
    });
  }
});

export default healthRoutes;
