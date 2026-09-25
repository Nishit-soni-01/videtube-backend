import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

// GET /api/v1/videos
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)

    const matchStage = {}

    // Filter by title or description if query string exists
    if (query?.trim()) {
        matchStage.$or = [
            { title: { $regex: query.trim(),$options: "i" } },
            { description: { $regex: query.trim(),$options: "i" } }
        ]
    }

    // Filter by user ID if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId format")
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    // Only show published videos unless fetching specific owner videos
    matchStage.isPublished = true

    const sortStage = {}
    sortStage[sortBy] = sortType === "asc" ? 1 : -1

    const pipeline = [
        { $match: matchStage },
        { $sort: sortStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {                             username: 1,                             fullName: 1,                             avatar: 1                         }                     }                 ]             }         },         {$addFields: {
                owner: { $first: "$ownerDetails" }
            }
        },
        {
            $project: {
                ownerDetails: 0
            }
        }
    ]

    // Execute aggregation with pagination logic
    const skip = (pageNumber - 1) * limitNumber

    const [videos, totalVideos] = await Promise.all([
        Video.aggregate([...pipeline, { $skip: skip }, {$limit: limitNumber }]),
        Video.countDocuments(matchStage)
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalVideos,
                    totalPages: Math.ceil(totalVideos / limitNumber)
                }
            },
            "Videos fetched successfully"
        )
    )
})

// POST /api/v1/videos
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    // Extract file paths from req.files (Multer middleware)
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail image is required")
    }

    // Upload files to Cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile?.url) {
        throw new ApiError(500, "Failed to upload video file to Cloudinary")
    }

    if (!thumbnail?.url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration || 0,
        owner: req.user?._id,
        isPublished: true
    })

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"))
})

// GET /api/v1/videos/:videoId
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {                             username: 1,                             fullName: 1,                             avatar: 1                         }                     }                 ]             }         },         {$addFields: {
                owner: { $first: "$owner" }
            }
        }
    ])

    if (!video?.length) {
        throw new ApiError(404, "Video not found")
    }

    // Increment view count asynchronously
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"))
})

// PATCH /api/v1/videos/:videoId
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    if (!title?.trim() && !description?.trim() && !req.file?.path) {
        throw new ApiError(400, "At least one field (title, description, or thumbnail) is required to update")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Ensure only owner can update
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this video")
    }

    const updateData = {}

    if (title?.trim()) updateData.title = title
    if (description?.trim()) updateData.description = description

    // Upload new thumbnail if provided
    if (req.file?.path) {
        const newThumbnail = await uploadOnCloudinary(req.file.path)
        if (!newThumbnail?.url) {
            throw new ApiError(500, "Failed to upload thumbnail")
        }
        updateData.thumbnail = newThumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video details updated successfully"))
})

// DELETE /api/v1/videos/:videoId
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Ownership check
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this video")
    }

    await Video.findByIdAndDelete(videoId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

// PATCH /api/v1/videos/toggle/publish/:videoId
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to toggle publish status")
    }

    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: video.isPublished },
                `Video publish status toggled to ${video.isPublished ? "Published" : "Unpublished"}`
            )
        )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}