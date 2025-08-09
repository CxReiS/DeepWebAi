export class AudioTranscriptionService {
    private whisperApiKey: string
    
    constructor() {
      this.whisperApiKey = process.env.OPENAI_API_KEY || ''
    }
    
    async transcribeAudio(audioFile: File): Promise<string> {
      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('model', 'whisper-1')
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.whisperApiKey}`
        },
        body: formData
      })
      
      const data = await response.json()
      return data.text
    }
    
    // Yerel Whisper modeli için
    async transcribeLocal(audioPath: string): Promise<string> {
      // whisper.cpp kullanımı
      const { exec } = await import('child_process')
      return new Promise((resolve, reject) => {
        exec(`whisper --model medium --file ${audioPath}`, (error, stdout) => {
          if (error) reject(error)
          else resolve(stdout)
        })
      })
    }
  }