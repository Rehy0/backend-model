// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDb from "./db/index.js";

dotenv.config({
  path:'./env'
})

connectDb()











// const app = express()
// ;( async() => {
//   try {
//    await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`);
//     app.on("Error",(error)=>{
//       console.error(error);
//       throw error
//     })
//     app.listen(process.env.PORT,()=>{
//       console.log(`Your port running on ${process.env.PORT}`)
//     })
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// })()