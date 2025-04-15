document.addEventListener("DOMContentLoaded", () => {
    let startTime = new Date(); // Record the start time when the page loads
    localStorage.setItem("startTime", startTime.toISOString()); // Save to localStorage
    document.getElementById("completeButton").addEventListener("click", () => {
        let moduleId = localStorage.getItem("currentModule");
        let userId = localStorage.getItem("userId");

        if (!moduleId || !userId) {
            console.log("No active session found.");
            return;
        }

        let now = new Date(); // Capture end time
        let formattedEndTime = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0") + " " +
            String(now.getHours()).padStart(2, "0") + ":" +
            String(now.getMinutes()).padStart(2, "0") + ":" +
            String(now.getSeconds()).padStart(2, "0");

        fetch("http://localhost:5000/end_activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, moduleId, endTime: formattedEndTime })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Server Response:", data);
            if (data.success) {
                alert("Activity completed successfully!");
                window.history.back(); // Redirect to the previous page
            } else {
                alert("Error ending activity: " + data.message);
            }
        })
        .catch(error => console.error("Error in completing activity:", error));

        // Clear session data after completion
        localStorage.removeItem("currentModule");
        localStorage.removeItem("startTime");
    });
});