import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import { Game } from "./src/models/game.model.js";

dotenv.config({ path: "./.env" });

const seedStudent = async () => {
  try {
    const dbUri = `${process.env.MONGODB_URL}/Smart-Sac`;
    console.log("Connecting to database:", dbUri);
    await mongoose.connect(dbUri);
    console.log("Connected.");

    // Find all games
    const games = await Game.find({});
    console.log("Found games:", games.map(g => g.name));

    // Delete existing student if any
    await User.deleteOne({ email: "student@test.com" });
    await User.deleteOne({ username: "student" });

    const userGames = games.slice(0, 3).map((g, index) => ({
      game: g._id,
      rating: 4.0 - index * 0.5
    }));

    const student = new User({
      fullname: "Student Test",
      email: "student@test.com",
      username: "student",
      roll_no: "IIT2024001",
      phone_number: "9876543210",
      password: "Password123!",
      isVerified: true,
      games: userGames,
      achievements: ["First place Table Tennis 2025"]
    });

    await student.save();
    console.log("Test student created successfully!");

    // Also let's make sure some other users have games and ratings correctly populated
    const otherUsers = await User.find({ email: { $ne: "student@test.com" } }).limit(5);
    for (let i = 0; i < otherUsers.length; i++) {
      const user = otherUsers[i];
      // assign some random games
      user.games = games.slice(i % games.length, (i % games.length) + 2).map((g, idx) => ({
        game: g._id,
        rating: 3.5 + idx * 0.5
      }));
      await user.save({ validateBeforeSave: false });
      console.log(`Updated user ${user.username} with games.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error seeding student:", error);
    process.exit(1);
  }
};

seedStudent();
