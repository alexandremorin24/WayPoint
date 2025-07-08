const { createEmailLayout } = require('./base');

module.exports = {
  subject: 'Invitation à collaborer sur une carte WayPoint',
  html: (inviterName, mapName, role, invitationUrl) => {
    const content = `
      <h2>Nouvelle invitation de collaboration</h2>
      <p>Bonjour,</p>
      <p><span class="highlight">${inviterName}</span> vous invite à collaborer sur la carte <strong>"${mapName}"</strong> en tant que <span class="highlight">${role}</span>.</p>
      
      <div class="card">
        <h3>Que pouvez-vous faire ?</h3>
        <p>En acceptant cette invitation, vous pourrez :</p>
        <p>• Ajouter et modifier des points d'intérêt<br>
        • Collaborer en temps réel<br>
        • Partager vos découvertes</p>
      </div>
      
      <div class="text-center">
        <a href="${invitationUrl}" class="btn">
          Accepter l'invitation
        </a>
      </div>
      
      <div class="alert alert-warning">
        <strong>Important :</strong> Cette invitation expirera dans <strong>7 jours</strong>.
      </div>
      
      <div class="divider"></div>
      
      <p class="text-muted">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <span class="text-small">${invitationUrl}</span>
      </p>
    `;

    return createEmailLayout(content, {
      title: 'Invitation à collaborer sur une carte WayPoint',
      preheader: `${inviterName} vous invite à collaborer sur "${mapName}"`
    });
  }
}; 
