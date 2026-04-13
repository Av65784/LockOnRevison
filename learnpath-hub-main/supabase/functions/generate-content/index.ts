import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentText, subjectName } = await req.json();

    if (!documentText || typeof documentText !== "string" || documentText.length < 10) {
      return new Response(JSON.stringify({ error: "Document text too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subjectName || typeof subjectName !== "string" || subjectName.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid subject name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Truncate document text to first 15000 chars for API limits
    const truncatedText = documentText.slice(0, 15000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert curriculum designer. Given study material, create a structured course.
You MUST respond with valid JSON only, no markdown, no explanation.`
          },
          {
            role: "user",
            content: `Create a structured course from this document for the subject "${subjectName}".

Create 2-4 units, each with 2-3 lessons and a quiz with 3-5 multiple choice questions.

Respond with ONLY this JSON structure:
{
  "units": [
    {
      "title": "Unit Title",
      "lessons": [
        {
          "title": "Lesson Title",
          "content": ["paragraph 1", "paragraph 2", "paragraph 3"]
        }
      ],
      "quiz": {
        "questions": [
          {
            "question": "Question text?",
            "options": ["A", "B", "C", "D"],
            "correctIndex": 0
          }
        ]
      }
    }
  ]
}

Document content:
${truncatedText}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_course",
              description: "Create a structured course with units, lessons, and quizzes",
              parameters: {
                type: "object",
                properties: {
                  units: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        lessons: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              content: { type: "array", items: { type: "string" } }
                            },
                            required: ["title", "content"]
                          }
                        },
                        quiz: {
                          type: "object",
                          properties: {
                            questions: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  question: { type: "string" },
                                  options: { type: "array", items: { type: "string" } },
                                  correctIndex: { type: "number" }
                                },
                                required: ["question", "options", "correctIndex"]
                              }
                            }
                          },
                          required: ["questions"]
                        }
                      },
                      required: ["title", "lessons", "quiz"]
                    }
                  }
                },
                required: ["units"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_course" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let courseData;
    if (toolCall) {
      courseData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content as JSON
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(JSON.stringify({ error: "AI failed to generate course structure" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      courseData = JSON.parse(jsonMatch[0]);
    }

    // Icons for subjects
    const icons = ["📚", "🔬", "📐", "🧪", "🌍", "💻", "📖", "🎯"];
    const colors = ["primary", "energy", "streak", "xp"];

    // Create subject
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .insert({
        user_id: user.id,
        name: subjectName,
        icon: icons[Math.floor(Math.random() * icons.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      })
      .select()
      .single();

    if (subjectError) throw subjectError;

    // Create units, lessons, quizzes
    for (let i = 0; i < courseData.units.length; i++) {
      const unitData = courseData.units[i];
      
      const { data: unit, error: unitError } = await supabase
        .from("units")
        .insert({
          subject_id: subject.id,
          user_id: user.id,
          title: unitData.title,
          sort_order: i,
          unlocked: i === 0,
        })
        .select()
        .single();

      if (unitError) throw unitError;

      // Create lessons
      for (let j = 0; j < unitData.lessons.length; j++) {
        const lessonData = unitData.lessons[j];
        await supabase.from("lessons").insert({
          unit_id: unit.id,
          user_id: user.id,
          title: lessonData.title,
          content: lessonData.content,
          sort_order: j,
        });
      }

      // Create quiz
      await supabase.from("quizzes").insert({
        unit_id: unit.id,
        user_id: user.id,
        questions: unitData.quiz.questions,
      });
    }

    return new Response(JSON.stringify({ success: true, subjectId: subject.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
