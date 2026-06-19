import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config({ path: "./.env" });

const checkUsers = async () => {
  try {
    const dbUri = `${process.env.MONGODB_URL}/Smart-Sac`;
    console.log("Connecting to database:", dbUri);
    await mongoose.connect(dbUri);
    console.log("Connected.");
    
    const allUsers = await User.find({});
    let usersWithGames = 0;
    let usersWithNullGameRef = 0;
    
    allUsers.forEach(u => {
      if (u.games && u.games.length > 0) {
        usersWithGames++;
        u.games.forEach(g => {
          if (!g.game) {
            usersWithNullGameRef++;
          }
        });
      }
    });
    
    console.log("Total users:", allUsers.length);
    console.log("Users with games:", usersWithGames);
    console.log("Games with null/undefined game reference:", usersWithNullGameRef);
    
    // Print the first user that has games
    const sampleUser = allUsers.find(u => u.games && u.games.length > 0);
    if (sampleUser) {
      console.log("Sample user games structure:", JSON.stringify(sampleUser.games, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkUsers();
