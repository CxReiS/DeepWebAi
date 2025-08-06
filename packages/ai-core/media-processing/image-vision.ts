import Tesseract from "tesseract.js";

export class ImageVisionService {
  // OCR için tesseract.js
  async extractTextFromImage(imageFile: File): Promise<string> {
    const worker = await Tesseract.createWorker("eng+tur", 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    try {
      const { data } = await worker.recognize(imageFile);
      return data.text || '';
    } finally {
      await worker.terminate();
    }
  }

  // Vision API için (GPT-4V, Claude Vision vb.)
  async analyzeImage(imageFile: File, prompt: string): Promise<string> {
    const base64 = await this.fileToBase64(imageFile);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64}` },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}
