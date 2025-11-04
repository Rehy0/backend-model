import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';   

const generateAccessAndRefreshToken = async(userId)=>{
   try {
      const user = await User.findById(userId)
      const AccessToken = user.generateAccessToken()
      const RefreshToken = user.generateRefreshToken()

      user.RefreshToken = RefreshToken
      await user.save({validateBeforeSave:false})
      return {AccessToken,RefreshToken}

   } catch (error) {
      throw new ApiError(500,"Something went wrong while generating referesh and access token")
   }
}

const registerUser = asyncHandler(async (req,res)=>{
   
// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res

 const {username, email, password, fullname} = req.body 
 console.log("fullname:", fullname);
 console.log("username:", username);
 console.log("email:", email);
 console.log("password:", password);

 if([fullname,email,username,password].some((field)=>field?.trim()==="")){
    throw new ApiError(400,"Fullname is required")
 }

const existedUser = await User.findOne({
   $or:[{email},{username}]
})
if(existedUser){
   throw new ApiError(409,"Username or email already exists")     
}
console.log(req.files)

const avatarLocalPath = req.files?.avatar?.[0]?.path;
// const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

// let avatarLocalPath;
let coverImageLocalPath;



if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
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
   username:username.toLowerCase(),
   avatar: avatar?.url,
   coverImage: coverImage?.url || "",
   email,
   password,

})

const createdUser = await User.findById(user._id).select("-password -refreshToken");

if(!createdUser){
   throw new ApiError(500,"something went wrong while regestering the user")
}

return res.status(201).json(
   new ApiResponse(200,createdUser,"User registered successfully")
)

});

const loginUser = asyncHandler( async(req,res)=>{
// req body -> data
//username or email
// find the user 
// password check 
// access and refresh token
// send cookie

const {email,username,password} = req.body

console.log(req.body)
if(!username && !email){
   throw new ApiError(400, "username or email is required")
}

console.log("Email:", email);
console.log("Username:", username);

const user = await User.findOne({
   $or:[{username},{email}]
})

console.log("User found:", user);

if(!user){
   throw new ApiError(404, "User does not exist!")
}

 const isPasswordValid = await user.ispasswordCorrect(password)

if(!isPasswordValid){
   throw new ApiError(400,"Password is incorrect")
}

  const {AccessToken,RefreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
   httpOnly:true,
   secure:true 
  } 

  return res
  .status(200)
  .cookie("AcessToken",AccessToken,options)
  .cookie("RefreshToken",RefreshToken,options)
  .json(
   new ApiResponse(
      200,
      {
         user:loggedInUser,AccessToken,RefreshToken,
         
      },
      "User logged In Successfully"
   )
  )
})

const logoutUser = asyncHandler( async(req,res)=>{
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken:undefined,
         }
      },
      {
         new:true
      }
   )   

   const option = {
      httpOnly:true,
      secure:true
   }

   return res
   .status(200)
   .clearCookie("AcessToken",option)
   .clearCookie("RefreshToken",option)
   .json(new ApiResponse(200,{},"User Logged Out"))
})

export {registerUser,loginUser,logoutUser}; 