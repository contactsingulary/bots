(function(window, document) {
  window.embedApp = window.embedApp || {};
  let initialized = false;
  let container = null;
  let chatFrame = null;
  let isOpen = false;
  
  window.embedApp.init = function(config) {
    if (initialized) return;
    window.embedApp.config = config || {};
    
    if (Object.keys(window.embedApp.config).length === 0) {
      loadConfig(function() {
        renderWidget();
      });
    } else {
      renderWidget();
    }
    
    initialized = true;
  };
  
  function loadConfig(callback) {
    const scriptUrl = 'https://embed.singulary-tech.de/api/config';
    const script = document.createElement('script');
    script.async = true;
    script.src = scriptUrl;
    script.onload = callback;
    document.head.appendChild(script);
  }
  
  function renderWidget() {
    if (container) return;
    
    container = document.createElement('div');
    container.id = 'embed-widget';
    container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
    
    const button = document.createElement('button');
    button.innerText = 'Chat';
    button.style.cssText = 'padding:10px 20px;background:' + 
      (window.embedApp.config.color || '#000000') + 
      ';color:white;border:none;border-radius:5px;cursor:pointer;';
    
    chatFrame = document.createElement('iframe');
    chatFrame.src = 'https://embed.singulary-tech.de/chat';
    chatFrame.style.cssText = 'display:none;width:350px;height:500px;border:none;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:white;margin-bottom:10px;';
    chatFrame.title = 'Chat';
    chatFrame.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture;';
    chatFrame.referrerPolicy = 'origin';
    
    button.addEventListener('click', function() {
      isOpen = !isOpen;
      chatFrame.style.display = isOpen ? 'block' : 'none';
    });
    
    container.appendChild(chatFrame);
    container.appendChild(button);
    document.body.appendChild(container);
  }
  
  window.addEventListener('message', function(event) {
    if (event.origin === 'https://embed.singulary-tech.de' && event.data) {
      if (event.data.type === 'chatClose') {
        isOpen = false;
        chatFrame.style.display = 'none';
      }
    }
  });
  
  setTimeout(function() {
    if (!initialized) {
      window.embedApp.init({});
    }
  }, 0);
})(window, document);