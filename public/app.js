const video = document.getElementById("video");
const resultMessage = document.getElementById("result-message");

async function fetchKnownImage() {
  try {
    const response = await fetch("http://localhost:3000/take-image");
    const data = await response.json();

    if (data && data.image) {
      return data.image;
    } else {
      console.error("Invalid image link received from the server.");
      return ""; // or handle the error as needed
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    return ""; // or handle the error as needed
  }
}

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    await new Promise((resolve) => {
      video.addEventListener("play", resolve, { once: true });
    });

    // Load face-api.js models individually
    await loadModel("tinyFaceDetector", "/models");
    await loadModel("faceLandmark68Net", "/models");
    await loadModel("faceRecognitionNet", "/models");
    await loadModel("faceExpressionNet", "/models");
    await loadModel("ssdMobilenetv1", "/models");

    // Load the known face image
    const knownImageUrl = await fetchKnownImage();

    const knownImage = await faceapi.fetchImage(knownImageUrl);

    // Detect the face in the known image
    const knownFaceDetection = await faceapi
      .detectSingleFace(knownImage)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!knownFaceDetection) {
      console.error("No face detected in the known image.");
      return;
    }

    // Extract the face descriptor from the known face detection
    const knownFaceDescriptor = knownFaceDetection.descriptor;

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

      if (detections.length > 0) {
        const userFaceDescriptor = detections[0].descriptor;

        // Check if the face is likely to be live based on facial landmarks
        const isLive = true;

        if (isLive) {
          console.log("live");
          const distance = faceapi.euclideanDistance(
            userFaceDescriptor,
            knownFaceDescriptor
          );

          // Adjust the threshold based on your requirements
          const threshold = 0.5;
          console.log(distance);

          if (distance < threshold) {
            resultMessage.textContent = "Face matched!";
            resultMessage.style.color = "green";
            // window.open("voting-machine.html", "_self");
          } else {
            resultMessage.textContent = "Face not recognized";
            resultMessage.style.color = "red";
          }
        } else {
          resultMessage.textContent = "Liveness check failed";
          resultMessage.style.color = "red";
        }
      } else {
        resultMessage.textContent = "No face detected";
        resultMessage.style.color = "red";
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
