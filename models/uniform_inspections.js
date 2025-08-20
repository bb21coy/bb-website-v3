// This is the model for the uniform inspection summary page.

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UniformInspectionsSchema = new mongoose.Schema(
    {
        boy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            validate: {
                validator: async function (value) {
                    const user = await mongoose.model('User').findById(value);

                    if (!user) throw new Error('Boy user not found');
                    if (user.account_type.toLowerCase() === 'boy' && user.appointment === null) throw new Error('Boy must be an admin, officer, primer or boy with an appointment');

                    return true;
                },
                message: 'Invalid boy account type',
            },
        },
        score: {
            type: Number,
            default: null
        },
        assessedDate: {
            type: Date,
            default: null
        },
        assessor: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            default: null,
            validate: {
                validator: async function (value) {
                    const user = await mongoose.model('User').findById(value);

                    if (!user) throw new Error('Assessor user not found');
                    if (user.account_type.toLowerCase() === 'boy' && user.appointment === null) throw new Error('Assessor must be an admin, officer, primer or boy with an appointment');

                    return true;
                },
                message: 'Invalid assessor account type',
            },
        }
    },
    {
        collection: "uniform_inspections"
    }
);

const UniformInspections = mongoose.model('UniformInspections', UniformInspectionsSchema) || mongoose.models.UniformInspections;
module.exports = UniformInspections;