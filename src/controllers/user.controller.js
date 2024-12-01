import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// method for handle ACCESS and REFRESH Tokens
const generateAccessAndRefreshTokens = async(userId) => {
      try {
        const user = await User.findById(userId); //find User form DB
        const accessToken = user.generateRefreshToken(); // generate Access Token
        const refreshToken = user.generateAccessToken(); // generate Refresh Token

        //save refresh token in DB
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) //for just save without password validation
        console.log("Refresh Token saved in DB");
        
        return {accessToken, refreshToken};

      } catch (error) {
        throw new ApiError(500, "Something went wrong when generating access and refresh token");
      }
    }


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
const registerUser = asyncHandler( async (req, res) => {

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
    const {fullName, email, userName, password } = req.body
    //console.log("email: ", email);

    // validation - not empty
    if (
        [fullName, email, userName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]//or operators
    })

    if (existedUser) {
        throw new ApiError(
          409,
          "User already exists, please create a new one ..."
        );
    }
    //console.log(req.files);

    // check for images, check for avatar
    // const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }
    
    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is required")
    // }

    // upload them to cloudinary, avatar
    // const avatar = await uploadOnCloudinary(avatarLocalPath);
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // if (!avatar) {
    //     throw new ApiError(400, "Avatar file is required yet not uploaded!!")
    // }


      // let avatar;
      // try {
      //   avatar = await uploadOnCloudinary(avatarLocalPath);
      //   console.log("Uploading avatar", avatar);
      // } catch (error) {
      //   console.log("Error when Uploading Avatar", error);
      //   throw new ApiError(500, "Failed to upload Avatar");
      // }
  
      // let coverImage;
      // try {
      //   coverImage = await uploadOnCloudinary(coverImageLocalPath);
      //   console.log("Uploading coverImage", coverImage);
      // } catch (error) {
      //   console.log("Error when Uploading coverImage", error);
      //   throw new ApiError(500, "Failed to upload coverImage");
      // }

    // create user object- create entry in db
    try {
        const user = await User.create({
        fullName,
        // avatar: avatar.url || "",
        // coverImage: coverImage?.url || "",
        email, 
        password,
        userName: userName.toLowerCase()
    })

    // check for user creation.... if created then
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
} catch (error) {
    console.log("User creation failed", error);
    // if (avatar) {
    //     await deleteFromCloudinary(avatar.public_id)
    // }
    // if (coverImage) {
    //   await deleteFormCloudinary(coverImage.public_id);
    // }
    // throw new ApiError(
    //   500,
    //   "Something went wrong when creating user and Images were Deleted"
    // );
}
});


// Steps to LoggedIn Successfully:
    // 1) taking DATA from req body
    // 2) userName & email base LogIn access
    // 3) find the User
    // 4) password check
    // 5) access and refresh token
    // 6) send cookie and response  


// LogIn User method........
const loginUser = asyncHandler(async (req, res) => { 

    // 1) taking DATA from req body
    const {email, userName, password} = req.body


    // 2) userName & email base LogIn access
    if (!userName || !email) {
      throw new ApiError(400, "userName or email is required")
    }


    // 3) find the User
       /*User.findOne({email}) //find email
        User.findOne({ userName });  //find userName
        Instead of that use or func*/
    const user = await User.findOne({
      $or: [{userName}, {email}]
    })

    if (!user) {
      throw new ApiError (404, "User does not exist")
    }
    console.log("user exist");
    


    // 4) password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }
    console.log("password checked and valid");
    


    // 5) access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    console.log("Have access of Tokens");


    //Remove unwanted data (like token, password) while sending response
    const LoggedInUser = await User.findById(user._id).select
    ("-password -refreshToken")


    // 6) send cookie and response
    const options = {
      httpOnly: true,
      secure: true  
    } // modifiable from server only, cannot modify from frontend

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, 
        {user: LoggedInUser, accessToken, refreshToken},
        "User logged In Successfully"
      )
    )
});



//LogOut user methods
const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true,
  }
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

export { 
  registerUser, 
  loginUser, 
  logoutUser 
};