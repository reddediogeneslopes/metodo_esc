import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    const {
      participant = {},
      internal_classification = {},
      public_result = {},
      open_answers = {},
      improved_internal_summary = "",
      raw_answers = {}
    } = body;

    const internalEmail = process.env.INTERNAL_REPORT_EMAIL;

    const subject = `Novo Diagnóstico Método ESC — ${participant.name || "Sem nome"} | ${internal_classification.lead_type || "Sem classificação"}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2>Novo Diagnóstico Método ESC</h2>

        <h3>Contato</h3>
        <p><strong>Nome:</strong> ${escapeHtml(participant.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(participant.email)}</p>
        <p><strong>Cidade/UF:</strong> ${escapeHtml(participant.city_state)}</p>
        <p><strong>Segmento:</strong> ${escapeHtml(participant.segment)}</p>
        <p><strong>Produtos/Serviços:</strong> ${escapeHtml(participant.products_services)}</p>

        <h3>Classificação interna</h3>
        <p><strong>Tipo de lead:</strong> ${escapeHtml(internal_classification.lead_type)}</p>
        <p><strong>Fit score:</strong> ${escapeHtml(internal_classification.fit_score)}</p>
        <p><strong>Score de maturidade:</strong> ${escapeHtml(internal_classification.maturity_score)}</p>
        <p><strong>Classe de maturidade:</strong> ${escapeHtml(internal_classification.maturity_class)}</p>
        <p><strong>Risco operacional:</strong> ${escapeHtml(internal_classification.operational_risk)}</p>
        <p><strong>Capacidade de crescimento:</strong> ${escapeHtml(internal_classification.growth_capacity)}</p>
        <p><strong>Momento:</strong> ${escapeHtml(internal_classification.moment)}</p>

        <h3>Resumo melhorado</h3>
        <pre style="white-space: pre-wrap; background:#f6f6f6; padding:12px; border-radius:8px;">${escapeHtml(improved_internal_summary)}</pre>

        <h3>Resultado visualizado pelo cliente</h3>
        <pre style="white-space: pre-wrap; background:#f6f6f6; padding:12px; border-radius:8px;">${escapeHtml(JSON.stringify(public_result, null, 2))}</pre>

        <h3>Respostas abertas</h3>
        <pre style="white-space: pre-wrap; background:#f6f6f6; padding:12px; border-radius:8px;">${escapeHtml(JSON.stringify(open_answers, null, 2))}</pre>

        <h3>Respostas completas</h3>
        <pre style="white-space: pre-wrap; background:#f6f6f6; padding:12px; border-radius:8px;">${escapeHtml(JSON.stringify(raw_answers, null, 2))}</pre>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [internalEmail],
      subject,
      html
    });

    if (error) {
      return res.status(500).json({ ok: false, error });
    }

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unexpected error"
    });
  }
}
