module.exports = {
  subject: 'Invitation to collaborate on a WayPoint map',
  html: (inviterName, mapName, role, acceptUrl, rejectUrl) => `
    <h2>Invitation to collaborate on WayPoint 🗺️</h2>
    <p>${inviterName} invites you to collaborate on the map "${mapName}" as a ${role}.</p>
    
    <p>You can accept or reject this invitation:</p>
    
    <div style="margin: 20px 0;">
      <a href="${acceptUrl}" style="background:#22c55e;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;margin-right:10px;">
        Accept invitation
      </a>
      
      <a href="${rejectUrl}" style="background:#ef4444;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Reject invitation
      </a>
    </div>
    
    <p>This invitation will expire in 7 days.</p>
    
    <p>If the buttons don't work, you can copy and paste these URLs in your browser:</p>
    <p>Accept: ${acceptUrl}</p>
    <p>Reject: ${rejectUrl}</p>
  `
}; 
