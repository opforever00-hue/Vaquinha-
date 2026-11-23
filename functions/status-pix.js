export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Parâmetro id obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const token = context.env.PUSHINPAY_TOKEN;
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Chave PUSHINPAY_TOKEN não configurada na Cloudflare.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`https://api.pushinpay.com.br/api/transactions/${encodeURIComponent(id)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    const normalizedStatus = String(data.status || '').toLowerCase();

    return new Response(
      JSON.stringify({
        id,
        status: normalizedStatus === 'paid' || normalizedStatus === 'approved' ? 'paid' : normalizedStatus
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erro ao consultar status da transação' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
