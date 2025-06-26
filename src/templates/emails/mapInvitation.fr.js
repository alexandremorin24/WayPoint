module.exports = {
  subject: 'Invitation à collaborer sur une carte WayPoint',
  html: (inviterName, mapName, role, invitationUrl) => `
    <h2>Invitation à collaborer sur WayPoint</h2>
    <p>${inviterName} vous invite à collaborer sur la carte "${mapName}" en tant que ${role}.</p>
    
    <p><a href="${invitationUrl}" style="background:#22c55e;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
      Voir l'invitation
    </a></p>
    
    <p>Cette invitation expirera dans 7 jours.</p>
    
    <p>Si le bouton ne fonctionne pas, copiez ce lien : ${invitationUrl}</p>
  `
}; 
