import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()
const kb = "16kb"
 

app.use(cors({
  origin : process.env.CORS_ORIGIN,
  credentials: true,
}))

app.use(express.json({limit:kb}));
app.use(express.urlencoded({extended:true,limit:kb }));
app.use(express.static("public"));
app.use(cookieParser());

// imports routes here
import userRoutes from "./routes/user.routes.js"

app.use("/api/v1/users",userRoutes)


export default app


