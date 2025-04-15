// ✅ Capture Start Time When Page Loads
document.addEventListener("DOMContentLoaded", () => {
    let startTime1 = new Date();

    // Format Start Time
    let formattedStartTime = startTime1.getFullYear() + "-" +
        String(startTime1.getMonth() + 1).padStart(2, "0") + "-" +
        String(startTime1.getDate()).padStart(2, "0") + " " +
        String(startTime1.getHours()).padStart(2, "0") + ":" +
        String(startTime1.getMinutes()).padStart(2, "0") + ":" +
        String(startTime1.getSeconds()).padStart(2, "0");

    localStorage.setItem("startTime1", formattedStartTime);
    console.log("Start Time Saved:", formattedStartTime);
});

// ✅ Capture End Time and Send Data When "Complete Activity" is Clicked
document.getElementById("completeButton1").addEventListener("click", () => {
    let moduleId = localStorage.getItem("currentModule");
    let userId = localStorage.getItem("userId");
    let formattedStartTime1 = localStorage.getItem("startTime1");
    console.log(moduleId,userId,formattedStartTime1)
    let completionPercentage = localStorage.getItem("completionPercentage");
    let helpclicked=localStorage.getItem("helpCount");
    console.log(completionPercentage)
    console.log(helpclicked)

    if (!moduleId || !userId || !formattedStartTime1) {
        console.log("No active session found.");
        return;
    }

    // Capture End Time
    let now = new Date();
    let formattedEndTime1 = now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + " " +
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ":" +
        String(now.getSeconds()).padStart(2, "0");

    console.log("Start Time:", formattedStartTime1);
    console.log("End Time:", formattedEndTime1);
    console.log(helpclicked)

    // Send to Backend
    fetch("http://localhost:5000/end_activity_simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId,
            moduleId,
            startTime1: formattedStartTime1,
            endTime1: formattedEndTime1,
            completionPercentage: completionPercentage,
            helpclicked:helpclicked // ✅ Sending percentage
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Server Response:", data);
        if (data.success) {
            alert("Activity completed successfully!");
            window.history.back();
        } else {
            alert("Error ending activity: " + data.message);
        }
    })
    .catch(error => console.error("Error in completing activity:", error));

    // Clear Session Data
    localStorage.removeItem("startTime1");
    localStorage.removeItem("completionPercentage");
    localStorage.removeItem("helpCount")
});
