import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { User } from "./models/user.model.js";
import { Room } from "./models/room.model.js";
import { Game } from "./models/game.model.js";
import { Equipment } from "./models/equipment.model.js";
import { Announcement } from "./models/announcement.model.js";

dotenv.config({
  path: './.env'
});

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
    id: "announce-1",
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

const dummySpecializations = [
  { game: "Table Tennis", level: "Advanced", hours: 120, wins: 80 },
  { game: "Badminton", level: "Intermediate", hours: 85, wins: 40 },
  { game: "Squash", level: "Beginner", hours: 30, wins: 5 },
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Clearing old data...");
    await Room.deleteMany({});
    await Equipment.deleteMany({});
    await Game.deleteMany({});
    await Announcement.deleteMany({});

    await Room.insertMany(dummyRooms);
    console.log("Rooms seeded.");

    await Announcement.insertMany(dummyAnnouncements);
    console.log("Announcements seeded.");

    console.log("Seeding Games and Equipment...");
    
    const gameTT = await Game.create({ name: "Table Tennis" });
    const gameSnooker = await Game.create({ name: "Snooker" });
    const gameBadminton = await Game.create({ name: "Badminton" });
    const gameChess = await Game.create({ name: "Chess" });

    const equipTT = await Equipment.create({ 
      name: "Table Tennis", 
      status: "in-use"
    });
    const equipSnooker = await Equipment.create({ name: "Snooker Table" });
    const equipBadminton = await Equipment.create({ name: "Badminton Set" });
    const equipChess = await Equipment.create({ name: "Chess Set" });

    gameTT.equipment.push(equipTT._id);
    await gameTT.save();

    gameSnooker.equipment.push(equipSnooker._id);
    await gameSnooker.save();

    gameBadminton.equipment.push(equipBadminton._id);
    await gameBadminton.save();

    gameChess.equipment.push(equipChess._id);
    await gameChess.save();

    console.log("Games and Equipment seeded.");

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