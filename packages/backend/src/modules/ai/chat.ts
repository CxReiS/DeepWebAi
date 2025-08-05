import { Elysia } from "elysia";

export const streamingAI = new Elysia()
  .get("/chat/stream", ({ query }) => {
    return new Response(
      new ReadableStream({
        async start(controller) {
          // Server-Sent Events veya WebSocket streaming
        },
      })
    );
  })

  .get("/chat", ({ query }) => {
    // Gelen sorgu parametrelerini işleyin
    const { message } = query;

    // Burada AI modeline mesajı gönderip yanıt alabilirsiniz
    const responseMessage = `AI response to: ${message}`;

    return new Response(responseMessage, {
      headers: { "Content-Type": "text/plain" },
    });
  });
