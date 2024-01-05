const mongoose = require('mongoose');

// Define Mongoose Schema
const voterSchema = new mongoose.Schema({
    voter_id: { type: Number, required: true, unique: true },
    aadhar_id: { type: Number, required: true, unique: true },
    image_url: { type: String, required: true, unique: true },
});

// Create Mongoose Model
const Voter = mongoose.model('Voter', voterSchema);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/voterDB');

// Check for successful connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');

    // Use the Model to create a new voter document
    const newVoter = new Voter({
        voter_id: 1234,
        aadhar_id: 4321,
        image_url: 'https://res.cloudinary.com/dzv8lzuw2/image/upload/v1704454460/jyaeuzp8hlajbcljp8wh.jpg',
    });

    // Save the document to the database
    newVoter.save()
});
