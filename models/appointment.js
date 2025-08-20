// This is the model for the appointments holder list

const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
    {
        appointment_name: {
            type: String,
            unique: true,
            required: true
        },
        account_type: {
            type: String,
            enum: ['Officer', 'Primer', 'Boy'],
            required: true
        },
        account_id: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Appointment = mongoose.model('Appointment', AppointmentSchema) || mongoose.models.Appointment;
module.exports = Appointment;