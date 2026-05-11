import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a precise nutrition and food-safety analyst.
Given an image of food (a meal, a packaged product, or its label), you must:
1. Identify the food/dish/product as accurately as possible.
2. Decide if it is "whole_food" (fresh/minimally processed like fruit, veg, meat, eggs, rice) or "processed" (manufactured: noodles, chocolate, chips, soda, ready meals, packaged snacks).
3. Estimate nutrition for a realistic single serving. Always return numeric values (use 0 if truly absent, never null).
4. List notable vitamins & minerals present (with rough amounts and unit).
5. If processed, identify likely artificial / concerning ingredients (preservatives, artificial colors, MSG, trans fats, high-fructose corn syrup, emulsifiers like E471, nitrites, BHA/BHT, aspartame, palm oil, excessive sodium/sugar, etc.). For each, give a severity (low/medium/high) and a 1-sentence plain-English health concern.
6. Compute a healthScore from 0 (very unhealthy) to 100 (excellent).
7. Be honest about uncertainty in "notes".
Never refuse. If image is unclear, make your best estimate and lower the confidence.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, userContext, previousResult, correction } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isTextOnly =
      typeof userContext === "string" && userContext.startsWith("NO IMAGE PROVIDED.");
    const userTextParts: string[] = [
      isTextOnly
        ? "Analyze the food described below (no real image was uploaded — ignore the placeholder image) and call the report_food_analysis tool. Lower confidence accordingly."
        : "Analyze this food image and call the report_food_analysis tool.",
    ];
    if (userContext && typeof userContext === "string" && userContext.trim()) {
      userTextParts.push(
        `IMPORTANT user context about this meal (quantity, preparation, brand, doubts, etc.) — use it to refine the analysis: "${userContext.trim().slice(0, 800)}"`,
      );
    }
    if (previousResult) {
      userTextParts.push(
        `You previously analyzed this image and returned: ${JSON.stringify(previousResult).slice(0, 4000)}`,
      );
    }
    if (correction && typeof correction === "string" && correction.trim()) {
      userTextParts.push(
        `The user says your previous analysis was wrong. Their correction: "${correction.trim().slice(0, 800)}". Re-analyze the image taking this into account and return an updated report.`,
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "report_food_analysis",
          description: "Return structured nutrition + safety analysis for the food in the image.",
          parameters: {
            type: "object",
            properties: {
              foodName: { type: "string" },
              category: { type: "string", enum: ["whole_food", "processed"] },
              confidence: { type: "number", description: "0 to 1" },
              servingDescription: { type: "string" },
              healthScore: { type: "number", description: "0-100" },
              healthVerdict: { type: "string", enum: ["excellent", "good", "moderate", "poor", "avoid"] },
              nutrition: {
                type: "object",
                properties: {
                  calories: { type: "number" },
                  proteinG: { type: "number" },
                  carbsG: { type: "number" },
                  sugarG: { type: "number" },
                  fatG: { type: "number" },
                  saturatedFatG: { type: "number" },
                  fiberG: { type: "number" },
                  sodiumMg: { type: "number" },
                },
                required: ["calories", "proteinG", "carbsG", "sugarG", "fatG", "saturatedFatG", "fiberG", "sodiumMg"],
              },
              vitamins: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    amount: { type: "string" },
                  },
                  required: ["name", "amount"],
                },
              },
              flaggedIngredients: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] },
                    concern: { type: "string" },
                  },
                  required: ["name", "severity", "concern"],
                },
              },
              positives: { type: "array", items: { type: "string" } },
              notes: { type: "string" },
            },
            required: [
              "foodName",
              "category",
              "confidence",
              "servingDescription",
              "healthScore",
              "healthVerdict",
              "nutrition",
              "vitamins",
              "flaggedIngredients",
              "positives",
              "notes",
            ],
          },
        },
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userTextParts.join("\n\n") },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "report_food_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Could not analyze image. Try a clearer photo." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
