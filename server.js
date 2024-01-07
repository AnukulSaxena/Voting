require('dotenv').config({ path: '.env' })
const express = require('express');
const path = require('path');
const cors = require('cors')
const mongoose = require('mongoose')

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

const PORT = process.env.PORT || 3000;
let voter_image = ''

const voterSchema = new mongoose.Schema({
    voter_id: { type: Number, required: true, unique: true },
    aadhar_id: { type: Number, required: true, unique: true },
    image_url: { type: String, required: true, unique: true },
    is_voted: { type: Boolean, required: true },
});

const Voter = mongoose.model('Voter', voterSchema);

app.post('/authenticate', async (req, res) => {

    mongoose.connect('mongodb://localhost:27017/voterDB');

    const { aadhar_id, voter_id } = req.body;

    try {

        const result = await Voter.findOne({ aadhar_id, voter_id });


        if (result && !result.is_voted) {
            console.log('Authentication successful: Yes');
            voter_image = result.image_url
            res.json({ authenticated: true });
        } else {
            console.log('Authentication successful: No');
            res.json({ authenticated: false });
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.get('/take-image', (req, res) => {
    console.log(voter_image)
    const imageUrl = voter_image;

    res.json({ image: imageUrl });
});



const voteSchema = new mongoose.Schema({
    party: String,
});


const Vote = mongoose.model('Vote', voteSchema);




app.post('/submit-vote', async (req, res) => {
    try {
        const { party } = req.body;


        const newVote = new Vote({ party });
        await newVote.save();


        if (voter_image) {
            await Voter.updateOne({ image_url: voter_image }, { $set: { is_voted: true } });
            voter_image = '';
            res.status(200).json({ message: 'Vote submitted successfully.' });
        } else {
            res.status(500).json({ error: 'No associated voter found.' });
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





app.get('/', (req, res) => {
    console.log('ok');

    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
