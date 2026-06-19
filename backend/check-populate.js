import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import "./src/models/game.model.js";

dotenv.config({ path: "./.env" });

const checkPopulate = async () => {
  try {
    const dbUri = `${process.env.MONGODB_URL}/Smart-Sac`;
    console.log("Connecting to database:", dbUri);
    await mongoose.connect(dbUri);
    console.log("Connected.");
    
    const players = await User.find({}).select("fullname games").populate('games.game', 'name category');
    console.log(`Fetched ${players.length} players.`);
    
    let crashCount = 0;
    players.forEach(player => {
      if (player.games && player.games.length > 0) {
        player.games.forEach(g => {
          if (!g.game) {
            console.log(`CRASH RISK: Player ${player.fullname} has userGame but game field is null!`);
            crashCount++;
          } else {
            console.log(`Player ${player.fullname} plays ${g.game.name} with rating ${g.rating}`);
          }
        });
      }
    });
    
    console.log(`Total crash risk instances: ${crashCount}`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkPopulate();
