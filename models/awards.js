// This model is for all awards

const mongoose = require('mongoose');

// This model is for all masteries
const MasteriesSchema = new mongoose.Schema(
    {
        mastery_name: {
            type: String,
            required: true
        },
        // to use this description when filling the results generation page if the main badge has no description
        mastery_description: {
            type: String,
            default: null
        },
        mastery_requirements: {
            type: String,
            default: null
        },
        // to use this description placeholder when filling the results generation page if the main badge has no description
        mastery_description_hint: {
            type: String,
            default: null
        },
        recommended_level: {
            type: Number,
            default: null,
            validate: {
                validator: function (value) {
                    return value === null || (value >= 1 && value <= 4);
                },
                message: 'recommended_level must be between 1 and 4 or null.'
            }
        }
    },
    {
        timestamps: true
    }
);

const AwardsSchema = new mongoose.Schema(
    {
        badge_name: {
            type: String,
            unique: true,
            required: true
        },
        badge_requirements: {
            type: String,
            default: null
        },
        // The description of the badge. Only applies to badges without any masteries
        badge_description: {
            type: String,
            default: null
        },
        recommended_level: {
            type: Number,
            default: null,
            validate: {
                validator: function (value) {
                    return value === null || (value >= 1 && value <= 4);
                },
                message: 'recommended_level must be between 1 and 4 or null.'
            }
        },
        // The masteries of the badge. Only applies to badges with masteries. Relate to the masteries model
        badge_masteries: [MasteriesSchema],
        // The description placeholder text of the badge
        badge_description_hint: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        validate: {
            validator: function () {
                if (this.badge_description && this.badge_masteries.length > 0) throw new Error('If a badge description exists, there should be no masteries.');
                if (!this.badge_description && this.badge_masteries.length === 0) throw new Error('If there are no badge masteries, a badge description must exist.');
                return true;
            },
            message: 'Invalid badge configuration.'
        }
    }
);

const Awards = mongoose.model('Awards', AwardsSchema) || mongoose.models.Awards;
const Masteries = mongoose.model('Masteries', MasteriesSchema) || mongoose.models.Masteries;

module.exports = { Awards, Masteries };