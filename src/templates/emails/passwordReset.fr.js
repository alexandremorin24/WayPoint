const { createEmailLayout } = require('./base');

module.exports = {
  subject: 'Réinitialisation de votre mot de passe',
  html: (name, resetUrl) => {
    const content = `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Bonjour <span class="highlight">${name}</span>,</p>
      <p>Nous avons reçu une demande de réinitialisation de votre mot de passe WayPoint.</p>
      
      <div class="card">
        <h3>Sécurité avant tout</h3>
        <p>Pour protéger votre compte, cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe sécurisé.</p>
      </div>
      
      <div class="text-center">
        <a href="${resetUrl}" class="btn">
          Réinitialiser mon mot de passe
        </a>
      </div>
      
      <div class="alert alert-warning">
        <strong>Important :</strong> Ce lien expirera dans <strong>24 heures</strong>.
      </div>
      
      <div class="alert alert-info">
        <strong>Pour votre sécurité :</strong><br>
        • Ce lien ne peut être utilisé qu'une seule fois<br>
        • Si vous n'avez pas demandé cette réinitialisation, ignorez cet email<br>
        • Votre mot de passe actuel reste valide jusqu'à ce que vous le changiez
      </div>
      
      <div class="divider"></div>
      
      <p class="text-muted">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <span class="text-small">${resetUrl}</span>
      </p>
    `;

    return createEmailLayout(content, {
      title: 'Réinitialisation de votre mot de passe',
      preheader: 'Réinitialisez votre mot de passe WayPoint'
    });
  }
}; 
