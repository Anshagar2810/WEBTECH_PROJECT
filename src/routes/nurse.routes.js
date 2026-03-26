// src/routes/nurse.routes.js
import express from "express";
import { createNurse, getAllNurses } from "../controllers/nurse.controller.js";

const router = express.Router();

router.post("/", createNurse);
router.get("/", getAllNurses);

export default router;