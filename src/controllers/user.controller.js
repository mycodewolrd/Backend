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
        // cheak if user already exists: username, email
        // cheak for images, cheak for avatar
        // upload them to cloudinary, avatar
        // create user object- create entry in db
        // remove password and refresh token field from response
        // cheak for user creation
        // return respons
    


        const { fullName, userName, email, password } = req.body
        console.log("email: ", email);

        // Cheak Validation: field not empty
        // option 1: You have to cheak condition each and every field
        // if (fullName === "") {
        //     throw new ApiError(400, "fullname is required")
        // }
        // if (userName === "") {
        //   throw new ApiError(400, "username is required");
        // }
        // etc......


        //Option 2: cheak condition with Some Method
        
        if (
            [fullName, userName, email, password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(400, "All fields are required");
        }

        // cheak if user already exists: username, email
        const existedUser = User.findOne({
            $or: [{ userName }, { email }]
        })
        if (existedUser) {
            throw new ApiError(409, "user already exists")
        }


        // cheak for images, cheak for avatar
        const avatarLocalPatha =  req.files?.avatar[0]?.path;
        const coverImageLocalPatha = req.files?.coverImage[0]?.path;

        if (!avatarLocalPatha) {
            throw new ApiError(400, "Avatar file is required")
        }


        // upload them to cloudinary, avatar
        const avatar = await uploadOnCloudinary(avatarLocalPatha)
        const coverImage = await uploadOnCloudinary(coverImageLocalPatha)


        // cheak avatar is uploaded or not
        if (!avatar) {
            throw new ApiError(400, "Avatar file is required")
        }


        // create user object- create entry in db
        const user = await User.create({
            userName: userName.toLowerCase(),
            email,
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            password
        })
        


        // remove password and refresh token field from response
        const createdUser = await User.findById(user._id).select(
            "-password -refershtoken"
        );

        // cheak for user creation
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user")
        }


        //return respons
        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered Successfully") 
        )
});



export {registerUser};