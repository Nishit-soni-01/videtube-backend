import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// GET /api/v1/dashboard/stats
const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id

    // 1. Total Subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: userId })

    // 2. Video Stats (Total Videos & Total Views)
    const videoStats = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ])

    // 3. Total Likes across all videos uploaded by this channel
    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoInfo"
            }
        },
        {
            $unwind: "$videoInfo"
        },
        {
            $match: {
                "videoInfo.owner": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideoLikes: { $sum: 1 }
            }
        }
    ])

    const stats = {
        totalSubscribers: totalSubscribers || 0,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: totalLikes[0]?.totalVideoLikes || 0
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"))
})

// GET /api/v1/dashboard/videos
const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 })

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats,
    getChannelVideos
}