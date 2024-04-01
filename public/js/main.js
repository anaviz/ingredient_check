document.addEventListener('DOMContentLoaded', function() {
  const video = document.getElementById('video');
  const canvas = document.createElement('canvas'); // Create a canvas element
  const captureButton = document.getElementById('captureIngredients');
  const resultsDiv = document.getElementById('analysisResults'); // Access the results div
  let stream = null; // Declare a variable to store the stream globally
  const errorMessageDiv = document.createElement('div'); // Create a div for error messages
  errorMessageDiv.id = 'errorMessage';
  errorMessageDiv.style.display = 'none'; // Initially hide the error message div
  document.body.appendChild(errorMessageDiv); // Append it to the body
  const imageContainer = document.querySelector('.captured-image-container'); // Select the container for captured image

  // Function to start the camera stream
  function openCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function(mediaStream) {
        stream = mediaStream; // Store the stream globally
        video.srcObject = stream;
        captureButton.disabled = false; // Enable the capture button
        captureButton.style.display = 'inline-block'; // Make sure the capture button is visible
        console.log("Camera has been successfully opened and stream started.");
      })
      .catch(function(err) {
        console.error("Error accessing the camera: ", err);
        alert("An error occurred while trying to access the camera. Please check your device settings and permissions.");
      });
  }

  // Function to capture the image from the video feed
  function captureImage() {
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      // Convert canvas to an image URL
      const imageUrl = canvas.toDataURL('image/jpeg');
      
      // Create or update the img element to display the captured image
      let capturedImageElement = document.getElementById('capturedImage');
      if (!capturedImageElement) {
        capturedImageElement = document.createElement('img');
        capturedImageElement.id = 'capturedImage';
        capturedImageElement.style.maxWidth = '640px'; // Match video width for consistency
        capturedImageElement.style.maxHeight = '480px'; // Match video height for consistency
        imageContainer.appendChild(capturedImageElement); // Append the captured image to the container
        imageContainer.style.display = 'flex'; // Make the container visible
      }
      capturedImageElement.src = imageUrl;

      // Hide the video element
      video.style.display = 'none';

      canvas.toBlob(function(blob) {
        sendImageForAnalysis(blob);
      }, 'image/jpeg');

      // Stop the camera stream
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log("Camera stream stopped.");
        });
        captureButton.disabled = true; // Disable the 'Capture Ingredients' button
      }
    } catch (error) {
      console.error('Error capturing or converting image:', error);
      // Display error message to the user
      errorMessageDiv.textContent = 'Failed to capture or convert the image, please try again.';
      errorMessageDiv.style.display = 'block';
      // Automatically trigger the 'Capture Again' functionality
      document.getElementById('captureAgain').click();
    }
  }

  // Function to show loading indicator
  function showLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loadingIndicator';
    loadingIndicator.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
    loadingIndicator.style.position = 'absolute';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.zIndex = '2'; // Ensure it's above the captured image

    document.body.appendChild(loadingIndicator);
  }

  // Function to hide loading indicator
  function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }

  // Function to send the captured image to the backend for analysis
  function sendImageForAnalysis(imageBlob) {
    const formData = new FormData();
    formData.append('image', imageBlob, 'ingredient-image.jpg');
    showLoadingIndicator(); // Show loading indicator
    fetch('/api/analyze-image', {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      hideLoadingIndicator(); // Hide loading indicator regardless of the response status
      if (!response.ok) { // Check if the response status code indicates failure
        console.error('Failed to analyze the image. Please try again.'); // Log the error
        errorMessageDiv.textContent = 'Failed to analyze the image, please try again.'; // Populate the errorMessageDiv with a user-friendly error message
        errorMessageDiv.style.display = 'block'; // Make the error message visible
        document.getElementById('captureAgain').click(); // Programmatically trigger the 'Capture Again' button's click event
        return; // Exit the function early to prevent further execution
      }
      return response.json();
    })
    .then(data => {
      if (data) { // Ensure data exists before attempting to display results
        console.log('Image analysis received:', data);
        displayAnalysisResults(data); // Call to a new function to display the results

        // Hide the 'Capture Ingredients' button
        captureButton.style.display = 'none';

        // Show the 'Capture Again' button
        const captureAgainButton = document.getElementById('captureAgain');
        captureAgainButton.style.display = 'inline-block'; // or 'block', depending on your styling preferences
      }
    })
    .catch((error) => {
      console.error('Error sending image for analysis:', error);
      alert('An error occurred while sending the image for analysis. Please try again.');
      hideLoadingIndicator(); // Ensure to hide loading indicator even on error
    });
  }

  // Modified function to display analysis results
  function displayAnalysisResults(data) {
    resultsDiv.innerHTML = ''; // Clear previous results
    const productTypeElement = document.createElement('h3');
    productTypeElement.textContent = `Product Type: ${data.product_type}`;
    resultsDiv.appendChild(productTypeElement);

    const ingredientsList = document.createElement('div');
    ingredientsList.className = 'ingredients-list';

    data.ingredients.forEach(ingredient => {
      const ingredientElement = document.createElement('div');
      ingredientElement.classList.add('ingredient-result');
      ingredientElement.innerHTML = `<strong>Ingredient:</strong> ${ingredient.name} <br>
                                      <strong>Concern Level:</strong> ${ingredient.concern} <br>
                                      <strong>Explanation:</strong> ${ingredient.reason}`;
      ingredientsList.appendChild(ingredientElement);
    });

    resultsDiv.appendChild(ingredientsList);
    // Show the 'Capture Again' button
    document.getElementById('captureAgain').style.display = 'block';
  }

  // Event listener for the capture button
  captureButton.addEventListener('click', function() {
    captureImage(); // Call the function to capture the image when the button is clicked
  });

  // Event listener for the 'Capture Again' button
  document.getElementById('captureAgain').addEventListener('click', function() {
    // Clear the analysis results
    resultsDiv.innerHTML = '';

    // Remove the displayed captured image
    const capturedImageElement = document.getElementById('capturedImage');
    if (capturedImageElement) {
      capturedImageElement.remove();
      imageContainer.style.display = 'none'; // Hide the container as it's now empty
    }

    // Hide the 'Capture Again' button
    this.style.display = 'none';

    // Clear and hide the error message div
    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';

    // Show the video element for the camera stream
    video.style.display = 'block';

    // Enable the 'Capture Ingredients' button and make it visible
    captureButton.disabled = false;
    captureButton.style.display = 'inline-block'; // Make sure the capture button is visible

    // Restart the camera stream
    openCamera();
  });

  // Immediately start the camera when the page loads
  openCamera();
});