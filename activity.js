function startActivity(moduleId) {
    let userId = localStorage.getItem("userId"); // Retrieve stored user ID

    if (!userId) {
        alert("Please log in first!");
        window.location.href = "login.html"; // Redirect to login
        return;
    }

    let startTime = new Date().toISOString();
    localStorage.setItem("currentModule", moduleId);
    localStorage.setItem("startTime", startTime);

    console.log(`Starting activity: UserID=${userId}, Module=${moduleId}, StartTime=${startTime}`);

    fetch("http://localhost:5000/start_activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, moduleId, startTime })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Start Activity Response:", data);
        if (!data.success) {
            alert("Error starting activity: " + data.message);
        }
    })
    .catch(error => console.error("Error in startActivity:", error));

    window.location.href = moduleId + ".html"; // Redirect to the selected topic
}

// function endActivity() {
//     let moduleId = localStorage.getItem("currentModule");
//     let startTime = localStorage.getItem("startTime");
//     let userId = localStorage.getItem("userId");

//     if (!moduleId || !startTime || !userId) {
//         console.log("No active session found.");
//         return;
//     }

//     let endTime = new Date().toISOString();
//     let hours = (new Date(endTime) - new Date(startTime)) / 3600000; // Time spent in hours

//     console.log(`Ending activity: UserID=${userId}, Module=${moduleId}, EndTime=${endTime}, Hours=${hours}`);

//     fetch("http://localhost:5000/end_activity", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId, moduleId, endTime, hours })
//     })
//     .then(res => res.json())
//     .then(data => {
//         console.log("End Activity Response:", data);
//         if (!data.success) {
//             alert("Error ending activity: " + data.message);
//         }
//     })
//     .catch(error => console.error("Error in endActivity:", error));

//     localStorage.removeItem("currentModule");
//     localStorage.removeItem("startTime");
// }

// // Ensure activity is recorded on page unload
// window.addEventListener("beforeunload", endActivity);
