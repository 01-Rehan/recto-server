import dotenv from 'dotenv';
import connectDB from './db/connection';
import app from './app';

dotenv.config({
  path : "./.env"  
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log("server running at port :",process.env.PORT || 3000);
    })
})
.catch((err) => {
    console.log("error while starting server :",err);
})