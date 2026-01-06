import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language = 'en', context = 'general' } = await req.json();

    const systemPrompts: Record<string, string> = {
      learn: `You are an intelligent learning assistant that helps users with educational content, course recommendations, and research across multiple subjects including technology, business, agriculture, healthcare, and more. Respond in the user's preferred language. Provide detailed, helpful, and accurate information. You can help with:
- Finding courses and learning resources
- Explaining complex concepts
- Research assistance
- Study tips and learning strategies
- Career guidance related to education`,
      healthcare: `You are a healthcare information assistant that provides general health information and guidance. IMPORTANT: Always remind users to consult healthcare professionals for medical advice. Respond in the user's preferred language. You can help with:
- General health information
- Preventive care tips
- Understanding medical terms
- Finding healthcare services
- Wellness and nutrition advice
Note: You are not a replacement for professional medical advice.`,
      needs: `You are a helpful assistant for a platform that covers all human needs - from transportation and housing to jobs, services, and products. Respond in the user's preferred language. You can help users:
- Find services and products
- Compare options
- Get recommendations
- Understand processes
- Navigate the platform`,
      general: `You are a helpful AI assistant for a multi-service platform. Respond in the user's preferred language. Be helpful, accurate, and concise.`
    };

    const languageInstructions: Record<string, string> = {
      en: 'Respond in English.',
      es: 'Responde en español.',
      fr: 'Répondez en français.',
      de: 'Antworten Sie auf Deutsch.',
      zh: '请用中文回复。',
      ar: 'أجب باللغة العربية.',
      hi: 'हिंदी में जवाब दें।',
      pt: 'Responda em português.',
      ru: 'Отвечайте на русском языке.',
      ja: '日本語で回答してください。',
      ko: '한국어로 답변해 주세요.',
      sw: 'Jibu kwa Kiswahili.'
    };

    const langInstruction = languageInstructions[language] || languageInstructions['en'];
    const systemPrompt = `${systemPrompts[context] || systemPrompts['general']}\n\n${langInstruction}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'AI request failed');
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
