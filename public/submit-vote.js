function submitVote() {
  const selectedParty = document.getElementById("party").value;

  // Send the vote to the server
  fetch("http://localhost:3000/submit-vote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ party: selectedParty }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message); // Log the server response
      // Optionally, you can provide feedback to the user on the client side
      alert("Vote submitted successfully.");
      window.close();
    })
    .catch((error) => {
      console.error("Error submitting vote:", error);
      // Optionally, provide feedback to the user on the client side
      alert("Error submitting vote. Please try again.");
    });
}
