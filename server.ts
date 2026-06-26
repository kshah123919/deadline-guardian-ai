import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
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
      // Prioritize highly available models with higher free tier quotas to avoid gemini-3.5-flash quota exhaustion (limit 20/day)
      const candidateModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"];

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

  // Mission Control Analysis API endpoint
  app.post("/api/mission-control", async (req, res) => {
    try {
      const { tasks, userProfile } = req.body;

      console.log("=========================================");
      console.log(`[DEVELOPMENT LOG] Incoming Mission Control auto-analysis at ${new Date().toISOString()}`);
      console.log(`[DEVELOPMENT LOG] Total retrieved tasks for auto-analysis: ${tasks ? tasks.length : 0}`);

      if (!tasks || tasks.length === 0) {
        console.log("[DEVELOPMENT LOG] No tasks found for Mission Control. Returning empty state.");
        return res.json({
          noTasks: true,
          message: "You currently don't have any tasks. Add a task first so I can generate a personalized productivity plan."
        });
      }

      console.log("[DEVELOPMENT LOG] Compiling context for Mission Control auto-analysis.");
      console.log("=========================================");

      const pendingTasks = tasks.filter((t: any) => t.status !== "completed");
      const completedTasks = tasks.filter((t: any) => t.status === "completed");

      const formattedPending = pendingTasks.map((t: any, i: number) => {
        return `Task #${i + 1}
  - ID: ${t.id}
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
  - ID: ${t.id}
  - Title: ${t.title}
  - Priority: ${t.priority}
  - Deadline: ${t.deadline} (ISO)
  - Category: ${t.category}
  - Estimated Duration: ${t.estimatedDuration || "Not specified"}`;
      }).join("\n\n");

      const systemInstruction = `You are "Guardian Mission Control", a highly advanced, context-aware productivity analysis engine.
You analyze the user's specific tasks, deadlines, priorities, categories, progress, and estimated durations to generate an interactive daily plan, predict risks, analyze workload, and provide immediate rescue steps.

CRITICAL INSTRUCTIONS:
- You must ONLY refer to the actual tasks stored in the application state, provided in the context below. Do NOT make up or hallucinate tasks that do not exist.
- Ensure all task IDs in your response match the exact IDs provided in the pending task context.
- Keep the dailyBriefing text highly professional, proactive, and formatted with beautiful scannable markdown. Use bold tags (**text**) to highlight key numbers or task names. Do not use generic system greetings.
- Be precise when calculating success probability and workload levels based on due times and current time.`;

      const contextPayload = `USER PROFILE:
- Name: ${userProfile?.name || "User"}
- Role: ${userProfile?.role || "Professional"}
- Weekly Goal: ${userProfile?.weeklyGoal || 10} completed tasks
- Current Weekly Completed: ${userProfile?.completedCount || 0} tasks

PENDING TASKS IN WORKSPACE:
${formattedPending || "None currently pending."}

COMPLETED TASKS IN WORKSPACE:
${formattedCompleted || "None completed yet."}

CURRENT DATE/TIME: ${new Date().toISOString()}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          dailyBriefing: {
            type: Type.STRING,
            description: "A compact, proactive daily briefing in beautiful markdown summarizing task load, warning of risk levels, and recommending immediate action."
          },
          deadlineRisks: {
            type: Type.ARRAY,
            description: "Risk assessment for each pending task.",
            items: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                taskTitle: { type: Type.STRING },
                riskLevel: { type: Type.STRING, description: "Must be 'low', 'moderate', or 'critical'" },
                successProbability: { type: Type.INTEGER, description: "0 to 100 success rate percentage" },
                reason: { type: Type.STRING },
                recommendedAction: { type: Type.STRING }
              },
              required: ["taskId", "taskTitle", "riskLevel", "successProbability", "reason", "recommendedAction"]
            }
          },
          workloadMeter: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING, description: "Must be 'Light', 'Balanced', 'Heavy', or 'Overloaded'" },
              explanation: { type: Type.STRING }
            },
            required: ["level", "explanation"]
          },
          executionPlan: {
            type: Type.ARRAY,
            description: "Optimal order of execution for pending tasks.",
            items: {
              type: Type.OBJECT,
              properties: {
                taskId: { type: Type.STRING },
                taskTitle: { type: Type.STRING },
                recommendedOrder: { type: Type.INTEGER },
                reason: { type: Type.STRING }
              },
              required: ["taskId", "taskTitle", "recommendedOrder", "reason"]
            }
          },
          smartTimeline: {
            type: Type.ARRAY,
            description: "A visual schedule blocks covering the day.",
            items: {
              type: Type.OBJECT,
              properties: {
                timeSlot: { type: Type.STRING, description: "e.g. '09:00 - 10:30' or '12:00 - 13:00'" },
                activity: { type: Type.STRING },
                durationMinutes: { type: Type.INTEGER },
                isTask: { type: Type.BOOLEAN },
                taskId: { type: Type.STRING }
              },
              required: ["timeSlot", "activity", "durationMinutes", "isTask"]
            }
          },
          emergencyMode: {
            type: Type.OBJECT,
            properties: {
              isTriggered: { type: Type.BOOLEAN, description: "Set to true if any pending task is due in less than 24 hours" },
              criticalTaskId: { type: Type.STRING },
              criticalTaskTitle: { type: Type.STRING },
              remainingWorkExplanation: { type: Type.STRING },
              estimatedCompletionProbability: { type: Type.INTEGER },
              immediateRecommendation: { type: Type.STRING }
            },
            required: ["isTriggered"]
          }
        },
        required: ["dailyBriefing", "deadlineRisks", "workloadMeter", "executionPlan", "smartTimeline", "emergencyMode"]
      };

      let response;
      let modelError: any = null;
      // Prioritize highly available models with higher free tier quotas to avoid gemini-3.5-flash quota exhaustion (limit 20/day)
      const candidateModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"];

      for (const modelName of candidateModels) {
        try {
          console.log(`[DEVELOPMENT LOG] Attempting Mission Control analysis with model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: contextPayload,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              temperature: 0.2,
            }
          });
          if (response && response.text) {
            console.log(`[DEVELOPMENT LOG] Mission Control generation succeeded using model: ${modelName}`);
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

      const resultData = JSON.parse(response.text.trim());
      res.json(resultData);

    } catch (error: any) {
      console.error("[Mission Control Server Error]:", error);
      res.status(500).json({
        error: "Failed to generate Mission Control plan.",
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
