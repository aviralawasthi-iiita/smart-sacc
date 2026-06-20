import mongoose from "mongoose";
import dotenv from "dotenv";

import { DB_Name } from "../constants.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

const gameSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String },
    description: { type: String },
});

const Game = mongoose.models.Game || mongoose.model("Game", gameSchema);

const equipmentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, required: true, enum: ["available", "in-use", "broken"], default: "available" },
});

const Equipment = mongoose.models.Equipment || mongoose.model("Equipment", equipmentSchema);

const games = [
    { name: "badminton", category: "Racquet Sports", description: "Indoor badminton courts" },
    { name: "table tennis", category: "Racquet Sports", description: "Indoor table tennis" },
    { name: "chess", category: "Board Games", description: "Classic chess" },
    { name: "carrom", category: "Board Games", description: "Carrom board" },
    { name: "basketball", category: "Team Sports", description: "Outdoor basketball" },
    { name: "volleyball", category: "Team Sports", description: "Outdoor volleyball" },
];

const equipments = [
    { name: "badminton racket 1", status: "available" },
    { name: "badminton racket 2", status: "available" },
    { name: "badminton racket 3", status: "available" },
    { name: "badminton racket 4", status: "available" },
    { name: "shuttlecock pack 1", status: "available" },
    { name: "table tennis bat 1", status: "available" },
    { name: "table tennis bat 2", status: "available" },
    { name: "table tennis ball 1", status: "available" },
    { name: "chess board 1", status: "available" },
    { name: "carrom board 1", status: "available" },
    { name: "basketball 1", status: "available" },
    { name: "volleyball 1", status: "available" },
];

async function seed() {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Name}`);
        console.log("Connected to DB");

        for (const g of games) {
            try {
                await Game.create(g);
                console.log(`Added game: ${g.name}`);
            } catch (e) {
                if (e.code === 11000) console.log(`Game ${g.name} already exists`);
            }
        }

        for (const eq of equipments) {
            try {
                await Equipment.create(eq);
                console.log(`Added equipment: ${eq.name}`);
            } catch (e) {
                if (e.code === 11000) console.log(`Equipment ${eq.name} already exists`);
            }
        }
        console.log("Seeding done");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
