import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// GET /api/v1/comments/:videoId
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: { $first: "$owner" }
            }
        }
    ]

    const [comments, totalComments] = await Promise.all([
        Comment.aggregate([...pipeline, { $skip: skip }, { $limit: limitNumber }]),
        Comment.countDocuments({ video: videoId })
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalComments,
                    totalPages: Math.ceil(totalComments / limitNumber)
                }
            },
            "Comments fetched successfully"
        )
    )
})

// POST /api/v1/comments/:videoId
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))
})

// PATCH /api/v1/comments/c/:commentId
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID format")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content cannot be empty")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this comment")
    }

    comment.content = content.trim()
    await comment.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"))
})

// DELETE /api/v1/comments/c/:commentId
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID format")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}