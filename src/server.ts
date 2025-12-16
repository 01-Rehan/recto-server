import dotenv from 'dotenv';
dotenv.config();

import connectDB from './db/connection';
import app from './app';

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log("server running at port :",process.env.PORT || 3000);
    })
})
.catch((err) => {
    console.log("error while starting server :",err);
})