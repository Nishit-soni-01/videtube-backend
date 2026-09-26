# VideTube Backend API

![Node.js](https://img.shields.io/badge/Node.js-v18.x-green?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-v4.x-black?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?style=for-the-badge&logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Authentication-black?style=for-the-badge&logo=json-web-tokens)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20Management-blue?style=for-the-badge&logo=cloudinary)

A robust, production-ready RESTful API for a video hosting platform built using **Node.js**, **Express.js**, and **MongoDB**. Designed following modular **MVC architecture**, secure JWT-based authentication, Cloudinary media pipeline integrations, and complex MongoDB aggregation pipelines.

---

## 📋 Table of Contents
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Database Schema & Aggregations](#-database-schema--aggregations)
- [License](#-license)

---

## ✨ Key Features

### 🔐 Authentication & User Management
* **Dual-Token System:** Secure Access Token (short-lived) & Refresh Token (long-lived) mechanism via HTTP-only cookies.
* **Profile Management:** Avatar and Cover image file uploads handled via `Multer` and hosted on `Cloudinary`.
* **Account Controls:** Password resets, profile details update, watch history tracking, and channel profile views.

### 🎥 Video Engine
* **Media Processing:** Direct video asset and thumbnail uploads to Cloudinary with automatic duration extraction.
* **Video Controls:** Toggle publish/unpublish status, update video metadata, track view counts, and soft/hard deletion.
* **Feed & Search:** Paginated video list retrieval with support for sorting, text search, and owner filtering.

### 💬 Social & Engagement Layer
* **Comments:** Add, update, delete, and paginate nested video comments with creator populating.
* **Like System:** Universal toggle mechanism for Videos, Comments, and Tweets; retrieve user's liked videos feed.
* **Subscriptions:** Channel subscription toggle with metrics for subscriber counts and subscribed channels list.
* **Playlists:** Create, update, delete custom playlists; dynamically append/remove videos.
* **Tweets / Community Posts:** Short status updates feed for creators.

### 📊 Analytics & Dashboard
* **Creator Analytics:** Aggregation pipeline calculating channel metrics: total subscribers, total videos, overall view count, and total video likes.
* **Content Hub:** Retrieve uploaded channel content sorted chronologically.

---

## 🛠 Tech Stack

* **Runtime:** Node.js (ES Modules syntax)
* **Framework:** Express.js
* **Database:** MongoDB with Mongoose ODM
* **Authentication:** JSON Web Tokens (JWT), Bcrypt.js
* **Media Handling:** Multer (Local storage temporary staging), Cloudinary API
* **Middleware & Utilities:** `cookie-parser`, `cors`, custom `ApiError`, `ApiResponse`, and `asyncHandler` wrappers

---

## 📁 Project Architecture

```text
videtube-backend/
├── public/
│   └── temp/                 # Staging area for temporary file uploads
├── src/
│   ├── controllers/          # Business logic handlers
│   │   ├── comment.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── healthcheck.controller.js
│   │   ├── like.controller.js
│   │   ├── playlist.controller.js
│   │   ├── subscription.controller.js
│   │   ├── tweet.controller.js
│   │   ├── user.controller.js
│   │   └── video.controller.js
│   ├── db/                   # Database connection setup
│   │   └── index.js
│   ├── middlewares/          # Express middlewares
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   ├── models/               # Mongoose schemas
│   │   ├── comment.model.js
│   │   ├── like.model.js
│   │   ├── playlist.model.js
│   │   ├── subscription.model.js
│   │   ├── tweet.model.js
│   │   ├── user.model.js
│   │   └── video.model.js
│   ├── routes/               # API route definitions
│   │   ├── comment.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── healthcheck.routes.js
│   │   ├── like.routes.js
│   │   ├── playlist.routes.js
│   │   ├── subscription.routes.js
│   │   ├── tweet.routes.js
│   │   ├── user.routes.js
│   │   └── video.routes.js
│   ├── utils/                # Helper utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── cloudinary.js
│   ├── app.js                # Express app setup & route mounting
│   └── index.js              # Server execution entry point
├── .env.sample               # Environment configuration template
├── .gitignore
├── package.json
└── README.md

```

## 🚀 Getting Started

### Prerequisites
* Node.js (v18.x or higher)
* MongoDB connection URI (Local instance or MongoDB Atlas)
* Cloudinary Account (for API Key, Secret, and Cloud Name)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Nishit-soni-01/videtube-backend.git](https://github.com/Nishit-soni-01/videtube-backend.git)
   cd videtube-backend
