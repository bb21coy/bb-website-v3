const mongoose = require('mongoose');

const BlacklistTokenSchema = new mongoose.Schema(
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

const Token = mongoose.model('Token', BlacklistTokenSchema) || mongoose.models.Token;
module.exports = Token;