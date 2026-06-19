import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { PendingUser } from "../models/pendingUser.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { createEmailTransporter } from "../utils/mailtransporter.util.js";
import { Message } from "../models/message.model.js";
import { Ticket } from "../models/ticket.model.js";
import { Equipment } from "../models/equipment.model.js";
import { Announcement } from "../models/announcement.model.js";
import { randomBytes } from "crypto";
import { Game } from "../models/game.model.js";
import dns from "dns/promises";
import bcrypt from "bcrypt";

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

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, roll_no, password, phone_number } = req.body;

  console.log(email);

  if ([fullname, email, username, password, phone_number].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  if (username.includes("@")) {
    throw new ApiError(400, "Username cannot contain '@'");
  }

  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone_number)) {
    throw new ApiError(400, "Phone number must be 10 digits");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email address format");
  }

  // Verify email domain exists (has MX records)
  const domain = email.split('@')[1];
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new ApiError(400, "Invalid email domain. Cannot receive emails.");
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, "Invalid email domain or domain does not exist.");
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new ApiError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
  }

  const existedEmail = await User.findOne({ email });
  if (existedEmail) {
    throw new ApiError(409, "Email address is already registered");
  }

  const existedUsername = await User.findOne({ username });
  if (existedUsername) {
    throw new ApiError(409, "Username is already taken");
  }

  const existedPhone = await User.findOne({ phone_number });
  if (existedPhone) {
    throw new ApiError(409, "Phone number is already registered");
  }

  // Check if a pending registration already exists
  const existingPending = await PendingUser.findOne({ email });

  // Enforce 1-minute cooldown before a new OTP can be sent
  if (existingPending?.lastOtpSentAt) {
    const secondsSinceLast = (Date.now() - new Date(existingPending.lastOtpSentAt).getTime()) / 1000;
    if (secondsSinceLast < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceLast);
      throw new ApiError(429, `Please wait ${waitSeconds} second(s) before requesting a new verification code.`);
    }
  }

  // Delete any old pending registration to start fresh
  await PendingUser.deleteMany({ email });

  // Hash password before storing in PendingUser to avoid double-hashing later
  const hashedPassword = await bcrypt.hash(password, 10);

  const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();

  const pendingUser = await PendingUser.create({
    fullname,
    email,
    password: hashedPassword,
    roll_no,
    phone_number,
    username: username.toLowerCase(),
    emailVerificationToken,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    lastOtpSentAt: new Date(),
  });

  if (!pendingUser) {
    throw new ApiError(500, "Failed to start registration process");
  }

  const verificationMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Email Verification</h1>
        <p>Hello ${pendingUser.fullname},</p>
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
      to: pendingUser.email,
      subject: 'Verify Your Email Address',
      html: verificationMessage
    });

    return res.status(201).json(
      new ApiResponse(201, { email: pendingUser.email }, "Verification code sent to your email.")
    );

  } catch (emailError) {
    await PendingUser.findByIdAndDelete(pendingUser._id);
    console.error("Email sending error:", emailError);
    throw new ApiError(500, "Error sending verification email. Please try again.");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username: email }, { email }]
  });

  if (!user) {
    throw new ApiError(400, "user not found");
  }
  const ispassvalid = await user.isPasswordCorrect(password);

  if (!ispassvalid) {
    throw new ApiError(401, "invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

  const loggedinUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  console.log("user logged in");
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
      200,
      {
        user: loggedinUser, accessToken, refreshToken
      },
      "user loggin in succesfully",
    ))
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token, email } = req.body;

  if (!token || !email) {
    throw new ApiError(400, "Token and email are required");
  }

  const pendingUser = await PendingUser.findOne({
    email: email.toLowerCase(),
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!pendingUser) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  // Create the actual user now that email is verified.
  // Password is already bcrypt-hashed in PendingUser, so we insert directly
  // into the collection to bypass Mongoose's pre-save bcrypt hook.
  const insertResult = await User.collection.insertOne({
    fullname: pendingUser.fullname,
    email: pendingUser.email,
    username: pendingUser.username,
    roll_no: pendingUser.roll_no,
    phone_number: pendingUser.phone_number,
    password: pendingUser.password,
    isVerified: true,
    achievements: [],
    games: [],
    messagesSent: [],
    messagesReceived: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (!insertResult.acknowledged) {
    throw new ApiError(500, "Failed to create user after verification");
  }

  // Cleanup pending user
  await PendingUser.deleteOne({ _id: pendingUser._id });

  const user = { _id: insertResult.insertedId };

  const verifiedUser = await User.findById(user._id).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, verifiedUser, "Email verified and account created successfully")
  );
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // First check if already verified and in main User collection
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, "Email is already verified. Please login.");
  }

  const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });

  if (!pendingUser) {
    return res.status(200).json(
      new ApiResponse(200, {}, "If an account exists with this email, a verification token has been sent")
    );
  }

  // Enforce 1-minute cooldown
  if (pendingUser.lastOtpSentAt) {
    const secondsSinceLast = (Date.now() - new Date(pendingUser.lastOtpSentAt).getTime()) / 1000;
    if (secondsSinceLast < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceLast);
      throw new ApiError(429, `Please wait ${waitSeconds} second(s) before requesting a new code.`);
    }
  }

  const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();

  pendingUser.emailVerificationToken = emailVerificationToken;
  pendingUser.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  pendingUser.lastOtpSentAt = new Date();
  await pendingUser.save();

  const verificationMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Email Verification</h1>
        <p>Hello ${pendingUser.fullname},</p>
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
      to: pendingUser.email,
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


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id || req.body.user,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ message: "User logged out successfully" });;
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(500, "genrateing refrees gone wrong");
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
    if (!user) {
      throw new ApiError(401, "invalid rerresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "not smae");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);
    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(
        200,
        {
          accessToken, refreshToken
        },
        "user loggin in succesfully",
      ))
  } catch (error) {
    throw new ApiError(501, error?.message || "idkk)");
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(400, "invalid old password");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.status(200)
    .json(new ApiResponse(200, {}, "pass cahnged"));
}
)

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
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
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
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
    console.error("Email sending error:", error);
    throw new ApiError(500, "Error sending email. Please check server logs.");
  }
});



const verifyResetToken = asyncHandler(async (req, res, next) => {
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
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new ApiError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
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


const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('games.game')
    .select('-password -refreshToken');
  
  if (user && user.games) {
    user.games = user.games.filter(g => g.game !== null && g.game !== undefined);
  }

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
  const allowedFields = ["phone_number", "fullname", "achievements"];
  const updates = {};
  console.log(req.body);
  for (const field of allowedFields) {
    if (req.body[field] && req.body[field].toString().trim() !== "") {
      updates[field] = req.body[field].toString().trim();
    }
  }
  if (updates.fullname == "") {
    throw new ApiError(400, "empty fullname");
  }
  if (updates.phone_number) {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(updates.phone_number)) {
      throw new ApiError(400, "Phone number must be 10 digits");
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

  if (updates.phone_number) {
    const existingPhone = await User.findOne({
      phone_number: updates.phone_number,
      _id: { $ne: req.user._id },
    });
    if (existingPhone) throw new ApiError(409, "Phone number already in use");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { ...updates } },
    { new: true }
  );


  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});


const dashboardDetails = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(500, "no user found");

  const [
    numberOfUnreadMessages,
    numberOfOpenTickets,
    equipment,
    announcements
  ] = await Promise.all([
    Message.countDocuments({ receiver: user._id, status: { $nin: ["read", "unsent"] } }),
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

  const cleanedPlayers = players.map(player => {
    const playerObj = player.toObject();
    if (playerObj.games) {
      playerObj.games = playerObj.games.filter(g => g.game !== null && g.game !== undefined);
    }
    return playerObj;
  });

  return res.status(200).json(
    new ApiResponse(200, cleanedPlayers, "Players fetched successfully")
  );
});

const getPlayers = asyncHandler(async (req, res) => {
  const { gameIds } = req.query;

  if (!gameIds) {
    throw new ApiError(400, "Please provide at least one game ID in query (e.g. ?gameIds=id1,id2)");
  }

  const gameIdArray = gameIds.split(",");

  const players = await User.find({
    _id: { $ne: req.user._id },
    "games.game": { $in: gameIdArray }
  }).select("fullname games").populate('games.game', 'name category');

  if (!players || players.length === 0) {
    throw new ApiError(404, "No players found for the specified games");
  }

  const cleanedPlayers = players.map(player => {
    const playerObj = player.toObject();
    if (playerObj.games) {
      playerObj.games = playerObj.games.filter(g => g.game !== null && g.game !== undefined);
    }
    return playerObj;
  });

  return res.status(200).json(
    new ApiResponse(200, cleanedPlayers, "Players fetched successfully")
  );
});

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !content) {
    throw new ApiError(400, "Receiver ID and content are required");
  }

  const uniqueId = randomBytes(16).toString('hex');

  const message = await Message.create({
    id: uniqueId,
    sender: senderId,
    receiver: receiverId,
    content: content,
    status: "sent"
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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$sender", userId] },
            then: "$receiver",
            else: "$sender"
          }
        },
        lastMessage: { $first: "$content" },
        lastMessageStatus: { $first: "$status" },
        lastMessageSender: { $first: "$sender" },
        lastMessageCreatedAt: { $first: "$createdAt" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$status", "received"] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "otherUser"
      }
    },
    {
      $unwind: "$otherUser"
    },
    {
      $project: {
        _id: 0,
        otherUser: {
          _id: "$otherUser._id",
          fullname: "$otherUser.fullname",
          sport: { $ifNull: [{ $arrayElemAt: ["$otherUser.specializations.game", 0] }, "N/A"] },
          isAvailable: "$otherUser.isAvailable"
        },
        lastMessage: "$lastMessage",
        lastMessageStatus: "$lastMessageStatus",
        lastMessageSender: "$lastMessageSender",
        lastMessageCreatedAt: "$lastMessageCreatedAt",
        unreadCount: "$unreadCount"
      }
    },
    {
      $sort: { lastMessageCreatedAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);

  return res.status(200).json(
    new ApiResponse(200, conversations, "Conversations fetched successfully")
  );
});
const getMessages = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params;
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  if (!otherUserId) {
    throw new ApiError(400, "The other user's ID is required");
  }

  await Message.updateMany(
    {
      receiver: userId,
      sender: otherUserId,
      status: "received"
    },
    {
      $set: { status: "read" }
    }
  );

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  messages.reverse();

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

  // Send email asynchronously in the background so it doesn't block the HTTP response
  const transporter = createEmailTransporter();
  transporter.sendMail({
    from: `"Smart-Sac" <${process.env.EMAIL_USER}>`,
    to: process.env.SPORTS_HEAD_EMAIL,
    subject: "New Equipment Request",
    html: message,
  }).catch((emailError) => {
    console.error("Failed to send new equipment email in background:", emailError);
  });

  return res.status(200).json(
    new ApiResponse(200, { ticketId: ticket._id }, "New equipment ticket sent successfully")
  );
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

  // Send email asynchronously in the background so it doesn't block the HTTP response
  const transporter = createEmailTransporter();
  transporter.sendMail({
    from: `"Smart-Sac" <${process.env.EMAIL_USER}>`,
    to: process.env.SPORTS_HEAD_EMAIL,
    subject: "Broken Equipment Report",
    html: message,
  }).catch((emailError) => {
    console.error("Failed to send broken equipment email in background:", emailError);
  });

  return res.status(200).json(
    new ApiResponse(200, { ticketId: ticket._id }, "Broken equipment report sent successfully")
  );
});



const getGames = asyncHandler(async (req, res) => {
  const games = await Game.find().lean();
  return res.status(200).json(
    new ApiResponse(200, games, "Games fetched successfully")
  );
});

const getAnnouncements = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const total = await Announcement.countDocuments();
  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        announcements,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAnnouncements: total,
        hasNextPage: page * limit < total
      },
      "Announcements fetched successfully"
    )
  );
});

export {
  registerUser,
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
  getAnnouncements,
  brokenEquipmentTicket,
  verifyEmail,
  resendVerificationEmail
};
