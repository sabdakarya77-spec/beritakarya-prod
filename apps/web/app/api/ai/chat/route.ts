import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { model, messages } = await request.json()

    if (!model || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'AI not configured',
        content: 'AI service is not configured. Please set OPENAI_API_KEY in environment.'
      }, { status: 503 })
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      return NextResponse.json({ 
        error: 'AI request failed',
        content: 'Failed to get response from AI service. Please try again.'
      }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    return NextResponse.json({ content })
  } catch (error) {
    console.error('AI route error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      content: 'An error occurred while processing your request.'
    }, { status: 500 })
  }
}