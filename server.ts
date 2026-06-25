import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up JSON body parsing
  app.use(express.json());

  // Initialize the Gemini API client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Chat/Analysis API endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, tasks, userProfile } = req.body;

      console.log("=========================================");
      console.log(`[DEVELOPMENT LOG] Incoming Gemini request at ${new Date().toISOString()}`);
      console.log(`[DEVELOPMENT LOG] User prompt: "${prompt}"`);
      console.log(`[DEVELOPMENT LOG] Total retrieved tasks: ${tasks ? tasks.length : 0}`);

      // Requirement 5: If no tasks exist, explicitly respond with a specific message
      if (!tasks || tasks.length === 0) {
        console.log("[DEVELOPMENT LOG] No tasks found. Sending empty state response.");
        return res.json({
          text: "You currently don't have any tasks. Add a task first so I can generate a personalized productivity plan."
        });
      }

      // Log detailed task metadata for development verification
      console.log("[DEVELOPMENT LOG] Retrieving active and completed task metrics:");
      tasks.forEach((t: any, index: number) => {
        console.log(`  Task #${index + 1}: "${t.title}"`);
        console.log(`    - Status: ${t.status}`);
        console.log(`    - Progress: ${t.progress}%`);
        console.log(`    - Priority: ${t.priority}`);
        console.log(`    - Category: ${t.category}`);
        console.log(`    - Deadline: ${t.deadline}`);
        console.log(`    - Estimated Duration: ${t.estimatedDuration || "None specified"}`);
      });
      console.log("=========================================");

      // Requirement 1 & 2: Construct a structured context object and send it together with the user's prompt to Gemini.
      const pendingTasks = tasks.filter((t: any) => t.status !== "completed");
      const completedTasks = tasks.filter((t: any) => t.status === "completed");

      // Format current tasks for clear model interpretation
      const formattedPending = pendingTasks.map((t: any, i: number) => {
        return `Task #${i + 1}
  - Title: ${t.title}
  - Description: ${t.description || "No description provided"}
  - Priority: ${t.priority}
  - Deadline: ${t.deadline} (ISO)
  - Category: ${t.category}
  - Progress: ${t.progress}%
  - Estimated Duration: ${t.estimatedDuration || "Not specified"}`;
      }).join("\n\n");

      const formattedCompleted = completedTasks.map((t: any, i: number) => {
        return `Task #${i + 1}
  - Title: ${t.title}
  - Priority: ${t.priority}
  - Deadline: ${t.deadline} (ISO)
  - Category: ${t.category}
  - Estimated Duration: ${t.estimatedDuration || "Not specified"}`;
      }).join("\n\n");

      const systemInstruction = `You are "Guardian Copilot", a context-aware productivity guardian.
You analyze the user's specific tasks, deadlines, priorities, categories, progress, and estimated durations to offer strategic scheduling advice, plan sprints, and identify risks.

CRITICAL INSTRUCTIONS:
- You must ONLY analyze and refer to the actual tasks stored in the application's state, provided in the context below. Do NOT make up or hallucinate tasks that do not exist.
- Answer user queries directly, with high relevance to their active task load.
- Avoid generic, boilerplate system greetings or ungrounded productivity platitudes.
- Format your response with beautiful and scannable markdown. Use bold tags (**text**) to call out key statistics, task titles, or crucial timelines.
- Keep responses compact, action-oriented, and structured.

If the user asks:
- "Analyze my day"
- "Which tasks are remaining?"
- "What should I do first?"
- "Which deadline is most at risk?"
- "Can I finish everything today?"
You must formulate precise answers based purely on the real task lists below. Calculate active risk margins, compare due times against the current local time, and suggest concrete order of operations.`;

      const contextPayload = `USER PROFILE:
- Name: ${userProfile?.name || "User"}
- Role: ${userProfile?.role || "Professional"}
- Weekly Goal: ${userProfile?.weeklyGoal || 10} completed tasks
- Current Weekly Completed: ${userProfile?.completedCount || 0} tasks

PENDING TASKS IN WORKSPACE:
${formattedPending || "None currently pending."}

COMPLETED TASKS IN WORKSPACE:
${formattedCompleted || "None completed yet."}

CURRENT LOCAL DATE/TIME: ${new Date().toISOString()}

USER PROMPT TO ANSWER: "${prompt}"`;

      // Requirement 3: Call Gemini API (with robust model fallback sequence)
      let response;
      let modelError: any = null;
      const candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

      for (const modelName of candidateModels) {
        try {
          console.log(`[DEVELOPMENT LOG] Attempting text generation with model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: contextPayload,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });
          if (response && response.text) {
            console.log(`[DEVELOPMENT LOG] Generation succeeded using model: ${modelName}`);
            modelError = null;
            break;
          }
        } catch (err: any) {
          console.warn(`[DEVELOPMENT LOG] Model ${modelName} failed/unavailable:`, err.message || err);
          modelError = err;
        }
      }

      if (modelError || !response) {
        throw modelError || new Error("All candidate models failed to produce a valid response.");
      }

      const replyText = response.text || "I was unable to analyze your workspace metrics. Please try again.";
      
      // Let's also check if Gemini wants to propose a new task that can be created.
      // To provide a continuous premium experience without breaking any requirements, we return the parsed reply.
      res.json({ text: replyText });

    } catch (error: any) {
      console.error("[Gemini API Server Error]:", error);
      res.status(500).json({ 
        error: "Failed to connect to the Gemini intelligence engine.",
        details: error.message 
      });
    }
  });

  // Serve Vite in development / static assets in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[SERVER] Vite development middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[SERVER] Production static file serving enabled.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
