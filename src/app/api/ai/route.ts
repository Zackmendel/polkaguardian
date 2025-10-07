import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { proposalText } = await req.json();

    if (!proposalText) {
      return NextResponse.json({ error: 'Proposal text is required' }, { status: 400 });
    }

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes DAO proposals.' },
        { role: 'user', content: `Summarize the following DAO proposal: ${proposalText}` },
      ],
      model: 'gpt-3.5-turbo',
    });

    const summary = chatCompletion.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error summarizing proposal:', error);
    return NextResponse.json({ error: 'Failed to summarize proposal' }, { status: 500 });
  }
}
