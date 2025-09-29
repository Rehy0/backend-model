import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async()=>{
   try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`)
  console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
   } catch (error) {
    console.log(error);
    process.exit(1);
   }
}

export default connectDb