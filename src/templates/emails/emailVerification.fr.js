const { createEmailLayout } = require('./base');

module.exports = {
  subject: 'Confirmez votre adresse e-mail',
  html: (verifyUrl) => {
    const content = `
      <h2>Bienvenue sur WayPoint !</h2>
      <p>Merci de rejoindre notre communauté de créateurs de cartes !</p>
      
      <div class="card">
        <h3>Une dernière étape</h3>
        <p>Pour activer votre compte et commencer à créer des cartes extraordinaires, confirmez simplement votre adresse e-mail.</p>
      </div>
      
      <div class="text-center">
        <a href="${verifyUrl}" class="btn">
          Confirmer mon e-mail
        </a>
      </div>
      
      <div class="alert alert-info">
        <strong>Sécurité :</strong> Cette étape protège votre compte et nous assure que nous pouvons vous contacter si nécessaire.
      </div>
      
      <div class="card">
        <h3>Ce qui vous attend :</h3>
        <p>• Créez des cartes interactives pour vos voyages<br>
        • Collaborez avec vos amis en temps réel<br>
        • Partagez vos découvertes avec la communauté<br>
        • Explorez les cartes créées par d'autres voyageurs</p>
      </div>
      
      <div class="divider"></div>
      
      <p class="text-muted">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <span class="text-small">${verifyUrl}</span>
      </p>
    `;

    return createEmailLayout(content, {
      title: 'Confirmez votre adresse e-mail',
      preheader: 'Activez votre compte WayPoint en un clic'
    });
  }
}; 
