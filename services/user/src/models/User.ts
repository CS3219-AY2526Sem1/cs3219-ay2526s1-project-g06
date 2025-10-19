import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  bio?: string;
  language?: string;
  profileCompleted: boolean; // Add this field
  createdAt: Date;
  updatedAt: Date;
}

// Add interface for static methods
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
  profileCompleted: { type: Boolean, default: false }, // Add this line
}, {
  timestamps: true
});

// Update your existing upsertFromAuth method
userSchema.statics.upsertFromAuth = async function(authData: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}) {
  try {
    const existingUser = await this.findOne({ uid: authData.uid });
    
    if (existingUser) {
      // Update existing user but preserve profileCompleted
      return await this.findOneAndUpdate(
        { uid: authData.uid },
        {
          email: authData.email,
          displayName: authData.displayName,
          photoURL: authData.photoURL,
        },
        { new: true }
      );
    } else {
      // Create new user with explicit profileCompleted: false
      const newUser = await this.create({
        uid: authData.uid,
        email: authData.email,
        displayName: authData.displayName,
        photoURL: authData.photoURL,
        role: 'user',
        profileCompleted: false, // Explicitly set to false
      });
      return newUser;
    }
  } catch (error) {
    console.error('Error in upsertFromAuth:', error);
    throw error;
  }
};

// Update your existing updateProfile method
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
        profileCompleted: true, // Set to true when profile is completed
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