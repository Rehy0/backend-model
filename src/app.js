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

export default app


