import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/begehungen", async (req: Request, res: Response) => {
    try {
      const { project_id, type, positions } = req.body;
      if (!project_id || !type || !positions || !Array.isArray(positions)) {
        res.status(400).json({ error: "project_id, type, and positions required" });
        return;
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const bgResult = await client.query(
          `INSERT INTO begehungen (project_id, type, finalized, finalized_at)
           VALUES ($1, $2, TRUE, NOW())
           RETURNING id, finalized_at`,
          [project_id, type]
        );
        const begehungId = bgResult.rows[0].id;
        const finalizedAt = bgResult.rows[0].finalized_at;

        for (const pos of positions) {
          await client.query(
            `INSERT INTO begehung_positions
             (begehung_id, room_id, room_name, position_id, position_nr, title, description,
              qty, unit, price, trade, status, photo_count, note, is_mehrleistung, from_catalog)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
            [
              begehungId,
              pos.room_id,
              pos.room_name,
              pos.position_id,
              pos.position_nr,
              pos.title,
              pos.description || "",
              pos.qty || 0,
              pos.unit || "Stk",
              pos.price || 0,
              pos.trade || "",
              pos.status || "none",
              pos.photo_count || 0,
              pos.note || "",
              pos.is_mehrleistung || false,
              pos.from_catalog || false,
            ]
          );
        }

        await client.query("COMMIT");
        res.json({ id: begehungId, finalized_at: finalizedAt });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Error creating begehung:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/begehungen/:projectId", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { type } = req.query;

      let query = `SELECT * FROM begehungen WHERE project_id = $1`;
      const params: any[] = [projectId];

      if (type) {
        query += ` AND type = $2`;
        params.push(type);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err: any) {
      console.error("Error fetching begehungen:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/begehungen/:projectId/latest/:type", async (req: Request, res: Response) => {
    try {
      const { projectId, type } = req.params;

      const bgResult = await pool.query(
        `SELECT * FROM begehungen WHERE project_id = $1 AND type = $2 AND finalized = TRUE ORDER BY finalized_at DESC LIMIT 1`,
        [projectId, type]
      );

      if (bgResult.rows.length === 0) {
        res.json(null);
        return;
      }

      const begehungId = bgResult.rows[0].id;
      const posResult = await pool.query(
        `SELECT * FROM begehung_positions WHERE begehung_id = $1 ORDER BY room_id, position_nr`,
        [begehungId]
      );

      res.json({
        ...bgResult.rows[0],
        positions: posResult.rows,
      });
    } catch (err: any) {
      console.error("Error fetching latest begehung:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/begehungen/:projectId/:begehungId", async (req: Request, res: Response) => {
    try {
      const { projectId, begehungId } = req.params;

      const bgResult = await pool.query(
        `SELECT * FROM begehungen WHERE id = $1 AND project_id = $2`,
        [begehungId, projectId]
      );
      if (bgResult.rows.length === 0) {
        res.status(404).json({ error: "Begehung not found" });
        return;
      }

      const posResult = await pool.query(
        `SELECT * FROM begehung_positions WHERE begehung_id = $1 ORDER BY room_id, position_nr`,
        [begehungId]
      );

      res.json({
        ...bgResult.rows[0],
        positions: posResult.rows,
      });
    } catch (err: any) {
      console.error("Error fetching begehung:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
