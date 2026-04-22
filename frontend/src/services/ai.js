// frontend/src/services/ai.js
export async function askAI(prompt, context = {}) {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context })
    });

    // Check if the response is ok
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 200)}`);
    }

    // Check content type
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await res.text();
      console.error('Expected JSON but got:', contentType);
      console.error('Response:', responseText.substring(0, 500));
      throw new Error(`Server returned ${contentType} instead of JSON. Response: ${responseText.substring(0, 100)}...`);
    }

    const data = await res.json();
    // If OpenAI chat completion format:
    return data?.choices?.[0]?.message?.content ?? data?.reply ?? JSON.stringify(data);

  } catch (error) {
    if (error.name === 'SyntaxError' && error.message.includes('JSON.parse')) {
      throw new Error('Server returned invalid JSON. Check if your backend is running correctly.');
    }
    throw error;
  }
}

export async function generateExperiment(data) {
  try {
    const res = await fetch('/api/ai/experiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText.substring(0, 200)}`);
    }

    // Check content type
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await res.text();
      console.error('Expected JSON but got:', contentType);
      console.error('Response:', responseText.substring(0, 500));
      throw new Error(`Server returned ${contentType} instead of JSON`);
    }

    return res.json();

  } catch (error) {
    if (error.name === 'SyntaxError' && error.message.includes('JSON.parse')) {
      throw new Error('Server returned invalid JSON. Check if your backend is running correctly.');
    }
    throw error;
  }
}
