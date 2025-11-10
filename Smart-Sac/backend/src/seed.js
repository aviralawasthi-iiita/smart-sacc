import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { User } from "./models/user.model.js";
import { Room } from "./models/room.model.js";
import { Game } from "./models/game.model.js";
import { Equipment } from "./models/equipment.model.js";
import { Announcement } from "./models/announcement.model.js";

// Load environment variables from .env
dotenv.config({
  path: './.env'
});

// --- 1. Define Your Dummy Data ---
// Based on your Index.tsx and Players.tsx

const dummyRooms = [
  {
    name: "Drama Room",
    capacity: 30,
    status: "occupied",
    currentActivity: "Theater Practice",
    timeSlot: "4:00 PM - 6:00 PM",
  },
  {
    name: "Music Studio",
    capacity: 15,
    status: "available",
  },
  {
    name: "Art Room",
    capacity: 20,
    status: "reserved",
    currentActivity: "Painting Workshop",
    timeSlot: "6:00 PM - 8:00 PM",
  },
  {
    name: "Dance Studio",
    capacity: 25,
    status: "available",
  },
];

const dummyAnnouncements = [
  {
    id: "announce-1", // We'll add an ID since your model requires it
    heading: "New Snooker Table Arrived!",
    content: "A brand new Snooker table is now available in the main hall. Come check it out!",
    footer: "Posted by Admin"
  },
  {
    id: "announce-2",
    heading: "SAC Maintenance this Friday",
    content: "The SAC will be closed for maintenance this Friday from 8 AM to 12 PM.",
    footer: "Posted by Admin"
  }
];

// Based on your Players.tsx
const dummySpecializations = [
  { game: "Table Tennis", level: "Advanced", hours: 120, wins: 80 },
  { game: "Badminton", level: "Intermediate", hours: 85, wins: 40 },
  { game: "Squash", level: "Beginner", hours: 30, wins: 5 },
];


// --- 2. The Seeder Function ---

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // --- Clear Old Data ---
    console.log("Clearing old data...");
    await Room.deleteMany({});
    await Equipment.deleteMany({});
    await Game.deleteMany({});
    await Announcement.deleteMany({});

    // --- Seed Rooms ---
    await Room.insertMany(dummyRooms);
    console.log("Rooms seeded.");

    // --- Seed Announcements ---
    await Announcement.insertMany(dummyAnnouncements);
    console.log("Announcements seeded.");

    // --- Seed Games & Equipment (with relationships) ---
    console.log("Seeding Games and Equipment...");
    
    // Create Games
    const gameTT = await Game.create({ name: "Table Tennis" });
    const gameSnooker = await Game.create({ name: "Snooker" });
    const gameBadminton = await Game.create({ name: "Badminton" });
    const gameChess = await Game.create({ name: "Chess" });

    // Create Equipment (based on Index.tsx)
    const equipTT = await Equipment.create({ 
      name: "Table Tennis", 
      status: "in-use" // We'll set one to 'in-use'
    });
    const equipSnooker = await Equipment.create({ name: "Snooker Table" });
    const equipBadminton = await Equipment.create({ name: "Badminton Set" });
    const equipChess = await Equipment.create({ name: "Chess Set" });

    // Link Equipment to Games
    gameTT.equipment.push(equipTT._id);
    await gameTT.save();

    gameSnooker.equipment.push(equipSnooker._id);
    await gameSnooker.save();

    gameBadminton.equipment.push(equipBadminton._id);
    await gameBadminton.save();

    gameChess.equipment.push(equipChess._id);
    await gameChess.save();

    console.log("Games and Equipment seeded.");

    // --- Update Existing Users ---
    // This will find ALL users in your database (including the one you 
    // registered) and give them the dummy specializations.
    console.log("Updating all users with dummy player data...");
    const result = await User.updateMany(
      {},
      {
        $set: {
          specializations: dummySpecializations,
          isAvailable: true
        }
      }
    );
    console.log(`${result.modifiedCount} users updated.`);

    console.log("✅ Database seeding successful!");
    process.exit(0);

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();