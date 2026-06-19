import dotenv from "dotenv"
import { createServer } from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initSocket } from "./socket.js";

dotenv.config({
    path: './.env'
});

const httpServer = createServer(app);

connectDB().then(()=>{
    // Initialise Socket.IO on the shared HTTP server
    initSocket(httpServer);

    httpServer.listen(process.env.PORT || 8000, ()=>{
        console.log(` server runnig at port : ${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.log("mongo db connection failed in app listend thing", err);
});
