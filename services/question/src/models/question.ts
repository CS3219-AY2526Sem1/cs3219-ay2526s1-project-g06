import {model, Schema, Document} from "mongoose";

export interface questionInterface extends Document {
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    topic: string;
}

const questionSchema = new Schema<questionInterface>({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        required: true
    },
    topic: {
        type: String,
        required: true
    }
});

export const Question = model<questionInterface>("Questions", questionSchema)