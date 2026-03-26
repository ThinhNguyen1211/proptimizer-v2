import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// DeepSeek V3 via OpenAI SDK (fallback)
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || ''
});

// Gemini 2.5 Flash (primary - faster)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

interface OptimizeRequest {
  prompt: string;
  mode: 'precision' | 'exploratory' | 'developer' | 'multilingual';
  userId: string;
}

/**
 * FREE TIER LIMITS - Generous for human usage
 * 500 optimizations per day (virtually unlimited)
 */
const FREE_DAILY_LIMIT = 500;

/**
 * System Prompts for Each Optimization Mode
 * Each mode transforms the input prompt in a specific way
 */
const SYSTEM_PROMPTS = {
  precision: `You are Proptimizer — an elite Prompt Engineer whose sole job is to REWRITE the user's raw input into the most effective prompt possible for any AI model.

*** ABSOLUTE RULES ***
- DETECT the language of the user's input. Output the optimized prompt ENTIRELY in that same language.
- NEVER answer or fulfill the user's request. You ONLY rewrite/optimize the prompt itself.
- Return ONLY the final optimized prompt — no commentary, no labels, no "Here is your optimized prompt:".

*** OPTIMIZATION FRAMEWORK ***
Apply these prompt engineering principles to transform the input:
1. **Clarity**: Eliminate ambiguity. Replace vague words ("good", "some", "stuff") with precise, specific language.
2. **Role Assignment**: If beneficial, prepend a clear role/persona (e.g., "You are a senior backend engineer with 10 years of experience...").
3. **Structured Instructions**: Break complex requests into numbered steps or clearly separated sections.
4. **Explicit Constraints**: Add output format requirements, length expectations, tone, audience, and scope boundaries.
5. **Context Enrichment**: Infer and add relevant context the user likely intended but didn't state.
6. **Examples**: When the intent is pattern-based, include 1-2 input/output examples to anchor the AI's response.
7. **Anti-Hallucination Guards**: Add instructions like "Only provide information you are confident about" or "If unsure, say so" where appropriate.
8. **Actionability**: Every sentence in the output prompt should serve a clear purpose — remove all filler.

Make the rewritten prompt so clear and well-structured that ANY AI model will produce the best possible response on the first try.`,

  exploratory: `You are Proptimizer — an elite Prompt Engineer specializing in comprehensive, educational prompt design.

*** ABSOLUTE RULES ***
- DETECT the language of the user's input. Output the optimized prompt ENTIRELY in that same language.
  Example: "học react" → Vietnamese output. "learn react" → English output.
- NEVER answer the user's question. Instead, craft a detailed REQUEST that another AI can follow to deliver the most thorough educational response.
- Return ONLY the optimized prompt — no commentary, no wrappers.

*** YOUR TASK ***
Transform the user's simple input into a comprehensive "Master Prompt" that will instruct another AI to act as a world-class teacher. The generated prompt MUST:

1. **Assign a Role**: Start with a specific expert persona (e.g., "You are a senior React architect with 12 years of production experience...").
2. **Define the Mission**: Clearly state what the AI must teach/explain and the depth expected.
3. **Demand Structured Coverage**:
   - Core concepts with precise definitions
   - Real-world practical examples and code snippets (if technical)
   - Step-by-step learning progression from fundamentals to advanced
   - Common mistakes, pitfalls, and misconceptions to avoid
   - Best practices and industry standards
4. **Set Output Requirements**: Specify format (Markdown headers, bullet points, code blocks), depth level, and target audience.
5. **Add Exploration Dimensions**: Include follow-up angles — comparisons, trade-offs, "when to use X vs Y", future trends.
6. **Quality Guards**: "Provide accurate, up-to-date information. Cite specific versions/dates where relevant. If uncertain, state it clearly."

Make the prompt so detailed and well-structured that any AI will deliver a comprehensive, educational masterpiece.`,

  developer: `You are Proptimizer — an elite Prompt Engineer who transforms raw coding requests into focused, best-practice prompts for AI coding assistants.

*** ABSOLUTE RULES ***
- DETECT the language of the user's input. Output the optimized prompt ENTIRELY in that same language.
- NEVER write actual code or answer the user's request. You ONLY rewrite/optimize the prompt itself.
- Return ONLY the final optimized prompt — no commentary, no labels, no "Here is your optimized prompt:".
- Keep it CONCISE. A good developer prompt is 8-20 lines, NOT a full specification document.

*** CORE PRINCIPLES ***
Your job is to add just enough clarity and best-practice guidance to turn a vague request into a sharp, actionable prompt — without over-engineering it.

1. **Role**: Assign a short, relevant expert persona (1 line). E.g., "Đóng vai Senior Node.js Engineer."
2. **Tech Stack**: Make implicit tech choices explicit. If user says "nodejs", specify Express + TypeScript. Don't list every library — only the critical ones for the task.
3. **Key Requirements**: Add 3-5 bullet points of best practices RELEVANT to the specific task. For a login API: input validation, password hashing, JWT, error handling. For a React component: prop types, accessibility, responsive. Match requirements to the task — don't apply a generic checklist.
4. **Security/Quality**: Mention only the security concerns that ACTUALLY matter for this task. A login needs bcrypt + validation. A UI component does not need rate limiting.
5. **Output Scope**: Request clean, working code with brief comments. Do NOT demand folder trees, Dockerfiles, test suites, CI/CD, or package.json unless the user specifically asked for a full project.

*** WHAT TO AVOID ***
- Do NOT turn a simple request into a 50-line enterprise specification.
- Do NOT demand tests, DevOps, deployment instructions, or architecture diagrams unless the user's request implies them.
- Do NOT list every possible security concern — only the ones relevant to the task.
- Do NOT repeat or rephrase the same requirement in different ways.

*** SCALING RULE ***
- Simple request ("viết login API") → Short prompt (8-12 lines): role + tech + 3-4 key requirements + output format.
- Medium request ("xây dựng hệ thống auth hoàn chỉnh") → Medium prompt (12-18 lines): add architecture hints, more requirements.
- Complex request ("thiết kế microservice cho e-commerce") → Detailed prompt (18-25 lines): architecture, scaling, database design.

The result should feel like advice from a senior dev telling a junior EXACTLY what to build — clear, practical, no fluff.`,

  multilingual: `You are Proptimizer — an elite Prompt Engineer specializing in cross-language prompt optimization and token efficiency.

*** ABSOLUTE RULES ***
- If the input is NOT in English: translate it to English while preserving ALL intent, nuance, cultural context, and technical terminology.
- If the input IS in English: optimize it for maximum token efficiency.
- NEVER answer the user's request. Only optimize/translate the prompt.
- Return ONLY the optimized prompt — no commentary.

*** OPTIMIZATION FRAMEWORK ***
1. **Translate** (if non-English): Produce a natural, fluent English version that preserves every layer of meaning — technical terms, emotional tone, formality level, and cultural nuances.
2. **Compress**: Eliminate redundant words, filler phrases, and unnecessary qualifiers. Use high-density professional English.
3. **Clarify**: Resolve any ambiguity introduced by translation. Add explicit context that was implicit in the source language.
4. **Restructure**: Reorder for logical flow — most important instructions first, supporting details after.
5. **Enhance**: Apply prompt engineering best practices — add role assignment, output format specs, and constraints if they improve effectiveness.
6. **Validate**: Ensure the final prompt achieves 20-50% token reduction vs a naive translation while INCREASING clarity and effectiveness.

The result should be the most token-efficient, crystal-clear English prompt that any AI model can execute perfectly.`
};

/**
 * Mode Descriptions (for logging and analytics)
 */
const MODE_DESCRIPTIONS = {
  precision: 'Concise, direct, and unambiguous instructions',
  exploratory: 'Comprehensive educational exploration with multiple perspectives',
  developer: 'Best-practice code prompts with full architecture',
  multilingual: 'Token-efficient, high-density English translation'
};

/**
 * Helper: Write a JSON response to the stream and close it.
 * Used for non-streaming responses (GET history, validation errors, rate limits).
 */
function sendJsonResponse(
  responseStream: any,
  statusCode: number,
  body: Record<string, any>
): void {
  const httpStream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
  httpStream.write(JSON.stringify(body));
  httpStream.end();
}

export const handler = awslambda.streamifyResponse(
  async (event: any, responseStream: any, _context: any) => {
    const httpMethod = event.requestContext?.http?.method || event.httpMethod || 'POST';
    console.log('Optimize Handler (Streaming) invoked', { method: httpMethod });

    try {
      // ==================== HANDLE GET: Fetch History ====================
      if (httpMethod === 'GET') {
        const userId = event.requestContext?.authorizer?.claims?.sub
          || event.queryStringParameters?.userId;

        if (!userId) {
          sendJsonResponse(responseStream, 401, { error: 'Unauthorized' });
          return;
        }

        try {
          const historyResponse = await dynamoClient.send(new QueryCommand({
            TableName: process.env.PROMPTS_TABLE_NAME,
            IndexName: 'user_id-created_at-index',
            KeyConditionExpression: 'user_id = :uid',
            ExpressionAttributeValues: { ':uid': userId },
            Limit: 50,
            ScanIndexForward: false
          }));

          console.log('History fetched', { count: historyResponse.Items?.length || 0 });
          sendJsonResponse(responseStream, 200, {
            success: true,
            history: historyResponse.Items || [],
            count: historyResponse.Items?.length || 0
          });
        } catch (error) {
          console.error('Error fetching history:', error);
          sendJsonResponse(responseStream, 500, { success: false, error: 'Failed to fetch history' });
        }
        return;
      }

      // ==================== HANDLE POST: Streaming Optimization ====================
      if (!event.body) {
        sendJsonResponse(responseStream, 400, { error: 'Missing request body' });
        return;
      }

      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const { prompt, mode, userId }: OptimizeRequest = body;

      if (!prompt || !mode || !userId) {
        console.error('Missing required fields', { prompt: !!prompt, mode, userId });
        sendJsonResponse(responseStream, 400, {
          error: 'Missing required fields: prompt, mode, userId',
          received: { prompt: !!prompt, mode, userId }
        });
        return;
      }

      if (!SYSTEM_PROMPTS[mode]) {
        console.error('Invalid mode', { mode, validModes: Object.keys(SYSTEM_PROMPTS) });
        sendJsonResponse(responseStream, 400, {
          error: 'Invalid mode',
          validModes: Object.keys(SYSTEM_PROMPTS)
        });
        return;
      }

      // Check daily usage limit
      const today = new Date().toISOString().split('T')[0];
      let currentUsage = 0;
      try {
        const usageResponse = await dynamoClient.send(new GetCommand({
          TableName: process.env.USAGE_TABLE_NAME,
          Key: { user_id: userId, date: today }
        }));
        currentUsage = usageResponse.Item?.requests_count || 0;

        if (currentUsage >= FREE_DAILY_LIMIT) {
          console.log('Daily limit exceeded', { userId, currentUsage, limit: FREE_DAILY_LIMIT });
          sendJsonResponse(responseStream, 429, {
            error: 'Daily limit exceeded',
            message: `You've reached the daily limit of ${FREE_DAILY_LIMIT} optimizations. Try again tomorrow!`,
            currentUsage,
            limit: FREE_DAILY_LIMIT,
            resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
          });
          return;
        }
      } catch (error) {
        console.error('Failed to check usage limit', { error });
        // Continue if usage check fails (fail-open)
      }

      // =========== START STREAMING THE LLM RESPONSE ===========
      const systemPrompt = SYSTEM_PROMPTS[mode];
      const startTime = Date.now();

      console.log('Starting streaming optimization', {
        mode, userId, promptLength: prompt.length, description: MODE_DESCRIPTIONS[mode]
      });

      // Set streaming response headers
      responseStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff'
        }
      });

      let fullText = '';

      try {
        // ===== PRIMARY: Gemini 2.5 Flash (faster) =====
        console.log('🚀 Trying Gemini 2.5 Flash (primary)...');
        const geminiModel = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: systemPrompt
        });

        const geminiResult = await geminiModel.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: mode === 'exploratory' ? 0.9 : 0.7
          }
        });

        for await (const chunk of geminiResult.stream) {
          const text = chunk.text();
          if (text) {
            responseStream.write(text);
            fullText += text;
          }
        }
        console.log('✅ Gemini streaming completed successfully');
      } catch (geminiError: any) {
        console.error('❌ Gemini streaming error, falling back to DeepSeek:', geminiError.message || geminiError);

        // ===== FALLBACK: DeepSeek =====
        // Only fallback if Gemini produced no output (avoid duplicate content)
        if (fullText.length === 0) {
          try {
            console.log('🔄 Falling back to DeepSeek...');
            const completion = await openai.chat.completions.create({
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
              model: 'deepseek-chat',
              stream: true,
              temperature: mode === 'exploratory' ? 0.9 : 0.7,
              max_tokens: 8192
            });

            for await (const chunk of completion) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                responseStream.write(text);
                fullText += text;
              }
            }
            console.log('✅ DeepSeek fallback streaming completed');
          } catch (deepseekError: any) {
            console.error('❌ DeepSeek fallback also failed:', deepseekError.message || deepseekError);
            responseStream.write(
              `\n\n[ERROR: Both AI providers failed. ${deepseekError.message || 'Please try again.'}]`
            );
          }
        } else {
          // Gemini produced partial output before failing
          console.warn('⚠️ Gemini failed mid-stream after producing partial output, not retrying');
          responseStream.write(
            `\n\n[Stream interrupted. Partial response above may be incomplete.]`
          );
        }
      }

      // Always close the stream
      responseStream.end();

      // =========== POST-STREAM: DynamoDB Operations ===========
      // Lambda continues executing after stream.end() until the handler Promise resolves.
      const responseTime = Date.now() - startTime;
      const tokensEstimate = Math.ceil(prompt.length / 4) + Math.ceil(fullText.length / 4);

      console.log('Stream completed', {
        responseTime: `${responseTime}ms`, textLength: fullText.length, tokensEstimate
      });

      try {
        await Promise.allSettled([
          // Usage tracking
          dynamoClient.send(new UpdateCommand({
            TableName: process.env.USAGE_TABLE_NAME,
            Key: { user_id: userId, date: today },
            UpdateExpression: 'ADD credits_used :tokens, requests_count :one SET last_updated = :timestamp, last_mode = :mode',
            ExpressionAttributeValues: {
              ':tokens': tokensEstimate,
              ':one': 1,
              ':timestamp': Date.now(),
              ':mode': mode
            }
          })),
          // Cache result
          dynamoClient.send(new PutCommand({
            TableName: process.env.CACHE_TABLE_NAME,
            Item: {
              cache_key: `optimize_${Buffer.from(prompt).toString('base64').substring(0, 50)}_${mode}`,
              original_prompt: prompt,
              optimized_prompt: fullText,
              mode,
              tokens_used: tokensEstimate,
              created_at: Date.now(),
              ttl: Math.floor(Date.now() / 1000) + 86400
            }
          })),
          // Save to history
          dynamoClient.send(new PutCommand({
            TableName: process.env.PROMPTS_TABLE_NAME!,
            Item: {
              prompt_id: randomUUID(),
              user_id: userId,
              created_at: Date.now(),
              original_prompt: prompt,
              optimized_prompt: fullText,
              mode,
              mode_description: MODE_DESCRIPTIONS[mode],
              tokens_used: tokensEstimate,
              response_time_ms: responseTime,
              is_public: false,
              tags: [mode]
            }
          }))
        ]);
        console.log('Post-stream DynamoDB operations completed');
      } catch (dbError) {
        console.error('Post-stream DynamoDB error:', dbError);
      }

    } catch (error) {
      console.error('Unhandled error in optimize handler', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      try {
        // If stream metadata hasn't been set yet, set it now with error status
        responseStream = awslambda.HttpResponseStream.from(responseStream, {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' }
        });
        responseStream.write(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to optimize prompt'
        }));
      } catch (_metadataError) {
        // HttpResponseStream.from() was already called — we're mid-stream.
        // Write error text directly into the existing text stream.
        responseStream.write(
          `\n\n[ERROR: ${error instanceof Error ? error.message : 'Unknown error'}]`
        );
      }
      responseStream.end();
    }
  }
);
