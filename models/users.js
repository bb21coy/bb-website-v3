const mongoose = require('mongoose');
const { validate } = require('./token');

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
        abbreviated_name: {
            type: String,
            default: "",
            required: true
        },
        password: {
            type: String,
            required: true,
            validate: {
                validator: (value) => {
                    const bcryptRegex = /^\$2[aby]\$([0-9]{2})\$.{53}$/;
                    return bcryptRegex.test(value);
                },
                message: 'Password must be a valid bcrypt hash.'
            }
        },
        account_type: {
            type: String,
            enum: ['Admin', 'Officer', 'Primer', 'Boy'],
            required: true,
        },
        graduated: {
            type: Boolean,
            default: false
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
        level: {
            type: Number,
            default: null,
            enum: [1, 2, 3, 4, 5, null]
        },
        rank: {
            type: String,
            default: null,
            validate: {
                validator: function (value) {
                    const allowedRanks = this.account_type === 'Boy'
                        ? ['REC', 'PTE', 'LCP', 'CPL', 'SGT', 'SSG', 'WO']
                        : this.account_type === 'Officer'
                            ? [null, 'OCT', '2LT', 'LTA']
                            : this.account_type === 'Primer'
                                ? [null, 'CLT', 'SCL']
                                : [];

                    if (this.account_type === 'Admin') return value === null;
                    return allowedRanks.includes(value);
                },
                message: (props) => `${props.value} is not a valid rank for account type ${props.account_type}.`
            }
        },
        credentials: {
            type: String,
            default: null
        },
        roll_call: {
            type: Boolean,
            default: null,
            validate: {
                validator: function (value) {
                    if (this.account_type === 'Admin') return value === null;
                    return value !== null;
                },
                message: 'roll_call is required for non-admin accounts and must be null for admin accounts.'
            }
        },
        class1: {
            type: String,
            default: null,
        },
        class2: {
            type: String,
            default: null,
        },
        class3: {
            type: String,
            default: null,
        },
        class4: {
            type: String,
            default: null,
        },
        class5: {
            type: String,
            default: null,
        },
        rank1: {
            type: String,
            default: null,
            validate: {
                validator: function (value) {
                    if (this.account_type === 'Boy') return value === null || typeof value === 'string';
                    return value === null;
                },
                message: function (props) {
                    return `rank1 must be null for non-boy account types, or a string/null for boy account types. Current value is: ${props.value}`;
                }
            }
        },
        rank2: {
            type: String,
            default: null,
            validate: {
                validator: (value) => {
                    if (this.account_type === 'Boy') return value === null || typeof value === 'string';
                    return value === null;
                },
                message: (props) => `rank2 must be null for non-boy account types, or a string/null for boy account types.`
            }
        },
        rank3: {
            type: String,
            default: null,
            validate: {
                validator: function (value) {
                    if (this.account_type === 'Boy') return value === null || typeof value === 'string';
                    return value === null;
                },
                message: (props) => `rank3 must be null for non-boy account types, or a string/null for boy account types.`
            }
        },
        rank4: {
            type: String,
            default: null,
            validate: {
                validator: function (value) {
                    if (this.account_type === 'Boy') return value === null || typeof value === 'string';
                    return value === null;
                },
                message: (props) => `rank4 must be null for non-boy account types, or a string/null for boy account types.`
            }
        },
        rank5: {
            type: String,
            default: null,
            validate: {
                validator: function (value) {
                    if (this.account_type === 'Boy') return value === null || typeof value === 'string';
                    return value === null;
                },
                message: (props) => `rank5 must be null for non-boy account types, or a string/null for boy account types.`
            }
        },
        member_id: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', UserSchema) || mongoose.models.User;
module.exports = User;