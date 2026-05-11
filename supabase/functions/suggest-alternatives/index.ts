import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a practical nutrition coach who helps people get more health for their money.
Given a food the user just analyzed, the price they paid, and their currency/region, suggest 3-5 healthier foods they could buy for roughly the same money.
Rules:
- Be realistic about local prices in the given region (if no region given, assume generic global supermarket prices in the given currency).
- Prefer whole foods (fruits, vegetables, eggs, legumes, yogurt, oats, nuts, fish, lean meats) over processed snacks.
- Each suggestion must clearly beat the original on health (lower sugar/sodium/artificial ingredients OR higher protein/fiber/vitamins).
- Give a short, punchy reason ("3x the protein, no added sugar").
- "approxQuantity" should be concrete and buyable ("2 dozen eggs", "1.5 kg bananas", "500g Greek yogurt").
- Never refuse. If price is unclear, make a reasonable assumption and lower confidence in your notes.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { originalFood, originalHealthScore, price, currency, region } = await req.json();
    if (!price || !currency) {
      return new Response(JSON.stringify({ error: "price and currency are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userText = [
      `Original food: ${originalFood || "unknown"} (health score ${originalHealthScore ?? "?"} / 100).`,
      `Budget: ${price} ${currency}${region ? ` in ${region}` : ""}.`,
      `Suggest healthier foods I could buy for the same money. Call the suggest_alternatives tool.`,
    ].join("\n");

    const tools = [
      {
        type: "function",
        function: {
          name: "suggest_alternatives",
          description: "Return 3-5 healthier food alternatives buyable for the same budget.",
          parameters: {
            type: "object",
            properties: {
              alternatives: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    approxQuantity: { type: "string", description: "What you can buy for the budget" },
                    healthScore: { type: "number", description: "0-100" },
                    reason: { type: "string", description: "Why it's a healthier swap, 1 sentence" },
                    keyBenefit: { type: "string", description: "Short tag like 'High protein' or 'No added sugar'" },
                  },
                  required: ["name", "approxQuantity", "healthScore", "reason", "keyBenefit"],
                },
              },
              notes: { type: "string" },
            },
            required: ["alternatives", "notes"],
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
          { role: "user", content: userText },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "suggest_alternatives" } },
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
      return new Response(JSON.stringify({ error: "AI suggestion failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Could not generate suggestions." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-alternatives error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
