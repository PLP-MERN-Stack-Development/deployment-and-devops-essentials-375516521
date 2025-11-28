const mongodose = require('mongoose');
const { Schema } = mongodose;

const studentSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }, 
    email: { type: String, required: true, unique: true },
    enrollmentDate: { type: Date, default: Date.now },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }]
});     