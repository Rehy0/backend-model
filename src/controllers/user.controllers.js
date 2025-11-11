import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt, { decode } from "jsonwebtoken"
import { Aggregate } from 'mongoose';

const generateAccessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId)
      const AccessToken = user.generateAccessToken()
      const RefreshToken = user.generateRefreshToken()

      user.RefreshToken = RefreshToken
      await user.save({ validateBeforeSave: false })
      return { AccessToken, RefreshToken }

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
   }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

   const { username, email, password, fullname } = req.body
   console.log("fullname:", fullname);
   console.log("username:", username);
   console.log("email:", email);
   console.log("password:", password);

   if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "Fullname is required")
   }

   const existedUser = await User.findOne({
      $or: [{ email }, { username }]
   })
   if (existedUser) {
      throw new ApiError(409, "Username or email already exists")
   }
   console.log(req.files)

   const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // let avatarLocalPath;
   let coverImageLocalPath;



   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if (!avatar) {
      throw new ApiError(400, "Avatar upload failed");
   }

   const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      avatar: avatar?.url,
      coverImage: coverImage?.url || "",
      email,
      password,

   })

   const createdUser = await User.findById(user._id).select("-password -RefreshToken");

   if (!createdUser) {
      throw new ApiError(500, "something went wrong while regestering the user")
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
   )

});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    //username or email
    // find the user 
    // password check 
    // access and refresh token
    // send cookie

   const { email, username, password } = req.body

   console.log(req.body)
   if (!username && !email) {
      throw new ApiError(400, "username or email is required")
   }

   console.log("Email:", email);
   console.log("Username:", username);

   const user = await User.findOne({
      $or: [{ username }, { email }]
   })

   console.log("User found:", user);

   if (!user) {
      throw new ApiError(404, "User does not exist!")
   }

   const isPasswordValid = await user.ispasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(400, "Password is incorrect")
   }

   const { AccessToken, RefreshToken } = await generateAccessAndRefreshToken(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -RefreshToken")

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .cookie("AcessToken", AccessToken, options)
      .cookie("RefreshToken", RefreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser, AccessToken, RefreshToken,

            },
            "User logged In Successfully"
         )
      )
})

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            RefreshToken: undefined,
         }
      },
      {
         new: true
      }
   )

   const option = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .clearCookie("AcessToken", option)
      .clearCookie("RefreshToken", option)
      .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.RefreshToken || req.body.RefreshToken

   if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request")
   }

   try {
      const decodeToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )

      const user = await User.findById(decodeToken?._id);

      if (!user) {
         throw new ApiError(401, "Invalid refreshToken")
      }

      if (incomingRefreshToken !== user?.RefreshToken) {
         throw new ApiError(401, "RefreshToken is expired or used")
      }

      const options = {
         httpOnly: true,
         secure: true
      }

      const { AccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

      return res
         .status(200)
         .cookie("accessToken", AccessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(new ApiResponse(
            200,
            { AccessToken, RefreshToken: newRefreshToken }
         ))
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid RefreshToken");

   }
})

const changeUserCurrentPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body
   const user = await User.findById(req.user?.id)
   const ispasswordCorrect = await user.ispasswordCorrect(oldPassword)

   if (!ispasswordCorrect) {
      throw new ApiError(401, "Invalid Password")
   }

   user.password = newPassword
   await user.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed SuccessFully"))


})

const getCurrentUser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(200, req.user, "current user fetched successfully!")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
   const {fullname,email} = req.body;
   
  if(!fullname || !email){
    throw new ApiError(400,"All fields are required!")
  }


  const user = await User.findByIdAndUpdate(
   req.user?.id,
   {
      $set:{
         fullname:fullname,  // fullname,
         email:email   // email,
      }
   },
   {new:true},
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details update successfully!"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{

 const avatarLocalPath = req.file?.path

if (!avatarLocalPath) {
   throw new ApiError(400,"Avatar file is missing!");
}

const avatar = await uploadOnCloudinary(avatarLocalPath)

if (!avatar.url) {
   throw new ApiError(400,"Error while uploading on avatar")
}

const user = await User.findByIdAndUpdate(
   req.user?._id,
   {
      $set:{
         avatar:avatar.url
      }
   },
   {new: true}
).select("-password")

return res
.status(200)
.json(new ApiResponse(200,user,"avtar is updated successfully!"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
   const coverImageLocalPath = req.user?._id;

   if (!coverImageLocalPath) {
      throw new ApiError(400,"CoverImage file is missing!")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!coverImage.url) {
      throw new ApiError(400,"Error while uploading on CoverImage!")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage:coverImage.url
         }
      },
      {new:true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200,user,"coverImage updated successfully!"))
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
   const {username} = req.params;
   if(!username?.trim()){
      throw new ApiError(401,"Username is missing")
   }
  const channel = await User.aggregate([
   {
      $match:{
         username:username?.toLowerCase(),
      }
   },
   {
      $lookup:{
         from: "subscription",
         localField:"_id",
         foreignField:"channel",
         as:"subscribers"
      }
   },
   {
      $lookup:{
         from:"subscription",
         localField:"_id",
         foreignField:"subscriber",
         as:"subscribedTo"
      }
   },
   {
      $addFields:{
         subscribersCount:{
            $size:"$subscribers",
         },
         channelsSubscribedToCount:{
            $size:"$subscribedTo"
         }
      }
   }
  ])

})

export {
   registerUser, 
   loginUser, 
   logoutUser, 
   refreshAccessToken, 
   changeUserCurrentPassword, 
   getCurrentUser, 
   updateAccountDetails, 
   updateUserAvatar, 
   updateUserCoverImage, 
   getUserChannelProfile 
}; 
