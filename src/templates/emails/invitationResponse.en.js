const { createEmailLayout } = require('./base');

module.exports = {
  subject: (status) => `WayPoint invitation response - ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
  html: (inviteeName, mapName, status) => {
    const isAccepted = status === 'accepted';
    const content = `
      <h2>Response to your invitation</h2>
      <p>Hello,</p>
      <p><span class="highlight">${inviteeName}</span> has <strong>${isAccepted ? 'accepted' : 'rejected'}</strong> your invitation to collaborate on the map <strong>"${mapName}"</strong>.</p>
      
      ${isAccepted ? `
      <div class="alert alert-success">
        <strong>Great news!</strong> This person can now collaborate on your map.
      </div>
      
      <div class="card">
        <h3>Next steps:</h3>
        <p>• ${inviteeName} can now add points of interest<br>
        • You will receive notifications for modifications<br>
        • You can collaborate in real time</p>
      </div>
      ` : `
      <div class="alert alert-error">
        <strong>Invitation rejected</strong> - No worries, it happens!
      </div>
      
      <div class="card">
        <h3>What to do now?</h3>
        <p>• You can send a new invitation later<br>
        • Maybe try explaining the benefits of collaboration<br>
        • Continue developing your map solo</p>
      </div>
      `}
      
      <div class="divider"></div>
      
      <p class="text-muted">
        This email is sent automatically to keep you informed of responses to your invitations.
      </p>
    `;

    return createEmailLayout(content, {
      title: `WayPoint invitation response - ${isAccepted ? 'Accepted' : 'Rejected'}`,
      preheader: `${inviteeName} has ${isAccepted ? 'accepted' : 'rejected'} your invitation`
    });
  }
}; 
