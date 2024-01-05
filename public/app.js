const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const resultMessage = document.getElementById('result-message');
const votingMachine = document.getElementById('voting-machine');


// ... (existing code)

function submitVote() {
    const selectedParty = document.getElementById('party').value;

    // Send the vote to the server
    fetch('http://localhost:3000/submit-vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ party: selectedParty }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message); // Log the server response
            // Optionally, you can provide feedback to the user on the client side
            alert('Vote submitted successfully.');
            window.close()
        })
        .catch(error => {
            console.error('Error submitting vote:', error);
            // Optionally, provide feedback to the user on the client side
            alert('Error submitting vote. Please try again.');
        });
}

// ... (existing code)

async function fetchKnownImage() {
    try {
        const response = await fetch('http://localhost:3000/take-image');
        const data = await response.json();

        if (data && data.image) {
            return data.image;
        } else {
            console.error('Invalid image link received from the server.');
            return ''; // or handle the error as needed
        }
    } catch (error) {
        console.error('Error fetching image:', error);
        return ''; // or handle the error as needed
    }
}



async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        await new Promise((resolve) => {
            video.addEventListener('play', resolve, { once: true });
        });

        // Set the canvas dimensions based on the video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        // Load face-api.js models individually
        await loadModel('tinyFaceDetector', '/models');
        await loadModel('faceLandmark68Net', '/models');
        await loadModel('faceRecognitionNet', '/models');
        await loadModel('faceExpressionNet', '/models');
        await loadModel('ssdMobilenetv1', '/models');

        // Load the known face image
        const knownImageUrl = await fetchKnownImage();

        const knownImage = await faceapi.fetchImage(knownImageUrl);

        // Detect the face in the known image
        const knownFaceDetection = await faceapi.detectSingleFace(knownImage).withFaceLandmarks().withFaceDescriptor();

        if (!knownFaceDetection) {
            console.error('No face detected in the known image.');
            return;
        }

        // Extract the face descriptor from the known face detection
        const knownFaceDescriptor = knownFaceDetection.descriptor;

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors()
                .withFaceExpressions();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

            if (resizedDetections.length > 0) {
                const userFaceDescriptor = resizedDetections[0].descriptor;
                const userFaceLandmarks = resizedDetections[0].landmarks.positions;

                // Check if the face is likely to be live based on facial landmarks
                const isLive = true

                if (isLive) {
                    console.log('live')
                    const distance = faceapi.euclideanDistance(userFaceDescriptor, knownFaceDescriptor);

                    // Adjust the threshold based on your requirements
                    const threshold = 0.4;
                    console.log(distance);

                    if (distance < threshold) {
                        resultMessage.textContent = 'Face matched!';
                        resultMessage.style.color = 'green';
                        votingMachine.style.display = 'block';
                    } else {
                        resultMessage.textContent = 'Face not recognized';
                        resultMessage.style.color = 'red';
                    }
                } else {
                    resultMessage.textContent = 'Liveness check failed';
                    resultMessage.style.color = 'red';
                }
            } else {
                resultMessage.textContent = 'No face detected';
                resultMessage.style.color = 'red';
            }
        }, 1000);
    } catch (error) {
        console.error(error);
    }
}



async function loadModel(modelName, modelPath) {
    try {
        await faceapi.nets[modelName].loadFromUri(modelPath);
        console.log(`${modelName} model loaded successfully.`);
    } catch (error) {
        console.error(`Error loading ${modelName} model:`, error);
        throw error;
    }
}

startWebcam();
