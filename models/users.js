const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
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

const User = mongoose.model('User', UserSchema) || mongoose.models.User;
module.exports = User;