import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//* Generate the AccessToken and RefreshToken
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId); //find User form DB
    if (!user) {
      throw new ApiError("User not found");
    }
    const accessToken = user.generateRefreshToken(); // generate Access Token
    const refreshToken = user.generateAccessToken(); // generate Refresh Token

    //save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //for just save without password validation
    console.log("Refresh Token saved in DB");
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong when generating access and refresh token"
    );
  }
};

//Steps to Registered Users Successfully:
// get User details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object- create entry in db
// remove password and refresh token field from response
// check for user creation
// return response

// Register User method........
const registerUser = asyncHandler(async (req, res) => {
  // Check Validation: field not empty
  // option 1: You have to check condition each and every field
  // if (fullName === "") {
  //     throw new ApiError(400, "fullname is required")
  // }
  // if (userName === "") {
  //   throw new ApiError(400, "username is required");
  // }
  // etc......

  //Option 2: check condition with Some Method

  // get User details from frontend
  const { fullName, email, userName, password } = req.body;
  //console.log("email: ", email);

  // validation - not empty
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists: username, email
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }], //or operators
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists, please create a new one");
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;
  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Uploading avatar", avatar);
  } catch (error) {
    console.log("Error Uploading Avatar", error);
    throw new ApiError(500, "Failed to upload Avatar");
  }
  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverLocalPath);
    console.log("Uploading coverImage", coverImage);
  } catch (error) {
    console.log("Error Uploading coverImage", error);
    throw new ApiError(500, "Failed to upload coverImage");
  }
  // create user object- create entry in db
  try {
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      userName: userName.toLowerCase(),
    });

    // check for user creation.... if created then
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );


    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    // return response
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  } catch (error) {
    console.log("User creation failed", error);
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFormCloudinary(coverImage.public_id);
    }
    throw new ApiError(
      500,
      "Something went wrong when creating user and Images were Deleted"
    );
  }
});

// Steps to LoggedIn Successfully:
// 1) taking DATA from req body
// 2) userName & email base LogIn access
// 3) find the User
// 4) Validate Password
// 5) access and refresh token
// 6) send cookie and response

// LogIn User method........
const loginUser = asyncHandler(async (req, res) => {
  // 1) taking DATA from req body
  const { email, password } = req.body;
  console.log("Entered Email:", email);
  console.log("Entered Password:", password);

  // 2) userName & email base LogIn access
  if (!email) {
    throw new ApiError(400, "email must be provided");
  }
  // Here is an alternative of above code based:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")
  // }

  // 3) find the User
  /*User.findOne({email}) //find email
        User.findOne({ userName });  //find userName
        Instead of that use or func*/
  const user = await User.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  console.log("User found:", user);

  // 4) Validate Password
  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("Is password valid:", isPasswordValid);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  // 5) access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  console.log("Have access of Tokens");

  //Remove unwanted data (like token, password) while sending response
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(404, " User already logged in ...");
  }

  // 6) send cookie and response
  const options = {
    httpOnly: true,
    secure: false,
  }; // modifiable from server only, cannot modify from frontend

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, refreshToken, accessToken },
        " User Logged In Successfully"
      )
    );
});

// User LogOut
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

//* refresh token endpoint
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

//* change the Password

//* Get the User

//* Update user Details

//* update Avatar of User

//* Update cover image
export { registerUser, loginUser, logoutUser, refreshAccessToken };