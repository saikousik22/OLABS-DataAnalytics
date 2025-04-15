document.addEventListener("DOMContentLoaded", function () {
    console.log("Fetching lab assignments...");

    let userId = localStorage.getItem("userId"); // Retrieve user ID
    if (!userId) {
        alert("User ID not found! Please log in.");
        return;
    }

    fetch(`http://localhost:5000/getLabAssignments/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched lab assignments:", data);
            renderLabChart(data); // Call function to display data
        })
        .catch(error => console.error("Error fetching lab assignments:", error));

        fetch(`http://localhost:5000/getLabCompletion/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched data:", data);
            document.getElementById("completedLabs").textContent = data.completedLabs;
            document.getElementById("totalLabs").textContent = data.totalLabs;
            renderCompletionBar(data.completionPercentage);
        })
        .catch(error => console.error("Error fetching module completion data:", error));
        
        fetch(`http://localhost:5000/deadline/${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Fetched lab data:", data);
            createBarChart(data);
        })
        .catch(error => console.error("Error fetching lab data:", error));

});


// ✅ Ensure this function is defined BEFORE calling it in fetch
function renderLabChart(data) {
    console.log("Rendering lab chart:", data);

    const ctx = document.getElementById("labChart")?.getContext("2d");
    if (!ctx) {
        console.error("Lab chart canvas not found!");
        return;
    }

    const labNames = data.map(item => item.task); // Extract lab names

    if (window.labChart instanceof Chart) {
        window.labChart.destroy(); // Destroy old chart before creating new one
    }

    window.labChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labNames, // Show lab names
            datasets: [{
                label: "Labs Assigned",
                data: new Array(labNames.length).fill(1), // Equal distribution
                backgroundColor: [
                    "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FFDB33", "#A133FF"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { 
                    enabled: true, // Enable tooltips
                    callbacks: {
                        label: function (tooltipItem) {
                            return tooltipItem.label; // Show lab name on hover
                        }
                    }
                },
                legend: { display: true }   // Show legend with lab names
            }
        }
    });

    console.log("Lab chart rendered successfully!");
}


function renderCompletionBar(completionPercentage) {
    console.log("Rendering completion bar:", completionPercentage);

    const ctx = document.getElementById("completionChart")?.getContext("2d");
    if (!ctx) {
        console.error("Completion chart canvas not found!");
        return;
    }

    // Determine bar color based on completion percentage
    let barColor;
    if (completionPercentage < 50) {
        barColor = "red";  // Low completion
    } else if (completionPercentage < 80) {
        barColor = "yellow"; // Medium completion
    } else {
        barColor = "green";  // High completion
    }

    // Adjust height dynamically based on percentage
    let barHeight = (completionPercentage / 100) * 300; // Scale to max 300px

    if (window.completionChart instanceof Chart) {
        window.completionChart.destroy();
    }

    window.completionChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Lab Completion"],
            datasets: [{
                label: `${completionPercentage.toFixed(2)}% Completed`,
                data: [completionPercentage],
                backgroundColor: barColor,
                borderColor: "#000",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            return `Completion: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            }
        }
    });

    console.log("Completion bar rendered successfully!");
}

function createBarChart(labData) {
    const today = new Date();
    const tasks = labData.map(item => item.task);
    const daysLeft = labData.map(item => {
        const deadline = new Date(item.deadline);
        const timeDiff = deadline - today;
        return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))); // Convert milliseconds to days
    });

    const ctx = document.getElementById("barChart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: tasks,
            datasets: [{
                label: "Days Left",
                data: daysLeft,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: "Days Left" } },
                x: { title: { display: true, text: "Assigned Labs" } }
            }
        }
    });
}