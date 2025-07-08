const createEmailLayout = (content, options = {}) => {
  const {
    title = 'WayPoint',
    preheader = '',
    backgroundColor = '#003566',  // Background color from theme
    primaryColor = '#001D3D',     // Primary color from theme
    secondaryColor = '#FFC300',   // Secondary color from theme
    successColor = '#43aa8b',     // Success color from theme
    errorColor = '#d90429',       // Error color from theme
    logoUrl = `${process.env.FRONTEND_URL}/logo.png`
  } = options;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    /* Email styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: ${backgroundColor};
      font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #ffffff;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${primaryColor};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .email-header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${backgroundColor} 100%);
      padding: 32px 20px;
      text-align: center;
      border-bottom: 2px solid ${secondaryColor};
    }
    
    .logo {
      max-width: 280px;
      height: auto;
    }
    
    .email-body {
      padding: 40px 32px;
      background-color: ${primaryColor};
    }
    
    .email-footer {
      background-color: rgba(0, 0, 0, 0.2);
      padding: 24px 32px;
      text-align: center;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    h1, h2, h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #ffffff;
      font-weight: 600;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: ${secondaryColor};
    }
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      color: ${secondaryColor};
    }
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #ffffff;
    }
    
    p {
      margin: 0 0 16px 0;
      color: #ffffff;
    }
    
    .btn {
      display: inline-block;
      padding: 14px 28px;
      margin: 20px 0;
      background-color: ${secondaryColor};
      color: ${primaryColor} !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      text-transform: uppercase;
      transition: all 0.2s ease-in-out;
      border: 2px solid ${secondaryColor};
      font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    
    .btn:hover {
      background-color: ${primaryColor};
      color: ${secondaryColor} !important;
      border-color: ${secondaryColor};
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(255, 195, 0, 0.3);
    }
    
    .btn-success {
      background-color: ${successColor};
      border-color: ${successColor};
      color: #ffffff !important;
    }
    
    .btn-success:hover {
      background-color: #3a8b6b;
      border-color: #3a8b6b;
      color: #ffffff !important;
    }
    
    .btn-error {
      background-color: ${errorColor};
      border-color: ${errorColor};
      color: #ffffff !important;
    }
    
    .btn-error:hover {
      background-color: #c2032a;
      border-color: #c2032a;
      color: #ffffff !important;
    }
    
    .alert {
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid;
    }
    
    .alert-info {
      background-color: rgba(0, 119, 182, 0.1);
      border-color: #0077b6;
      color: #0099ff;
    }
    
    .alert-warning {
      background-color: rgba(255, 195, 0, 0.1);
      border-color: ${secondaryColor};
      color: ${secondaryColor};
    }
    
    .alert-success {
      background-color: rgba(67, 170, 139, 0.1);
      border-color: ${successColor};
      color: ${successColor};
    }
    
    .alert-error {
      background-color: rgba(217, 4, 41, 0.1);
      border-color: ${errorColor};
      color: ${errorColor};
    }
    
    .divider {
      height: 1px;
      background-color: rgba(255, 255, 255, 0.2);
      margin: 30px 0;
    }
    
    .text-center {
      text-align: center;
    }
    
    .text-muted {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    }
    
    .text-small {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .mt-4 {
      margin-top: 24px;
    }
    
    .highlight {
      background-color: rgba(255, 195, 0, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      color: ${secondaryColor};
      font-weight: 600;
    }
    
    .card {
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }
    
    .link {
      color: ${secondaryColor};
      text-decoration: none;
      font-weight: 600;
    }
    
    .link:hover {
      text-decoration: underline;
    }
    
    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0 !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }
      
      .email-body {
        padding: 30px 20px !important;
      }
      
      .email-footer {
        padding: 20px !important;
      }
      
      h1 {
        font-size: 24px !important;
      }
      
      h2 {
        font-size: 20px !important;
      }
      
      .btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
      
      .card {
        padding: 16px !important;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>` : ''}
  
  <div style="background-color: ${backgroundColor}; padding: 20px 0; min-height: 100vh;">
    <div class="email-container">
      <div class="email-header">
        <img src="${logoUrl}" alt="WayPoint" class="logo" />
      </div>
      
      <div class="email-body">
        ${content}
      </div>
      
      <div class="email-footer">
        <p>
          Cet email a été envoyé par <strong style="color: ${secondaryColor};">WayPoint</strong><br>
          <a href="${process.env.FRONTEND_URL}" class="link">Visiter WayPoint</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { createEmailLayout }; 
