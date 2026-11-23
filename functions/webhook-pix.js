export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const transactionId = payload.id || payload.transaction_id || payload.data?.id || '';
    const status = String(payload.status || payload.data?.status || '').toLowerCase();

    if (transactionId && (status === 'paid' || status === 'approved' || status === 'completed')) {
      // Opcional: se quiser persistir no Cloudflare KV, associe um namespace (ex: PIX_KV) e use:
      // await context.env.PIX_KV?.put(`tx:${transactionId}`, JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() }));
    }

    return new Response(
      JSON.stringify({ received: true, id: transactionId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Payload inválido no webhook' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
