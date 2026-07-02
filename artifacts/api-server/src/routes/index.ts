import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import playerRouter from "./player";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/player", playerRouter);

export default router;
