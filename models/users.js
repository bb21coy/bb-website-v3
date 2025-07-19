const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        account_name: {
            type: String,
            required: true
        },
        user_name: {
            type: String,
            required: true,
            unique: true
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
        },
        appointment: {
            type: String,
            default: null
        },
        honorifics: {
            enum: ['Mr', 'Ms', 'Mrs'],
            type: String,
            default: null
        },
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', UserSchema) || mongoose.models.User;
module.exports = User;