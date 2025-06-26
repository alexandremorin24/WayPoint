module.exports = {
  subject: 'Invitation to collaborate on a WayPoint map',
  html: (inviterName, mapName, role, invitationUrl) => `
    <h2>WayPoint Collaboration Invitation</h2>
    <p>${inviterName} invites you to collaborate on the map "${mapName}" as a ${role}.</p>
    
    <p><a href="${invitationUrl}" style="background:#22c55e;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
      View invitation
    </a></p>
    
    <p>This invitation will expire in 7 days.</p>
    
    <p>If the button doesn't work, copy this link: ${invitationUrl}</p>
  `
}; 
