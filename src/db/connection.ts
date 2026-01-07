import mongoose from "mongoose";
import { DB_NAME } from "../constant";

async function connectDB() {
  try {
    const ConnectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`,
    );
    if (process.env.NODE_ENV === "development")
      console.log(
        `Mongo DB Connected HOST:${ConnectionInstance.connection.host} PORT:${ConnectionInstance.connection.port}`,
      );
  } catch (error) {
    console.log("Database Connection Failed : ", error);
    process.exit(1);
  }
}

export default connectDB;
