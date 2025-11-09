import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { createEmailTransporter } from "../utils/mailtransporter.util.js";
import { Message } from "../models/message.model.js";
import { Ticket } from "../models/ticket.model.js";
import { Equipment } from "../models/equipment.model.js";
import { Announcement } from "../models/announcement.model.js";
import { randomBytes } from "crypto";
import { Game } from "../models/game.model.js";

const generateAccessTokenAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating tokens");
  }
};

const registerUser = asyncHandler(async(req,res) => {
    const {fullname, email, username, roll_no, password, phone_number} = req.body;
    
    console.log(email);
    
    // Check for empty fields
    if([fullname, email, username, password, phone_number].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    // Phone number validation (basic 10-digit validation)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone_number)) {
        throw new ApiError(400, "Phone number must be 10 digits");
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new ApiError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{username}, {email}, {phone_number}]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email, username, or phone number already exists");
    }

    // Generate email verification token
    const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user with verification token
    const user = await User.create({
        fullname,
        email,
        password,
        roll_no,
        phone_number,
        username: username.toLowerCase(),
        emailVerificationToken,
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        isVerified: false
    });

    const usercheck = await User.findById(user._id).select("-password -refreshToken");

    if (!usercheck) {
        throw new ApiError(500, "User not created");
    }

    // Send verification email
    const verificationMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Email Verification</h1>
        <p>Hello ${user.fullname},</p>
        <p>Thank you for registering! Please use the following verification code to activate your account:</p>
        
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
                ${emailVerificationToken}
            </div>
        </div>
        
        <p><strong>⏰ This verification code will expire in 24 hours.</strong></p>
        <p>If you didn't create an account, please ignore this email.</p>
    </div>
    `;

    try {
        const transporter = createEmailTransporter();
        await transporter.sendMail({
            from: `"Smart-Sac" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Verify Your Email Address',
            html: verificationMessage
        });

        return res.status(201).json(
            new ApiResponse(201, usercheck, "User created successfully. Please check your email for verification instructions.")
        );

    } catch (emailError) {
        // If email fails to send, delete the created user to maintain data consistency
        await User.findByIdAndDelete(user._id);
        console.error("Email sending error:", emailError);
        throw new ApiError(500, "Error sending verification email. Please try again.");
    }
});

const loginUser = asyncHandler(async (req,res) => {
 
    const {email,password} = req.body;
    if(!email){
        throw new ApiError(400,"username or email is required");
    }
    const user = await User.findOne({
        $or: [{username : email},{email}]
    });

    if(!user){
        throw new ApiError(400,"user not found");
    }
    const ispassvalid = await user.isPasswordCorrect(password);

    if(!ispassvalid){
        throw new ApiError(401,"invalid password");
    }

   const {accessToken, refreshToken} = await generateAccessTokenAndRefreshTokens(user._id);

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken" );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: "lax", 
        };

    console.log("user logged in");
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            user:loggedinUser,accessToken,refreshToken
        },
        "user loggin in succesfully",
    ))
});

// Verify Email Token
const verifyEmail = asyncHandler(async (req, res) => {
    const { token, email } = req.body;

    if (!token || !email) {
        throw new ApiError(400, "Token and email are required");
    }

    const user = await User.findOne({
        email: email.toLowerCase(),
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }

    // Mark user as verified and clear verification fields
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const verifiedUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, verifiedUser, "Email verified successfully")
    );
});

// Resend Verification Email
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Return success to prevent email enumeration
        return res.status(200).json(
            new ApiResponse(200, {}, "If an account exists with this email, a verification token has been sent")
        );
    }

    if (user.isVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    // Generate new verification token
    const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    const verificationMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Email Verification</h1>
        <p>Hello ${user.fullname},</p>
        <p>Here is your new verification code:</p>
        
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
                ${emailVerificationToken}
            </div>
        </div>
        
        <p><strong>⏰ This verification code will expire in 24 hours.</strong></p>
    </div>
    `;

    try {
        const transporter = createEmailTransporter();
        await transporter.sendMail({
            from: `"Smart-Sac" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Verify Your Email Address',
            html: verificationMessage
        });

        return res.status(200).json(
            new ApiResponse(200, {}, "Verification email sent successfully")
        );

    } catch (error) {
        console.error("Email sending error:", error);
        throw new ApiError(500, "Error sending verification email");
    }
});


const logoutUser = asyncHandler(async(req,res)=> {
    await User.findByIdAndUpdate(req.user._id || req.body.user,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    );
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: "lax", 
        };

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json({ message: "User logged out successfully" });;
});

const refreshAccessToken = asyncHandler(async(req,res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(500,"genrateing refrees gone wrong");
    }

    try {
        if (!process.env.REFRESH_TOKEN_SECRET) {
          throw new ApiError(500, "Server misconfiguration: missing REFRESH_TOKEN_SECRET");
        }
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401,"invalid rerresh token");
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"not smae");
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // ✅ only secure in prod
            sameSite: "lax", // optional but recommended
            };

        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshTokens(user._id);
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(
            200,
            {
            accessToken,refreshToken
            },
            "user loggin in succesfully",
        ))
    } catch (error) {
        throw new ApiError(501, error?.message || "idkk)");
    }
})

const changeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect) throw new ApiError(400,"invalid old password");
    user.password = newPassword;
    await user.save({validateBeforeSave:false});
    return res.status(200)
    .json(new ApiResponse(200,{},"pass cahnged"));
}
)

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // We send a success response even if user doesn't exist
    // This prevents "user enumeration" attacks
    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        "If an account exists with this email, a password reset token has been sent"
      )
    );
  }

  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

  user.passwordResetToken = resetToken
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Password Reset Token</h1>
      <p>Hello ${user.fullname || 'User'},</p>
      <p>You requested a password reset. Please use the following token to reset your password:</p>
      
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
          ${resetToken}
        </div>
      </div>
      
      <p><strong>⏰ This token will expire in 10 minutes.</strong></p>
      <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
    </div>
  `;

  try {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: `"Smart-Sac" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Token',
      html: message
    })

    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        "If an account exists with this email, a password reset token has been sent"
      )
    );
  } catch (error) {
    // --- THIS IS THE FIX ---
    // We NO LONGER erase the token here. We let it expire naturally.
    // user.passwordResetToken = undefined;  <-- DELETED
    // user.passwordResetExpires = undefined; <-- DELETED
    // await user.save({ validateBeforeSave: false }); <-- DELETED

    console.error("Email sending error:", error);
    // Throw an error so the user knows something went wrong on the server
    throw new ApiError(500, "Error sending email. Please check server logs.");
  }
});
 


const verifyResetToken = asyncHandler(async (req, res,next) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const hashedToken = token

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  return res.status(200).json(
    new ApiResponse(200, { verified: true, token }, "Token verified successfully")
  );
});


const resetPassword = asyncHandler(async (req, res) => {
   const { token, newPassword, confirmPassword } = req.body;

  if (!token) {
    throw new ApiError(400, "Reset token is missing");
  }
  if (!newPassword || !confirmPassword) {
    throw new ApiError(400, "Token and passwords are required");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined;

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Password reset successful. Please login with your new password."
    )
  );
});


const getCurrentUser = asyncHandler(async(req,res) => {
    const user = await User.findById(req.user._id)
        .populate('games.game') // Populate game details
        .select('-password -refreshToken');
    console.log(user);
    const bookedItems = await Equipment.find({ user: user._id }).lean()
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                userDetails: user, 
                bookedItems,
            },
            "Current user and booked items fetched successfully"
        )
    )
})
const updateAccountDetails = asyncHandler(async (req, res) => {
  const allowedFields = ["email", "phone_number", "fullname", "roll_no", "achievements"];
  const updates = {};
  console.log(req.body);
  for (const field of allowedFields) {
    if (req.body[field] && req.body[field].toString().trim() !== "") {
      updates[field] = req.body[field].toString().trim();
    }
  }
  const games = req.body.games; 
  if (games) {
    if (!Array.isArray(games)) {
      throw new ApiError(400, "Games must be an array");
    }
    for (const g of games) {
      if (!g.game || g.rating === undefined) {
        throw new ApiError(400, "Each game must include both name and rating");
      }
      if (typeof g.rating !== "number" || g.rating < 0 || g.rating > 5) {
        throw new ApiError(400, "Game rating must be a number between 0 and 5");
      }
    }

    updates.games = games;
  }
  console.log("Final updates:", updates);

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "At least one non-empty field is required to update");
  }

  if (updates.email) {
    const existingEmail = await User.findOne({
      email: updates.email.toLowerCase(),
      _id: { $ne: req.user._id },
    });
    if (existingEmail) throw new ApiError(409, "Email already in use");

    updates.email = updates.email.toLowerCase().trim();
  }

  if (updates.phone_number) {
    const existingPhone = await User.findOne({
      phone_number: updates.phone_number,
      _id: { $ne: req.user._id },
    });
    if (existingPhone) throw new ApiError(409, "Phone number already in use");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { ...updates} },
    { new: true }
  );

  
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});


const dashboardDetails = asyncHandler(async (req,res)=>{
  const user = req.user;
  if(!user) throw new ApiError(500, "no user found");

  const [
    numberOfUnreadMessages,
    numberOfOpenTickets,
    equipment,
    announcements
  ] = await Promise.all([
    Message.countDocuments({ receiver: user._id, status: { $nin: ["read","unsent"] }}),
    Ticket.countDocuments({ sender: user._id, status: "open" }),
    Equipment.find().populate("user", "fullname phone_number").lean(),
    Announcement.find().sort({ createdAt: -1 }).limit(2).lean()
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        unreadMessages: numberOfUnreadMessages,
        openTickets: numberOfOpenTickets,     
        equipment,  
        announcements  
      },
      "Dashboard details sent"
    )
  );
});

const getAllPlayers = asyncHandler(async (req, res) => {
  const players = await User.find({ _id: { $ne: req.user._id } }).select("fullname games").populate('games.game', 'name category');
  if (!players) {
    throw new ApiError(404, "No players found");
  }
  return res.status(200).json(
    new ApiResponse(200, players, "Players fetched successfully")
  );
});

const getPlayers = asyncHandler(async (req, res) => {
  const { gameIds } = req.query;

  // Handle case where no gameIds are provided
  if (!gameIds) {
    throw new ApiError(400, "Please provide at least one game ID in query (e.g. ?gameIds=id1,id2)");
  }

  // Convert comma-separated IDs to array
  const gameIdArray = gameIds.split(",");

  // Find users who have any of those games
  const players = await User.find({
    _id: { $ne: req.user._id },  // exclude current user
    "games.game": { $in: gameIdArray }
  }).select("fullname games").populate('games.game', 'name category');

  if (!players || players.length === 0) {
    throw new ApiError(404, "No players found for the specified games");
  }

  return res.status(200).json(
    new ApiResponse(200, players, "Players fetched successfully")
  );
});

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id; // from verifyJWT

  if (!receiverId || !content) {
    throw new ApiError(400, "Receiver ID and content are required");
  }

  // Generate a unique ID to satisfy your message.model.js 'id' field
  const uniqueId = randomBytes(16).toString('hex');

  const message = await Message.create({
    id: uniqueId,
    sender: senderId,
    receiver: receiverId,
    content: content,
    status: "sent" // Set status to 'sent'
  });

  if (!message) {
    throw new ApiError(500, "Failed to send message");
  }

  return res.status(201).json(
    new ApiResponse(201, message, "Message sent successfully")
  );
});

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Message.aggregate([
    {
      // 1. Find all messages involving the current user
      $match: {
        $or: [{ sender: userId }, { receiver: userId }]
      }
    },
    {
      // 2. Sort by latest message first
      $sort: { createdAt: -1 }
    },
    {
      // 3. Group by the "other user"
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$sender", userId] },
            then: "$receiver",
            else: "$sender"
          }
        },
        // Get the most recent message's details
        lastMessage: { $first: "$content" },
        lastMessageStatus: { $first: "$status" },
        lastMessageSender: { $first: "$sender" },
        lastMessageCreatedAt: { $first: "$createdAt" },
        // Count unread messages (where user is receiver and status is 'received')
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ["$receiver", userId] },
                { $eq: ["$status", "received"] }
              ]},
              1,
              0
            ]
          }
        }
      }
    },
    {
      // 4. Populate the "other user's" details from the 'users' collection
      $lookup: {
        from: "users", 
        localField: "_id", // The _id from the group (which is the other user's ID)
        foreignField: "_id",
        as: "otherUser"
      }
    },
    {
      // 5. Deconstruct the otherUser array
      $unwind: "$otherUser"
    },
    {
      // 6. Project the final, clean shape for the frontend
      $project: {
        _id: 0, // hide the default _id
        otherUser: {
          _id: "$otherUser._id",
          fullname: "$otherUser.fullname",
          // Get the game of the first specialization, or 'N/A'
          sport: { $ifNull: [ { $arrayElemAt: ["$otherUser.specializations.game", 0] }, "N/A" ] },
          isAvailable: "$otherUser.isAvailable" // For online status
        },
        lastMessage: "$lastMessage",
        lastMessageStatus: "$lastMessageStatus",
        lastMessageSender: "$lastMessageSender",
        lastMessageCreatedAt: "$lastMessageCreatedAt",
        unreadCount: "$unreadCount"
      }
    },
    {
      // 7. Sort conversations by the most recent message
      $sort: { lastMessageCreatedAt: -1 }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(200, conversations, "Conversations fetched successfully")
  );
});
const getMessages = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params; // Get the other user's ID from the URL
  const userId = req.user._id;

  if (!otherUserId) {
    throw new ApiError(400, "The other user's ID is required");
  }

  // 1. Mark all messages from this user as "read"
  await Message.updateMany(
    {
      receiver: userId,
      sender: otherUserId,
      status: "received" // Find all unread messages
    },
    {
      $set: { status: "read" } // Mark them as "read"
    }
  );

  // 2. Find the full conversation history
  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId }
    ]
  }).sort({ createdAt: "asc" }); // Sort by oldest first

  return res.status(200).json(
    new ApiResponse(200, messages, "Messages fetched successfully")
  );
});

const newEquipmentTicket = asyncHandler(async (req, res) => {
  const { equipment, game, heading, details } = req.body;
  const user = req.user;

  if (!equipment || !game || !heading || !details) {
    throw new ApiError(400, "All fields (equipment, game, heading, details) are required");
  }
  if (!user) {
    throw new ApiError(401, "Unauthorized user");
  }

  const ticket = await Ticket.create({
    heading,
    content: details,
    sender: user._id,
  });

  const message = `
    <h2>New Equipment Request</h2>
    <p><strong>Game:</strong> ${game}</p>
    <p><strong>Equipment:</strong> ${equipment}</p>
    <p><strong>Heading:</strong> ${heading}</p>
    <p><strong>Details:</strong> ${details}</p>
    <p><em>Requested by:</em> ${user.fullname || user.email}</p>
  `;

  try {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: `"Smart-Sac" <${process.env.EMAIL_USER}>`,
      to: process.env.SPORTS_HEAD_EMAIL,
      subject: "New Equipment Request",
      html: message,
    });

    res.status(200).json(
      new ApiResponse(200, { ticketId: ticket._id }, "New equipment ticket sent successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Failed to send email");
  }
});


const brokenEquipmentTicket = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { equipmentId, heading, content } = req.body;
  const user = req.user;

  if (!equipmentId || !heading || !content) {
    throw new ApiError(400, "All fields (equipment, heading, details) are required");
  }
  if (!user) {
    throw new ApiError(401, "Unauthorized user");
  }

  const equipmentData = await Equipment.findById(equipmentId);
  if (!equipmentData) {
    throw new ApiError(404, "Equipment not found");
  }
  const details = content;

  const ticket = await Ticket.create({
    heading,
    content: details,
    equipment: equipmentData._id,
    sender: user._id,
  });
  const equipment = equipmentData.name;

  const message = `
    <h2>Broken Equipment Report</h2>
    <p><strong>Equipment:</strong> ${equipment}</p>
    <p><strong>Heading:</strong> ${heading}</p>
    <p><strong>Details:</strong> ${details}</p>
    <p><em>Reported by:</em> ${user.fullname || user.email}</p>
  `;

  try {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: `"Smart-Sac" <${process.env.EMAIL_USER}>`,
      to: process.env.SPORTS_HEAD_EMAIL,
      subject: "Broken Equipment Report",
      html: message,
    });

    res.status(200).json(
      new ApiResponse(200, { ticketId: ticket._id }, "Broken equipment report sent successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Failed to send email");
  }
});



const getGames = asyncHandler(async (req, res) => {
  const games = await Game.find().lean();
  return res.status(200).json(
    new ApiResponse(200, games, "Games fetched successfully")
  );
});

export {registerUser,
    loginUser,
    logoutUser,
    updateAccountDetails,
    getCurrentUser,
    changeCurrentPassword,
    forgotPassword,
    verifyResetToken,
    refreshAccessToken,
    resetPassword,
    dashboardDetails,
    getAllPlayers,
    getPlayers,
    sendMessage,
    getConversations,
    getMessages,
    getGames,
    brokenEquipmentTicket,
    verifyEmail,
    resendVerificationEmail
};
