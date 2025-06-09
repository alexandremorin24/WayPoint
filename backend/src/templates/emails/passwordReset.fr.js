module.exports = {
  subject: 'Réinitialisation de votre mot de passe',
  html: (name, resetUrl) => `
    <h2>Demande de réinitialisation de mot de passe 🔐</h2>
    <p>Bonjour ${name},</p>
    <p>Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
    <p>
      <a href="${resetUrl}" style="background:#1e40af;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Réinitialiser mon mot de passe
      </a>
    </p>
    <p>Si le bouton ne fonctionne pas, vous pouvez également copier et coller cette URL dans votre navigateur :</p>
    <p>${resetUrl}</p>
    <p>Ce lien expirera dans 24 heures.</p>
    <p>Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet email en toute sécurité.</p>
    <p>Pour des raisons de sécurité, ce lien ne peut être utilisé qu'une seule fois.</p>
  `
} 
