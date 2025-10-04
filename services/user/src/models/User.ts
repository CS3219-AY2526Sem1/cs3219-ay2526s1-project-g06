import {
    Schema,
    model,
    models,
    type Model,
    type InferSchemaType,
  } from "mongoose";
  
  const UserSchema = new Schema(
    {
      uid: { type: String, required: true, unique: true, index: true },
      email: { type: String, index: true, sparse: true },
      displayName: { type: String },
      photoURL: { type: String },
      role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    {
      collection: "users",
      timestamps: true, 
      versionKey: false,
      toJSON: {
        virtuals: true, 
        transform: (_doc, ret) => {
          delete (ret as any)._id;
        },
      },
    }
  );
  
  export type UserDoc = InferSchemaType<typeof UserSchema> & {
    createdAt: Date;
    updatedAt: Date;
  };
  
  export interface IUserModel extends Model<UserDoc> {
    upsertFromAuth(args: {
      uid: string;
      email?: string | null;
      displayName?: string | null;
      photoURL?: string | null;
    }): Promise<UserDoc>;
  }
  
  UserSchema.statics.upsertFromAuth = async function ({
    uid,
    email,
    displayName,
    photoURL,
  }: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  }) {
    const update = {
      $setOnInsert: { uid, createdAt: new Date() },
      $set: {
        email: email ?? null,
        displayName: displayName ?? null,
        photoURL: photoURL ?? null,
        updatedAt: new Date(),
      },
    };
    const options = { upsert: true, new: true };
    const doc = await this.findOneAndUpdate({ uid }, update, options);
    return doc as UserDoc;
  };
  

  const User = (models.User || model("User", UserSchema)) as any as IUserModel;

  export default User;
  