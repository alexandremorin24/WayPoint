const { createEmailLayout } = require('./base');

module.exports = {
  subject: 'Invitation to collaborate on a WayPoint map',
  html: (inviterName, mapName, role, invitationUrl) => {
    const content = `
      <h2>New collaboration invitation</h2>
      <p>Hello,</p>
      <p><span class="highlight">${inviterName}</span> invites you to collaborate on the map <strong>"${mapName}"</strong> as a <span class="highlight">${role}</span>.</p>
      
      <div class="card">
        <h3>What can you do?</h3>
        <p>By accepting this invitation, you will be able to:</p>
        <p>• Add and edit points of interest<br>
        • Collaborate in real time<br>
        • Share your discoveries</p>
      </div>
      
      <div class="text-center">
        <a href="${invitationUrl}" class="btn">
          Accept invitation
        </a>
      </div>
      
      <div class="alert alert-warning">
        <strong>Important:</strong> This invitation will expire in <strong>7 days</strong>.
      </div>
      
      <div class="divider"></div>
      
      <p class="text-muted">
        If the button doesn't work, copy this link into your browser:<br>
        <span class="text-small">${invitationUrl}</span>
      </p>
    `;

    return createEmailLayout(content, {
      title: 'Invitation to collaborate on a WayPoint map',
      preheader: `${inviterName} invites you to collaborate on "${mapName}"`
    });
  }
}; 
