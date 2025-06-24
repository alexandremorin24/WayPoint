module.exports = {
  subject: (status) => `Réponse à votre invitation WayPoint - ${status === 'accepted' ? 'Acceptée' : 'Refusée'}`,
  html: (inviteeName, mapName, status) => `
    <h2>Réponse à votre invitation WayPoint 🗺️</h2>
    <p>${inviteeName} a ${status === 'accepted' ? 'accepté' : 'refusé'} votre invitation à collaborer sur la carte "${mapName}".</p>
    
    ${status === 'accepted' ? `
    <p>Cette personne peut maintenant collaborer sur votre carte.</p>
    ` : `
    <p>Vous pouvez toujours renvoyer une nouvelle invitation si nécessaire.</p>
    `}
  `
}; 
