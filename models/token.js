import { Schema, model } from 'mongoose';

const BlacklistTokenSchema = new Schema(
    {
        token: {
            type: String,
            required: true
        },
        expiry: {
            type: Number,
            required: true
        }
    },
    { 
        collection: "token_blacklist"
    }
);

export default model('Token', BlacklistTokenSchema);