import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import User from "../models/user.model.js";

// REGISTER USER
export const register = async (req, res) => {
  try {
    const { userId, name, phone, password, role } = req.body;

    if (!userId || !name || !phone || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isDbConnected) {
      const existing = await User.findOne({ $or: [{ userId }, { phone }] });
      if (existing) return res.status(400).json({ error: "User already exists" });

      const user = await User.create({ userId, name, phone, password: hashedPassword, role });
      return res.status(201).json({ message: "User registered successfully", user: { userId: user.userId, name: user.name, role: user.role } });
    }

    // Fallback: persist users to a local dev file when DB is not connected
    const devFile = path.resolve(process.cwd(), 'dev_users.json');
    let users = [];
    try {
      const raw = await fs.readFile(devFile, 'utf8');
      users = JSON.parse(raw || '[]');
    } catch (e) {
      users = [];
    }

    if (users.find(u => u.userId === userId || u.phone === phone)) {
      return res.status(400).json({ error: 'User already exists (dev store)' });
    }

    const newUser = { userId, name, phone, password: hashedPassword, role };
    users.push(newUser);
    await fs.writeFile(devFile, JSON.stringify(users, null, 2), 'utf8');

    return res.status(201).json({ message: 'User registered (dev store)', user: { userId: newUser.userId, name: newUser.name, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN USER
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findOne({ $or: [{ userId: identifier }, { phone: identifier }, { email: identifier }] });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id, userId: user.userId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { userId: user.userId, name: user.name, role: user.role } });
    }

    // Fallback: check dev_users.json
    const devFile = path.resolve(process.cwd(), 'dev_users.json');
    let users = [];
    try {
      const raw = await fs.readFile(devFile, 'utf8');
      users = JSON.parse(raw || '[]');
    } catch (e) {
      users = [];
    }

    const user = users.find(u => u.userId === identifier || u.phone === identifier || u.email === identifier);
    if (!user) return res.status(404).json({ error: 'User not found (dev store)' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.userId, userId: user.userId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { userId: user.userId, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};