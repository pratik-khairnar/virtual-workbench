const config = require('../config');
const crypto = require('crypto');

/**
 * Alerter module — sends red alerts on critical failures.
 * MVP: logs to console + stores in JSON DB.
 * Production: replace with Slack/Discord/PagerDuty webhook.
 */

function sendAlert(severity, source, message, metadata = {}) {
  const { db } = require('../db/database');

  const alert = {
    id: crypto.randomUUID(),
    severity,
    source,
    message,
    metadata: JSON.stringify(metadata),
    acknowledged: 0,
  };

  const icon = severity === 'red' ? '🔴' : severity === 'yellow' ? '🟡' : '🟢';
  console.error(`${icon} [ALERT] [${source}] ${message}`, metadata);

  try {
    db.insertAlert(alert);
  } catch (err) {
    console.error('[Alerter] Failed to store alert:', err.message);
  }

  if (config.alertWebhookUrl) {
    fetch(config.alertWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${icon} *${severity.toUpperCase()} ALERT* from \`${source}\`\n${message}`,
        ...metadata,
      }),
    }).catch(err => {
      console.error('[Alerter] Webhook failed:', err.message);
    });
  }

  return alert;
}

function redAlert(source, message, metadata) {
  return sendAlert('red', source, message, metadata);
}

function yellowAlert(source, message, metadata) {
  return sendAlert('yellow', source, message, metadata);
}

module.exports = { sendAlert, redAlert, yellowAlert };
