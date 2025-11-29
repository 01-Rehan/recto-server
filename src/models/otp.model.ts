import { Schema, model, Model, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IOTP extends Document{
  email: string;
  fullName : string,
  hashedPassword : string,
  hashedCode: string;
  expiresAt: Date;
}

export interface IOTPMethods {
 compareCode(otp: string): Promise<boolean>; 
}

const EXPIRATION_TIME = 5 * 60 * 1000;

const OTPSchema = new Schema<IOTP , Model<IOTP, {}, IOTPMethods>,IOTPMethods>({
  email: {
    type: String,
    required: true,
    index: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  hashedPassword: {
    type: String,
    required: true,
    select : false
  },
  hashedCode: {
    type: String,
    required: true,
    select : false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + EXPIRATION_TIME),
  },
},
{
  timestamps: true,
});

OTPSchema.pre("save", async function (){
    try {
      if (this.isModified("hashedCode")) { 
      this.hashedCode = await bcrypt.hash(this.hashedCode, 10);
    }
    } catch (error) {
      console.log("Error while hashing the OTP code", error);
      throw error;
    }
})

OTPSchema.pre("save", async function () {
  try {
    if (!this.isModified("hashedPassword")) return;
    const salt = await bcrypt.genSalt(10);
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, salt);
  } catch (err: any) {
    // Type as any or Error
    throw err;
  }
});

OTPSchema.methods.compareCode = async function (otp: string) {
  try {
    return await bcrypt.compare(otp, this.hashedCode);
  } catch (err) {
    console.log("Error comparing OTP", err);
    return false;
  }
}

// Auto-delete expired OTPs (Mongo TTL index)
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPModel = model<IOTP>("OTP", OTPSchema);
