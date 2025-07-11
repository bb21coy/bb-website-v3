import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        account_type: {
            type: String,
            enum: ['Admin', 'Officer', 'Primer', 'Boy'],
            required: true
        },
        graduated: {
            type: Boolean,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default model('User', UserSchema);