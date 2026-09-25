import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// POST /api/v1/playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name and description are required")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id,
        videos: []
    })

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

// GET /api/v1/playlist/user/:userId
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID format")
    }

    const playlists = await Playlist.find({ owner: userId })

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
})

// GET /api/v1/playlist/:playlistId
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID format")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
    ])

    if (!playlist?.length) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))
})

// PATCH /api/v1/playlist/add/:videoId/:playlistId
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID format")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify this playlist")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: videoId }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
})

// PATCH /api/v1/playlist/remove/:videoId/:playlistId
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID format")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"))
})

// DELETE /api/v1/playlist/:playlistId
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID format")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

// PATCH /api/v1/playlist/:playlistId
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID format")
    }

    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "Name or description is required for update")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this playlist")
    }

    const updateFields = {}
    if (name?.trim()) updateFields.name = name.trim()
    if (description?.trim()) updateFields.description = description.trim()

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: updateFields },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}