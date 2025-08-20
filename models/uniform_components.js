// This model is for all uniform components. for eg (Hair, Field Service Cap, Haversack, etc...)

const mongoose = require('mongoose');

const UniformComponentSchema = new mongoose.Schema(
    {
        component_name: {
            type: String,
            required: true
        },
        total_score: {
            type: Number,
            required: true
        },
        components_fields: [ComponentFieldSchema]
    }
);

// This model is for all component fields, for eg haversack must have "this and that"
const ComponentFieldSchema = new mongoose.Schema({
    field_description: {
        type: String,
        required: true
    },
    field_score: {
        type: Number,
        required: true,
        default: 1
    }
});

const UniformComponent = mongoose.model('UniformComponent', UniformComponentSchema) || mongoose.models.UniformComponent;
module.exports = UniformComponent;