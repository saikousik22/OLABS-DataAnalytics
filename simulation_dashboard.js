document.addEventListener("DOMContentLoaded", function () {
    console.log("Visualization script loaded");

    let userId = localStorage.getItem("userId");
    if (!userId) {
        alert("User ID not found! Please log in.");
        return;
    }

    console.log("Fetching data for userId:", userId);


    // Fetch Time Spent per Topic Data
    fetch(`http://localhost:5000/get-module-hours-simulation/${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Module Hours API Response:", data);
            if (!data || data.length === 0) {
                alert("No module data received!");
                return;
            }
            renderTopicChart(data);
        })
        .catch(error => console.error("Error fetching module data:", error));

    // Fetch Average Score per Module
    fetch(`http://localhost:5000/getModuleScores-simulation/${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Module Scores API Response:", data);
            if (!data || data.length === 0) {
                alert("No module score data received!");
                return;
            }
            renderAttemptsChart(data);
        })
        .catch(error => console.error("Error fetching module scores:", error));

        fetch(`http://localhost:5000/get_progress_data/${userId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log("Progress Data:", data.data);
                        renderCompletionChart(data.data);
                    } else {
                        console.error("Failed to fetch progress data");
                    }
                })
                .catch(error => console.error("Error fetching progress data:", error));
            // Fetch Help Attempts Data
    fetch(`http://localhost:5000/get_help_attempts/${userId}`)
    .then(response => response.json())
    .then(data => {
        console.log("Help Attempts API Response:", data);
        if (!data.success || !data.data || data.data.length === 0) {
            alert("No help attempts data received!");
            return;
        }
        renderHelpAttemptsChart(data.data);
    })
    .catch(error => console.error("Error fetching help attempts data:", error));

    fetch(`http://localhost:5000/get_recent_mastery_scores/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderMasteryScoreChart(data.data);
                } else {
                    console.error("Failed to fetch mastery scores:", data.message);
                }
            })
            .catch(error => console.error("Error fetching mastery scores:", error));
}
        
);

// fetch(`http://localhost:5000/send-sql/${userId}`, {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json",
//     },
//     body: JSON.stringify({}), // Sending an empty body if not required
// })
// .then(response => response.json())
// .then(data => {
//     console.log("Response from server:", data);
// })
// .catch(error => {
//     console.error("Error:", error);
// });

// Render User Study Chart
// function renderStudyChart(totalTime, topicsStudied) {
//     console.log("Rendering study chart:", totalTime, topicsStudied);

//     const ctx = document.getElementById("studyChart")?.getContext("2d");
//     if (!ctx) {
//         console.error("Study chart canvas not found!");
//         return;
//     }

//     if (window.studyChart instanceof Chart) {
//         window.studyChart.destroy();
//     }

//     window.studyChart = new Chart(ctx, {
//         type: "bar",
//         data: {
//             labels: ["Total Study Time (min)", "Topics Studied"],
//             datasets: [{
//                 label: "User Study Data",
//                 data: [totalTime, topicsStudied],
//                 backgroundColor: ["#4CAF50", "#2196F3"],
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             responsive: true,
//             scales: { y: { beginAtZero: true } }
//         }
//     });

//     console.log("Study chart rendered successfully!");
// }

// Render Time Spent per Topic Chart
function renderTopicChart(data) {
    console.log("Rendering topic chart:", data);

    const ctx = document.getElementById("topicChart")?.getContext("2d");
    if (!ctx) {
        console.error("Topic chart canvas not found!");
        return;
    }

    const moduleNames = data.map(item => item.modulename);
    const hoursSpent = data.map(item => item.total_hours);

    if (window.topicChart instanceof Chart) {
        window.topicChart.destroy();
    }

    window.topicChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: moduleNames,
            datasets: [{
                label: "Min Spent per Module",
                data: hoursSpent,
                backgroundColor: "#2196F3"
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    console.log("Topic chart rendered successfully!");
}

// Render Average Score per Module (Pie Chart)
// function renderScoreChart(data) {
//     console.log("Rendering score chart:", data);

//     const ctx = document.getElementById("scoreChart")?.getContext("2d");
//     if (!ctx) {
//         console.error("Score chart canvas not found!");
//         return;
//     }

//     const moduleNames = data.map(item => item.modulename);
//     const avgScores = data.map(item => item.avg_score);

//     if (window.scoreChart instanceof Chart) {
//         window.scoreChart.destroy();
//     }

//     window.scoreChart = new Chart(ctx, {
//         type: "pie",
//         data: {
//             labels: moduleNames,
//             datasets: [{
//                 label: "Average Score",
//                 data: avgScores,
//                 backgroundColor: [
//                     "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FFDB33", "#A133FF"
//                 ]
//             }]
//         },
//         options: {
//             responsive: true
//         }
//     });

//     console.log("Score chart rendered successfully!");
// }

// // Add this function to your visualization.js file

// // Add this to visualization.js file

// // Helper function to get rotation angle based on score
// function getRotationAngle(score) {
//     if (score >= 9) return 60;    // Advanced (right-most)
//     if (score >= 5) return 0;     // Intermediate (middle)
//     return -60;                   // Beginner (left-most)
// }

// // Render Gauge Chart
// function renderGaugeChart(data) {
//     console.log("Rendering gauge chart:", data);

//     // Find "Pythagoras Theorem" in data
//     const subjectData = data.find(item => item.modulename === "pythogorestheorem");
//     if (!subjectData) {
//         console.error("Pythagoras Theorem data not found!");
//         return;
//     }

//     const subjectName = subjectData.modulename;
//     const userScore = Number(subjectData.avg_score); // Ensure it's a number

//     console.log("Selected Subject:", subjectName, " | Score:", userScore);

//     // Update subject info if exists
//     const subjectNameEl = document.getElementById("subjectName");
//     const avgScoreEl = document.getElementById("avgScore");
//     if (subjectNameEl) subjectNameEl.textContent = `Subject: ${subjectName}`;
//     if (avgScoreEl) avgScoreEl.textContent = `Average Score: ${userScore.toFixed(2)}`;

//     // Get canvas
//     const ctx = document.getElementById("gaugeChart").getContext("2d");
    
//     // Destroy previous chart instance if exists
//     if (window.gaugeChart instanceof Chart) {
//         window.gaugeChart.destroy();
//     }

//     // Create new chart
//     window.gaugeChart = new Chart(ctx, {
//         type: "doughnut",
//         data: {
//             labels: ["Beginner", "Intermediate", "Advanced"],
//             datasets: [{
//                 data: [1, 1, 1],  // Equal sections
//                 backgroundColor: ["lightblue", "blue", "green"],
//                 borderWidth: 0
//             }]
//         },
//         options: {
//             responsive: false,
//             cutout: "80%",
//             rotation: -90,
//             circumference: 180,
//             plugins: {
//                 legend: { 
//                     display: true,
//                     labels: { 
//                         generateLabels: function(chart) {
//                             return chart.data.labels.map((label, i) => ({
//                                 text: label, 
//                                 fillStyle: chart.data.datasets[0].backgroundColor[i],
//                                 hidden: false
//                             }));
//                         }
//                     }
//                 },
//                 tooltip: {
//                     callbacks: {
//                         label: function(tooltipItem) {
//                             return tooltipItem.label;  // Show only label, no numbers
//                         }
//                     }
//                 }
//             }
//         }
//     });

//     // Move arrow dynamically
//     document.getElementById("arrow").style.transform = `translateX(-50%) rotate(${getRotationAngle(userScore)}deg)`;
    
//     console.log("Gauge chart rendered successfully!");
// }

function renderAttemptsChart(data) {
    console.log("Rendering attempts chart with data:", data);

    const ctx = document.getElementById("attemptsChart")?.getContext("2d");
    if (!ctx) {
        console.error("Attempts chart canvas not found!");
        return;
    }

    // Extract module names and attempt counts
    const moduleNames = data.map(item => item.modulename);
    const attemptCounts = data.map(item => item.c);  // Handle undefined

    console.log("Modules:", moduleNames);
    console.log("Attempts:", attemptCounts);  // Check if it's fetching correctly

    // Destroy existing chart if needed
    if (window.attemptsChart instanceof Chart) {
        window.attemptsChart.destroy();
    }

    // Create bar chart
    window.attemptsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: moduleNames,
            datasets: [{
                label: "No. of Attempts",
                data: attemptCounts,
                backgroundColor: "rgba(54, 162, 235, 0.6)", // Blue color
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Attempts"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Module Name"
                    }
                }
            }
        }
    });

    console.log("Attempts chart rendered successfully!");
}


function renderCompletionChart(progressData) {
    const ctx = document.getElementById("progressChart").getContext("2d");

    // Ensure data is in the correct format
    if (!Array.isArray(progressData) || progressData.length === 0) {
        console.error("Invalid or empty progress data received");
        return;
    }

    // Extracting labels (X-axis) and data (Y-axis)
    let labels = progressData.map(row => `${row.modulename} (Attempt-${row.attempt_number})`);
    let completionPercentages = progressData.map(row => row.steps_done); // Use 'steps_done' as completion %

    // Destroy old chart if it exists
    if (window.progressChart instanceof Chart) {
        window.progressChart.destroy();
    }

    // Create Chart
    window.progressChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Steps Completed",
                data: completionPercentages,
                backgroundColor: "blue",
                borderColor: "#000",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, max: 100 } // Adjust max based on step count
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            return `Steps Completed: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function renderHelpAttemptsChart(data) {
    console.log("Rendering help attempts chart:", data);

    // ✅ Ensure data is an array before proceeding
    if (!Array.isArray(data)) {
        console.error("Expected an array but got:", data);
        return;
    }

    // ✅ Get canvas context safely
    const chartCanvas = document.getElementById("helpAttemptsChart");
    if (!chartCanvas) {
        console.error("Help attempts chart canvas not found!");
        return;
    }
    const ctx = chartCanvas.getContext("2d");

    // ✅ Extract module names & hints used
    const moduleNames = data.map(item => `${item.modulename} (Attempt ${item.attempt_number})`);
    const hintsUsed = data.map(item => item.no_hints_used || 0); // Default to 0 if undefined

    // ✅ Destroy existing chart if it exists
    if (window.helpAttemptsChart instanceof Chart) {
        window.helpAttemptsChart.destroy();
    }

    // ✅ Render new chart
    window.helpAttemptsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: moduleNames,
            datasets: [{
                label: "No. of Hints Used",
                data: hintsUsed,
                backgroundColor: "rgba(255, 99, 132, 0.6)", // Red color
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                    }
                },
                x: {
                    title: {
                        display: true,
                    }
                }
            }
        }
    });

    console.log("Help attempts chart rendered successfully!");
}

function renderMasteryScoreChart(data) {
    console.log("Rendering Mastery Score Chart:", data);

    const ctx = document.getElementById("masteryScoreChart")?.getContext("2d");
    if (!ctx) {
        console.error("Mastery score chart canvas not found!");
        return;
    }

    const attemptLabels = data.map(item => `Attempt ${item.attempt_number}`);
    const masteryScores = data.map(item => item.mastery_score);

    if (window.masteryScoreChart instanceof Chart) {
        window.masteryScoreChart.destroy();
    }

    window.masteryScoreChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: attemptLabels,
            datasets: [{
                label: "Mastery Score",
                data: masteryScores,
                backgroundColor: "rgba(54, 162, 235, 0.6)", // Blue color
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: "Mastery Score"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Attempts"
                    }
                }
            }
        }
    });

    console.log("Mastery Score Chart rendered successfully!");
}
