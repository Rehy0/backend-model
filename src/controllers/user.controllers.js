import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import User from '../models/User.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';


const registerUser = asyncHandler(async (req,res)=>{
   
 const {username, email, password, fullname} = req.body 
 console.log("fullname:", fullname);
 console.log("username:", username);
 console.log("email:", email);
 console.log("password:", password);

 if([fullname,email,username,password].some((field)=>field?.trim()==="")){
    throw new ApiError(400,"Fullname is required")
 }

const existedUser = User.findOne({
   $or:[{email},{username}]
})
if(existedUser){
   throw new ApiError(409,"Username or email already exists")     
}

const avtarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avtarLocalPath) {
   throw new ApiError(400,"Avatar is required")
}

const avatar = await uploadOnCloudinary(avtarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath) 

if (!avatar) {
   throw new ApiError(400, "Avatar is required");
}

const user = await User.create({
   fullname,
   username:username.toLowerCase(),
   avatar: avatar.url,
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

export {registerUser};

