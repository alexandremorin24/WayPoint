const { createEmailLayout } = require('./base');

module.exports = {
  subject: (status) => `Réponse à votre invitation WayPoint - ${status === 'accepted' ? 'Acceptée' : 'Refusée'}`,
  html: (inviteeName, mapName, status) => {
    const isAccepted = status === 'accepted';
    const content = `
      <h2>Réponse à votre invitation</h2>
      <p>Bonjour,</p>
      <p><span class="highlight">${inviteeName}</span> a <strong>${isAccepted ? 'accepté' : 'refusé'}</strong> votre invitation à collaborer sur la carte <strong>"${mapName}"</strong>.</p>
      
      ${isAccepted ? `
      <div class="alert alert-success">
        <strong>Excellente nouvelle !</strong> Cette personne peut maintenant collaborer sur votre carte.
      </div>
      
      <div class="card">
        <h3>Prochaines étapes :</h3>
        <p>• ${inviteeName} peut maintenant ajouter des points d'intérêt<br>
        • Vous recevrez des notifications pour les modifications<br>
        • Vous pouvez collaborer en temps réel</p>
      </div>
      ` : `
      <div class="alert alert-error">
        <strong>Invitation refusée</strong> - Pas de souci, cela arrive !
      </div>
      
      <div class="card">
        <h3>Que faire maintenant ?</h3>
        <p>• Vous pouvez renvoyer une nouvelle invitation plus tard<br>
        • Peut-être essayer d'expliquer les avantages de la collaboration<br>
        • Continuer à développer votre carte en solo</p>
      </div>
      `}
      
      <div class="divider"></div>
      
      <p class="text-muted">
        Cet email est envoyé automatiquement pour vous tenir informé des réponses à vos invitations.
      </p>
    `;

    return createEmailLayout(content, {
      title: `Réponse à votre invitation WayPoint - ${isAccepted ? 'Acceptée' : 'Refusée'}`,
      preheader: `${inviteeName} a ${isAccepted ? 'accepté' : 'refusé'} votre invitation`
    });
  }
}; 
