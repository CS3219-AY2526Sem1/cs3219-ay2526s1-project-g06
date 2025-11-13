// AI Assistance Disclosure
// Tool: Copilot Claude 4.5, date 2025-10-03
// Scope: Implentation of User Model after I gave AI the schema design and fields that I wanted in my User Model
// Author Review: Validated Correctness

import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  bio?: string;
  language?: string;
  profileCompleted: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

interface IUserModel extends Model<IUser> {
  upsertFromAuth(authData: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<IUser>;
  
  updateProfile(uid: string, profileData: {
    displayName?: string;
    bio?: string;
    language?: string;
  }): Promise<IUser | null>;
}

const userSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: { type: String },
  photoURL: { type: String },
  role: { type: String, default: 'user' },
  bio: { type: String },
  language: { type: String },
  profileCompleted: { type: Boolean, default: false }, 
}, {
  timestamps: true
});

userSchema.statics.upsertFromAuth = async function(authData: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}) {
  try {
    const existingUser = await this.findOne({ uid: authData.uid });
    
    if (existingUser) {
      return await this.findOneAndUpdate(
        { uid: authData.uid },
        {
          email: authData.email,
          photoURL: authData.photoURL || null,
        },
        { new: true }
      );
    } else {
      const newUser = await this.create({
        uid: authData.uid,
        email: authData.email,
        displayName: authData.displayName,
        photoURL: authData.photoURL || null,
        role: 'user',
        profileCompleted: false, 
      });
      return newUser;
    }
  } catch (error) {
    console.error('Error in upsertFromAuth:', error);
    throw error;
  }
};

userSchema.statics.updateProfile = async function(uid: string, profileData: {
  displayName?: string;
  bio?: string;
  language?: string;
}) {
  try {
    return await this.findOneAndUpdate(
      { uid },
      {
        ...profileData,
        profileCompleted: true, 
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
};

const User = mongoose.model<IUser, IUserModel>('User', userSchema);
export default User;