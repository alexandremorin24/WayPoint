module.exports = {
  subject: 'Invitation à collaborer sur une carte WayPoint',
  html: (inviterName, mapName, role, acceptUrl, rejectUrl) => `
    <h2>Invitation à collaborer sur WayPoint 🗺️</h2>
    <p>${inviterName} vous invite à collaborer sur la carte "${mapName}" en tant que ${role}.</p>
    
    <p>Vous pouvez accepter ou refuser cette invitation :</p>
    
    <div style="margin: 20px 0;">
      <a href="${acceptUrl}" style="background:#22c55e;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;margin-right:10px;">
        Accepter l'invitation
      </a>
      
      <a href="${rejectUrl}" style="background:#ef4444;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Refuser l'invitation
      </a>
    </div>
    
    <p>Cette invitation expirera dans 7 jours.</p>
    
    <p>Si les boutons ne fonctionnent pas, vous pouvez copier et coller ces URLs dans votre navigateur :</p>
    <p>Accepter : ${acceptUrl}</p>
    <p>Refuser : ${rejectUrl}</p>
  `
}; 
