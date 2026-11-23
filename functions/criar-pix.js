export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { value, name, email } = await request.json();

    if (!value || Number(value) < 500) {
      return new Response(
        JSON.stringify({ error: 'Valor inválido (mínimo R$ 5,00).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = env.PUSHINPAY_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Chave PUSHINPAY_TOKEN não configurada na Cloudflare.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const webhookUrl = `${url.origin}/webhook-pix`;

    const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: Number(value),
        webhook_url: webhookUrl,
        metadata: {
          payer_name: name || '',
          payer_email: email || ''
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Erro na API PushinPay' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const qrCodeText = data.qr_code || data.pix_code || '';
    const qrBase64 =
      data.qr_code_base64 ||
      (qrCodeText
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeText)}`
        : '');

    return new Response(
      JSON.stringify({
        id: data.id || data.transaction_id || '',
        qr_code: qrCodeText,
        qr_code_base64: qrBase64
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro interno ao criar cobrança Pix.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
