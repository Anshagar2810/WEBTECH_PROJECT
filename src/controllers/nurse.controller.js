// src/controllers/nurse.controller.js
import User from "../models/user.model.js";

export const createNurse = async (req, res) => {
  try {
    const nurse = await User.create({
      ...req.body,
      role: "NURSE"
    });

    res.status(201).json({
      success: true,
      data: nurse
    });
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
};

export const getAllNurses = async (req, res) => {
  const nurses = await User.find({ role: "NURSE" });
  res.json(nurses);
};