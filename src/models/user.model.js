import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //make it searchable field in database
    },
    email: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      require: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudinary url
    },
    coverImage: {
      type: String, //cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      require: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password by bcrypt before saving
// userSchema.pre("save", async function (next) {
//   // if (!this.isModified("password")) return next();
//   // this.password = bcrypt.hash(this.password, 10);
//   // console.log("Hashed Password:", this.password); // Log hashed password
//   // next();
//   if (this.isModified("password")) {
//       this.password = bcrypt.hash(this.password, 10);
//       next();
//   }
// });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password, 10);
  console.log("Hashed Password: ", this.password); // Add logging here
  next();
});

//or option 2:
// if (this.isModified("password")) {
//     this.password = bcrypt.hash(this.password, 10);
//     next();
// }

//compare encrypted password with user's given password
userSchema.methods.isPasswordCorrect = async function (password) {
  console.log("Comparing Password:", password);
  console.log("Stored Hashed Password:", this.password);
  return await bcrypt.compare(password, this.password);
};

//Generate JWT Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
