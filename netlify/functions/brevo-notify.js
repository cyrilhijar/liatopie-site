// Netlify Function déclenchée par le webhook "submission-created" de Netlify Forms.
// Rôle : à chaque soumission du formulaire de contact, (1) créer/mettre à jour le
// contact dans la liste Brevo "Form contact HP" (id 6), (2) envoyer un email de
// notification transactionnel à l'équipe LIATOPIE.
//
// Variable d'environnement requise (déjà configurée dans Netlify) : BREVO_API_KEY

const BREVO_LIST_ID = 6; // "Form contact HP"
const NOTIFY_TO = "cyril@liatopie.fr";
const SENDER = { name: "LIATOPIE - Site web", email: "cyril@liatopie.fr" };

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY manquante dans les variables d'environnement Netlify");
    return { statusCode: 500, body: "Server misconfigured" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: "Invalid payload" };
  }

  // Netlify envoie les données de soumission dans payload.payload.data
  const data = payload?.payload?.data || {};
  const nom = (data.nom || "").trim();
  const email = (data.email || "").trim();
  const telephone = (data.telephone || "").trim();
  const message = (data.message || "").trim();

  // Rejette silencieusement les soumissions du honeypot (déjà filtrées par Netlify
  // normalement, mais on double-checke)
  if (data["bot-field"]) {
    return { statusCode: 200, body: "ignored" };
  }

  if (!email) {
    return { statusCode: 400, body: "Missing email" };
  }

  const brevoHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "api-key": apiKey,
  };

  // 1. Créer / mettre à jour le contact dans Brevo
  try {
    const contactRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: brevoHeaders,
      body: JSON.stringify({
        email,
        attributes: {
          NOM: nom,
          SMS: telephone || undefined,
        },
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    });

    if (!contactRes.ok) {
      const errText = await contactRes.text();
      console.error("Erreur création contact Brevo:", contactRes.status, errText);
      // on continue quand même vers la notification email
    }
  } catch (err) {
    console.error("Exception appel Brevo /contacts:", err);
  }

  // 2. Envoyer l'email de notification transactionnel
  try {
    const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: brevoHeaders,
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: NOTIFY_TO }],
        replyTo: { email, name: nom || email },
        subject: `Nouveau contact site web : ${nom || email}`,
        htmlContent: `
          <h2>Nouveau message depuis le formulaire du site</h2>
          <p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
          <p><strong>Email :</strong> ${escapeHtml(email)}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(telephone) || "(non renseigné)"}</p>
          <p><strong>Message :</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Erreur envoi notification Brevo:", emailRes.status, errText);
      return { statusCode: 502, body: "Brevo email failed" };
    }
  } catch (err) {
    console.error("Exception appel Brevo /smtp/email:", err);
    return { statusCode: 502, body: "Brevo email failed" };
  }

  return { statusCode: 200, body: "ok" };
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
