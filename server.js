const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const moment = require("moment");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "kousik@1234", // Change to your MySQL password
    database: "olabs",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err);
    } else {
        console.log("Connected to MySQL database");
    }
});

// ✅ Register User & Get ID
app.post("/register", async (req, res) => {
    const { username, email, mobile, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into MySQL and get user ID
    db.query(
        "INSERT INTO users (username, email, mobile, password) VALUES (?, ?, ?, ?)",
        [username, email, mobile, hashedPassword],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Email already exists!" });
            }

            // Get the inserted user ID
            const userId = result.insertId;
            res.json({ success: true, userId });
        }
    );
});

// ✅ Login User & Get ID
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT id, password FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: "User not found!" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password!" });
        }

        res.json({ success: true, userId: user.id });
    });
});

app.post("/start_activity", (req, res) => {
    const { userId, moduleId, startTime } = req.body;

    if (!userId || !moduleId || !startTime) {
        return res.status(400).json({ success: false, message: "Missing data" });
    }

    // ✅ Convert `startTime` to MySQL format `YYYY-MM-DD HH:mm:ss`
    const formattedStartTime = moment(startTime).format("YYYY-MM-DD HH:mm:ss");

    console.log("Formatted Start Time:", formattedStartTime);

    const query = "INSERT INTO activity (user_id, module_id, start_time) VALUES (?, ?, ?)";
    db.query(query, [userId, moduleId, formattedStartTime], (err, result) => {
        if (err) {
            console.error("Error inserting start activity:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Activity started", data: result });
    });
});

// ✅ End Activity (Update using User ID)
// app.post("/end_activity", (req, res) => {
//     const { userId, moduleId, endTime } = req.body;

//     if (!userId || !moduleId || !endTime) {
//         return res.status(400).json({ success: false, message: "Missing data" });
//     }

//     // ✅ Convert `endTime` to MySQL format
//     const formattedEndTime = moment(endTime).format("YYYY-MM-DD HH:mm:ss");

//     // Calculate time spent (in hours)
//     const query = `
//         UPDATE activity 
//         SET end_time = ?, hours_spent = TIMESTAMPDIFF(MINUTE, start_time, ?) 
//         WHERE user_id = ? AND module_id = ? AND end_time IS NULL
//     `;

//     db.query(query, [formattedEndTime, formattedEndTime, userId, moduleId], (err, result) => {
//         if (err) {
//             console.error("Error updating end activity:", err);
//             return res.status(500).json({ success: false, message: err.message });
//         }
//         res.json({ success: true, message: "Activity ended", data: result });
//     });
// });

app.post("/end_activity", (req, res) => {
    let { userId, moduleId, endTime } = req.body;

    if (!userId || !moduleId || !endTime) {
        return res.json({ success: false, message: "Missing required parameters" });
    }

    const query = `
        UPDATE activity 
        SET end_time = ?, hours_spent = TIMESTAMPDIFF(MINUTE, start_time, ?) 
        WHERE user_id = ? AND module_id = ? AND end_time IS NULL
    `;

    db.query(query, [endTime, endTime, userId, moduleId], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.json({ success: false, message: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.json({ success: false, message: "No matching activity found" });
        }
        res.json({ success: true, message: "Activity ended successfully" });
    });
});


// Get User Study Data
app.get("/getActivity/:userId", (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT COUNT(DISTINCT module_id) AS topics_studied, 
               IFNULL(SUM(hours_spent), 0) AS total_time 
        FROM activity 
        WHERE user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching user study data:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results[0] || { topics_studied: 0, total_time: 0 });
    });
});

// Get Time Spent per Module
app.get("/get-module-hours/:userId", (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT a.modulename, IFNULL(SUM(act.hours_spent), 0) AS total_hours
        FROM activity act
        INNER JOIN admin a ON act.module_id = a.moduleid
        WHERE act.user_id = ? 
        GROUP BY a.modulename`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error executing query:", err);
            return res.status(500).json({ success: false, message: "Database query error" });
        }
        res.json(results);
    });
});

app.post("/storeQuizScore/:userId", (req, res) => {
    const userId = req.params.userId;  // Extract userId from URL
    const { moduleId, attempt, score } = req.body; // Get data from request body

    if (!userId || !moduleId || !attempt || score === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const query = "INSERT INTO quiz_scores (module_id, user_id,  attempt, score) VALUES (?, ?, ?, ?)";
    db.query(query, [moduleId, userId,  attempt, score], (err, result) => {
        if (err) {
            console.error("Error inserting score:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Score recorded successfully", insertedId: result.insertId });
    });
});

app.get("/getModuleScores/:userId", (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT Count(attempt) As c, a.modulename, AVG(q.score) AS avg_score
        FROM quiz_scores q
        INNER JOIN admin a ON q.module_id = a.moduleid
        WHERE q.user_id = ?
        GROUP BY a.modulename
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query failed" });
        }
        
        if (!results || results.length === 0) {
            return res.status(404).json({ error: "No data found for this user." });
        }

        res.json(results);
    });
});

app.post('/chatbot', (req, res) => {
    console.log("Received Data:", req.body); // Logs data to the console
    res.json({ message: "Data received successfully" });
});

// app.post("/send-sql/:userId", (req, res) => {
//     const userId = req.params.userId;

//     let sqlQuery = `
//         SELECT a.modulename, AVG(q.score) AS avg_score
//         FROM quiz_scores q
//         INNER JOIN admin a ON q.module_id = a.moduleid
//         WHERE q.user_id = ?
//         GROUP BY a.modulename
//     `;

//     db.query(sqlQuery, [userId], (err, results) => {
//         if (err) {
//             console.error("❌ Error executing query:", err);
//             return res.status(500).json({ error: "Database query failed", details: err });
//         }

//         console.log("✅ Query results:", results);

//         fetch("http://localhost:5000/futurework", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 completedLabs: results,
//                 constantValue: 6
//             })
//         })
//         .then(response => response.json())
//         .then(data => {
//             console.log("📡 Data sent successfully:", data);
//             res.json({ message: "Data sent and processed", processedData: data });
//         })
//         .catch(error => {
//             console.error("🚨 Error sending data to /futurework:", error);
//             res.status(500).json({ error: "Failed to send data to futurework", details: error.message });
//         });
//     });
// });
// ✅ Start Server


app.post("/teacherregister", async (req, res) => {
    const { username, email, mobile, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into MySQL and get user ID
    db.query(
        "INSERT INTO teachers (username, email, mobile, password) VALUES (?, ?, ?, ?)",
        [username, email, mobile, hashedPassword],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Email already exists!" });
            }

            // Get the inserted user ID
            const teacherId = result.insertId;
            // console.log(teacherId);
            res.json({ success: true, teacherId });
        }
    );
});

// ✅ Login User & Get ID
app.post("/teacherlogin", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT id, password FROM teachers WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: "User not found!" });
        }

        const teacher = results[0];
        const isMatch = await bcrypt.compare(password, teacher.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password!" });
        }

        res.json({ success: true, teacherId: teacher.id });
    });
});

app.post("/assign", async (req, res) => {
    try {
        const { teacherId, task, studentIds, duration } = req.body;
        const currentDate = new Date();
        const deadline = new Date();
        deadline.setDate(currentDate.getDate() + duration); // Add duration days

        // Convert date to YYYY-MM-DD format
        const formattedDeadline = deadline.toISOString().split("T")[0];

        // Insert each student-task assignment in a loop
        for (let studentId of studentIds) {
            db.query(
                "INSERT INTO tasks (teacherId, task, studentId, deadline) VALUES (?, ?, ?, ?)", 
                [teacherId, task, studentId, formattedDeadline], 
                (err, result) => {
                    if (err) console.error("Error inserting:", err);
                }
            );
        }

        res.json({ message: "Task assigned successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/getLabAssignments/:userId", (req, res) => {
    const userId = req.params.userId;
    const query = "SELECT task FROM tasks WHERE studentId = ?";
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results); // Ensure the response is JSON
    });
});

app.get("/getLabCompletion/:userId", (req, res) => {
    const userId = req.params.userId;

    // Query to get completed lab count
    const completedQuery = `
        SELECT COUNT(DISTINCT a.modulename) AS common_modules 
        FROM admin a 
        INNER JOIN quiz_scores q ON a.moduleid = q.module_id 
        INNER JOIN tasks t ON a.modulename = t.task 
        WHERE q.user_id = ? AND t.studentId = ?`;

    // Query to get total assigned labs count
    const totalQuery = `SELECT COUNT(DISTINCT task) AS totalLabs FROM tasks WHERE studentId = ?`;

    db.query(completedQuery, [userId, userId], (err1, completedResult) => {
        if (err1) {
            console.error("Error fetching completed labs:", err1);
            return res.status(500).json({ error: "Database error in fetching completed labs" });
        }

        db.query(totalQuery, [userId], (err2, totalResult) => {
            if (err2) {
                console.error("Error fetching total labs:", err2);
                return res.status(500).json({ error: "Database error in fetching total labs" });
            }

            // Extracting correct field names
            const completedLabs = completedResult[0]?.common_modules || 0;
            const totalLabs = totalResult[0]?.totalLabs || 1; // Avoid division by zero
            const completionPercentage = (completedLabs / totalLabs) * 100;

            res.json({ completedLabs, totalLabs, completionPercentage });
        });
    });
});

app.get("/deadline/:userId", (req, res) => {
    const userId = req.params.userId;
    const query = "SELECT task, deadline FROM tasks WHERE studentId = ?";

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(result);
    });
});

// app.post("/start_activity_simulation", (req, res) => {
//     const { userId, moduleId, startTime1 } = req.body;

//     if (!userId || !moduleId || !startTime1) {
//         return res.status(400).json({ success: false, message: "Missing data" });
//     }

//     // ✅ Convert `startTime` to MySQL format `YYYY-MM-DD HH:mm:ss`
//     const formattedStartTime = moment(startTime1).format("YYYY-MM-DD HH:mm:ss");

//     console.log("Formatted Start Time:", formattedStartTime);

//     const query = "INSERT INTO simulation; (user_id, module_id, start_time) VALUES (?, ?, ?)";
//     db.query(query, [userId, moduleId, formattedStartTime], (err, result) => {
//         if (err) {
//             console.error("Error inserting start activity:", err);
//             return res.status(500).json({ success: false, message: err.message });
//         }
//         res.json({ success: true, message: "Activity started", data: result });
//     });
// });

app.post("/end_activity_simulation", (req, res) => {
    const { userId, moduleId, startTime1, endTime1, completionPercentage,helpclicked } = req.body;

    if (!userId || !moduleId || !startTime1 || !endTime1 ||     completionPercentage === undefined || 
        helpclicked === undefined) {
        return res.json({ success: false, message: "Missing required fields" });
    }

    // ✅ Insert new record directly
    const insertQuery = `
        INSERT INTO simulation (user_id, module_id, start_time, end_time, hours_spent,steps_done,no_hints_used) 
        VALUES (?, ?, ?, ?, TIMESTAMPDIFF(MINUTE, ?, ?), ?, ?)
    `;

    db.query(insertQuery, [userId, moduleId, startTime1, endTime1, startTime1, endTime1, completionPercentage,helpclicked], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.json({ success: false, message: "Insert failed" });
        }
        res.json({ success: true, message: "Activity recorded successfully!", insertedPercentage: completionPercentage });
    });
});


app.get("/get-module-hours-simulation/:userId", (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT a.modulename, IFNULL(SUM(sim.hours_spent), 0) AS total_hours
        FROM simulation sim
        INNER JOIN admin a ON sim.module_id = a.moduleid
        WHERE sim.user_id = ? 
        GROUP BY a.modulename`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error executing query:", err);
            return res.status(500).json({ success: false, message: "Database query error" });
        }
        res.json(results);
    });
});

app.get("/getModuleScores-simulation/:userId", (req, res) => {
    const userId = req.params.userId;

    const query = `
       SELECT COUNT(q.no_of_attempts) AS c, a.modulename
FROM simulation q
INNER JOIN admin a ON q.module_id = a.moduleid
WHERE q.user_id = ?
GROUP BY a.modulename;

    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query failed" });
        }
        
        if (!results || results.length === 0) {
            return res.status(404).json({ error: "No data found for this user." });
        }

        res.json(results);
    });
});

app.get("/get_progress_data/:userId", (req, res) => {
    const { userId } = req.params; // Get userId from URL params

    if (!userId) {
        return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const query = `
        WITH RankedAttempts AS (
            SELECT 
                s.user_id, 
                a.modulename, 
                s.steps_done,
                ROW_NUMBER() OVER (PARTITION BY s.user_id, s.module_id ORDER BY s.id DESC) AS attempt_number
            FROM simulation s
            JOIN admin a ON s.module_id = a.moduleid
            WHERE s.user_id = ? AND s.module_id = 'p1'
        )
        SELECT user_id, modulename, steps_done, attempt_number 
        FROM RankedAttempts
        WHERE attempt_number <= 3
        ORDER BY attempt_number;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching progress data:", err);
            return res.status(500).json({ success: false, message: "Database fetch failed" });
        }
        res.json({ success: true, data: results });
    });
});

app.get("/get_help_attempts/:userId", (req, res) => {
    const { userId } = req.params; // Get userId from URL params

    if (!userId) {
        return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const query = `
        WITH RankedAttempts AS (
            SELECT 
                s.user_id, 
                a.modulename, 
                s.no_hints_used, 
                ROW_NUMBER() OVER (PARTITION BY s.user_id, s.module_id ORDER BY s.id DESC) AS attempt_number
            FROM simulation s
            JOIN admin a ON s.module_id = a.moduleid
            WHERE s.user_id = ? AND s.module_id = 'p1'
        )
        SELECT user_id, modulename, no_hints_used, attempt_number 
        FROM RankedAttempts
        WHERE attempt_number <= 3
        ORDER BY attempt_number;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching help usage data:", err);
            return res.status(500).json({ success: false, message: "Database fetch failed" });
        }
        res.json({ success: true, data: results });
    });
});

app.get("/get_recent_mastery_scores/:userId", (req, res) => {
    const { userId } = req.params;

    const query = `
        WITH RankedAttempts AS (
            SELECT 
                s.user_id, 
                s.module_id,
                TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) AS time_taken,
                s.no_hints_used,
                100 - (TIMESTAMPDIFF(MINUTE, s.start_time, s.end_time) * 0.5) 
                    - (s.no_hints_used * 3) AS mastery_score,
                ROW_NUMBER() OVER (PARTITION BY s.user_id, s.module_id ORDER BY s.id DESC) AS attempt_number
            FROM simulation s
            WHERE s.user_id = ? AND s.module_id = 'p1'
        )
        SELECT user_id, module_id, time_taken, no_hints_used, mastery_score, attempt_number
        FROM RankedAttempts
        WHERE attempt_number <= 3
        ORDER BY attempt_number;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching mastery scores:", err);
            return res.status(500).json({ success: false, message: "Database fetch failed" });
        }
        res.json({ success: true, data: results });
    });
});



app.listen(5000, () => {
    console.log("Server running on port 5000");
});
