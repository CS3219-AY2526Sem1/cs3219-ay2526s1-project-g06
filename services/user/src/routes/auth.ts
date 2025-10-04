import { Router } from "express";
import { verifyIdToken } from "../firebase";
import { requireSession } from "../mw/requireSession";

const router = Router();

router.post("/session", async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: "missing_id_token" });

    // Verify with Admin SDK
    const decoded = await verifyIdToken(idToken);
    // Optional: block unverified emails while testing (comment if not needed)
    // if (!decoded.email_verified) return res.status(403).json({ error: "email_unverified" });

    res.cookie("session", idToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,             // false for http://localhost; set true in prod HTTPS
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return res.sendStatus(204);
  } catch (e: any) {
    console.error("SESSION VERIFY FAILED:", e?.code ?? e?.message ?? e);
    // expose a simple code so you can see it in the Network tab
    return res.status(401).json({ error: e?.code ?? "invalid_session" });
  }
});

router.get("/me", requireSession, (req, res) => {
    res.json({ user: (req as any).user });
  });

export default router;