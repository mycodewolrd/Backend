import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true//make it searchable field in database
        },
        email: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            require: true,
            lowercase: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: true
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            require: [true, "Password is required"]
        },
        refershtoken: {
            type: String
        }
    }, 
    {
        timestamps: true
    }
)





export const User = mongoose.model(User, userSchema)