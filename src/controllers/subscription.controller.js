import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// POST /api/v1/subscriptions/c/:channelId
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID format")
    }

    // Prevent subscribing to one's own channel
    if (channelId.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res
            .status(200)
            .json(new ApiResponse(200, { isSubscribed: false }, "Unsubscribed successfully"))
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully"))
})

// GET /api/v1/subscriptions/c/:channelId (Get subscribers of a channel)
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID format")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: { $first: "$subscriber" }
            }
        },
        {
            $project: {
                _id: 1,
                subscriber: 1,
                createdAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribers, totalSubscribers: subscribers.length },
                "Subscribers fetched successfully"
            )
        )
})

// GET /api/v1/subscriptions/u/:subscriberId (Get channels subscribed by a user)
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID format")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: { $first: "$channel" }
            }
        },
        {
            $project: {
                _id: 1,
                channel: 1,
                createdAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribedChannels, totalChannels: subscribedChannels.length },
                "Subscribed channels fetched successfully"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}