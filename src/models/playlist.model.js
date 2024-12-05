import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        videoCount: {
            type: Number,
            required: true,
        },
        categories: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
        videos: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
        owner: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            }
        ]
    },
    { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);