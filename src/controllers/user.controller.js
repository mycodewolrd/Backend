import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//method for register User
const registerUser = asyncHandler( async (req, res) => {
    //Steps: 
        // get User details from frontend
        // validation - not empty
        // check if user already exists: username, email
        // check for images, check for avatar
        // upload them to cloudinary, avatar
        // create user object- create entry in db
        // remove password and refresh token field from response
        // check for user creation
        // return response
    


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
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
       coverImage = await uploadOnCloudinary(coverImageLocalPath);
       console.log("Uploading coverImage", coverImage);
     } catch (error) {
       console.log("Error Uploading coverImage", error);
       throw new ApiError(500, "Failed to upload coverImage");
     }

    // create user object- create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
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
} )



export {registerUser};