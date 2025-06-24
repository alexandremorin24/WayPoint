module.exports = {
  subject: (status) => `WayPoint invitation response - ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
  html: (inviteeName, mapName, status) => `
    <h2>WayPoint invitation response 🗺️</h2>
    <p>${inviteeName} has ${status === 'accepted' ? 'accepted' : 'rejected'} your invitation to collaborate on the map "${mapName}".</p>
    
    ${status === 'accepted' ? `
    <p>This person can now collaborate on your map.</p>
    ` : `
    <p>You can always send a new invitation if needed.</p>
    `}
  `
}; 
